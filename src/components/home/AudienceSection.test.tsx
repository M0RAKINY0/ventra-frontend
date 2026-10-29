import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { AudienceSection } from "@/components/home/AudienceSection"

afterEach(cleanup)

describe("AudienceSection", () => {
  it("announces each audience once despite the looping reel", () => {
    render(<AudienceSection />)

    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Plan-goers",
      "Friends & night-outs",
      "Hosts & creators",
    ])
  })

  it("pauses and resumes the reel when tapped", () => {
    render(<AudienceSection />)
    const toggle = screen.getByRole("button", { name: "Pause the slideshow" })

    fireEvent.click(toggle)
    expect(toggle.getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByText("Paused · tap to play")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Play the slideshow" }))
    expect(toggle.getAttribute("aria-pressed")).toBe("false")
    expect(screen.getByText("Tap the cards to pause")).toBeTruthy()
  })
})
