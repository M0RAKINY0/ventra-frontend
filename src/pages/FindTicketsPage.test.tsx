import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { api } from "@/lib/api"
import { RouterProvider } from "@/lib/router"
import { FindTicketsPage } from "@/pages/FindTicketsPage"

vi.mock("@/lib/session", () => ({ useSession: () => ({ user: null }) }))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("FindTicketsPage", () => {
  it("sends the trimmed email and answers without saying whether it has tickets", async () => {
    const recover = vi.spyOn(api, "recoverTickets").mockResolvedValue({ message: "ok" })
    render(
      <RouterProvider>
        <FindTicketsPage />
      </RouterProvider>,
    )

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "  kemi@example.com " } })
    fireEvent.click(screen.getByRole("button", { name: "Email my tickets" }))

    const status = await screen.findByRole("status")
    expect(recover).toHaveBeenCalledWith("kemi@example.com")
    expect(status.textContent).toContain("If that email has tickets")
    expect(screen.getByRole("button", { name: "Send again" })).toBeTruthy()
  })
})
