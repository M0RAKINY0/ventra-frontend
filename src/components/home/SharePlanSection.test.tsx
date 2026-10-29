import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { SharePlanSection } from "@/components/home/SharePlanSection"

afterEach(cleanup)

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview")
  URL.revokeObjectURL = vi.fn()
})

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function fillRequiredText() {
  fill("Title", "Sunday Sketch Club")
  fill("Date", "2026-09-06")
  fill("Time", "09:00")
  fill("Venue", "Marina Gate")
  fill("Description", "Slow drawing walk.")
}

describe("SharePlanSection", () => {
  it("asks for the first missing field", () => {
    const onCreate = vi.fn()
    render(<SharePlanSection onCreate={onCreate} />)

    fireEvent.click(screen.getByRole("button", { name: /publish plan/i }))

    expect(screen.getByRole("alert").textContent).toBe("Add a title.")
    expect(onCreate).not.toHaveBeenCalled()
  })

  it("requires a photo before publishing", () => {
    const onCreate = vi.fn()
    render(<SharePlanSection onCreate={onCreate} />)

    fillRequiredText()
    fireEvent.click(screen.getByRole("button", { name: /publish plan/i }))

    expect(screen.getByRole("alert").textContent).toBe("Add a photo before publishing.")
    expect(onCreate).not.toHaveBeenCalled()
  })

  it("publishes a draft with formatted date and time", () => {
    const onCreate = vi.fn()
    render(<SharePlanSection onCreate={onCreate} />)

    fillRequiredText()
    const photo = new File(["x"], "walk.png", { type: "image/png" })
    fireEvent.change(screen.getByLabelText(/add a photo/i), { target: { files: [photo] } })
    fireEvent.click(screen.getByRole("button", { name: /publish plan/i }))

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Sunday Sketch Club",
        date: "Sunday, 06 Sep",
        time: "9:00 AM",
        city: "Lagos",
        priceLabel: "Free entry",
        imagePreviewUrl: "blob:preview",
      }),
    )
    expect(screen.getByRole("status").textContent).toBe("Your plan is live in the guide.")
    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("")
  })
})
