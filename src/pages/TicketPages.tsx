import { ArrowLeft, ArrowRight, Download, LoaderCircle } from "lucide-react"
import { useState } from "react"
import { Container, EmptyState, ErrorState, Loading, Sheet, StatusPill, type Tone } from "@/components/common"
import { PhotoHero, SiteHeader } from "@/components/shell"
import { ApiError, api } from "@/lib/api"
import { coverFor, longDate, money, shortDate, ticketCode, ticketDisplay, time, timeRange } from "@/lib/format"
import { Link } from "@/lib/router"
import { useSession } from "@/lib/session"
import { useAsync } from "@/lib/use-async"
import { cn } from "@/lib/utils"
import type { Ticket } from "@/types/api"
import { NotFoundPage } from "@/pages/StatusPages"

const TONE: Record<ReturnType<typeof ticketDisplay>["tone"], Tone> = {
  ready: "ready",
  pending: "pending",
  used: "used",
  void: "void",
}

export function TicketsPage() {
  const { user } = useSession()
  const tickets = useAsync((signal) => api.listTickets(signal), [])
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming")

  const [now] = useState(() => Date.now())
  const all = tickets.data ?? []
  const upcoming = all.filter((ticket) => new Date(ticket.reservation.event.endsAt).getTime() >= now)
  const past = all.filter((ticket) => new Date(ticket.reservation.event.endsAt).getTime() < now)
  const shown = tab === "upcoming" ? upcoming : past
  const heroImage = upcoming[0] ? coverFor(upcoming[0].reservation.event) : "/events/rooftop-cinema.webp"

  return (
    <div className="min-h-screen bg-paper">
      <PhotoHero image={heroImage} dim minHeight="min-h-[300px] md:min-h-[360px]">
        <Container className="flex flex-col gap-2">
          <span className="text-white/85">{user?.name}</span>
          <h1 className="m-0 font-display text-[clamp(34px,5vw,64px)] leading-none tracking-tight">My tickets</h1>
        </Container>
      </PhotoHero>
      <Sheet>
        <Container className="flex flex-col gap-6 pt-7 md:pt-8">
          <div role="tablist" aria-label="Ticket timing" className="segmented self-stretch sm:self-start">
            <button type="button" role="tab" aria-selected={tab === "upcoming"} onClick={() => setTab("upcoming")}>
              Upcoming · {upcoming.length}
            </button>
            <button type="button" role="tab" aria-selected={tab === "past"} onClick={() => setTab("past")}>
              Past · {past.length}
            </button>
          </div>
          <div role="tabpanel">
            {tickets.error ? (
              <ErrorState error={tickets.error} onRetry={tickets.reload} />
            ) : tickets.loading ? (
              <Loading label="Loading your tickets" />
            ) : shown.length === 0 ? (
              <EmptyState
                title={tab === "upcoming" ? "No upcoming tickets." : "No past tickets yet."}
                body={tab === "upcoming" ? "Reserve a spot and your ticket shows up here with its QR code." : undefined}
                action={
                  tab === "upcoming" ? (
                    <Link to="/events" className="pill pill-dark">
                      Browse events
                    </Link>
                  ) : null
                }
              />
            ) : (
              <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] gap-4 p-0 md:gap-5">
                {shown.map((ticket) => (
                  <li key={ticket.id}>
                    <TicketCard ticket={ticket} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </Sheet>
    </div>
  )
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const event = ticket.reservation.event
  const display = ticketDisplay(ticket.status, event.status)
  const faded = display.tone === "void" || display.tone === "used"
  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="group relative block aspect-[16/10] overflow-hidden rounded-[26px] bg-ink text-white no-underline"
    >
      <img
        src={coverFor(event)}
        alt=""
        className={cn("absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]", faded && "grayscale")}
      />
      <span aria-hidden="true" className="scrim-bottom absolute inset-0" />
      <span className="glass absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-[13px] font-bold">
        {shortDate(event.startsAt, event.timezone)} · {time(event.startsAt, event.timezone)}
      </span>
      <StatusPill tone={TONE[display.tone]} className="absolute right-4 top-4 px-3.5 py-1.5 text-[13px]">
        {display.label}
      </StatusPill>
      <span className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[22px] font-bold leading-tight">{event.title}</span>
          <span className="text-sm text-white/85">
            {ticket.ticketType.name} · {event.venue}
          </span>
        </span>
        <span aria-hidden="true" className="flex size-11 flex-none items-center justify-center rounded-full bg-white text-ink">
          <ArrowRight size={19} />
        </span>
      </span>
    </Link>
  )
}

export function TicketPage({ ticketId }: { ticketId: string }) {
  const ticket = useAsync((signal) => api.getTicket(ticketId, signal), [ticketId])
  if (ticket.error instanceof ApiError && ticket.error.status === 404) return <NotFoundPage />

  const data = ticket.data
  const event = data?.reservation.event

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-white">
      {event ? (
        <img src={coverFor(event)} alt="" className="absolute inset-0 size-full scale-110 object-cover blur-lg" />
      ) : null}
      <span aria-hidden="true" className="absolute inset-0 bg-[rgba(10,16,14,0.58)]" />
      <SiteHeader />
      <Container className="on-photo relative pb-28 pt-4 md:pb-16 md:pt-10">
        {ticket.error ? (
          <ErrorState error={ticket.error} onRetry={ticket.reload} className="text-ink" />
        ) : !data || !event ? (
          <Loading label="Loading ticket" className="text-white/80" />
        ) : (
          <TicketBody ticket={data} />
        )}
      </Container>
    </div>
  )
}

function TicketBody({ ticket }: { ticket: Ticket }) {
  const event = ticket.reservation.event
  const display = ticketDisplay(ticket.status, event.status)
  const showQr = (display.tone === "ready" || display.tone === "used") && ticket.qrCodeDataUrl
  const help =
    display.tone === "ready"
      ? "Show this at the entrance. It scans once."
      : display.tone === "used"
        ? ticket.checkIn
          ? `Scanned at the door on ${shortDate(ticket.checkIn.checkedInAt, event.timezone)}, ${time(ticket.checkIn.checkedInAt, event.timezone)}.`
          : "This ticket has been scanned."
        : display.tone === "pending"
          ? "Your spot is confirmed. The code appears here and in your email as soon as it's ready."
          : "The organizer cancelled this event, so this ticket no longer works."

  return (
    <div className="flex flex-wrap items-center justify-between gap-10">
      <div className="flex max-w-2xl flex-[1_1_420px] flex-col gap-4">
        <Link
          to="/tickets"
          className="glass inline-flex min-h-11 items-center gap-1.5 self-start rounded-full pl-2.5 pr-4 font-semibold text-white no-underline"
        >
          <ArrowLeft aria-hidden="true" size={18} />
          My tickets
        </Link>
        <span className="glass self-start rounded-full px-3.5 py-1.5 text-sm font-bold">{display.label}</span>
        <h1 className="m-0 font-display text-[clamp(32px,5vw,68px)] leading-none tracking-tight">{event.title}</h1>
        <span className="text-lg text-white/85">
          {longDate(event.startsAt, event.timezone)} · {timeRange(event)} · {event.venue}, {event.city}
        </span>
        <div className="mt-2 flex flex-wrap gap-3">
          {showQr ? (
            <a
              href={ticket.qrCodeDataUrl ?? undefined}
              download={`ventra-ticket-${ticketCode(ticket.publicId)}.png`}
              className="pill pill-light"
            >
              <Download aria-hidden="true" size={18} />
              Download QR
            </a>
          ) : null}
          <Link to={`/events/${event.id}`} className="glass pill text-white">
            Event details
          </Link>
        </div>
      </div>

      <article className="flex w-full min-w-0 flex-col items-center gap-4 rounded-[34px] bg-[rgba(255,253,247,0.95)] p-6 text-ink shadow-[0_30px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl md:w-auto md:flex-[0_1_440px] md:p-8">
        {showQr ? (
          <>
            <img
              src={ticket.qrCodeDataUrl ?? undefined}
              alt={`QR code for ticket ${ticketCode(ticket.publicId)}`}
              className={cn("aspect-square w-full max-w-[280px] rounded-[22px] bg-white p-2", display.tone === "used" && "opacity-35")}
            />
            <span className="font-mono text-lg font-bold tracking-[0.08em]">{ticketCode(ticket.publicId)}</span>
          </>
        ) : display.tone === "pending" ? (
          <div className="flex aspect-square w-full max-w-[280px] flex-col items-center justify-center gap-3 rounded-[22px] bg-white">
            <LoaderCircle aria-hidden="true" className="spin text-ink" size={38} />
            <span className="font-bold">Generating your QR</span>
          </div>
        ) : (
          <div className="flex aspect-square w-full max-w-[280px] items-center justify-center rounded-[22px] bg-[#f8dcd6] p-6 text-center text-lg font-bold text-[#6e2219]">
            This ticket is no longer valid.
          </div>
        )}
        <p role="status" className="m-0 text-center text-[15px] leading-normal text-ink-soft">
          {help}
        </p>
        <dl className="m-0 grid w-full grid-cols-2 gap-3.5 border-t border-line pt-4">
          <div>
            <dt className="text-xs text-subtle">Ticket</dt>
            <dd className="m-0 font-bold">{ticket.ticketType.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Price</dt>
            <dd className="m-0 font-bold">{money(ticket.ticketType.price, event.currency)}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Date</dt>
            <dd className="m-0 font-bold">{shortDate(event.startsAt, event.timezone)}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Starts</dt>
            <dd className="m-0 font-bold">{time(event.startsAt, event.timezone)}</dd>
          </div>
        </dl>
      </article>
    </div>
  )
}
