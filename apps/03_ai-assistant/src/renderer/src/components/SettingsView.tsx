import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { bridge, isDemo } from '../platform/bridge'
import type { VaultState } from '../hooks/useVault'
import type { ModelState } from '../hooks/useModels'
import {
  INFERENCE_PROFILES,
  fitToProfile,
  resolveInference,
  vramWarning,
  type InferenceSettings,
} from '@shared/lib/inference'
import { CLOUD_PROVIDERS, type CloudProviderView } from '@shared/lib/providers'
import { DEFAULT_PERMISSIONS, type Permissions } from '@shared/lib/permissions'
import { ACCENTS, DEFAULT_APPEARANCE, WIDTHS, type Appearance } from '../state/appearance'
import {
  CUSTOM_FIELDS,
  DEFAULT_INFERENCE,
  clampCustomOption,
  customRange,
  customValue,
  withCustomOption,
  withProfile,
} from '../state/performance'

/**
 * Settings — the whole window, one section at a time.
 *
 * A rail of sections on the left, the section itself on the right, and nothing
 * between a setting and the control that changes it: a label, the control, done.
 * A setting the app cannot act on is not listed, so every row here does
 * something when it is touched.
 *
 * - System: what is actually running here — the app, the model Ollama reported,
 *   its endpoint, and the folder conversations are being kept in.
 * - Appearance: the two theme tokens the interface reads. The app draws itself
 *   from tokens, so this is a re-theme rather than a repaint.
 * - Performance: Ollama's own options, from the profile table in inference.ts.
 *   Memory is measured against the profile that was chosen — choosing a profile
 *   IS the answer to "how much video memory is there", so picking 6 GB is never
 *   answered with a warning about 4.
 * - Agent access: what each agent is allowed to do. Every switch here governs
 *   something that exists and is checked where it happens — the main process
 *   refuses a switched-off provider and a switched-off capture before anything
 *   leaves or is written. Permissions with nothing behind them are not offered.
 * - System: what is running — and that includes the port the browser extension
 *   posts to, because an open port the person cannot see would be a secret.
 * - Models: the online providers, one row each. A key is pasted here and never
 *   comes back — the main process holds it, sealed by the machine's keychain.
 *   Saving a key is what makes that provider's models appear in the composer, and
 *   a provider stays off until somebody does exactly that.
 * - Vault: the folder, chosen through the main process, which reports what
 *   happened. Nothing here creates a folder, and the path shown is the one the
 *   vault itself reported.
 *
 * Anything that needs a machine says so plainly when there is not one: in the
 * browser preview there is no folder to choose and no model to run.
 */

type SectionId = 'agents' | 'system' | 'appearance' | 'models' | 'performance' | 'vault'

type Row = {
  /** What the row is called, and what the rail's search matches on. */
  label: string
  /** Extra words the same search should find this row by. */
  terms?: string
  body: ReactNode
}

const SECTIONS: readonly {
  id: SectionId
  title: string
  group: string
  /** True when the section holds preferences, which are the only things a reset can restore. */
  resettable?: boolean
}[] = Object.freeze([
  { id: 'system', title: 'System', group: 'This computer' },
  { id: 'agents', title: 'Agent access', group: 'This app', resettable: true },
  { id: 'appearance', title: 'Appearance', group: 'This app', resettable: true },
  { id: 'models', title: 'Models', group: 'This app' },
  { id: 'performance', title: 'Performance', group: 'This app', resettable: true },
  { id: 'vault', title: 'Vault', group: 'This app' },
])

const GROUPS = ['This computer', 'This app'] as const

/** Four glyphs, drawn here rather than pulled from a font or a package. */
function SectionIcon({ id }: { id: SectionId }) {
  const paths: Record<SectionId, ReactNode> = {
    system: (
      <>
        <rect x="2" y="3" width="16" height="11" rx="2" />
        <path d="M7 17h6" />
      </>
    ),
    agents: (
      <>
        <path d="M10 3 4 5.4v3.9c0 3.5 2.5 6.3 6 7.4 3.5-1.1 6-3.9 6-7.4V5.4z" />
        <path d="M7.6 10.2 9.4 12l3-3.4" />
      </>
    ),
    appearance: (
      <>
        <circle cx="10" cy="10" r="7" />
        <path d="M10 6.5v3.5l2.5 1.5" />
      </>
    ),
    models: (
      <>
        <circle cx="7.5" cy="12.5" r="3.5" />
        <path d="M10.2 10 16 4.2M13.6 4.2H16v2.4" />
      </>
    ),
    performance: <path d="M3 14.5 7.5 8l3 3.5L14 4l3 10.5" />,
    vault: (
      <>
        <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h3l1.5 2h6A1.5 1.5 0 0 1 16.5 7.5v7A1.5 1.5 0 0 1 15 16H4.5A1.5 1.5 0 0 1 3 14.5z" />
      </>
    ),
  }
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {paths[id]}
    </svg>
  )
}

/**
 * A permission switch. The whole control, with nothing written beside it: the
 * label says what is being allowed and the position says whether it is.
 */
function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[22px] w-[40px] shrink-0 rounded-full border transition-colors ${
        checked ? 'border-accent bg-accent/60' : 'border-line bg-card'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-[2px] h-[16px] w-[16px] rounded-full transition-all ${
          checked ? 'left-[21px] bg-white' : 'left-[2px] bg-muted'
        }`}
      />
    </button>
  )
}

export default function SettingsView({
  open,
  onClose,
  vault,
  onChanged,
  appearance,
  onAppearanceChange,
  inference,
  onInferenceChange,
  models,
  permissions,
  onPermissionsChange,
}: {
  open: boolean
  onClose: () => void
  permissions: Permissions
  onPermissionsChange: (next: Permissions) => void
  vault: VaultState
  /** Called after the vault moves, so the rest of the app re-reads it. */
  onChanged: () => void
  appearance: Appearance
  onAppearanceChange: (next: Appearance) => void
  inference: InferenceSettings
  onInferenceChange: (next: InferenceSettings) => void
  models: ModelState
}) {
  const [section, setSection] = useState<SectionId>('system')
  const [providers, setProviders] = useState<CloudProviderView[]>([])
  const [providersError, setProvidersError] = useState('')
  const [keyEncryption, setKeyEncryption] = useState<'os' | 'none'>('none')
  const [keyDraft, setKeyDraft] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState('')
  const [testing, setTesting] = useState('')
  const [verdict, setVerdict] = useState<Record<string, string>>({})
  const [providerProblems, setProviderProblems] = useState<Record<string, string>>({})
  const [customBase, setCustomBase] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [extension, setExtension] = useState({ listening: false, port: 8765, url: '', error: '' })
  const [permissionProblem, setPermissionProblem] = useState('')
  const [query, setQuery] = useState('')
  const [typed, setTyped] = useState('')
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setProblem('')
    // The field starts at the folder that is actually in use rather than blank.
    bridge.settings
      .read()
      .then(settings => {
        setTyped(settings.vaultPath || '')
        setCustomBase(settings.cloud?.baseUrl || '')
        setCustomModel(settings.cloud?.model || '')
      })
      .catch(() => {})
    // Which providers have a key, and whether this machine can seal one. Both are
    // answers from the main process; when it cannot say, the pane says that.
    void bridge.cloud
      .providers()
      .then(view => {
        if (!view?.ok) {
          setProviders([])
          setProvidersError(view?.error || 'This app could not read the providers.')
          return
        }
        setProvidersError('')
        setProviders(view.providers)
        setKeyEncryption(view.encryption)
      })
      .catch(() => setProvidersError('This app could not read the providers.'))
    // Where the browser extension posts to. Read once per opening of Settings.
    void bridge.extension
      .status()
      .then(status => setExtension(status))
      .catch(() => {})
    // A provider that cannot be reached is a sentence beside that provider, in the
    // provider's own words — never a console message.
    void bridge.cloud
      .models()
      .then(answer => {
        setProviderProblems(
          Object.fromEntries((answer?.problems || []).map(item => [item.provider, item.error]))
        )
      })
      .catch(() => setProviderProblems({}))
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function apply(folder: string): Promise<void> {
    if (busy) return
    setBusy(true)
    setProblem('')
    try {
      const result = await bridge.settings.update({ vaultPath: folder })
      if (!result.ok) {
        setProblem(result.error || 'That folder could not be used.')
        return
      }
      setTyped(result.settings?.vaultPath || folder)
      onChanged()
    } catch (error) {
      setProblem((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function choose(): Promise<void> {
    const folder = await bridge.vault.chooseFolder()
    if (!folder) return
    setTyped(folder)
    await apply(folder)
  }

  /**
   * Saving a key hands it over and keeps nothing: what comes back is the provider
   * list and whether the machine could seal it. A key typed for this run only is
   * said out loud, because it will be gone at the next launch.
   */
  async function saveKey(id: string, label: string): Promise<void> {
    const key = (keyDraft[id] || '').trim()
    if (!key) return
    const view = await bridge.cloud.saveKey(id, key)
    if (!view?.ok) {
      setVerdict(current => ({ ...current, [id]: view?.error || 'That key could not be saved.' }))
      return
    }
    setProviders(view.providers)
    setKeyEncryption(view.encryption)
    setKeyDraft(current => ({ ...current, [id]: '' }))
    setEditing('')
    setVerdict(current => ({ ...current, [id]: `Key saved for ${label}.` }))
    // The composer's model list is what just changed: the models this key reaches
    // belong in it now, not at the next launch.
    models.refresh()
  }

  async function removeKey(id: string, label: string): Promise<void> {
    const view = await bridge.cloud.clearKey(id)
    if (view?.ok) {
      setProviders(view.providers)
      setKeyEncryption(view.encryption)
      setVerdict(current => ({ ...current, [id]: `The key for ${label} is gone.` }))
      models.refresh()
      return
    }
    setVerdict(current => ({ ...current, [id]: view?.error || 'That key could not be removed.' }))
  }

  /** The Test button: one provider, asked for its own list of models. */
  async function testKey(id: string, label: string): Promise<void> {
    setTesting(id)
    setVerdict(current => ({ ...current, [id]: '' }))
    const answer = await bridge.cloud.test(id)
    setTesting('')
    setVerdict(current => ({
      ...current,
      [id]: answer?.ok
        ? `${label} answered: ${answer.count} model${answer.count === 1 ? '' : 's'}${answer.first ? `, including ${answer.first}` : ''}.`
        : answer?.error || `${label} did not answer.`,
    }))
  }

  /**
   * One permission, saved where it is enforced. The result comes back from the
   * main process, so the switch shows what the machine recorded rather than what
   * this component just asked for.
   */
  async function setPermission(next: Permissions): Promise<void> {
    const result = await bridge.settings.update({ permissions: next })
    if (!result?.ok || !result.settings?.permissions) {
      setPermissionProblem(result?.error || 'That permission could not be saved.')
      return
    }
    setPermissionProblem('')
    onPermissionsChange(result.settings.permissions)
    // A provider switched off disappears from the composer's list immediately,
    // and one switched on appears: the model list is the permission's first
    // visible effect.
    models.refresh()
  }

  /** The custom endpoint: an address and a model name, kept in the settings file. */
  async function saveCustom(baseUrl: string, model: string): Promise<void> {
    const result = await bridge.settings.update({ cloud: { baseUrl, model } })
    setVerdict(current => ({
      ...current,
      custom: result?.ok ? 'Saved. The custom endpoint is used for its own models.' : result?.error || 'That could not be saved.',
    }))
    if (result?.ok) models.refresh()
  }

  // What is loaded right now, from what Ollama reported — never a guess. In the
  // preview there is no machine, so the rows say that instead.
  const installed = models.models.find(entry => entry.name === models.model)
  const modelGb = installed?.size ? `${(installed.size / 1e9).toFixed(1)} GB on disk` : ''

  const running = isDemo
    ? {
        dot: 'bg-muted',
        label: 'No machine behind this window',
        detail: 'Models run on your own machine, in the desktop app.',
      }
    : models.status === 'online' && models.available
      ? {
          dot: 'bg-ok',
          label: `Running on this machine: ${models.model}`,
          detail: modelGb,
        }
      : models.status === 'loading'
        ? { dot: 'bg-muted', label: 'Looking for Ollama…', detail: '' }
        : {
            dot: 'bg-warn',
            label: 'Ollama is not answering',
            detail: models.error || 'Start Ollama and open Settings again.',
          }

  const keeping = isDemo
    ? { dot: 'bg-muted', label: 'Not in this window', detail: '' }
    : vault.state === 'ready'
      ? { dot: 'bg-ok', label: 'Keeping conversations', detail: vault.path }
      : vault.state === 'missing'
        ? { dot: 'bg-warn', label: 'No vault yet', detail: vault.error }
        : vault.state === 'offline'
          ? { dot: 'bg-muted', label: 'Vault unreachable', detail: 'The app is still running; nothing is being written.' }
          : { dot: 'bg-muted', label: 'Checking…', detail: '' }

  const options = resolveInference(inference).options
  const optionLine = (['num_ctx', 'num_batch', 'num_predict', 'num_gpu'] as const)
    .filter(key => typeof options[key] === 'number')
    .map(key => `${key}=${options[key]}`)
    .join(' · ')

  const warning = vramWarning(inference, installed?.size || 0)
  const fix = warning ? fitToProfile(inference, installed?.size || 0) : null

  // The providers that have a key, which are exactly the ones a permission can
  // govern: no key, nothing to allow.
  const keyedProviders = providers.filter(provider => provider.hasKey)

  const rowsById: Record<SectionId, Row[]> = {
    system: [
      {
        label: 'App',
        terms: 'version platform about',
        body: (
          <span className="text-[12.5px]">
            AI ASSistant <span className="text-muted">{bridge.app.version}</span>
          </span>
        ),
      },
      {
        label: 'Model',
        terms: 'running ollama weights size loaded',
        body: (
          <div className="flex items-start gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${running.dot}`} />
            <div className="min-w-0">
              <div className="text-[12.5px]">{running.label}</div>
              {running.detail && <div className="mt-0.5 text-[11.5px] text-muted">{running.detail}</div>}
            </div>
          </div>
        ),
      },
      {
        label: 'Ollama',
        terms: 'server endpoint 11434 not running',
        body: (
          <span className="text-[12.5px]">
            {isDemo ? 'Not in this window' : models.status === 'online' ? '127.0.0.1:11434' : models.status === 'loading' ? 'Looking…' : 'Not running'}
          </span>
        ),
      },
      {
        label: 'Extension',
        terms: 'browser extension chrome capture port 8765 posts',
        body: (
          <div className="flex items-start gap-2">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                isDemo ? 'bg-muted' : extension.listening ? 'bg-ok' : 'bg-warn'
              }`}
            />
            <div className="min-w-0">
              <div className="text-[12.5px]">
                {isDemo
                  ? 'Not in this window'
                  : extension.listening
                    ? `Listening at ${extension.url.replace(/^https?:\/\//, '')}`
                    : 'Not listening'}
              </div>
              <div className="mt-0.5 break-all text-[11.5px] text-muted">
                {isDemo
                  ? 'The port the browser extension posts to belongs to the desktop app.'
                  : extension.listening
                    ? 'The extension posts pages and conversations here. Nothing else answers on that port.'
                    : extension.error || 'The extension cannot reach this app at the moment.'}
              </div>
            </div>
          </div>
        ),
      },
      {
        label: 'Conversations folder',
        terms: 'vault path keep markdown files',
        body: (
          <div className="flex items-start gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${keeping.dot}`} />
            <div className="min-w-0">
              <div className="text-[12.5px]">{keeping.label}</div>
              {keeping.detail && <div className="mt-0.5 break-all text-[11.5px] text-muted">{keeping.detail}</div>}
              {vault.state === 'ready' && typeof vault.files === 'number' && (
                <div className="mt-0.5 text-[11.5px] text-muted">{vault.files} files on disk</div>
              )}
            </div>
          </div>
        ),
      },
      ...(isDemo
        ? [
            {
              label: 'This window',
              terms: 'preview browser interface only',
              body: (
                <p className="text-[12px] leading-relaxed text-muted">
                  The browser preview is the interface only. Nothing here is read from or written to a vault until this
                  runs as the desktop app.
                </p>
              ),
            },
          ]
        : []),
    ],
    agents: isDemo
      ? [
          {
            label: 'Agents',
            terms: 'permission allow local cloud vault browser extension files shell web mcp',
            body: (
              <p className="text-[12px] leading-relaxed text-muted">
                There is no machine behind this window: no local model to run, no vault to write to, and no port for
                a browser extension. Permissions are recorded and enforced by the desktop app.
              </p>
            ),
          },
        ]
      : [
          {
            label: 'Local model',
            terms: 'ollama local agent answer permission allow',
            body: (
              <Switch
                label="Allow the local model"
                checked={permissions.local}
                onChange={checked => void setPermission({ ...permissions, local: checked })}
              />
            ),
          },
          {
            label: 'Browser extension',
            terms: 'chrome extension capture port 8765 permission',
            body: (
              <div className="flex flex-col gap-1.5">
                <Switch
                  label="Allow browser captures"
                  checked={permissions.browserCapture}
                  onChange={checked => void setPermission({ ...permissions, browserCapture: checked })}
                />
                {!extension.listening && (
                  <span className="text-[11.5px] text-muted">
                    {extension.error || 'There is no port for it to post to at the moment.'}
                  </span>
                )}
              </div>
            ),
          },
          ...keyedProviders.map(provider => ({
            label: provider.label,
            terms: `${provider.id} cloud provider online answer permission`,
            body: (
              <Switch
                label={`Allow ${provider.label}`}
                checked={provider.enabled}
                onChange={checked =>
                  void setPermission({
                    ...permissions,
                    cloud: { ...permissions.cloud, [provider.id]: checked },
                  })
                }
              />
            ),
          })),
          ...(keyedProviders.length
            ? []
            : [
                {
                  label: 'Cloud models',
                  terms: 'provider key none online',
                  body: (
                    <p className="text-[12px] leading-relaxed text-muted">
                      No provider key is saved yet, so no cloud model can answer. Keys are added in Models.
                    </p>
                  ),
                },
              ]),
          {
            label: 'Keeping conversations',
            terms: 'vault write markdown save conversation permission',
            body: (
              <Switch
                label="Keep conversations"
                checked={permissions.keepConversations}
                onChange={checked => void setPermission({ ...permissions, keepConversations: checked })}
              />
            ),
          },
          {
            label: 'Not built yet',
            terms: 'files shell web mcp future tools',
            body: (
              <p className="text-[12px] leading-relaxed text-muted">
                Files, Shell, Web and MCP tools are not built yet, so there is nothing to grant. Each one appears
                here as its own permission when it exists.
              </p>
            ),
          },
          ...(permissionProblem
            ? [
                {
                  label: 'Permission',
                  terms: 'error could not save',
                  body: <p className="text-[12px] text-warn">{permissionProblem}</p>,
                },
              ]
            : []),
        ],
    appearance: [
      {
        label: 'Accent',
        terms: 'colour color theme violet blue teal amber rose',
        body: (
          <div className="flex gap-1.5">
            {ACCENTS.map(accent => (
              <button
                key={accent.name}
                type="button"
                className={`h-6 w-6 rounded-full border-2 ${
                  appearance.accent === accent.name ? 'border-ink' : 'border-transparent'
                }`}
                style={{ background: accent.hex }}
                onClick={() => onAppearanceChange({ ...appearance, accent: accent.name })}
                aria-label={`Accent: ${accent.label}`}
                aria-pressed={appearance.accent === accent.name}
                title={accent.label}
              />
            ))}
          </div>
        ),
      },
      {
        label: 'Conversation width',
        terms: 'column readable layout focused comfortable wide',
        body: (
          <div className="flex gap-1.5">
            {WIDTHS.map(width => (
              <button
                key={width.name}
                type="button"
                className={`rounded-full border px-3 py-1 text-[12px] ${
                  appearance.width === width.name
                    ? 'border-accent bg-accent/15 text-ink'
                    : 'border-line text-muted hover:bg-white/[0.06]'
                }`}
                onClick={() => onAppearanceChange({ ...appearance, width: width.name })}
                aria-label={`Conversation width: ${width.label}`}
                aria-pressed={appearance.width === width.name}
                title={`${width.px} pixels wide`}
              >
                {width.label}
              </button>
            ))}
          </div>
        ),
      },
    ],
    models: isDemo
      ? [
          {
            label: 'Providers',
            terms: 'claude anthropic gpt openai gemini openrouter groq deepseek grok xai custom key',
            body: (
              <div className="flex flex-col gap-1">
                <span className="text-[12.5px]">{CLOUD_PROVIDERS.map(provider => provider.label).join(' · ')}</span>
                <span className="text-[11.5px] text-muted">
                  Keys are kept by your machine’s own keychain, in the desktop app. This window is the interface only, so
                  there is no keychain behind it and no provider to ask.
                </span>
              </div>
            ),
          },
        ]
      : [
          {
            label: 'Keys',
            terms: 'keychain encryption sealed safe storage',
            body: (
              <span className="text-[12.5px]">
                {keyEncryption === 'os'
                  ? 'Sealed by this machine’s keychain.'
                  : 'Held for this run only — this machine gave the app nothing to seal a key with.'}
              </span>
            ),
          },
          ...providers.map(provider => ({
            label: provider.label,
            terms: `${provider.custom ? 'custom openai compatible endpoint self hosted lm studio llama.cpp vllm ' : ''}key api token ${provider.id}`,
            body: (
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${provider.hasKey ? 'bg-ok' : 'bg-muted'}`}
                  />
                  <span className="text-[12.5px]">
                    {provider.hasKey
                      ? provider.sessionOnly
                        ? 'Key saved for this run only'
                        : 'Key saved'
                      : 'No key'}
                  </span>
                  <span className="ml-auto flex shrink-0 gap-2">
                    {provider.hasKey ? (
                      <>
                        <button
                          type="button"
                          className="rounded-lg border border-line px-2.5 py-1 text-[12px] hover:bg-white/[0.06] disabled:opacity-50"
                          onClick={() => void testKey(provider.id, provider.label)}
                          disabled={testing === provider.id}
                          aria-label={`Test ${provider.label}`}
                        >
                          {testing === provider.id ? 'Testing…' : 'Test'}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-line px-2.5 py-1 text-[12px] hover:bg-white/[0.06]"
                          onClick={() => void removeKey(provider.id, provider.label)}
                          aria-label={`Remove key for ${provider.label}`}
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="rounded-lg border border-line px-2.5 py-1 text-[12px] hover:bg-white/[0.06]"
                        onClick={() => setEditing(editing === provider.id ? '' : provider.id)}
                        aria-label={`Add key for ${provider.label}`}
                      >
                        {editing === provider.id ? 'Cancel' : 'Add key'}
                      </button>
                    )}
                  </span>
                </div>

                {editing === provider.id && !provider.hasKey ? (
                  // A form, not a bare field: a password input outside one is a
                  // console warning in the browser, and this window must stay silent.
                  <form
                    className="flex gap-2"
                    onSubmit={event => {
                      event.preventDefault()
                      void saveKey(provider.id, provider.label)
                    }}
                  >
                    <input
                      type="password"
                      name={`key-${provider.id}`}
                      autoComplete="off"
                      className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3 py-2 text-[12.5px] outline-none focus:border-accent"
                      placeholder="Paste the key"
                      aria-label={`Key for ${provider.label}`}
                      value={keyDraft[provider.id] || ''}
                      onChange={event =>
                        setKeyDraft(current => ({ ...current, [provider.id]: event.target.value }))
                      }
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-line px-3 py-2 text-[12.5px] hover:bg-white/[0.06] disabled:opacity-50"
                      disabled={!(keyDraft[provider.id] || '').trim()}
                      aria-label={`Save key for ${provider.label}`}
                    >
                      Save
                    </button>
                  </form>
                ) : null}

                {provider.custom ? (
                  <div className="flex flex-col gap-2">
                    {([
                      ['Base URL', customBase, setCustomBase, 'http://127.0.0.1:1234/v1', 'baseUrl'],
                      ['Model', customModel, setCustomModel, 'the model name that endpoint expects', 'model'],
                    ] as const).map(([label, value, setter, placeholder, field]) => (
                      <label key={field} className="flex items-center gap-2">
                        <span className="w-[74px] shrink-0 text-[11.5px] text-muted">{label}</span>
                        <input
                          className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3 py-2 text-[12.5px] outline-none focus:border-accent"
                          placeholder={placeholder}
                          aria-label={`Custom ${field}`}
                          spellCheck={false}
                          value={value}
                          onChange={event => setter(event.target.value)}
                          onBlur={() =>
                            void saveCustom(
                              field === 'baseUrl' ? value : customBase,
                              field === 'model' ? value : customModel
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                ) : null}

                {providerProblems[provider.id] ? (
                  <p className="text-[11.5px] text-warn">{providerProblems[provider.id]}</p>
                ) : null}
                {verdict[provider.id] ? (
                  <p className="text-[11.5px] text-muted" role="status">
                    {verdict[provider.id]}
                  </p>
                ) : null}
                {!provider.custom && provider.keysUrl ? (
                  <a
                    className="w-fit text-[11.5px] text-muted underline hover:text-ink"
                    href={provider.keysUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {provider.keysUrl.replace(/^https:\/\//, '')}
                  </a>
                ) : null}
              </div>
            ),
          })),
          ...(providersError
            ? [
                {
                  label: 'Providers',
                  terms: 'error unavailable read',
                  body: <p className="text-[12px] text-warn">{providersError}</p>,
                },
              ]
            : []),
        ],
    performance: [
      {
        label: 'Memory profile',
        terms: 'vram gpu context cpu fastest',
        body: (
          <div className="flex flex-col gap-1.5">
            <select
              className="w-full max-w-[320px] rounded-lg border border-line bg-card px-3 py-2 text-[12.5px] outline-none focus:border-accent"
              value={inference.profile || DEFAULT_INFERENCE.profile}
              onChange={event => onInferenceChange(withProfile(inference, event.target.value))}
              aria-label="Memory profile"
            >
              {INFERENCE_PROFILES.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
            <div className="font-mono text-[11.5px] text-muted">{optionLine || 'Ollama’s own defaults'}</div>
          </div>
        ),
      },
      ...(inference.profile === 'custom'
        ? [
            {
              label: 'Values',
              terms: 'context window prompt batch longest reply layers gpu custom numbers',
              body: (
                <div className="grid grid-cols-2 gap-2">
                  {CUSTOM_FIELDS.map(field => (
                    <label key={field.key} className="rounded-lg border border-line bg-card px-3 py-2">
                      <span className="block text-[11.5px] text-muted">{field.label}</span>
                      <input
                        className="mt-0.5 w-full bg-transparent text-[13px] outline-none placeholder:text-muted/60"
                        inputMode="numeric"
                        value={customValue(inference, field.key)}
                        placeholder={customRange(field.key)}
                        aria-label={field.label}
                        spellCheck={false}
                        onChange={event =>
                          onInferenceChange(withCustomOption(inference, field.key, event.target.value))
                        }
                        onBlur={() => onInferenceChange(clampCustomOption(inference, field.key))}
                      />
                    </label>
                  ))}
                </div>
              ),
            },
          ]
        : []),
      ...(warning
        ? [
            {
              label: 'Memory',
              terms: 'vram fit warning too big',
              body: (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2">
                  <span className="text-[12px] text-warn">{warning}</span>
                  <button
                    className="ml-auto shrink-0 rounded-lg border border-line px-2.5 py-1 text-[12px] hover:bg-white/[0.06]"
                    onClick={() => onInferenceChange(fix || withProfile(inference, 'cpu'))}
                    aria-label={fix ? 'Fit it' : 'Use CPU only'}
                  >
                    {fix ? 'Fit it' : 'Use CPU only'}
                  </button>
                </div>
              ),
            },
          ]
        : []),
    ],
    vault: [
      {
        label: 'Folder',
        terms: 'vault path choose change folder markdown',
        body: isDemo ? (
          <p className="text-[12px] text-muted">The desktop app keeps conversations in the folder you choose.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-line px-3 py-2 text-[12.5px] hover:bg-white/[0.06]"
                onClick={() => void choose()}
                disabled={busy}
                aria-label="Choose folder"
              >
                Choose folder…
              </button>
              <div className="flex min-w-[220px] flex-1 gap-2">
                <input
                  className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3 py-2 text-[12.5px] outline-none focus:border-accent"
                  value={typed}
                  onChange={event => setTyped(event.target.value)}
                  placeholder="Paste a folder path"
                  aria-label="Vault folder path"
                  spellCheck={false}
                />
                <button
                  className="rounded-lg border border-line px-3 py-2 text-[12.5px] hover:bg-white/[0.06] disabled:opacity-50"
                  onClick={() => void apply(typed)}
                  disabled={busy || !typed.trim()}
                  aria-label="Use this folder"
                >
                  Use
                </button>
              </div>
            </div>
            <p className="text-[11.5px] text-muted">
              The folder must already exist; nothing is created in its place if the path is wrong.
            </p>
            {problem && (
              <p className="text-[12px] text-warn" role="status">
                {problem}
              </p>
            )}
          </div>
        ),
      },
    ],
  }

  const needle = query.trim().toLowerCase()
  const rowText = (row: Row): string => `${row.label} ${row.terms || ''}`.toLowerCase()
  const matches = (row: Row): boolean => !needle || rowText(row).includes(needle)
  const sectionFound = (id: SectionId): boolean => {
    const meta = SECTIONS.find(entry => entry.id === id)
    if (!meta) return false
    return meta.title.toLowerCase().includes(needle) || rowsById[id].some(matches)
  }

  // A search that would leave the open section empty opens the first section it
  // did find, so the pane never sits blank next to a list of results.
  const visible = SECTIONS.filter(meta => sectionFound(meta.id))
  useEffect(() => {
    if (!needle) return
    if (visible.some(meta => meta.id === section)) return
    const first = visible[0]
    if (first) setSection(first.id)
  }, [needle, section, visible])

  if (!open) return null

  const active = SECTIONS.find(meta => meta.id === section) || SECTIONS[0]
  const allRows = rowsById[active.id]
  const found = allRows.filter(matches)
  const rows = !needle ? allRows : found.length ? found : active.title.toLowerCase().includes(needle) ? allRows : []

  function resetSection(): void {
    if (section === 'appearance') onAppearanceChange(DEFAULT_APPEARANCE)
    if (section === 'performance') onInferenceChange(DEFAULT_INFERENCE)
    // Every permission back to its own default, which is the safe answer rather
    // than the last one: a local model may answer, a local vault may keep, and
    // nothing online is switched on or off except by a key.
    if (section === 'agents') void setPermission(DEFAULT_PERMISSIONS)
  }

  return (
    <div className="absolute inset-0 z-40 flex bg-bg" role="dialog" aria-modal="true" aria-label="Settings">
      <aside className="flex w-[236px] shrink-0 flex-col border-r border-line bg-panel">
        <div className="p-3">
          <input
            className="w-full rounded-lg border border-line bg-card px-3 py-1.5 text-[12.5px] outline-none focus:border-accent"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Find a setting"
            aria-label="Search settings"
            spellCheck={false}
          />
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {GROUPS.map(group => {
            const items = visible.filter(meta => meta.group === group)
            if (!items.length) return null
            return (
              <div key={group} className="mb-2">
                <div className="px-3 py-1.5 text-[11px] text-muted">{group}</div>
                {items.map(meta => {
                  const current = meta.id === section
                  return (
                    <button
                      key={meta.id}
                      type="button"
                      className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-[12.5px] ${
                        current ? 'bg-accent/15 text-ink' : 'text-muted hover:bg-white/[0.06] hover:text-ink'
                      }`}
                      onClick={() => setSection(meta.id)}
                      aria-label={`Section: ${meta.title}`}
                      aria-current={current ? 'page' : undefined}
                    >
                      <SectionIcon id={meta.id} />
                      {meta.title}
                    </button>
                  )
                })}
              </div>
            )
          })}
          {!visible.length && <p className="px-3 py-2 text-[12px] text-muted">Nothing matches that.</p>}
        </nav>

        <div className="border-t border-line p-2">
          <button
            type="button"
            className="w-full rounded-lg px-3 py-2 text-left text-[12.5px] text-muted enabled:hover:bg-white/[0.06] disabled:opacity-40"
            onClick={resetSection}
            disabled={!active.resettable}
            aria-label="Reset section"
            title={
              active.resettable
                ? `Put ${active.title} back to its defaults`
                : 'Nothing in this section is a preference to reset'
            }
          >
            Reset
          </button>
        </div>
      </aside>

      <section className="min-w-0 flex-1 overflow-y-auto">
        <header className="flex items-center gap-2 border-b border-line px-5 py-3.5">
          <h1 className="text-[15px] font-medium">{active.title}</h1>
          <button
            type="button"
            className="ml-auto rounded-lg px-2 py-1 text-muted hover:bg-white/[0.06] hover:text-ink"
            onClick={onClose}
            aria-label="Close settings"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M5 5l10 10M15 5 5 15" />
            </svg>
          </button>
        </header>

        <div className="w-full max-w-[720px] px-5 py-5">
          {rows.length === 0 ? (
            <p className="text-[12.5px] text-muted">Nothing here matches “{query.trim()}”.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {rows.map(row => (
                <div key={row.label} className="grid gap-1.5 sm:grid-cols-[180px_1fr] sm:gap-4">
                  <div className="text-[12.5px] text-muted sm:pt-1">{row.label}</div>
                  <div className="min-w-0">{row.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
