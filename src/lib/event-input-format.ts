const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// "2026-08-28" (from <input type="date">) -> "Friday, 28 Aug", matching demo events.
export function formatDateInput(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return ""

  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCMonth() !== month - 1) return ""

  return `${WEEKDAYS[date.getUTCDay()]}, ${String(day).padStart(2, "0")} ${MONTHS[month - 1]}`
}

// "18:30" (from <input type="time">) -> "6:30 PM".
export function formatTimeInput(value: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return ""

  const hours = Number(match[1])
  const minutes = match[2]
  if (hours > 23 || Number(minutes) > 59) return ""

  const suffix = hours < 12 ? "AM" : "PM"
  return `${hours % 12 || 12}:${minutes} ${suffix}`
}
