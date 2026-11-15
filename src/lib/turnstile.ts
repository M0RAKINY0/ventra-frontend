// Cloudflare Turnstile, the bot check the API requires before a reservation.
// Docs: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/

/**
 * The public site key. When it's unset the checkout shows no widget and sends
 * no token, which only a development API without a Turnstile secret accepts.
 */
export const TURNSTILE_SITE_KEY: string | undefined = import.meta.env.VITE_TURNSTILE_SITE_KEY || undefined

type RenderOptions = {
  sitekey: string
  action: string
  theme: "light" | "dark" | "auto"
  size: "normal" | "flexible" | "compact"
  callback: (token: string) => void
  "expired-callback": () => void
  "error-callback": () => void
}

export type TurnstileApi = {
  render: (container: HTMLElement, options: RenderOptions) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

let loading: Promise<TurnstileApi> | null = null

/** Adds Cloudflare's script once and resolves with its API. A failed load can be retried. */
export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script")
    const fail = () => {
      loading = null
      script.remove()
      reject(new Error("Turnstile did not load"))
    }
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : fail())
    script.onerror = fail
    document.head.append(script)
  })
  return loading
}
