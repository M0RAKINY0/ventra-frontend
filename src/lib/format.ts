import { ApiError } from "@/lib/api"
import type { EventCategory, EventStatus, TicketStatus, TicketType, VentraEvent } from "@/types/api"

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  MUSIC: "Music",
  BUSINESS: "Business",
  TECHNOLOGY: "Technology",
  ARTS_CULTURE: "Arts & culture",
  FOOD_DRINK: "Food & drink",
  SPORTS_FITNESS: "Sports & fitness",
  COMMUNITY: "Community",
  EDUCATION: "Education",
  OTHER: "Other",
}

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as EventCategory[]

// Local category photography stands in when an event has no cover image.
const CATEGORY_COVERS: Partial<Record<EventCategory, string>> = {
  MUSIC: "/events/street-sessions.webp",
  FOOD_DRINK: "/events/night-market.webp",
  ARTS_CULTURE: "/events/rooftop-cinema.webp",
  EDUCATION: "/events/ceramics-club.webp",
  COMMUNITY: "/events/sketch-walk.webp",
  SPORTS_FITNESS: "/events/sketch-walk.webp",
}

export function coverFor(event: Pick<VentraEvent, "coverImageUrl" | "category">): string {
  return event.coverImageUrl || CATEGORY_COVERS[event.category] || "/events/night-market.webp"
}

function inZone(iso: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone, ...options }).format(new Date(iso))
  } catch {
    return new Intl.DateTimeFormat("en-GB", options).format(new Date(iso))
  }
}

/** "Sat 28 Nov" in the event's own timezone. */
export function shortDate(iso: string, timeZone: string): string {
  return inZone(iso, timeZone, { weekday: "short", day: "numeric", month: "short" })
}

/** "Saturday 28 November 2026" */
export function longDate(iso: string, timeZone: string): string {
  return inZone(iso, timeZone, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

/** "7:00 pm" */
export function time(iso: string, timeZone: string): string {
  return inZone(iso, timeZone, { hour: "numeric", minute: "2-digit" })
}

export function timeRange(event: Pick<VentraEvent, "startsAt" | "endsAt" | "timezone">): string {
  const zone = inZone(event.startsAt, event.timezone, { timeZoneName: "short" }).split(" ").pop() ?? ""
  return `${time(event.startsAt, event.timezone)} – ${time(event.endsAt, event.timezone)} ${zone}`.trim()
}

export function money(amount: string | number, currency: string): string {
  const value = typeof amount === "string" ? Number(amount) : amount
  if (!Number.isFinite(value) || value === 0) return "Free"
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      currencyDisplay: "code",
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value)
  } catch {
    return `${currency} ${value.toLocaleString()}`
  }
}

export function lowestPrice(event: Pick<VentraEvent, "ticketTypes" | "currency">): string | null {
  if (event.ticketTypes.length === 0) return null
  const prices = event.ticketTypes.map((type) => Number(type.price))
  const min = Math.min(...prices)
  const label = money(min, event.currency)
  return prices.some((price) => price !== min) && min > 0 ? `From ${label}` : label
}

export function remaining(type: Pick<TicketType, "capacity" | "reservedCount">): number {
  return Math.max(0, type.capacity - type.reservedCount)
}

export function spotsLeft(event: Pick<VentraEvent, "ticketTypes">): number {
  return event.ticketTypes.reduce((sum, type) => sum + remaining(type), 0)
}

export function capacity(event: Pick<VentraEvent, "ticketTypes">): { reserved: number; total: number } {
  return event.ticketTypes.reduce(
    (sum, type) => ({ reserved: sum.reserved + type.reservedCount, total: sum.total + type.capacity }),
    { reserved: 0, total: 0 },
  )
}

export function eventStatusLabel(status: EventStatus): string {
  return status === "PUBLISHED" ? "Live" : status === "DRAFT" ? "Draft" : "Cancelled"
}

export type TicketDisplay = { label: string; tone: "ready" | "pending" | "used" | "void" }

/** A cancelled event voids its tickets, even though the ticket row still says READY. */
export function ticketDisplay(status: TicketStatus, eventStatus: EventStatus): TicketDisplay {
  if (eventStatus === "CANCELLED" || status === "VOID") return { label: "Event cancelled", tone: "void" }
  if (status === "USED") return { label: "Checked in", tone: "used" }
  if (status === "PENDING") return { label: "Issuing QR code", tone: "pending" }
  return { label: "Ready", tone: "ready" }
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  )
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong. Try again."
}

/** The page for one reservation. `save` saves it to the account as soon as a signed-in buyer lands there. */
export function reservationPath(reservation: { id: string; accessToken: string }, save = false): string {
  return `/reservations/${reservation.id}?token=${encodeURIComponent(reservation.accessToken)}${save ? "&save=1" : ""}`
}

/** Short, human-checkable code shown under a QR. The full payload stays in the QR. */
export function ticketCode(publicId: string): string {
  const core = publicId.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8)
  return `VTR-${core.slice(0, 4)}-${core.slice(4, 8)}`
}
