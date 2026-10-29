import { describe, expect, it } from "vitest"
import { formatDateInput, formatTimeInput } from "@/lib/event-input-format"

describe("formatDateInput", () => {
  it("formats a date input value like the demo events", () => {
    expect(formatDateInput("2026-08-28")).toBe("Friday, 28 Aug")
    expect(formatDateInput("2026-09-06")).toBe("Sunday, 06 Sep")
  })

  it("returns an empty string for missing or impossible dates", () => {
    expect(formatDateInput("")).toBe("")
    expect(formatDateInput("2026-02-31")).toBe("")
  })
})

describe("formatTimeInput", () => {
  it("formats 24-hour input values as 12-hour times", () => {
    expect(formatTimeInput("18:30")).toBe("6:30 PM")
    expect(formatTimeInput("00:05")).toBe("12:05 AM")
    expect(formatTimeInput("12:00")).toBe("12:00 PM")
  })

  it("returns an empty string for invalid values", () => {
    expect(formatTimeInput("")).toBe("")
    expect(formatTimeInput("25:00")).toBe("")
  })
})
