import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react"

type Location = { pathname: string; search: URLSearchParams }

type RouterValue = Location & {
  navigate: (to: string, options?: { replace?: boolean }) => void
}

const RouterContext = createContext<RouterValue | null>(null)

function readLocation(): Location {
  return { pathname: window.location.pathname, search: new URLSearchParams(window.location.search) }
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location>(readLocation)

  useEffect(() => {
    const onPop = () => setLocation(readLocation())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (options?.replace) window.history.replaceState({}, "", to)
    else window.history.pushState({}, "", to)
    setLocation(readLocation())
    window.scrollTo({ top: 0 })
  }, [])

  const value = useMemo(() => ({ ...location, navigate }), [location, navigate])
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter(): RouterValue {
  const value = useContext(RouterContext)
  if (!value) throw new Error("useRouter must be used inside RouterProvider")
  return value
}

/** Matches "/events/:eventId" style patterns. Returns params, or null when it doesn't match. */
export function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean)
  const pathParts = pathname.replace(/\/+$/, "").split("/").filter(Boolean)
  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let index = 0; index < patternParts.length; index += 1) {
    const part = patternParts[index]
    const value = pathParts[index]
    if (part.startsWith(":")) params[part.slice(1)] = decodeURIComponent(value)
    else if (part !== value) return null
  }
  return params
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }

export function Link({ to, onClick, ...rest }: LinkProps) {
  const { navigate } = useRouter()

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      rest.target === "_blank"
    ) {
      return
    }
    event.preventDefault()
    navigate(to)
  }

  return <a href={to} onClick={handleClick} {...rest} />
}
