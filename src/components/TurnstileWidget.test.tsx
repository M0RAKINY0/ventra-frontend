import { act, cleanup, render, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { TurnstileWidget } from "@/components/TurnstileWidget"
import type { TurnstileApi } from "@/lib/turnstile"

afterEach(() => {
  cleanup()
  delete window.turnstile
})

describe("TurnstileWidget", () => {
  it("asks for a checkout token, reports it, and runs a new challenge on reset", async () => {
    const turnstile: TurnstileApi = { render: vi.fn(() => "widget-1"), reset: vi.fn(), remove: vi.fn() }
    window.turnstile = turnstile
    const onToken = vi.fn()

    const view = render(<TurnstileWidget siteKey="site-key" action="checkout" resetKey={0} onToken={onToken} />)
    await waitFor(() => expect(turnstile.render).toHaveBeenCalledTimes(1))

    const options = vi.mocked(turnstile.render).mock.calls[0][1]
    expect(options.sitekey).toBe("site-key")
    expect(options.action).toBe("checkout")

    act(() => options.callback("token-1"))
    expect(onToken).toHaveBeenLastCalledWith("token-1")
    act(() => options["expired-callback"]())
    expect(onToken).toHaveBeenLastCalledWith(null)

    expect(turnstile.reset).not.toHaveBeenCalled()
    view.rerender(<TurnstileWidget siteKey="site-key" action="checkout" resetKey={1} onToken={onToken} />)
    expect(turnstile.reset).toHaveBeenCalledWith("widget-1")

    view.unmount()
    expect(turnstile.remove).toHaveBeenCalledWith("widget-1")
  })
})
