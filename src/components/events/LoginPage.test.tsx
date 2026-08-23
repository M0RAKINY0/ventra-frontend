import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { LoginPage } from "@/components/events/LoginPage"
import { demoEvents } from "@/data/events"

afterEach(cleanup)

function renderLoginPage() {
  return render(<LoginPage featuredEvent={demoEvents[0]} onBack={vi.fn()} />)
}

describe("LoginPage", () => {
  it("starts in sign-in mode with the focused email form", () => {
    renderLoginPage()

    expect(screen.getByRole("heading", { name: "Keep your next plan close." })).toBeTruthy()
    expect(screen.getByLabelText("Email address").getAttribute("type")).toBe("email")
    expect((screen.getByLabelText("Email address") as HTMLInputElement).required).toBe(true)
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("password")
    expect(screen.queryByLabelText("Name")).toBeNull()
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeTruthy()
  })

  it("switches to sign-up mode and exposes the name field", () => {
    renderLoginPage()

    fireEvent.click(screen.getByRole("button", { name: "Create an account" }))

    expect(screen.getByRole("heading", { name: "Make room for a good plan." })).toBeTruthy()
    expect((screen.getByLabelText("Name") as HTMLInputElement).required).toBe(true)
    expect(screen.getByRole("button", { name: "Create account" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy()
  })

  it("keeps existing email and password values attached to their fields when modes switch", () => {
    renderLoginPage()

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "hello@ventra.test" },
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "good-plans" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Create an account" }))

    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("")
    expect((screen.getByLabelText("Email address") as HTMLInputElement).value).toBe("hello@ventra.test")
    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("good-plans")
  })

  it("shows demo feedback after a valid sign-in submission", () => {
    renderLoginPage()

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "hello@ventra.test" },
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "good-plans" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }))

    expect(screen.getByRole("status").textContent).toContain("You are back in. Your plans are ready.")
  })

  it("shows an inline message when the email field is invalid", () => {
    renderLoginPage()

    const email = screen.getByLabelText("Email address")
    fireEvent.invalid(email)

    expect(screen.getByRole("alert").textContent).toContain("valid email address")
  })

  it("shows demo feedback when social authentication is selected", () => {
    renderLoginPage()

    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }))

    expect(screen.getByRole("status").textContent).toContain("You are back in. Your plans are ready.")
  })

  it("switches the visual preview with accessible pressed states", () => {
    renderLoginPage()

    const visualPanel = screen.getByRole("complementary", { name: "Ventra visual preview" })
    const eventButton = screen.getByRole("button", { name: "Event view" })
    const cityButton = screen.getByRole("button", { name: "City view" })
    const signalButton = screen.getByRole("button", { name: "Signal view" })

    expect(visualPanel.getAttribute("data-visual-mode")).toBe("event")
    expect(eventButton.getAttribute("aria-pressed")).toBe("true")

    fireEvent.click(cityButton)
    expect(visualPanel.getAttribute("data-visual-mode")).toBe("city")
    expect(cityButton.getAttribute("aria-pressed")).toBe("true")
    expect(eventButton.getAttribute("aria-pressed")).toBe("false")

    fireEvent.click(signalButton)
    expect(visualPanel.getAttribute("data-visual-mode")).toBe("signal")
    expect(signalButton.getAttribute("aria-pressed")).toBe("true")
  })

  it("calls onBack from the return action", () => {
    const onBack = vi.fn()
    render(<LoginPage featuredEvent={demoEvents[0]} onBack={onBack} />)

    fireEvent.click(screen.getByRole("button", { name: "Back to Ventra" }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
