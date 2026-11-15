// Shapes returned by the Ventra API (ticketflow-source). Dates arrive as ISO
// strings and Prisma Decimal prices arrive as strings.

export type Role = "USER" | "ADMIN"

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED"

export type TicketStatus = "PENDING" | "READY" | "USED" | "VOID"

export type EventCategory =
  | "MUSIC"
  | "BUSINESS"
  | "TECHNOLOGY"
  | "ARTS_CULTURE"
  | "FOOD_DRINK"
  | "SPORTS_FITNESS"
  | "COMMUNITY"
  | "EDUCATION"
  | "OTHER"

export type User = {
  id: string
  email: string
  name: string
  emailVerified?: boolean
  phoneNumber?: string | null
  role: Role
  createdAt: string
}

export type TicketType = {
  id: string
  eventId: string
  name: string
  description: string | null
  price: string
  capacity: number
  reservedCount: number
  createdAt: string
}

export type VentraEvent = {
  id: string
  /** Lowercase letters, digits and hyphens. The public page lives at /e/:slug. */
  slug: string
  title: string
  description: string
  startsAt: string
  endsAt: string
  venue: string
  category: EventCategory
  coverImageUrl: string | null
  city: string
  countryCode: string
  currency: string
  timezone: string
  status: EventStatus
  organizerId: string
  organizer: { id: string; name: string }
  ticketTypes: TicketType[]
  createdAt: string
}

export type EventInput = {
  title: string
  description: string
  startsAt: string
  endsAt: string
  venue: string
  category: EventCategory
  coverImageUrl: string | null
  city: string
  countryCode: string
  currency: string
  timezone: string
}

export type TicketTypeInput = {
  name: string
  description: string | null
  price: number
  capacity: number
}

export type Paginated<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}

type EventSummary = Omit<VentraEvent, "organizer" | "ticketTypes">

export type Ticket = {
  id: string
  reservationId: string
  ticketTypeId: string
  publicId: string
  status: TicketStatus
  qrCodeDataUrl: string | null
  qrPayload: string
  createdAt: string
  ticketType: TicketType
  reservation: {
    id: string
    eventId: string
    status: "CONFIRMED" | "CANCELLED"
    createdAt: string
    event: EventSummary
  }
  checkIn: { id: string; checkedInAt: string } | null
}

export type ReservationTicket = Omit<Ticket, "reservation" | "checkIn">

/** One checkout. `userId` is null when a guest reserved without an account. */
export type Reservation = {
  id: string
  eventId: string
  userId: string | null
  buyerEmail: string
  buyerName: string
  status: "CONFIRMED" | "CANCELLED"
  createdAt: string
  event: EventSummary
  tickets: ReservationTicket[]
  /** Opens this reservation without signing in. Treat it like a password. */
  accessToken: string
}

export type ReservationInput = {
  items: { ticketTypeId: string; quantity: number }[]
  /** Required for guests. The API ignores it for signed-in buyers. */
  buyer?: { name: string; email: string }
  /** From the Turnstile widget. Each attempt needs a fresh one, retries included. */
  turnstileToken?: string
}

/** Reservation totals for one event. Amounts are decimal strings, like "5000.00". */
export type SalesSummary = {
  eventId: string
  eventStatus: EventStatus
  currency: string
  reservationCount: number
  ticketCount: number
  reservedValue: string
  ticketTypes: { id: string; name: string; capacity: number; ticketCount: number; reservedValue: string }[]
}

/** One ticket in an organizer's attendee list. */
export type Attendee = {
  id: string
  publicId: string
  status: TicketStatus
  unitPrice: string
  createdAt: string
  ticketType: { name: string }
  reservation: { id: string; buyerName: string; buyerEmail: string; status: "CONFIRMED" | "CANCELLED" }
  checkIn: { checkedInAt: string } | null
}

export type CheckIn = {
  id: string
  ticketId: string
  eventId: string
  checkedInAt: string
  checkedInBy: { id: string; name: string }
  ticket: {
    id: string
    publicId: string
    ticketType: TicketType
    reservation: { id: string; buyerName: string; buyerEmail: string }
  }
}
