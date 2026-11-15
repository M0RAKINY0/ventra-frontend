import { Plus } from "lucide-react"
import { useState } from "react"
import { Container, EmptyState, ErrorState, Loading, Sheet, StatusPill } from "@/components/common"
import { PhotoHero } from "@/components/shell"
import { api } from "@/lib/api"
import { capacity, coverFor, eventStatusLabel, shortDate, time } from "@/lib/format"
import { Link } from "@/lib/router"
import { useSession } from "@/lib/session"
import { useAsync } from "@/lib/use-async"
import { cn } from "@/lib/utils"
import type { EventStatus, VentraEvent } from "@/types/api"

const FILTERS: { key: "ALL" | EventStatus; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "DRAFT", label: "Drafts" },
  { key: "PUBLISHED", label: "Live" },
  { key: "CANCELLED", label: "Cancelled" },
]

/** Events the signed-in person organizes, drafts included. */
function useMyEvents() {
  const { user } = useSession()
  return useAsync(async (signal) => {
    // Signed-in requests return published events plus everything this person owns.
    const page = await api.listEvents({ pageSize: 100 }, signal)
    return page.items.filter((event) => event.organizerId === user?.id)
  }, [user?.id])
}

export function HostingPage() {
  const events = useMyEvents()
  const [filter, setFilter] = useState<"ALL" | EventStatus>("ALL")
  const all = events.data ?? []
  const [now] = useState(() => Date.now())
  const next = all
    .filter((event) => event.status === "PUBLISHED" && new Date(event.endsAt).getTime() >= now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]
  const shown = all.filter((event) => filter === "ALL" || event.status === filter)

  return (
    <div className="min-h-screen bg-paper">
      <PhotoHero image={next ? coverFor(next) : "/events/rooftop-cinema.webp"} minHeight="min-h-[380px] md:min-h-[460px]">
        <Container className="flex flex-wrap items-end justify-between gap-6">
          {next ? <NextUp event={next} /> : (
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-white/85">Hosting</span>
              <h1 className="m-0 font-display text-[clamp(34px,5vw,60px)] leading-none tracking-tight">Your events</h1>
            </div>
          )}
          {next ? (
            <div className="flex flex-wrap gap-2.5">
              <Link to={`/hosting/${next.id}`} className="glass pill text-white">
                Manage
              </Link>
              <Link to={`/check-in?event=${next.id}`} className="pill pill-light">
                Open check-in
              </Link>
            </div>
          ) : null}
        </Container>
      </PhotoHero>

      <Sheet>
        <Container className="flex flex-col gap-6 pt-7 md:pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div role="group" aria-label="Status" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="chip flex-none"
                  aria-pressed={filter === item.key}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Link to="/hosting/new" className="pill pill-dark w-full sm:w-auto">
              <Plus aria-hidden="true" size={18} />
              Create event
            </Link>
          </div>

          {events.error ? (
            <ErrorState error={events.error} onRetry={events.reload} />
          ) : events.loading ? (
            <Loading label="Loading your events" />
          ) : shown.length === 0 ? (
            <EmptyState
              title={all.length === 0 ? "You haven't created an event yet." : "Nothing in this filter."}
              body={all.length === 0 ? "Drafts stay private until you publish them." : undefined}
            />
          ) : (
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4 p-0 md:gap-5">
              {shown.map((event) => (
                <li key={event.id}>
                  <HostedCard event={event} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Sheet>
    </div>
  )
}

function NextUp({ event }: { event: VentraEvent }) {
  const { reserved, total } = capacity(event)
  const percent = total === 0 ? 0 : Math.round((reserved / total) * 100)
  return (
    <div className="flex max-w-2xl flex-[1_1_420px] flex-col gap-2.5">
      <span className="font-semibold text-white/85">Next up · {shortDate(event.startsAt, event.timezone)}</span>
      <h1 className="m-0 font-display text-[clamp(32px,4.6vw,60px)] leading-none tracking-tight">{event.title}</h1>
      <div className="flex max-w-md items-center gap-3.5">
        <span aria-hidden="true" className="block h-2 flex-1 overflow-hidden rounded-full bg-white/30">
          <span className="block h-full bg-white" style={{ width: `${percent}%` }} />
        </span>
        <span className="whitespace-nowrap font-bold">
          {reserved} of {total} reserved
        </span>
      </div>
    </div>
  )
}

function HostedCard({ event }: { event: VentraEvent }) {
  const { reserved, total } = capacity(event)
  const percent = total === 0 ? 0 : Math.round((reserved / total) * 100)
  const tone = event.status === "PUBLISHED" ? "live" : event.status === "DRAFT" ? "draft" : "void"
  return (
    <Link
      to={`/hosting/${event.id}`}
      className="card flex flex-col overflow-hidden text-ink no-underline transition-transform hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span className="relative block aspect-video bg-paper-deep">
        {event.coverImageUrl || event.status !== "DRAFT" ? (
          <img
            src={coverFor(event)}
            alt=""
            className={cn("absolute inset-0 size-full object-cover", event.status === "CANCELLED" && "grayscale")}
          />
        ) : (
          <span className="absolute inset-3.5 flex items-center justify-center rounded-2xl border-2 border-dashed border-line-strong text-sm font-semibold text-subtle">
            No cover yet
          </span>
        )}
        <StatusPill tone={tone} className="absolute left-3 top-3">
          {eventStatusLabel(event.status)}
        </StatusPill>
      </span>
      <span className="flex flex-col gap-2 p-4 pb-5">
        <span className="text-lg font-bold">{event.title}</span>
        <span className="text-sm text-subtle">
          {shortDate(event.startsAt, event.timezone)} · {time(event.startsAt, event.timezone)}
        </span>
        <span className="mt-1 flex items-center gap-2.5">
          <span aria-hidden="true" className="block h-1.5 flex-1 overflow-hidden rounded-full bg-paper">
            <span className="block h-full bg-ink" style={{ width: `${percent}%` }} />
          </span>
          <span className="whitespace-nowrap text-[13px] text-ink-soft">
            {total === 0 ? "No ticket types yet" : `${reserved} of ${total}`}
          </span>
        </span>
      </span>
    </Link>
  )
}
