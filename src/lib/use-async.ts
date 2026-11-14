import { useCallback, useEffect, useState, type DependencyList } from "react"

type AsyncState<T> = {
  data: T | undefined
  error: unknown
  loading: boolean
  reload: () => void
  setData: (updater: (current: T | undefined) => T | undefined) => void
}

/** Runs an abortable loader whenever `deps` change. */
export function useAsync<T>(loader: (signal: AbortSignal) => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setDataState] = useState<T | undefined>(undefined)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    loader(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setDataState(result)
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setError(caught)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
    // The caller owns the dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((value) => value + 1), [])
  const setData = useCallback(
    (updater: (current: T | undefined) => T | undefined) => setDataState((current) => updater(current)),
    [],
  )

  return { data, error, loading, reload, setData }
}
