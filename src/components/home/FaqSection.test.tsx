import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { FaqSection } from "@/components/home/FaqSection"

afterEach(cleanup)

describe("FaqSection", () => {
  it("opens the first question by default", () => {
    render(<FaqSection />)
    const toggles = screen.getAllByRole("button")

    expect(toggles).toHaveLength(6)
    expect(toggles[0].getAttribute("aria-expanded")).toBe("true")
    expect(toggles.slice(1).every((toggle) => toggle.getAttribute("aria-expanded") === "false")).toBe(true)
  })

  it("keeps one answer open at a time and can close it", () => {
    render(<FaqSection />)
    const spots = screen.getByRole("button", { name: "Can I limit how many people come?" })

    fireEvent.click(spots)
    expect(spots.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByRole("button", { name: "Is it free to post a plan?" }).getAttribute("aria-expanded")).toBe("false")

    fireEvent.click(spots)
    expect(spots.getAttribute("aria-expanded")).toBe("false")
  })

  it("links each question to its answer panel", () => {
    render(<FaqSection />)
    const toggle = screen.getByRole("button", { name: "Do guests need an account?" })
    const panel = document.getElementById(toggle.getAttribute("aria-controls") ?? "")

    expect(panel?.textContent).toContain("Only to reserve.")
    expect(panel?.getAttribute("aria-labelledby")).toBe(toggle.id)
  })
})
