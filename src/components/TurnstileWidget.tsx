import { useEffect, useRef, useState } from "react"
import { Notice } from "@/components/common"
import { loadTurnstile } from "@/lib/turnstile"

type TurnstileWidgetProps = {
  siteKey: string
  /** The API only accepts tokens issued for the action it expects. */
  action: string
  /** Change this to throw the current token away and run a new challenge. */
  resetKey: number
  /** Called with a token when the challenge passes, and with null when the token expires or fails. */
  onToken: (token: string | null) => void
}

/** Runs the Cloudflare Turnstile challenge and reports its token. */
export function TurnstileWidget({ siteKey, action, resetKey, onToken }: TurnstileWidgetProps) {
  const container = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const lastReset = useRef(resetKey)
  const report = useRef(onToken)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    report.current = onToken
  }, [onToken])

  useEffect(() => {
    let cancelled = false
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !container.current) return
        widgetId.current = turnstile.render(container.current, {
          sitekey: siteKey,
          action,
          theme: "light",
          // The full widget needs 300px. Narrow phones get the compact one.
          size: container.current.clientWidth < 300 ? "compact" : "flexible",
          callback: (token) => report.current(token),
          "expired-callback": () => report.current(null),
          "error-callback": () => report.current(null),
        })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
      if (widgetId.current) {
        window.turnstile?.remove(widgetId.current)
        widgetId.current = null
      }
    }
  }, [siteKey, action])

  useEffect(() => {
    if (lastReset.current === resetKey) return
    lastReset.current = resetKey
    if (widgetId.current) window.turnstile?.reset(widgetId.current)
  }, [resetKey])

  return (
    <div className="flex flex-col gap-2">
      <div ref={container} className="min-h-[65px] w-full" />
      {failed ? (
        <Notice tone="danger">
          The security check didn't load. Turn off any content blocker for this page, then reload.
        </Notice>
      ) : null}
    </div>
  )
}
