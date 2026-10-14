import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_INFERENCE, PROFILES, CTX_MIN, CTX_MAX,
  clampContext, fitAdvice, profileById, resolveInference,
} from '../src/lib/inference.js'

test('the default profile is the one meant for a 4 GB GPU', () => {
  assert.equal(DEFAULT_INFERENCE.profile, 'safe-4gb')
  assert.equal(profileById(DEFAULT_INFERENCE.profile).options.num_ctx, 2048)
})

test('every profile resolves to real Ollama options', () => {
  const allowed = new Set(['num_ctx', 'num_batch', 'num_predict', 'num_gpu', 'f16_kv', 'low_vram'])
  for (const preset of PROFILES) {
    for (const key of Object.keys(preset.options)) {
      assert.ok(allowed.has(key), `${preset.id} sets "${key}", which is not an Ollama option`)
    }
    assert.ok(preset.options.num_ctx >= CTX_MIN, `${preset.id} context is below the floor`)
  }
})

test('the 4 GB profile is strictly lighter than the previous default', () => {
  const safe = profileById('safe-4gb').options
  const old = profileById('balanced-8gb').options
  assert.ok(safe.num_ctx < old.num_ctx, 'safe profile must use less context than the old hardcoded 4096')
  assert.ok(safe.num_predict < old.num_predict, 'safe profile must cap generation sooner')
  assert.equal(safe.f16_kv, true, 'f16_kv halves KV-cache memory and must stay on for small GPUs')
})

test('a custom context is clamped instead of trusted', () => {
  assert.equal(clampContext('4096'), 4096)
  assert.equal(clampContext('1'), CTX_MIN)
  assert.equal(clampContext('999999'), CTX_MAX)
  assert.equal(clampContext('nonsense', 4096), 4096)
  assert.equal(clampContext(undefined, 1234), 1234)
})

test('resolveInference tolerates junk and always returns usable options', () => {
  for (const junk of [null, undefined, 'nope', 42, [], { profile: 'does-not-exist' }]) {
    const resolved = resolveInference(junk)
    assert.ok(PROFILES.some(p => p.id === resolved.profile), 'fell back to a real profile')
    assert.ok(Number.isFinite(resolved.options.num_ctx))
    assert.equal(typeof resolved.keepAlive, 'string')
  }
})

test('custom profile uses the stored numCtx; presets ignore it', () => {
  const custom = resolveInference({ profile: 'custom', numCtx: 6000 })
  assert.equal(custom.options.num_ctx, 6000)
  // A stale numCtx on a preset must not leak through.
  const preset = resolveInference({ profile: 'safe-4gb', numCtx: 6000 })
  assert.equal(preset.options.num_ctx, 2048)
})

test('fit advice warns when the context will not fit and stays quiet when it will', () => {
  const tight = fitAdvice({ profileId: 'quality', numCtx: 8192, vramGb: 4 })
  assert.equal(tight.level, 'warn', '8K context on 4 GB must warn')
  const roomy = fitAdvice({ profileId: 'safe-4gb', numCtx: 2048, vramGb: 4 })
  assert.equal(roomy.level, 'ok', '2K context on 4 GB should not warn')
  const cpu = fitAdvice({ profileId: 'cpu-only', numCtx: 4096, vramGb: 4 })
  assert.equal(cpu.level, 'ok', 'CPU-only bypasses VRAM entirely')
})
