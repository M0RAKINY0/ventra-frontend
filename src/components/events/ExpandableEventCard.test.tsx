import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ExpandableEventCard } from "@/components/events/ExpandableEventCard"
import { demoEvents } from "@/data/events"

describe("ExpandableEventCard", () => {
  it("opens from the card surface, not only the action label", () => {
    const onOpen = vi.fn()

    render(<ExpandableEventCard event={demoEvents[0]} onOpen={onOpen} />)

    fireEvent.click(screen.getByRole("button", { name: "Open details for Night Market After Dark" }))

    expect(onOpen).toHaveBeenCalledWith(demoEvents[0])
  })

  it("does not render a sequence number over the event image", () => {
    render(<ExpandableEventCard event={demoEvents[0]} onOpen={vi.fn()} />)

    expect(document.querySelector(".event-card-sequence")).toBeNull()
  })

  it("does not render a category badge over the event image", () => {
    render(<ExpandableEventCard event={demoEvents[0]} onOpen={vi.fn()} />)

    expect(document.querySelector(".event-card-badge")).toBeNull()
  })
})
