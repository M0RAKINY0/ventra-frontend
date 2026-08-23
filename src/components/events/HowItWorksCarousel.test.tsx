import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { HowItWorksCarousel } from "@/components/events/HowItWorksCarousel"
import { howItWorksSteps } from "@/data/events"

vi.stubGlobal(
  "ResizeObserver",
  class ResizeObserverMock {
    observe() {}
    disconnect() {}
  },
)

afterEach(cleanup)

describe("HowItWorksCarousel", () => {
  it("keeps guide cards static when clicked", () => {
    render(<HowItWorksCarousel steps={howItWorksSteps} />)

    const cardTitle = screen.getByText(howItWorksSteps[0].title)
    const card = cardTitle.closest(".how-guide-card")
    expect(card).not.toBeNull()

    fireEvent.click(card as HTMLElement)

    expect(cardTitle.closest("button")).toBeNull()
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("keeps the next guide control available for the horizontal track", () => {
    render(<HowItWorksCarousel steps={howItWorksSteps} />)

    const nextButton = screen.getByRole("button", { name: "Next guide" })

    expect(nextButton.hasAttribute("disabled")).toBe(false)
  })
})
