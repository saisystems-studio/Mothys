import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../services/api'

/**
 * Runs an async loader on mount (and whenever `loader` identity changes) and
 * exposes { data, loading, error, reload }. `loader` must be a stable
 * reference (module-level function or useCallback).
 */
export default function useAsyncData(loader) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    loader()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: getErrorMessage(err) })
      })
    return () => {
      cancelled = true
    }
  }, [loader, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload }
}
