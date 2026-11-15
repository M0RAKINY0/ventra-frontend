import { ArrowLeft, CalendarDays, MapPin } from "lucide-react"
import { useRef, useState } from "react"
import { Container, ErrorState, Loading, Notice, Sheet } from "@/components/common"
import { PhotoHero } from "@/components/shell"
import { ApiError, api } from "@/lib/api"
import {
  CATEGORY_LABELS,
  coverFor,
  errorMessage,
  longDate,
  money,
  remaining,
  shortDate,
  timeRange,
} from "@/lib/format"
import { Link, useRouter } from "@/lib/router"
import { useSession } from "@/lib/session"
import { useAsync } from "@/lib/use-async"
import { cn } from "@/lib/utils"
import type { Reservation, VentraEvent } from "@/types/api"
import { NotFoundPage } from "@/pages/StatusPages"

export function EventPage({ eventId }: { eventId: string }) {
  const event = useAsync((signal) => api.getEvent(eventId, signal), [eventId])

  if (event.error instanceof ApiError && event.error.status === 404) return <NotFoundPage />

  return (
    <div className="min-h-screen bg-paper">
      <PhotoHero image={event.data ? coverFor(event.data) : null} minHeight="min-h-[460px] md:min-h-[620px]">
        <Container className="flex flex-col gap-3.5">
          <Link
            to="/events"
            className="glass inline-flex min-h-11 items-center gap-1.5 self-start rounded-full pl-2.5 pr-4 font-semibold text-white no-underline"
          >
            <ArrowLeft aria-hidden="true" size={18} />
            All events
          </Link>
          {event.data ? (
            <>
              <h1 className="m-0 max-w-4xl font-display text-[clamp(34px,6vw,80px)] leading-[0.98] tracking-tight">
                {event.data.title}
              </h1>
              <span className="text-base text-white/85 md:text-lg">
                {CATEGORY_LABELS[event.data.category]} · Hosted by {event.data.organizer.name}
              </span>
            </>
          ) : null}
        </Container>
      </PhotoHero>

      <Sheet>
        <Container className="pt-8 md:pt-10">
          {event.error ? (
            <ErrorState error={event.error} onRetry={event.reload} />
          ) : !event.data ? (
            <Loading label="Loading event" />
          ) : (
            <EventBody event={event.data} onChanged={event.reload} />
          )}
        </Container>
      </Sheet>
    </div>
  )
}

function EventBody({ event, onChanged }: { event: VentraEvent; onChanged: () => void }) {
  const { user } = useSession()
  const { pathname } = useRouter()
  const firstAvailable = event.ticketTypes.find((type) => remaining(type) > 0)
  const [selectedId, setSelectedId] = useState(firstAvailable?.id ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  // One key per attempt, so a retry after a network failure can't double-book.
  const idempotencyKey = useRef(crypto.randomUUID())

  function selectType(ticketTypeId: string) {
    setSelectedId(ticketTypeId)
    setError(null)
    idempotencyKey.current = crypto.randomUUID()
  }

  const selected = event.ticketTypes.find((type) => type.id === selectedId)
  const isOwner = user?.id === event.organizerId
  const cancelled = event.status === "CANCELLED"
  const draft = event.status === "DRAFT"
  const canReserve = Boolean(user && user.role === "USER" && !cancelled && !draft && selected && remaining(selected) > 0)

  async function reserve() {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      const result = await api.reserve(event.id, selected.id, idempotencyKey.current)
      setReservation(result)
      idempotencyKey.current = crypto.randomUUID()
      onChanged()
    } catch (caught) {
      setError(errorMessage(caught))
      if (caught instanceof ApiError && caught.status !== 0) idempotencyKey.current = crypto.randomUUID()
      if (caught instanceof ApiError && caught.code === "TICKET_TYPE_SOLD_OUT") onChanged()
    } finally {
      setBusy(false)
    }
  }

  const reserveAction = !user ? (
    <Link to={`/login?next=${encodeURIComponent(pathname)}`} className="pill pill-dark w-full">
      Log in to reserve
    </Link>
  ) : (
    <button type="button" className="pill pill-dark w-full" disabled={!canReserve || busy} onClick={reserve}>
      {busy ? "Reserving…" : cancelled ? "Reservations closed" : selected ? `Reserve · ${money(selected.price, event.currency)}` : "Reserve"}
    </button>
  )

  return (
    <div className="flex flex-wrap items-start gap-8 lg:gap-10">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-7">
        {cancelled ? <Notice tone="danger">The organizer cancelled this event. Existing tickets are no longer valid.</Notice> : null}
        {draft ? (
          <Notice tone="info">
            This is a draft, so only you can see it.{" "}
            <Link to={`/hosting/${event.id}`} className="font-bold text-cobalt">
              Manage event
            </Link>
          </Notice>
        ) : null}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3.5">
          <div className="card flex items-center gap-3.5 px-5 py-4">
            <span className="flex h-14 w-[52px] flex-none flex-col items-center justify-center rounded-2xl bg-ink leading-none text-cream">
              <CalendarDays aria-hidden="true" size={22} />
            </span>
            <span className="flex flex-col">
              <span className="font-bold">{longDate(event.startsAt, event.timezone)}</span>
              <span className="text-sm text-subtle">{timeRange(event)}</span>
            </span>
          </div>
          <div className="card flex items-center gap-3.5 px-5 py-4">
            <span className="flex h-14 w-[52px] flex-none items-center justify-center rounded-2xl bg-[#fde2d6] text-[#b5481f]">
              <MapPin aria-hidden="true" size={22} />
            </span>
            <span className="flex flex-col">
              <span className="font-bold">{event.venue}</span>
              <span className="text-sm text-subtle">
                {event.city}, {event.countryCode}
              </span>
            </span>
          </div>
        </div>

        <section className="flex max-w-3xl flex-col gap-3">
          <h2 className="m-0 text-2xl">About this event</h2>
          <p className="m-0 whitespace-pre-line text-[17px] leading-[1.7] text-ink-soft md:text-lg">{event.description}</p>
        </section>
      </div>

      <aside
        aria-labelledby="reserve-title"
        className="flex min-w-0 flex-[1_1_360px] flex-col gap-4 rounded-[30px] bg-white p-5 shadow-[0_20px_50px_rgba(23,35,31,0.1)] md:p-6"
      >
        {reservation ? (
          <div role="status" className="flex flex-col gap-4">
            <div className="relative min-h-44 overflow-hidden rounded-[22px] text-white">
              <img src={coverFor(event)} alt="" className="absolute inset-0 size-full object-cover" />
              <span aria-hidden="true" className="absolute inset-0 bg-ink/70" />
              <span className="relative flex flex-col gap-2 p-6">
                <strong className="font-display text-3xl">You're in.</strong>
                <span className="leading-relaxed">
                  {reservation.ticketType.name} for {shortDate(event.startsAt, event.timezone)}. Your QR code is ready, and we're
                  emailing it to {user?.email}.
                </span>
              </span>
            </div>
            {reservation.ticket ? (
              <Link to={`/tickets/${reservation.ticket.id}`} className="pill pill-dark w-full">
                View ticket
              </Link>
            ) : (
              <Link to="/tickets" className="pill pill-dark w-full">
                My tickets
              </Link>
            )}
            <Link to="/events" className="pill pill-soft w-full">
              Keep browsing
            </Link>
          </div>
        ) : (
          <>
            <h2 id="reserve-title" className="m-0 text-[22px]">
              Pick a ticket
            </h2>
            {event.ticketTypes.length === 0 ? (
              <p className="m-0 text-subtle">The organizer hasn't added tickets yet.</p>
            ) : (
              <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
                <legend className="sr-only-safe">Ticket type</legend>
                {event.ticketTypes.map((type) => {
                  const left = remaining(type)
                  const soldOut = left === 0
                  return (
                    <label
                      key={type.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3.5 rounded-[20px] border-2 border-transparent bg-paper px-4 py-4",
                        selectedId === type.id && "border-ink bg-white",
                        (soldOut || cancelled) && "cursor-not-allowed opacity-55",
                      )}
                    >
                      <input
                        type="radio"
                        name="ticket-type"
                        className="size-5 accent-ink"
                        checked={selectedId === type.id}
                        disabled={soldOut || cancelled}
                        onChange={() => selectType(type.id)}
                      />
                      <span className="flex flex-1 flex-col">
                        <span className="font-bold">{type.name}</span>
                        <span className="text-[13px] text-subtle">
                          {soldOut ? "Sold out" : `${left} of ${type.capacity} left`}
                          {type.description ? ` · ${type.description}` : ""}
                        </span>
                      </span>
                      <span className="font-bold">{money(type.price, event.currency)}</span>
                    </label>
                  )
                })}
              </fieldset>
            )}
            {error ? <Notice tone="danger">{error}</Notice> : null}
            {user?.role === "ADMIN" ? (
              <p className="m-0 text-sm text-subtle">Admin accounts can't reserve tickets. Use a regular account.</p>
            ) : null}
            <div className="hidden md:block">{reserveAction}</div>
            <p className="m-0 text-[13px] leading-normal text-subtle">
              Ventra doesn't take payments yet. Reserving holds one spot in your name.
              {isOwner ? " You're the organizer of this event." : ""}
            </p>
          </>
        )}
      </aside>

      {!reservation ? (
        <div className="frost fixed inset-x-3.5 bottom-3.5 z-40 flex items-center gap-3 rounded-full py-2 pl-5 pr-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)] md:hidden">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs text-subtle">{selected?.name ?? "No ticket selected"}</span>
            <span className="text-[17px] font-bold">{selected ? money(selected.price, event.currency) : "–"}</span>
          </span>
          <div className="max-w-[60%] flex-none">{reserveAction}</div>
        </div>
      ) : null}
    </div>
  )
}
