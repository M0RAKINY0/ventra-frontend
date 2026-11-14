import { describe, expect, it } from "vitest"
import { isoToZonedLocal, zonedLocalToIso } from "@/lib/datetime"

describe("event wall-clock times", () => {
  it("converts organizer input in the event timezone to UTC and back", () => {
    // Lagos is UTC+1 all year.
    expect(zonedLocalToIso("2026-12-10T08:00", "Africa/Lagos")).toBe("2026-12-10T07:00:00.000Z")
    expect(isoToZonedLocal("2026-12-10T07:00:00.000Z", "Africa/Lagos")).toBe("2026-12-10T08:00")

    // New York switches offset, so summer and winter differ by an hour.
    expect(zonedLocalToIso("2026-07-04T19:30", "America/New_York")).toBe("2026-07-04T23:30:00.000Z")
    expect(zonedLocalToIso("2026-12-04T19:30", "America/New_York")).toBe("2026-12-05T00:30:00.000Z")
  })
})
