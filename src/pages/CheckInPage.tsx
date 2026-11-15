import { Camera, CameraOff } from "lucide-react"
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { Container, EmptyState, ErrorState, Loading } from "@/components/common"
import { SiteHeader } from "@/components/shell"
import { ApiError, api } from "@/lib/api"
import { capacity, coverFor, errorMessage, initials, shortDate, time } from "@/lib/format"
import { Link, useRouter } from "@/lib/router"
import { useSession } from "@/lib/session"
import { useAsync } from "@/lib/use-async"
import { cn } from "@/lib/utils"
import type { CheckIn, VentraEvent } from "@/types/api"

type Result =
  | { kind: "idle" }
  | { kind: "ok"; checkIn: CheckIn }
  | { kind: "used" | "invalid" | "error"; message: string }

type BarcodeDetectorLike = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> }
type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike

function barcodeDetector(): BarcodeDetectorCtor | null {
  const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
  return ctor ?? null
}

export function CheckInPage() {
  const { user } = useSession()
  const { search, navigate } = useRouter()
  const events = useAsync(async (signal) => {
    const page = await api.listEvents({ pageSize: 100 }, signal)
    return page.items.filter(
      (event) => event.status === "PUBLISHED" && (event.organizerId === user?.id || user?.role === "ADMIN"),
    )
  }, [user?.id, user?.role])

  const list = events.data ?? []
  const selectedId = search.get("event") ?? list[0]?.id ?? ""
  const selected = list.find((event) => event.id === selectedId)

  return (
    <div className="min-h-screen bg-night text-white">
      <SiteHeader />
      <Container className="pb-32 pt-2 md:pb-16">
        {events.error ? (
          <ErrorState error={events.error} onRetry={events.reload} className="text-ink" />
        ) : events.loading ? (
          <Loading label="Loading your events" className="text-white/80" />
        ) : list.length === 0 ? (
          <div className="text-ink">
            <EmptyState
              title="No live events to check in."
              body="Publish an event first. Its check-in opens here."
              action={
                <Link to="/hosting" className="pill pill-dark">
                  Go to Hosting
                </Link>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h1 className="m-0 font-display text-4xl tracking-tight md:text-[44px]">Check-in</h1>
              <div className="flex min-w-0 flex-[0_1_420px] flex-col gap-1.5">
                <label htmlFor="checkin-event" className="text-sm text-white/70">
                  Event
                </label>
                <select
                  id="checkin-event"
                  value={selectedId}
                  onChange={(event) => navigate(`/check-in?event=${event.target.value}`, { replace: true })}
                  className="glass min-h-[52px] rounded-2xl px-4 text-base font-semibold"
                >
                  {list.map((event) => (
                    <option key={event.id} value={event.id} className="text-ink">
                      {event.title} · {shortDate(event.startsAt, event.timezone)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {selected ? <Scanner key={selected.id} event={selected} /> : null}
          </div>
        )}
      </Container>
    </div>
  )
}

function Scanner({ event }: { event: VentraEvent }) {
  const [result, setResult] = useState<Result>({ kind: "idle" })
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const checkIns = useAsync((signal) => api.listCheckIns(event.id, signal), [event.id])
  const reloadCheckIns = checkIns.reload
  const { reserved } = capacity(event)

  const submit = useCallback(
    async (payload: string) => {
      const value = payload.trim()
      if (!value) return
      setBusy(true)
      try {
        const checkIn = await api.checkIn(event.id, value)
        setResult({ kind: "ok", checkIn })
        setCode("")
        reloadCheckIns()
      } catch (caught) {
        if (caught instanceof ApiError && caught.code === "TICKET_ALREADY_USED") {
          setResult({ kind: "used", message: "This ticket was already scanned. Don't let it in twice." })
        } else if (caught instanceof ApiError && (caught.code === "TICKET_NOT_FOUND" || caught.code === "INVALID_QR_PAYLOAD")) {
          setResult({ kind: "invalid", message: "This code doesn't match a ticket for this event." })
        } else {
          setResult({ kind: "error", message: errorMessage(caught) })
        }
      } finally {
        setBusy(false)
      }
    },
    [event.id, reloadCheckIns],
  )

  const onManual = (formEvent: FormEvent) => {
    formEvent.preventDefault()
    void submit(code)
  }

  const count = checkIns.data?.length ?? 0
  const styles = {
    idle: "bg-cream text-ink",
    ok: "bg-lime text-[#1d3a21]",
    used: "bg-[#fbe6c8] text-[#5a3108]",
    invalid: "bg-[#f8dcd6] text-[#5c1b14]",
    error: "bg-[#f8dcd6] text-[#5c1b14]",
  }[result.kind]
  const title = {
    idle: "Ready to scan",
    ok: "Checked in",
    used: "Already used",
    invalid: "Not valid here",
    error: "Couldn't check in",
  }[result.kind]
  const detail =
    result.kind === "ok"
      ? `${result.checkIn.ticket.reservation.user.name} · ${result.checkIn.ticket.reservation.ticketType.name}. Let them in.`
      : result.kind === "idle"
        ? "Scan a ticket QR, or paste the code from it."
        : result.message

  return (
    <div className="flex flex-wrap items-start gap-6 lg:gap-7">
      <CameraPanel event={event} count={count} total={reserved} onScan={submit} paused={busy} />

      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
        <div role="status" aria-live="polite" className={cn("flex min-h-[120px] flex-col justify-center gap-1 rounded-[26px] p-6", styles)}>
          <span className="text-[22px] font-bold">{title}</span>
          <span className="text-[15px] leading-snug">{detail}</span>
        </div>

        <form className="flex gap-2.5" onSubmit={onManual}>
          <label htmlFor="checkin-code" className="sr-only-safe">
            Ticket code from the QR
          </label>
          <input
            id="checkin-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste ticket code"
            autoComplete="off"
            className="glass min-h-[54px] min-w-0 flex-1 rounded-full px-5 font-mono text-[15px] placeholder:text-white/60"
          />
          <button type="submit" className="pill pill-light min-h-[54px]" disabled={busy || !code.trim()}>
            {busy ? "Checking…" : "Check in"}
          </button>
        </form>

        <section aria-labelledby="recent-title" className="glass flex flex-col gap-3 rounded-[26px] p-5">
          <div className="flex items-baseline justify-between">
            <h2 id="recent-title" className="m-0 text-[17px]">
              Recent
            </h2>
            <span className="text-sm text-white/70">
              {count} of {reserved} in
            </span>
          </div>
          {checkIns.loading && !checkIns.data ? (
            <span className="text-white/70">Loading…</span>
          ) : count === 0 ? (
            <span className="text-white/70">Nobody yet.</span>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {(checkIns.data ?? []).slice(0, 6).map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <span aria-hidden="true" className="flex size-10 flex-none items-center justify-center rounded-full bg-white text-[13px] font-bold text-ink">
                    {initials(item.ticket.reservation.user.name)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-bold">{item.ticket.reservation.user.name}</span>
                    <span className="text-[13px] text-white/70">{item.ticket.reservation.ticketType.name}</span>
                  </span>
                  <span className="text-[13px] text-white/70">{time(item.checkedInAt, event.timezone)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function CameraPanel({
  event,
  count,
  total,
  onScan,
  paused,
}: {
  event: VentraEvent
  count: number
  total: number
  onScan: (payload: string) => Promise<void>
  paused: boolean
}) {
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const lastScan = useRef<{ value: string; at: number } | null>(null)
  const pausedRef = useRef(paused)
  const [on, setOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const Detector = barcodeDetector()
  const supported = Boolean(Detector && navigator.mediaDevices?.getUserMedia)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
    setOn(false)
  }, [])

  useEffect(() => stop, [stop])

  useEffect(() => {
    if (!on || !Detector || !video.current) return
    const detector = new Detector({ formats: ["qr_code"] })
    const timer = window.setInterval(async () => {
      if (pausedRef.current || !video.current || video.current.readyState < 2) return
      try {
        const codes = await detector.detect(video.current)
        const value = codes[0]?.rawValue
        if (!value) return
        const now = Date.now()
        // Ignore the same code for a few seconds while it stays in frame.
        if (lastScan.current && lastScan.current.value === value && now - lastScan.current.at < 4000) return
        lastScan.current = { value, at: now }
        await onScan(value)
      } catch {
        // A frame that can't be decoded is normal. Keep scanning.
      }
    }, 450)
    return () => window.clearInterval(timer)
  }, [on, Detector, onScan])

  async function start() {
    setCameraError(null)
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      stream.current = media
      if (video.current) {
        video.current.srcObject = media
        await video.current.play()
      }
      setOn(true)
    } catch (caught) {
      setCameraError(
        caught instanceof DOMException && caught.name === "NotAllowedError"
          ? "Camera access was blocked. Allow it in your browser settings, or paste codes instead."
          : "The camera didn't start. Paste codes instead.",
      )
      stop()
    }
  }

  return (
    <section
      aria-label="Scanner"
      className="relative aspect-[4/5] min-w-0 flex-[999_1_520px] overflow-hidden rounded-[34px] bg-black sm:aspect-[4/3]"
    >
      <video ref={video} muted playsInline className={cn("absolute inset-0 size-full object-cover", !on && "hidden")} />
      {!on ? <img src={coverFor(event)} alt="" className="absolute inset-0 size-full object-cover opacity-35 blur-sm" /> : null}
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 aspect-square w-[46%] max-w-72 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute left-0 top-0 h-1/5 w-1/5 rounded-tl-[26px] border-l-[5px] border-t-[5px] border-white" />
        <span className="absolute right-0 top-0 h-1/5 w-1/5 rounded-tr-[26px] border-r-[5px] border-t-[5px] border-white" />
        <span className="absolute bottom-0 left-0 h-1/5 w-1/5 rounded-bl-[26px] border-b-[5px] border-l-[5px] border-white" />
        <span className="absolute bottom-0 right-0 h-1/5 w-1/5 rounded-br-[26px] border-b-[5px] border-r-[5px] border-white" />
      </div>
      <div className="absolute inset-x-4 top-4 flex flex-wrap justify-between gap-2">
        <span className="glass rounded-full px-4 py-2 text-sm font-bold">{event.title}</span>
        <span className="glass rounded-full px-4 py-2 text-sm font-bold">
          {count} of {total} in
        </span>
      </div>
      <div className="absolute inset-x-4 bottom-4 flex flex-col items-center gap-2 text-center">
        {cameraError ? <span className="glass rounded-2xl px-4 py-2 text-sm">{cameraError}</span> : null}
        {supported ? (
          on ? (
            <button type="button" className="glass pill text-white" onClick={stop}>
              <CameraOff aria-hidden="true" size={18} />
              Stop camera
            </button>
          ) : (
            <button type="button" className="pill pill-light" onClick={start}>
              <Camera aria-hidden="true" size={18} />
              Start camera
            </button>
          )
        ) : (
          <span className="glass rounded-2xl px-4 py-2 text-sm">
            This browser can't read QR codes from the camera. Paste the code from the ticket instead.
          </span>
        )}
      </div>
    </section>
  )
}
