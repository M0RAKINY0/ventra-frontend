import { Download } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Container, ErrorState, Loading } from "@/components/common"
import { SiteHeader } from "@/components/shell"
import { ApiError, api } from "@/lib/api"
import { coverFor, errorMessage, eventPath, longDate, reservationPath, ticketCode, ticketDisplay, timeRange } from "@/lib/format"
import { Link, useRouter } from "@/lib/router"
import { useSession } from "@/lib/session"
import { useAsync } from "@/lib/use-async"
import { cn } from "@/lib/utils"
import type { Reservation, ReservationTicket } from "@/types/api"
import { NotFoundPage } from "@/pages/StatusPages"

/**
 * Every ticket in one reservation. Guests arrive here from the link in their
 * ticket email, which carries the access token. Signed-in owners need no token.
 */
export function ReservationPage({ reservationId }: { reservationId: string }) {
  const { search } = useRouter()
  const { user } = useSession()
  const token = search.get("token")
  const saveRequested = search.get("save") === "1"
  const reservation = useAsync(
    (signal) => api.getReservation(reservationId, token, signal),
    [reservationId, token],
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const { setData } = reservation

  const data = reservation.data
  const canSave = Boolean(token && data && data.userId === null && user?.role === "USER")

  async function save() {
    if (!token) return
    setSaving(true)
    setSaveError(null)
    try {
      const saved = await api.claimReservation(reservationId, token)
      setData(() => saved)
    } catch (caught) {
      setSaveError(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  // Someone who chose "log in to save" before signing in comes back with
  // save=1. Finish what they asked for instead of making them click again.
  const autoSaved = useRef(false)
  useEffect(() => {
    if (!saveRequested || !canSave || !token || autoSaved.current) return
    autoSaved.current = true
    api
      .claimReservation(reservationId, token)
      .then((saved) => setData(() => saved))
      .catch((caught: unknown) => setSaveError(errorMessage(caught)))
  }, [saveRequested, canSave, token, reservationId, setData])

  // A bad ID fails validation with 400. Either way there is nothing to show.
  if (reservation.error instanceof ApiError && [400, 404].includes(reservation.error.status)) return <NotFoundPage />

  // Links die 30 days after the event. The buyer can still get fresh ones by email.
  const expired = reservation.error instanceof ApiError && reservation.error.status === 410
  const canReset = Boolean(data && (token || (user && data.userId === user.id)))

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-white">
      {data ? (
        <img src={coverFor(data.event)} alt="" className="absolute inset-0 size-full scale-110 object-cover blur-lg" />
      ) : null}
      <span aria-hidden="true" className="absolute inset-0 bg-[rgba(10,16,14,0.58)]" />
      <SiteHeader />
      <Container className="on-photo relative pb-28 pt-4 md:pb-16 md:pt-10">
        {expired ? (
          <LinkNotice title="This link has expired">
            Ticket links stop working 30 days after the event. Enter your email and we'll send links for anything
            still current.
          </LinkNotice>
        ) : resetMessage ? (
          <LinkNotice title="Link reset">{resetMessage}</LinkNotice>
        ) : reservation.error ? (
          <ErrorState error={reservation.error} onRetry={reservation.reload} className="text-ink" />
        ) : !data ? (
          <Loading label="Loading your tickets" className="text-white/80" />
        ) : (
          <ReservationBody
            reservation={data}
            reset={canReset ? <ResetLinkPanel reservationId={reservationId} token={token} onDone={setResetMessage} /> : null}
            account={
              <AccountPanel
                reservation={data}
                signedIn={Boolean(user)}
                ownedByViewer={Boolean(user && data.userId === user.id)}
                canSave={canSave}
                saving={saving}
                error={saveError}
                onSave={save}
              />
            }
          />
        )}
      </Container>
    </div>
  )
}

/** Offers the account route next to the email one: sign in, save, or confirm it's saved. */
function AccountPanel({
  reservation,
  signedIn,
  ownedByViewer,
  canSave,
  saving,
  error,
  onSave,
}: {
  reservation: Reservation
  signedIn: boolean
  ownedByViewer: boolean
  canSave: boolean
  saving: boolean
  error: string | null
  onSave: () => void
}) {
  const many = reservation.tickets.length > 1

  if (ownedByViewer) {
    return (
      <div role="status" className="glass flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-[24px] p-5">
        <span className="font-semibold">{many ? "These tickets are" : "This ticket is"} saved to your account.</span>
        <Link to="/tickets" className="pill pill-light">
          My tickets
        </Link>
      </div>
    )
  }

  if (canSave) {
    return (
      <div className="glass flex max-w-xl flex-col gap-3 rounded-[24px] p-5">
        <span className="font-semibold">Keep {many ? "these tickets" : "this ticket"} in your account too.</span>
        {error ? (
          <span role="alert" className="text-sm font-semibold">
            {error}
          </span>
        ) : null}
        <button type="button" className="pill pill-light self-start" disabled={saving} onClick={onSave}>
          {saving ? "Saving…" : "Save to my account"}
        </button>
      </div>
    )
  }

  // Guests only. A reservation that already has an owner offers nothing here.
  if (signedIn || reservation.userId !== null) return null

  const next = encodeURIComponent(reservationPath(reservation, true))
  return (
    <div className="glass flex max-w-xl flex-col gap-3 rounded-[24px] p-5">
      <span className="font-semibold">Want {many ? "these" : "this"} in an account too?</span>
      <span className="text-white/85">
        Sign in and {many ? "the tickets show" : "the ticket shows"} under My tickets on any device. The email keeps
        working either way.
      </span>
      <div className="flex flex-wrap gap-3">
        <Link to={`/login?next=${next}`} className="pill pill-light">
          Log in
        </Link>
        <Link to={`/login?mode=signup&next=${next}`} className="glass pill text-white">
          Create account
        </Link>
      </div>
    </div>
  )
}

/** Full-page message in place of the tickets, with the way back to them. */
function LinkNotice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="m-0 font-display text-[clamp(32px,5vw,56px)] leading-none tracking-tight">{title}</h1>
      <p className="m-0 leading-relaxed text-white/85">{children}</p>
      <Link to="/find-tickets" className="pill pill-light self-start">
        Find my tickets
      </Link>
    </div>
  )
}

/**
 * For a link that went somewhere it shouldn't. Resetting kills every old
 * link and emails a new one to the buyer, so whoever else has it loses access.
 */
function ResetLinkPanel({
  reservationId,
  token,
  onDone,
}: {
  reservationId: string
  token: string | null
  onDone: (message: string) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reset() {
    setResetting(true)
    setError(null)
    try {
      const { message } = await api.resetReservationLink(reservationId, token)
      onDone(message)
    } catch (caught) {
      setError(errorMessage(caught))
      setResetting(false)
    }
  }

  if (!confirming) {
    return (
      <button type="button" className="self-start text-sm font-semibold text-white/85 underline" onClick={() => setConfirming(true)}>
        Shared this link by mistake? Reset it
      </button>
    )
  }

  return (
    <div className="glass flex max-w-xl flex-col gap-3 rounded-[24px] p-5">
      <span className="font-semibold">Reset this link?</span>
      <span className="text-white/85">
        Every old link to these tickets stops working, including this one. We'll email a new link to the address used
        at checkout.
      </span>
      {error ? (
        <span role="alert" className="text-sm font-semibold">
          {error}
        </span>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="pill pill-light" disabled={resetting} onClick={reset}>
          {resetting ? "Resetting…" : "Reset link"}
        </button>
        <button type="button" className="glass pill text-white" disabled={resetting} onClick={() => setConfirming(false)}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function ReservationBody({
  reservation,
  account,
  reset,
}: {
  reservation: Reservation
  account: ReactNode
  reset: ReactNode
}) {
  const event = reservation.event
  const count = reservation.tickets.length

  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-3xl flex-col gap-4">
        <span className="glass self-start rounded-full px-3.5 py-1.5 text-sm font-bold">
          {count === 1 ? "1 ticket" : `${count} tickets`} · {reservation.buyerName}
        </span>
        <h1 className="m-0 font-display text-[clamp(32px,5vw,68px)] leading-none tracking-tight">{event.title}</h1>
        <span className="text-lg text-white/85">
          {longDate(event.startsAt, event.timezone)} · {timeRange(event)} · {event.venue}, {event.city}
        </span>
        <p className="m-0 max-w-xl leading-relaxed text-white/85">
          We emailed {count === 1 ? "this ticket" : "these tickets"} to {reservation.buyerEmail}. That email links back
          to this page, so keep it until the event.
        </p>
        <Link to={eventPath(event)} className="glass pill self-start text-white">
          Event details
        </Link>
        {account}
        {reset}
      </div>

      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5 p-0">
        {reservation.tickets.map((ticket, index) => (
          <li key={ticket.id}>
            <TicketCard ticket={ticket} eventStatus={event.status} position={count > 1 ? `${index + 1} of ${count}` : null} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function TicketCard({
  ticket,
  eventStatus,
  position,
}: {
  ticket: ReservationTicket
  eventStatus: Reservation["event"]["status"]
  position: string | null
}) {
  const display = ticketDisplay(ticket.status, eventStatus)
  const code = ticketCode(ticket.publicId)
  const showQr = (display.tone === "ready" || display.tone === "used") && ticket.qrCodeDataUrl

  return (
    <article className="flex h-full flex-col items-center gap-4 rounded-[30px] bg-[rgba(255,253,247,0.95)] p-6 text-ink shadow-[0_30px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      <div className="flex w-full items-baseline justify-between gap-3">
        <span className="min-w-0 truncate font-bold">{ticket.ticketType.name}</span>
        <span className="flex-none text-sm font-semibold text-subtle">
          {position ? `${position} · ` : ""}
          {display.label}
        </span>
      </div>
      {showQr ? (
        <>
          <img
            src={ticket.qrCodeDataUrl ?? undefined}
            alt={`QR code for ticket ${code}`}
            className={cn("aspect-square w-full max-w-[260px] rounded-[22px] bg-white p-2", display.tone === "used" && "opacity-35")}
          />
          <span className="font-mono text-lg font-bold tracking-[0.08em]">{code}</span>
          <a href={ticket.qrCodeDataUrl ?? undefined} download={`ventra-ticket-${code}.png`} className="pill pill-dark mt-auto w-full">
            <Download aria-hidden="true" size={18} />
            Download QR
          </a>
        </>
      ) : (
        <div className="flex aspect-square w-full max-w-[260px] items-center justify-center rounded-[22px] bg-[#f8dcd6] p-6 text-center text-lg font-bold text-[#6e2219]">
          {display.tone === "pending" ? "This QR code is still being made. Refresh in a moment." : "This ticket is no longer valid."}
        </div>
      )}
    </article>
  )
}
