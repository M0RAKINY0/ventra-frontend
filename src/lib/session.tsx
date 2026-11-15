import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { ApiError, api } from "@/lib/api"
import { auth } from "@/lib/auth"
import type { User } from "@/types/api"

type SessionValue = {
  user: User | null
  status: "loading" | "ready"
  refresh: () => Promise<User | null>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<"loading" | "ready">("loading")

  const refresh = useCallback(async () => {
    try {
      const me = await api.me()
      setUser(me)
      return me
    } catch (error) {
      // 401 just means nobody is signed in. Anything else also leaves the
      // visitor signed out, and the pages show their own errors.
      if (!(error instanceof ApiError)) console.error(error)
      setUser(null)
      return null
    } finally {
      setStatus("ready")
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await auth.signOut()
    } finally {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(() => ({ user, status, refresh, signOut }), [user, status, refresh, signOut])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext)
  if (!value) throw new Error("useSession must be used inside SessionProvider")
  return value
}
