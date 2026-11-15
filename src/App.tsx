import { useEffect, type ReactNode } from "react"
import { MobileTabBar } from "@/components/shell"
import { Loading } from "@/components/common"
import { RouterProvider, matchPath, useRouter } from "@/lib/router"
import { SessionProvider, useSession } from "@/lib/session"
import { AdminPage } from "@/pages/AdminPage"
import { LoginPage, VerifyPage } from "@/pages/AuthPages"
import { BrowsePage } from "@/pages/BrowsePage"
import { CheckInPage } from "@/pages/CheckInPage"
import { EventPage } from "@/pages/EventPage"
import { HostingPage } from "@/pages/HostingPage"
import { LandingPage } from "@/pages/LandingPage"
import { ManageEventPage } from "@/pages/ManageEventPage"
import { NotFoundPage } from "@/pages/StatusPages"
import { TicketPage, TicketsPage } from "@/pages/TicketPages"

/** Sends signed-out visitors to log in, then back to where they were going. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, status } = useSession()
  const { pathname, search, navigate } = useRouter()
  const target = `${pathname}${search.toString() ? `?${search.toString()}` : ""}`

  useEffect(() => {
    if (status === "ready" && !user) navigate(`/login?next=${encodeURIComponent(target)}`, { replace: true })
  }, [status, user, navigate, target])

  if (status === "loading" || !user) return <Loading label="Checking your session" className="min-h-screen" />
  return <>{children}</>
}

type Route = { pattern: string; render: (params: Record<string, string>) => ReactNode; auth?: boolean; tabBar?: boolean }

const ROUTES: Route[] = [
  { pattern: "/", render: () => <LandingPage /> },
  { pattern: "/events", render: () => <BrowsePage />, tabBar: true },
  { pattern: "/events/:eventId", render: (p) => <EventPage eventId={p.eventId} /> },
  { pattern: "/login", render: () => <LoginPage /> },
  { pattern: "/verify", render: () => <VerifyPage /> },
  { pattern: "/tickets", render: () => <TicketsPage />, auth: true, tabBar: true },
  { pattern: "/tickets/:ticketId", render: (p) => <TicketPage ticketId={p.ticketId} />, auth: true },
  { pattern: "/hosting", render: () => <HostingPage />, auth: true, tabBar: true },
  { pattern: "/hosting/new", render: () => <ManageEventPage />, auth: true },
  { pattern: "/hosting/:eventId", render: (p) => <ManageEventPage eventId={p.eventId} />, auth: true },
  { pattern: "/check-in", render: () => <CheckInPage />, auth: true, tabBar: true },
  { pattern: "/admin", render: () => <AdminPage />, auth: true, tabBar: true },
]

function resolveRoute(pathname: string): { route: Route; params: Record<string, string> } | null {
  for (const route of ROUTES) {
    const params = matchPath(route.pattern, pathname)
    if (params) return { route, params }
  }
  return null
}

function Routes() {
  const { pathname } = useRouter()
  const match = resolveRoute(pathname)

  if (!match) return <NotFoundPage />
  const page = match.route.render(match.params)
  return (
    <>
      {match.route.auth ? <RequireAuth>{page}</RequireAuth> : page}
      {match.route.tabBar ? <MobileTabBar /> : null}
    </>
  )
}

export default function App() {
  return (
    <RouterProvider>
      <SessionProvider>
        <Routes />
      </SessionProvider>
    </RouterProvider>
  )
}
