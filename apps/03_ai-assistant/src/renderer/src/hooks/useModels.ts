import { useCallback, useEffect, useRef, useState } from 'react'
import type { ModelCapabilities } from '@shared/types'
import { getCapabilities, isRemoteModel, listModels, showModel } from '@shared/lib/ollama'

/** Nothing is assumed about a model until Ollama's own metadata says so. */
const UNVERIFIED: ModelCapabilities = { verified: false, vision: false, thinking: false }

export type InstalledModel = { name: string; size?: number }

export type ModelState = {
  model: string
  select: (name: string) => void
  models: InstalledModel[]
  status: 'loading' | 'online' | 'offline'
  /** A sentence the interface can show as-is. Empty when everything is fine. */
  error: string
  capabilities: ModelCapabilities
  refresh: () => void
  /** True only when the selected model is installed, verified and local. */
  available: boolean
}

/**
 * The models on this machine, and what the selected one can actually do.
 *
 * Two things here are deliberate. Cloud entries that Ollama lists are filtered
 * out: nothing on this machine has been authorized to send data anywhere, so a
 * cloud model must not appear selectable and then quietly be used. And vision or
 * thinking support is taken from Ollama's capability list, never from the model's
 * name — `qwen3-vl` looking like "vision" proves nothing about what is installed.
 */
export default function useModels(model: string, setModel: (name: string) => void): ModelState {
  const [models, setModels] = useState<InstalledModel[]>([])
  const [status, setStatus] = useState<ModelState['status']>('loading')
  const [error, setError] = useState('')
  const [capabilities, setCapabilities] = useState<ModelCapabilities>(UNVERIFIED)
  const [verification, setVerification] = useState({ name: '', local: false, error: '' })
  const refreshRef = useRef<AbortController | null>(null)

  const refresh = useCallback(async () => {
    refreshRef.current?.abort()
    const controller = new AbortController()
    refreshRef.current = controller
    const timer = setTimeout(() => controller.abort(), 8000)
    setStatus('loading')
    try {
      const data = await listModels(controller.signal)
      if (!Array.isArray(data.models)) throw new Error('Ollama returned an invalid model list.')
      if (controller.signal.aborted || refreshRef.current !== controller) return
      // Ollama can list cloud models too. They are NOT authorized in local mode.
      setModels(
        data.models.filter(
          (item): item is InstalledModel =>
            typeof item.name === 'string' && !isRemoteModel(item.name, item as never)
        )
      )
      setStatus('online')
      setError('')
    } catch (failure) {
      if (refreshRef.current === controller) {
        setModels([])
        setStatus('offline')
        const problem = failure as Error
        setError(
          problem.name === 'AbortError' ? 'Ollama did not respond within 8 seconds.' : problem.message
        )
      }
    } finally {
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    void refresh()
    return () => refreshRef.current?.abort()
  }, [refresh])

  useEffect(() => {
    setCapabilities(UNVERIFIED)
    setVerification({ name: model, local: false, error: '' })
    if (status !== 'online' || !models.some(item => item.name === model)) return
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort('timeout'), 8000)
    showModel(model, controller.signal)
      .then(metadata => {
        if (controller.signal.aborted) return
        const remote = isRemoteModel(model, metadata as never)
        setCapabilities(remote ? UNVERIFIED : getCapabilities(metadata))
        setVerification({
          name: model,
          local: !remote,
          error: remote
            ? 'This Ollama entry uses a remote/cloud model. It is disabled: no cloud destination has been approved.'
            : '',
        })
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted || controller.signal.reason === 'timeout') {
          setVerification({
            name: model,
            local: false,
            error:
              controller.signal.reason === 'timeout'
                ? 'Ollama model verification timed out. Refresh models and try again.'
                : `Could not verify the selected model: ${failure.message}`,
          })
        }
      })
      .finally(() => clearTimeout(timer))
    return () => controller.abort()
  }, [model, models, status])

  const installed = models.some(item => item.name === model)
  const localError = verification.name === model ? verification.error : ''

  return {
    model,
    select: setModel,
    models,
    status,
    error:
      error ||
      localError ||
      (status === 'online' && !installed
        ? `Selected model ${model} is not installed locally. Choose an installed model; nothing is downloaded or switched automatically.`
        : ''),
    capabilities,
    refresh: () => void refresh(),
    available: status === 'online' && installed && verification.name === model && verification.local,
  }
}
