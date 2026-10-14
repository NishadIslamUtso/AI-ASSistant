/**
 * inference.js — how much of the machine a reply is allowed to use.
 *
 * The single biggest reason a 3B model feels slow on a 4 GB laptop GPU is not
 * the weights (qwen2.5:3b is ~1.9 GB) — it is the context. Ollama allocates a
 * KV cache sized to num_ctx, and when weights + cache exceed VRAM the driver
 * silently spills to shared system memory, after which every token crawls.
 *
 * So the fix is a smaller num_ctx, not a smaller model. These profiles are
 * deliberately conservative and every option below is a real Ollama parameter.
 */

export const INFERENCE_KEY = 'ai_assistant_inference'

export const PROFILES = [
  {
    id: 'safe-4gb',
    label: '4 GB VRAM (safe)',
    hint: 'For a 4 GB laptop GPU such as an RTX 3050. Smallest context, least spill.',
    options: { num_ctx: 2048, num_batch: 128, num_predict: 512, f16_kv: true, low_vram: true },
    keepAlive: '2m',
  },
  {
    id: 'balanced-6gb',
    label: '6 GB VRAM',
    hint: 'A middle ground if you have a little more headroom.',
    options: { num_ctx: 4096, num_batch: 256, num_predict: 1024, f16_kv: true },
    keepAlive: '5m',
  },
  {
    id: 'balanced-8gb',
    label: '8 GB VRAM',
    hint: 'The previous default. Fine on a desktop card, tight on 4 GB.',
    options: { num_ctx: 4096, num_batch: 256, num_predict: 2048 },
    keepAlive: '5m',
  },
  {
    id: 'quality',
    label: 'Maximum quality',
    hint: 'Largest context. Expect spilling and slow replies on a small GPU.',
    options: { num_ctx: 8192, num_batch: 512, num_predict: 4096 },
    keepAlive: '10m',
  },
  {
    id: 'cpu-only',
    label: 'CPU only',
    hint: 'Ignore the GPU entirely. Slower, but never runs out of VRAM.',
    options: { num_ctx: 4096, num_batch: 128, num_predict: 1024, num_gpu: 0 },
    keepAlive: '5m',
  },
  {
    id: 'custom',
    label: 'Custom context',
    hint: 'Set the context window yourself.',
    options: { num_ctx: 4096 },
    keepAlive: '5m',
  },
]

export const DEFAULT_PROFILE_ID = 'safe-4gb'

export const CTX_MIN = 512
export const CTX_MAX = 32768

export function profileById(id) {
  return PROFILES.find(profile => profile.id === id) || PROFILES[0]
}

export function clampContext(value, fallback = 4096) {
  const number = Number.parseInt(value, 10)
  if (!Number.isFinite(number)) return fallback
  return Math.min(CTX_MAX, Math.max(CTX_MIN, number))
}

/**
 * Turn stored state into the exact object handed to Ollama.
 * Only ever stores `{ profile, numCtx }`, never a cached options blob — so
 * changing a profile's defaults in a later version reaches existing installs.
 */
export function resolveInference(value) {
  const source = value && typeof value === 'object' ? value : {}
  const profile = profileById(source.profile).id
  const numCtx = clampContext(source.numCtx, profileById(profile).options.num_ctx)
  const base = profileById(profile)
  const options = { ...base.options }
  if (profile === 'custom') options.num_ctx = numCtx
  return { profile, numCtx, options, keepAlive: base.keepAlive }
}

export const DEFAULT_INFERENCE = { profile: DEFAULT_PROFILE_ID, numCtx: 4096 }

/**
 * A rough fit check, in the spirit of LM Studio's green/red memory indicator.
 * KV cache is estimated at ~0.5 MB per 1K tokens for a 3B-class model with
 * f16_kv — an estimate, not a measurement, so the wording stays a warning.
 */
export function fitAdvice({ profileId, numCtx, vramGb = 4 }) {
  const ctx = profileId === 'custom' ? numCtx : profileById(profileId).options.num_ctx
  const reserve = 1.9 // approximate weights for a 3B model at Q4
  const cache = (ctx / 1000) * 0.5
  const predicted = reserve + cache
  if (profileId === 'cpu-only') return { level: 'ok', message: 'GPU is bypassed, so VRAM is not a factor.' }
  if (predicted > vramGb) {
    return {
      level: 'warn',
      message: `About ${predicted.toFixed(1)} GB needed against ${vramGb} GB of VRAM at ${ctx.toLocaleString()} context. Expect spilling to system memory and much slower replies — try a lower profile.`,
    }
  }
  return { level: 'ok', message: `About ${predicted.toFixed(1)} GB needed against ${vramGb} GB of VRAM at ${ctx.toLocaleString()} context. Should stay on the GPU.` }
}
