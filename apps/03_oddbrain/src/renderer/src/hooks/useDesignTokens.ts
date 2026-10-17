import { useEffect, useState } from 'react'
import { DEFAULT_DESIGN_SYSTEM, loadDesignTokens } from '@shared/lib/design-systems'

/**
 * The CSS custom properties for one design system, loaded on demand.
 *
 * Each token set is its own module, so only the chosen one is fetched — that is
 * why this is async at all. Failing to load them is not an error worth showing:
 * the artifact still renders, it just renders without the styling pass.
 */
export function useDesignTokens(id: string = DEFAULT_DESIGN_SYSTEM): string {
  const [tokens, setTokens] = useState('')
  useEffect(() => {
    let cancelled = false
    loadDesignTokens(id)
      .then(value => {
        if (!cancelled) setTokens(value || '')
      })
      .catch(() => {
        if (!cancelled) setTokens('')
      })
    return () => {
      cancelled = true
    }
  }, [id])
  return tokens
}
