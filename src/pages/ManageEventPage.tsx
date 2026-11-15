import { ArrowLeft, Check, ImageOff, Trash2 } from "lucide-react"
import { useMemo, useState, type FormEvent } from "react"
import { Container, EmptyState, ErrorState, FieldError, FieldLabel, Loading, Notice, Sheet } from "@/components/common"
import { AttendeesPanel } from "@/components/hosting/AttendeesPanel"
import { SalesPanel } from "@/components/hosting/SalesPanel"
import { ShareLink } from "@/components/ShareLink"
import { SiteHeader } from "@/components/shell"
import { ApiError, api } from "@/lib/api"
import { isoToZonedLocal, isValidTimeZone, timeZones, zonedLocalToIso } from "@/lib/datetime"
import {
  CATEGORIES,
  CATEGORY_LABELS,
  errorMessage,
  eventPath,
  eventStatusLabel,
  longDate,
  money,
  shortDate,
  time,
  timeRange,
} from "@/lib/format"
import { Link, useRouter } from "@/lib/router"
import { useSession } from "@/lib/session"
import { useAsync } from "@/lib/use-async"
import { cn } from "@/lib/utils"
import type { EventCategory, EventInput, VentraEvent } from "@/types/api"
import { AccessDeniedPage, NotFoundPage } from "@/pages/StatusPages"

type Draft = {
  title: string
  description: string
  category: EventCategory
  startsAt: string
  endsAt: string
  timezone: string
  venue: string
  city: string
  countryCode: string
  currency: string
  coverImageUrl: string
}

type Errors = Partial<Record<keyof Draft | "form", string>>

const DEFAULT_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos"

function emptyDraft(): Draft {
  return {
    title: "",
    description: "",
    category: "COMMUNITY",
    startsAt: "",
    endsAt: "",
    timezone: DEFAULT_ZONE,
    venue: "",
    city: "",
    countryCode: "NG",
    currency: "NGN",
    coverImageUrl: "",
  }
}

function draftFrom(event: VentraEvent): Draft {
  return {
    title: event.title,
    description: event.description,
    category: event.category,
    startsAt: isoToZonedLocal(event.startsAt, event.timezone),
    endsAt: isoToZonedLocal(event.endsAt, event.timezone),
    timezone: event.timezone,
    venue: event.venue,
    city: event.city,
    countryCode: event.countryCode,
    currency: event.currency,
    coverImageUrl: event.coverImageUrl ?? "",
  }
}

/** Client-side checks that mirror the API schema, so most mistakes show before submitting. */
function validateDraft(draft: Draft): { input?: EventInput; errors: Errors } {
  const errors: Errors = {}
  if (!draft.title.trim()) errors.title = "Add a title."
  if (!draft.description.trim()) errors.description = "Add a short description."
  if (!draft.venue.trim()) errors.venue = "Add the venue."
  if (!draft.city.trim()) errors.city = "Add the city."
  if (!/^[A-Za-z]{2}$/.test(draft.countryCode.trim())) errors.countryCode = "Use a 2-letter country code, like NG."
  if (!/^[A-Za-z]{3}$/.test(draft.currency.trim())) errors.currency = "Use a 3-letter currency code, like NGN."
  if (!isValidTimeZone(draft.timezone)) errors.timezone = "Pick a timezone from the list."
  const cover = draft.coverImageUrl.trim()
  if (cover) {
    try {
      if (new URL(cover).protocol !== "https:") errors.coverImageUrl = "The image link must start with https://."
    } catch {
      errors.coverImageUrl = "That doesn't look like a link."
    }
  }

  let startsAt = ""
  let endsAt = ""
  if (!draft.startsAt) errors.startsAt = "Pick a start time."
  if (!draft.endsAt) errors.endsAt = "Pick an end time."
  if (draft.startsAt && draft.endsAt && !errors.timezone) {
    startsAt = zonedLocalToIso(draft.startsAt, draft.timezone)
    endsAt = zonedLocalToIso(draft.endsAt, draft.timezone)
    if (new Date(endsAt) <= new Date(startsAt)) errors.endsAt = "The end has to be after the start."
  }

  if (Object.keys(errors).length > 0) return { errors }
  return {
    errors,
    input: {
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      startsAt,
      endsAt,
      timezone: draft.timezone,
      venue: draft.venue.trim(),
      city: draft.city.trim(),
      countryCode: draft.countryCode.trim().toUpperCase(),
      currency: draft.currency.trim().toUpperCase(),
      coverImageUrl: cover || null,
    },
  }
}

/** Maps zod `flatten()` details from a 400 response onto form fields. */
function apiFieldErrors(error: unknown): Errors {
  if (!(error instanceof ApiError)) return { form: errorMessage(error) }
  const details = error.details as { fieldErrors?: Record<string, string[]> } | undefined
  const result: Errors = { form: error.message }
  for (const [field, messages] of Object.entries(details?.fieldErrors ?? {})) {
    if (messages?.[0]) result[field as keyof Draft] = messages[0]
  }
  return result
}

export function ManageEventPage({ eventId }: { eventId?: string }) {
  const { user } = useSession()
  const event = useAsync(
    (signal) => (eventId ? api.getEvent(eventId, signal) : Promise.resolve(null)),
    [eventId],
  )

  if (event.error instanceof ApiError && event.error.status === 404) return <NotFoundPage />
  if (event.data && user && event.data.organizerId !== user.id && user.role !== "ADMIN") return <AccessDeniedPage />

  const current = event.data ?? null
  return (
    <div className="min-h-screen bg-paper">
      <ManageHeader event={current} creating={!eventId} onChange={event.setData} />
      <Sheet>
        <Container className="pt-7 md:pt-9">
          {!eventId ? (
            <CreateForm />
          ) : event.error ? (
            <ErrorState error={event.error} onRetry={event.reload} />
          ) : !current ? (
            <Loading label="Loading event" />
          ) : (
            <ManageBody event={current} onChange={(next) => event.setData(() => next)} reload={event.reload} />
          )}
        </Container>
      </Sheet>
    </div>
  )
}

function ManageHeader({
  event,
  creating,
  onChange,
}: {
  event: VentraEvent | null
  creating: boolean
  onChange: (updater: (current: VentraEvent | null | undefined) => VentraEvent | null | undefined) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: "publish" | "cancel") {
    if (!event) return
    setBusy(true)
    setError(null)
    try {
      const next = action === "publish" ? await api.publishEvent(event.id) : await api.cancelEvent(event.id)
      onChange((current) => (current ? { ...current, ...next, ticketTypes: next.ticketTypes ?? current.ticketTypes } : next))
      setConfirming(false)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="relative flex min-h-[380px] flex-col overflow-hidden bg-ink text-white md:min-h-[420px]">
      {event?.coverImageUrl ? (
        <>
          <img src={event.coverImageUrl} alt="" className="absolute inset-0 size-full object-cover" />
          <span aria-hidden="true" className="scrim-hero absolute inset-0" />
        </>
      ) : null}
      <SiteHeader />
      {!event?.coverImageUrl ? (
        <Container className="relative">
          <div className="flex min-h-24 items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-white/35 px-4 text-center text-sm font-semibold text-white/75 md:min-h-28">
            <ImageOff aria-hidden="true" size={22} />
            No cover image yet. Paste an https link in Details and it fills this space.
          </div>
        </Container>
      ) : null}
      <Container className="on-photo relative mt-auto flex flex-wrap items-end justify-between gap-5 pb-16 pt-6 md:pb-20">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/hosting"
              className="glass inline-flex min-h-10 items-center gap-1.5 rounded-full pl-2 pr-3.5 text-sm font-semibold text-white no-underline"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Hosting
            </Link>
            {event ? (
              <span className="glass rounded-full px-3.5 py-1.5 text-[13px] font-bold">{eventStatusLabel(event.status)}</span>
            ) : null}
          </div>
          <h1 className="m-0 font-display text-[clamp(30px,4.4vw,58px)] leading-none tracking-tight">
            {creating ? "Create an event" : event?.title ?? "Loading…"}
          </h1>
          {event ? (
            <span className="text-white/80">
              {longDate(event.startsAt, event.timezone)} · {timeRange(event)} · {event.venue}, {event.city}
            </span>
          ) : creating ? (
            <span className="text-white/80">It stays a private draft until you publish it.</span>
          ) : null}
        </div>
        {event && event.status !== "CANCELLED" ? (
          <div className="flex flex-wrap gap-2.5">
            <button type="button" className="glass pill text-white" onClick={() => setConfirming(true)} disabled={busy}>
              Cancel event
            </button>
            {event.status === "DRAFT" ? (
              <button
                type="button"
                className="pill pill-light"
                disabled={busy || event.ticketTypes.length === 0}
                onClick={() => run("publish")}
                title={event.ticketTypes.length === 0 ? "Add a ticket type first" : undefined}
              >
                {busy ? "Publishing…" : "Publish event"}
              </button>
            ) : (
              <Link to={eventPath(event)} className="pill pill-light">
                View public page
              </Link>
            )}
          </div>
        ) : null}
      </Container>
      {confirming || error ? (
        <Container className="relative pb-16 text-ink">
          {confirming ? (
            <div role="alertdialog" aria-labelledby="cancel-title" className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex flex-[1_1_320px] flex-col gap-1">
                <strong id="cancel-title" className="text-lg">
                  Cancel {event?.title}?
                </strong>
                <span className="text-ink-soft">This can't be undone. Every ticket for this event stops working at the door.</span>
              </div>
              <div className="flex gap-2.5">
                <button type="button" className="pill pill-soft" onClick={() => setConfirming(false)}>
                  Keep it
                </button>
                <button type="button" className="pill pill-danger" disabled={busy} onClick={() => run("cancel")}>
                  {busy ? "Cancelling…" : "Cancel event"}
                </button>
              </div>
            </div>
          ) : null}
          {error ? <div className="mt-3"><Notice tone="danger">{error}</Notice></div> : null}
        </Container>
      ) : null}
    </section>
  )
}

function CreateForm() {
  const { navigate } = useRouter()
  return (
    <div className="max-w-4xl">
      <DetailsForm
        initial={emptyDraft()}
        submitLabel="Create draft"
        onSubmit={async (input) => {
          const created = await api.createEvent(input)
          navigate(`/hosting/${created.id}`, { replace: true })
        }}
      />
    </div>
  )
}

function ManageBody({ event, onChange, reload }: { event: VentraEvent; onChange: (next: VentraEvent) => void; reload: () => void }) {
  const [tab, setTab] = useState<"details" | "tickets" | "checkins" | "sales" | "attendees">("details")
  const [now] = useState(() => Date.now())
  const locked = event.status !== "DRAFT"
  const hasTypes = event.ticketTypes.length > 0
  const startsInFuture = new Date(event.startsAt).getTime() > now
  const checks = [
    { text: "Title, dates, venue and category", ok: true },
    { text: "At least one ticket type", ok: hasTypes },
    { text: "Start time is in the future", ok: startsInFuture },
  ]

  return (
    <div className="flex flex-wrap items-start gap-7">
      <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-5">
        {event.status === "CANCELLED" ? (
          <Notice tone="danger">This event is cancelled. It no longer appears in Browse and its tickets don't work.</Notice>
        ) : null}
        <div role="tablist" aria-label="Event sections" className="segmented self-stretch overflow-x-auto sm:self-start">
          <button type="button" role="tab" aria-selected={tab === "details"} onClick={() => setTab("details")}>
            Details
          </button>
          <button type="button" role="tab" aria-selected={tab === "tickets"} onClick={() => setTab("tickets")}>
            Tickets · {event.ticketTypes.length}
          </button>
          <button type="button" role="tab" aria-selected={tab === "checkins"} onClick={() => setTab("checkins")}>
            Check-ins
          </button>
          <button type="button" role="tab" aria-selected={tab === "sales"} onClick={() => setTab("sales")}>
            Sales
          </button>
          <button type="button" role="tab" aria-selected={tab === "attendees"} onClick={() => setTab("attendees")}>
            Attendees
          </button>
        </div>
        <div role="tabpanel">
          {tab === "details" ? (
            <DetailsForm
              key={event.id + event.status}
              initial={draftFrom(event)}
              locked={locked}
              submitLabel="Save draft"
              onSubmit={async (input) => {
                const next = await api.updateEvent(event.id, input)
                onChange(next)
              }}
            />
          ) : tab === "tickets" ? (
            <TicketTypesPanel event={event} reload={reload} />
          ) : tab === "checkins" ? (
            <CheckInsPanel event={event} />
          ) : tab === "sales" ? (
            <SalesPanel event={event} />
          ) : (
            <AttendeesPanel event={event} />
          )}
        </div>
      </div>

      {event.status === "PUBLISHED" ? (
        <aside aria-labelledby="link-title" className="card flex min-w-0 flex-[1_1_300px] flex-col gap-3.5 p-6">
          <h2 id="link-title" className="m-0 text-[17px]">
            Your event link
          </h2>
          <ShareLink event={event} id="manage-share" stacked />
        </aside>
      ) : null}

      {event.status === "DRAFT" ? (
        <aside aria-labelledby="ready-title" className="card flex min-w-0 flex-[1_1_300px] flex-col gap-3.5 p-6">
          <div className="flex items-center justify-between">
            <h2 id="ready-title" className="m-0 text-[17px]">
              Ready to publish
            </h2>
            <span className="text-sm font-bold">{checks.filter((item) => item.ok).length} of 3</span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {checks.map((item) => (
              <li key={item.text} className="flex items-center gap-2.5 text-[15px]">
                {item.ok ? (
                  <span role="img" aria-label="Done" className="flex size-6 flex-none items-center justify-center rounded-full bg-ink text-white">
                    <Check aria-hidden="true" size={14} strokeWidth={3.4} />
                  </span>
                ) : (
                  <span role="img" aria-label="To do" className="size-6 flex-none rounded-full border-2 border-line-strong" />
                )}
                {item.text}
              </li>
            ))}
          </ul>
          <p className="m-0 text-[13px] text-subtle">After publishing, details and ticket types are locked.</p>
        </aside>
      ) : null}
    </div>
  )
}

function DetailsForm({
  initial,
  locked = false,
  submitLabel,
  onSubmit,
}: {
  initial: Draft
  locked?: boolean
  submitLabel: string
  onSubmit: (input: EventInput) => Promise<void>
}) {
  const [draft, setDraft] = useState<Draft>(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const zones = useMemo(() => timeZones(), [])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const { input, errors: found } = validateDraft(draft)
    setErrors(found)
    if (!input) return
    setBusy(true)
    try {
      await onSubmit(input)
      setSaved(true)
    } catch (caught) {
      setErrors(apiFieldErrors(caught))
    } finally {
      setBusy(false)
    }
  }

  const field = (key: keyof Draft) => ({
    id: `event-${key}`,
    disabled: locked,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `event-${key}-error` : undefined,
  })

  return (
    <form className="card flex flex-col gap-4 p-5 md:p-6" onSubmit={submit} noValidate>
      {locked ? <p className="m-0 text-sm text-ink-soft">Only drafts can be edited.</p> : null}
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="event-title">Title</FieldLabel>
        <input className="field" {...field("title")} value={draft.title} onChange={(e) => set("title", e.target.value)} maxLength={200} />
        <FieldError id="event-title-error" message={errors.title} />
      </div>
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="event-description">Description</FieldLabel>
        <textarea
          className="field min-h-32 resize-y"
          {...field("description")}
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
        />
        <FieldError id="event-description-error" message={errors.description} />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="event-category">Category</FieldLabel>
          <select className="field" {...field("category")} value={draft.category} onChange={(e) => set("category", e.target.value as EventCategory)}>
            {CATEGORIES.map((key) => (
              <option key={key} value={key}>
                {CATEGORY_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="event-timezone">Timezone</FieldLabel>
          <select className="field" {...field("timezone")} value={draft.timezone} onChange={(e) => set("timezone", e.target.value)}>
            {(zones.includes(draft.timezone) ? zones : [draft.timezone, ...zones]).map((zone) => (
              <option key={zone} value={zone}>
                {zone.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <FieldError id="event-timezone-error" message={errors.timezone} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="event-startsAt">Starts</FieldLabel>
          <input className="field" type="datetime-local" {...field("startsAt")} value={draft.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
          <FieldError id="event-startsAt-error" message={errors.startsAt} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="event-endsAt">Ends</FieldLabel>
          <input className="field" type="datetime-local" {...field("endsAt")} value={draft.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
          <FieldError id="event-endsAt-error" message={errors.endsAt} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="event-venue">Venue</FieldLabel>
          <input className="field" {...field("venue")} value={draft.venue} onChange={(e) => set("venue", e.target.value)} maxLength={300} />
          <FieldError id="event-venue-error" message={errors.venue} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="event-city">City</FieldLabel>
          <input className="field" {...field("city")} value={draft.city} onChange={(e) => set("city", e.target.value)} maxLength={200} />
          <FieldError id="event-city-error" message={errors.city} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="event-countryCode">Country code</FieldLabel>
          <input
            className="field uppercase"
            {...field("countryCode")}
            list="country-codes"
            maxLength={2}
            value={draft.countryCode}
            onChange={(e) => set("countryCode", e.target.value.toUpperCase())}
          />
          <datalist id="country-codes">
            {["NG", "GH", "KE", "ZA", "RW", "EG", "GB", "US"].map((code) => (
              <option key={code} value={code} />
            ))}
          </datalist>
          <FieldError id="event-countryCode-error" message={errors.countryCode} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="event-currency">Currency</FieldLabel>
          <input
            className="field uppercase"
            {...field("currency")}
            list="currency-codes"
            maxLength={3}
            value={draft.currency}
            onChange={(e) => set("currency", e.target.value.toUpperCase())}
          />
          <datalist id="currency-codes">
            {["NGN", "GHS", "KES", "ZAR", "RWF", "EGP", "GBP", "USD", "EUR"].map((code) => (
              <option key={code} value={code} />
            ))}
          </datalist>
          <FieldError id="event-currency-error" message={errors.currency} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="event-coverImageUrl">Cover image URL (optional)</FieldLabel>
        <input
          className="field"
          type="url"
          inputMode="url"
          placeholder="https://"
          {...field("coverImageUrl")}
          value={draft.coverImageUrl}
          onChange={(e) => set("coverImageUrl", e.target.value)}
        />
        <FieldError id="event-coverImageUrl-error" message={errors.coverImageUrl} />
      </div>
      {errors.form ? <Notice tone="danger">{errors.form}</Notice> : null}
      {saved ? <Notice tone="success">Saved.</Notice> : null}
      {!locked ? (
        <div className="flex justify-end">
          <button type="submit" className="pill pill-dark w-full sm:w-auto" disabled={busy}>
            {busy ? "Saving…" : submitLabel}
          </button>
        </div>
      ) : null}
    </form>
  )
}

function TicketTypesPanel({ event, reload }: { event: VentraEvent; reload: () => void }) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [cap, setCap] = useState("")
  const [description, setDescription] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const locked = event.status !== "DRAFT"

  async function add(formEvent: FormEvent) {
    formEvent.preventDefault()
    const priceValue = price.trim() === "" ? 0 : Number(price)
    const capacityValue = Number(cap)
    if (!name.trim()) return setError("Give the ticket type a name.")
    if (!Number.isFinite(priceValue) || priceValue < 0) return setError("Price must be 0 or more.")
    if (!Number.isInteger(capacityValue) || capacityValue < 1) return setError("Capacity must be a whole number, 1 or more.")
    setBusy(true)
    setError(null)
    try {
      await api.createTicketType(event.id, {
        name: name.trim(),
        description: description.trim() || null,
        price: priceValue,
        capacity: capacityValue,
      })
      setName("")
      setPrice("")
      setCap("")
      setDescription("")
      reload()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  async function remove(ticketTypeId: string) {
    setError(null)
    try {
      await api.deleteTicketType(event.id, ticketTypeId)
      reload()
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {event.ticketTypes.length === 0 ? (
        <EmptyState title="No ticket types yet." body="Add at least one before you publish." />
      ) : (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3.5 p-0">
          {event.ticketTypes.map((type) => (
            <li key={type.id} className="card flex flex-col gap-1.5 p-5">
              <span className="flex justify-between gap-3 text-[17px] font-bold">
                <span>{type.name}</span>
                <span>{money(type.price, event.currency)}</span>
              </span>
              {type.description ? <span className="text-sm text-subtle">{type.description}</span> : null}
              <span className="text-sm text-ink-soft">
                {type.reservedCount} of {type.capacity} reserved
              </span>
              {!locked ? (
                <button
                  type="button"
                  className="mt-1 inline-flex min-h-11 items-center gap-1.5 self-start rounded-full border-0 bg-transparent px-0 text-sm font-semibold text-danger"
                  onClick={() => remove(type.id)}
                >
                  <Trash2 aria-hidden="true" size={16} />
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {!locked ? (
        <form className="card flex flex-col gap-4 p-5 md:p-6" onSubmit={add} noValidate>
          <h2 className="m-0 text-lg">Add a ticket type</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="tt-name">Name</FieldLabel>
              <input id="tt-name" className="field" placeholder="General admission" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="tt-price">Price ({event.currency})</FieldLabel>
              <input id="tt-price" className="field" type="number" min={0} step="0.01" inputMode="decimal" placeholder="0 for free" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="tt-capacity">Capacity</FieldLabel>
              <input id="tt-capacity" className="field" type="number" min={1} step={1} inputMode="numeric" placeholder="50" value={cap} onChange={(e) => setCap(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="tt-description">Description (optional)</FieldLabel>
            <input id="tt-description" className="field" placeholder="What's included" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
          </div>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <div className="flex justify-end">
            <button type="submit" className="pill pill-dark w-full sm:w-auto" disabled={busy}>
              {busy ? "Adding…" : "Add ticket type"}
            </button>
          </div>
        </form>
      ) : (
        <>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <p className="m-0 text-sm text-subtle">Ticket types are fixed once an event is live.</p>
        </>
      )}
    </div>
  )
}

function CheckInsPanel({ event }: { event: VentraEvent }) {
  const checkIns = useAsync(
    (signal) => (event.status === "DRAFT" ? Promise.resolve([]) : api.listCheckIns(event.id, signal)),
    [event.id, event.status],
  )

  if (event.status === "DRAFT") {
    return <EmptyState title="Check-in opens after you publish." body="Once the event is live, scan QR codes from the Check-in page." />
  }
  if (checkIns.error) return <ErrorState error={checkIns.error} onRetry={checkIns.reload} />
  if (checkIns.loading) return <Loading label="Loading check-ins" />
  const list = checkIns.data ?? []
  if (list.length === 0) {
    return (
      <EmptyState
        title={event.status === "CANCELLED" ? "Check-in is closed." : "No one has checked in yet."}
        body={event.status === "CANCELLED" ? undefined : "Scanned tickets show up here with the time and who scanned them."}
        action={
          event.status === "PUBLISHED" ? (
            <Link to={`/check-in?event=${event.id}`} className="pill pill-dark">
              Open check-in
            </Link>
          ) : null
        }
      />
    )
  }
  return (
    <ul className="card m-0 flex list-none flex-col p-0">
      {list.map((item, index) => (
        <li key={item.id} className={cn("flex flex-wrap items-center justify-between gap-3 px-5 py-4", index > 0 && "border-t border-line")}>
          <span className="flex flex-col">
            <span className="font-bold">{item.ticket.reservation.buyerName}</span>
            <span className="text-sm text-subtle">{item.ticket.ticketType.name}</span>
          </span>
          <span className="text-right text-sm text-ink-soft">
            {shortDate(item.checkedInAt, event.timezone)}, {time(item.checkedInAt, event.timezone)}
            <br />
            by {item.checkedInBy.name}
          </span>
        </li>
      ))}
    </ul>
  )
}
