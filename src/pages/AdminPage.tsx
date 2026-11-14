import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { Container, EmptyState, ErrorState, Loading, Notice, Sheet, StatusPill } from "@/components/common"
import { PhotoHero } from "@/components/shell"
import { api } from "@/lib/api"
import { coverFor, errorMessage, eventStatusLabel, initials, shortDate } from "@/lib/format"
import { Link } from "@/lib/router"
import { useSession } from "@/lib/session"
import { useAsync } from "@/lib/use-async"
import { cn } from "@/lib/utils"
import type { User, VentraEvent } from "@/types/api"
import { AccessDeniedPage } from "@/pages/StatusPages"

const AVATAR_COLORS = ["bg-cobalt", "bg-[#b5481f]", "bg-[#2f6b35]", "bg-[#6b3a0a]", "bg-ink-soft"]

export function AdminPage() {
  const { user } = useSession()
  const [tab, setTab] = useState<"users" | "events">("users")
  if (user?.role !== "ADMIN") return <AccessDeniedPage />

  return (
    <div className="min-h-screen bg-paper">
      <PhotoHero image="/events/night-market.webp" dim minHeight="min-h-[300px] md:min-h-[360px]">
        <Container className="flex flex-col gap-2">
          <span className="text-white/85">Admins only</span>
          <h1 className="m-0 font-display text-[clamp(34px,5vw,64px)] leading-none tracking-tight">Admin</h1>
        </Container>
      </PhotoHero>
      <Sheet>
        <Container className="flex flex-col gap-6 pt-7 md:pt-8">
          <div role="tablist" aria-label="Admin sections" className="segmented self-stretch sm:self-start">
            <button type="button" role="tab" aria-selected={tab === "users"} onClick={() => setTab("users")}>
              Users
            </button>
            <button type="button" role="tab" aria-selected={tab === "events"} onClick={() => setTab("events")}>
              Events
            </button>
          </div>
          <div role="tabpanel">{tab === "users" ? <UsersPanel me={user} /> : <EventsPanel />}</div>
        </Container>
      </Sheet>
    </div>
  )
}

function UsersPanel({ me }: { me: User }) {
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search.trim()), 300)
    return () => window.clearTimeout(id)
  }, [search])

  const users = useAsync((signal) => api.listUsers({ query: debounced || undefined, pageSize: 50 }, signal), [debounced])

  async function toggle(target: User) {
    setPending(target.id)
    setError(null)
    try {
      const updated = await api.setRole(target.id, target.role === "ADMIN" ? "USER" : "ADMIN")
      users.setData((current) =>
        current ? { ...current, items: current.items.map((item) => (item.id === updated.id ? { ...item, role: updated.role } : item)) } : current,
      )
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex min-h-[52px] max-w-md items-center gap-2.5 rounded-full px-5">
        <Search aria-hidden="true" size={20} className="text-subtle" />
        <label htmlFor="admin-search" className="sr-only-safe">
          Search users
        </label>
        <input
          id="admin-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name or email"
          className="min-w-0 flex-1 border-0 bg-transparent outline-none"
        />
      </div>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {users.error ? (
        <ErrorState error={users.error} onRetry={users.reload} />
      ) : users.loading && !users.data ? (
        <Loading label="Loading people" />
      ) : (users.data?.items.length ?? 0) === 0 ? (
        <EmptyState title="Nobody matches that search." />
      ) : (
        <ul className="card m-0 flex list-none flex-col p-0">
          {users.data?.items.map((person, index) => {
            const isAdmin = person.role === "ADMIN"
            const self = person.id === me.id
            return (
              <li key={person.id} className={cn("flex flex-wrap items-center gap-3.5 px-4 py-3.5 md:px-5", index > 0 && "border-t border-line")}>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-11 flex-none items-center justify-center rounded-full text-sm font-bold text-white",
                    AVATAR_COLORS[index % AVATAR_COLORS.length],
                  )}
                >
                  {initials(person.name)}
                </span>
                <span className="flex min-w-0 flex-[1_1_200px] flex-col">
                  <span className="font-bold">{person.name}</span>
                  <span className="truncate text-sm text-subtle">{person.email}</span>
                </span>
                <StatusPill tone={isAdmin ? "admin" : "user"}>{isAdmin ? "Admin" : "User"}</StatusPill>
                <span className="hidden text-sm text-ink-soft md:inline">Joined {new Date(person.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                <button
                  type="button"
                  className="pill pill-soft min-h-11 px-4 text-sm"
                  disabled={self || pending === person.id}
                  title={self ? "You can't change your own role" : undefined}
                  aria-label={isAdmin ? `Remove admin role from ${person.name}` : `Make ${person.name} an admin`}
                  onClick={() => toggle(person)}
                >
                  {pending === person.id ? "Saving…" : isAdmin ? "Remove admin" : "Make admin"}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <p className="m-0 text-sm text-subtle">You can't change your own role.</p>
    </div>
  )
}

function EventsPanel() {
  const events = useAsync((signal) => api.listEvents({ pageSize: 100 }, signal), [])
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function cancel(event: VentraEvent) {
    setError(null)
    try {
      const updated = await api.cancelEvent(event.id)
      events.setData((current) =>
        current ? { ...current, items: current.items.map((item) => (item.id === updated.id ? { ...item, status: updated.status } : item)) } : current,
      )
      setConfirmId(null)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  if (events.error) return <ErrorState error={events.error} onRetry={events.reload} />
  if (events.loading && !events.data) return <Loading label="Loading events" />
  const list = events.data?.items ?? []
  if (list.length === 0) return <EmptyState title="No events yet." />

  return (
    <div className="flex flex-col gap-4">
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4 p-0 md:gap-5">
        {list.map((event) => {
          const cancelled = event.status === "CANCELLED"
          return (
            <li key={event.id} className="relative aspect-[16/10] overflow-hidden rounded-[26px] bg-ink text-white">
              <img src={coverFor(event)} alt="" className={cn("absolute inset-0 size-full object-cover", cancelled && "grayscale")} />
              <span aria-hidden="true" className="scrim-bottom absolute inset-0" />
              <StatusPill tone={event.status === "PUBLISHED" ? "live" : event.status === "DRAFT" ? "draft" : "void"} className="absolute left-3.5 top-3.5">
                {eventStatusLabel(event.status)}
              </StatusPill>
              <div className="absolute inset-x-[18px] bottom-4 flex items-end justify-between gap-2.5">
                <Link to={`/hosting/${event.id}`} className="flex min-w-0 flex-col gap-0.5 text-white no-underline">
                  <span className="text-lg font-bold">{event.title}</span>
                  <span className="text-[13px] text-white/85">
                    {shortDate(event.startsAt, event.timezone)} · {event.organizer.name}
                  </span>
                </Link>
                {cancelled ? null : confirmId === event.id ? (
                  <button type="button" className="pill pill-danger min-h-11 px-4 text-sm" onClick={() => cancel(event)}>
                    Confirm cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    className="pill pill-danger-soft min-h-11 px-4 text-sm"
                    aria-label={`Cancel ${event.title}`}
                    onClick={() => setConfirmId(event.id)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
