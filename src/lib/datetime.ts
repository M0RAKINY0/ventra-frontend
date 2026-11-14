// The API stores UTC instants plus an IANA timezone. Organizers type wall-clock
// times in the event's timezone, so convert between the two explicitly instead
// of relying on the browser's own timezone.

function partsIn(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") }
}

/** Milliseconds the zone is ahead of UTC at `date`. */
function offsetAt(date: Date, timeZone: string): number {
  const p = partsIn(date, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - (date.getTime() - date.getMilliseconds())
}

/** "2026-12-10T08:00" in `timeZone` → ISO string in UTC. */
export function zonedLocalToIso(local: string, timeZone: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(local)
  if (!match) throw new Error("Use the date and time picker to set a time.")
  const [, y, mo, d, h, mi] = match.map(Number)
  const wallClockAsUtc = Date.UTC(y, mo - 1, d, h, mi)
  // Two passes handle times near a daylight-saving change.
  let utc = wallClockAsUtc - offsetAt(new Date(wallClockAsUtc), timeZone)
  utc = wallClockAsUtc - offsetAt(new Date(utc), timeZone)
  return new Date(utc).toISOString()
}

/** ISO instant → "2026-12-10T08:00" wall-clock time in `timeZone`, for datetime-local inputs. */
export function isoToZonedLocal(iso: string, timeZone: string): string {
  const p = partsIn(new Date(iso), timeZone)
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format()
    return true
  } catch {
    return false
  }
}

export function timeZones(): string[] {
  const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf
  if (supported) return supported("timeZone")
  return ["Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Africa/Johannesburg", "Europe/London", "America/New_York", "UTC"]
}
