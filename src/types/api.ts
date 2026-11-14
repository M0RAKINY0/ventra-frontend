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
  publicId: string
  status: TicketStatus
  qrCodeDataUrl: string | null
  qrPayload: string
  createdAt: string
  reservation: {
    id: string
    eventId: string
    ticketTypeId: string
    status: "CONFIRMED" | "CANCELLED"
    createdAt: string
    event: EventSummary
    ticketType: TicketType
  }
  checkIn: { id: string; checkedInAt: string } | null
}

export type Reservation = {
  id: string
  eventId: string
  ticketTypeId: string
  status: "CONFIRMED" | "CANCELLED"
  event: EventSummary
  ticketType: TicketType
  ticket: Omit<Ticket, "reservation" | "checkIn"> | null
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
    reservation: {
      user: { id: string; name: string; email: string }
      ticketType: TicketType
    }
  }
}
