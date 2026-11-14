import type {
  CheckIn,
  EventCategory,
  EventInput,
  Paginated,
  Reservation,
  Role,
  Ticket,
  TicketType,
  TicketTypeInput,
  User,
  VentraEvent,
} from "@/types/api"

// Empty by default: in development Vite proxies /api to the backend, and in
// production the frontend is expected to be served from the API's origin or
// configured with VITE_API_URL.
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

/** Reads `{ error: { code, message } }` (API) or `{ code, message }` (Better Auth). */
export async function toApiError(response: Response): Promise<ApiError> {
  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    // Non-JSON error body, fall through to the generic message.
  }

  const source =
    payload && typeof payload === "object" && "error" in payload && payload.error && typeof payload.error === "object"
      ? (payload.error as Record<string, unknown>)
      : ((payload ?? {}) as Record<string, unknown>)

  const code = typeof source.code === "string" ? source.code : `HTTP_${response.status}`
  const message =
    typeof source.message === "string" && source.message.length > 0
      ? source.message
      : "Something went wrong. Try again."

  return new ApiError(response.status, code, message, source.details)
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", ...options.headers }
  if (options.body !== undefined) headers["Content-Type"] = "application/json"

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error
    throw new ApiError(0, "NETWORK_ERROR", "Can't reach Ventra right now. Check your connection and try again.")
  }

  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T

  const payload = (await response.json()) as unknown
  // Ventra API wraps payloads in { data }. Better Auth does not.
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ""
}

export type EventQuery = {
  query?: string
  category?: EventCategory
  from?: string
  to?: string
  countryCode?: string
  page?: number
  pageSize?: number
}

export const api = {
  me: () => request<{ user: User }>("/api/v1/me").then((r) => r.user),

  listEvents: (params: EventQuery = {}, signal?: AbortSignal) =>
    request<Paginated<VentraEvent>>(`/api/v1/events${query(params)}`, { signal }),

  getEvent: (eventId: string, signal?: AbortSignal) =>
    request<{ event: VentraEvent }>(`/api/v1/events/${eventId}`, { signal }).then((r) => r.event),

  createEvent: (input: EventInput) =>
    request<{ event: VentraEvent }>("/api/v1/events", { method: "POST", body: input }).then((r) => r.event),

  updateEvent: (eventId: string, input: Partial<EventInput>) =>
    request<{ event: VentraEvent }>(`/api/v1/events/${eventId}`, { method: "PATCH", body: input }).then(
      (r) => r.event,
    ),

  publishEvent: (eventId: string) =>
    request<{ event: VentraEvent }>(`/api/v1/events/${eventId}/publish`, { method: "POST" }).then((r) => r.event),

  cancelEvent: (eventId: string) =>
    request<{ event: VentraEvent }>(`/api/v1/events/${eventId}/cancel`, { method: "POST" }).then((r) => r.event),

  createTicketType: (eventId: string, input: TicketTypeInput) =>
    request<{ ticketType: TicketType }>(`/api/v1/events/${eventId}/ticket-types`, {
      method: "POST",
      body: input,
    }).then((r) => r.ticketType),

  deleteTicketType: (eventId: string, ticketTypeId: string) =>
    request<void>(`/api/v1/events/${eventId}/ticket-types/${ticketTypeId}`, { method: "DELETE" }),

  /** The idempotency key must stay the same when retrying the same reservation. */
  reserve: (eventId: string, ticketTypeId: string, idempotencyKey: string) =>
    request<{ reservation: Reservation }>(`/api/v1/events/${eventId}/reservations`, {
      method: "POST",
      body: { ticketTypeId },
      headers: { "Idempotency-Key": idempotencyKey },
    }).then((r) => r.reservation),

  listTickets: (signal?: AbortSignal) =>
    request<{ tickets: Ticket[] }>("/api/v1/me/tickets", { signal }).then((r) => r.tickets),

  getTicket: (ticketId: string, signal?: AbortSignal) =>
    request<{ ticket: Ticket }>(`/api/v1/me/tickets/${ticketId}`, { signal }).then((r) => r.ticket),

  checkIn: (eventId: string, qrPayload: string) =>
    request<{ checkIn: CheckIn }>(`/api/v1/events/${eventId}/check-ins`, {
      method: "POST",
      body: { qrPayload },
    }).then((r) => r.checkIn),

  listCheckIns: (eventId: string, signal?: AbortSignal) =>
    request<{ checkIns: CheckIn[] }>(`/api/v1/events/${eventId}/check-ins`, { signal }).then((r) => r.checkIns),

  listUsers: (params: { query?: string; role?: Role; page?: number; pageSize?: number } = {}, signal?: AbortSignal) =>
    request<Paginated<User>>(`/api/v1/users${query(params)}`, { signal }),

  setRole: (userId: string, role: Role) =>
    request<{ user: User }>(`/api/v1/users/${userId}/role`, { method: "PATCH", body: { role } }).then((r) => r.user),
}
