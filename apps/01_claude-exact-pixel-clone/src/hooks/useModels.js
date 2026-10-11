import { useCallback, useEffect, useRef, useState } from 'react'
import { getCapabilities, isRemoteModel, listModels, showModel } from '../lib/ollama.js'
const unverified = { verified: false, vision: false, thinking: false }
export default function useModels(model, setModel) {
  const [models, setModels] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [capabilities, setCapabilities] = useState(unverified)
  // Verified capabilities for EVERY installed model, not just the selected one.
  // This is what makes the vision bridge possible: a text-only model can still
  // accept an image and hand that one turn to a vision model that is installed.
  const [capabilityMap, setCapabilityMap] = useState({})
  const [verification, setVerification] = useState({ name: '', local: false, error: '' })
  const refreshRef = useRef(null)
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
      setModels(data.models.filter(item => typeof item.name === 'string' && !isRemoteModel(item.name, item)))
      setStatus('online'); setError('')
    } catch (error) {
      if (refreshRef.current === controller) {
        setModels([]); setStatus('offline')
        setError(error.name === 'AbortError' ? 'Ollama did not respond within 8 seconds.' : error.message)
      }
    } finally { clearTimeout(timer) }
  }, [])
  useEffect(() => { refresh(); return () => refreshRef.current?.abort() }, [refresh])
  useEffect(() => {
    if (status !== 'online') return
    let alive = true
    const controller = new AbortController()
    ;(async () => {
      const found = {}
      // Cap the fan-out: a large local library should not mean dozens of calls.
      for (const item of models.slice(0, 12)) {
        if (!alive) return
        try {
          const metadata = await showModel(item.name, controller.signal)
          if (isRemoteModel(item.name, metadata)) continue
          found[item.name] = getCapabilities(metadata)
        } catch { /* Unverifiable models simply stay unverified. */ }
      }
      if (alive) setCapabilityMap(found)
    })()
    return () => { alive = false; controller.abort() }
  }, [models, status])

  useEffect(() => {
    setCapabilities(unverified)
    setVerification({ name: model, local: false, error: '' })
    if (status !== 'online' || !models.some(item => item.name === model)) return
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort('timeout'), 8000)
    showModel(model, controller.signal).then(metadata => {
      if (controller.signal.aborted) return
      const remote = isRemoteModel(model, metadata)
      setCapabilities(remote ? unverified : getCapabilities(metadata))
      setVerification({ name: model, local: !remote, error: remote ? 'This Ollama entry uses a remote/cloud model. It is disabled: no cloud destination has been approved.' : '' })
    }).catch(error => {
      if (!controller.signal.aborted || controller.signal.reason === 'timeout') setVerification({ name: model, local: false, error: controller.signal.reason === 'timeout' ? 'Ollama model verification timed out. Refresh models and try again.' : `Could not verify the selected model: ${error.message}` })
    }).finally(() => clearTimeout(timer))
    return () => controller.abort()
  }, [model, models, status])
  const installed = models.some(item => item.name === model)
  const localError = verification.name === model ? verification.error : ''
  const visionModels = models.filter(item => capabilityMap[item.name]?.vision).map(item => item.name)
  return { model, select: setModel, models, status, error: error || localError || (status === 'online' && !installed ? `Selected model ${model} is not installed locally. Choose an installed model; nothing is downloaded or switched automatically.` : ''),
    capabilities, refresh,
    /** Installed models with VERIFIED vision, discovered without guessing from names. */
    visionModels,
    visionModel: visionModels.includes(model) ? model : visionModels[0] || '',
    /** True when an image can be handled by bridging to another installed model. */
    canSee: capabilities.vision || Boolean(visionModels.length),
    available: status === 'online' && installed && verification.name === model && verification.local }
}
