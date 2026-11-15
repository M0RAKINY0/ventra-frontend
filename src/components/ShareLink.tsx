import { Check, Copy } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { eventPath } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { VentraEvent } from "@/types/api"

type ShareLinkProps = {
  event: Pick<VentraEvent, "id" | "slug">
  /** Prefix for the input ID, so two share links can sit on one page. */
  id: string
  /** Puts the button under the link, for narrow side cards. */
  stacked?: boolean
}

/** The event's public link with a copy button. Organizers post this link on socials. */
export function ShareLink({ event, id, stacked }: ShareLinkProps) {
  const url = new URL(eventPath(event), window.location.origin).toString()
  const input = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<"idle" | "copied" | "selected">("idle")

  useEffect(() => {
    if (state === "idle") return
    const timer = window.setTimeout(() => setState("idle"), 2500)
    return () => window.clearTimeout(timer)
  }, [state])

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setState("copied")
    } catch {
      // No clipboard access, for example on plain http. Select the link so it can be copied by hand.
      input.current?.select()
      setState("selected")
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className={cn("flex gap-2.5", stacked ? "flex-col" : "flex-wrap")}>
        <label htmlFor={`${id}-link`} className="sr-only-safe">
          Event link
        </label>
        <input
          ref={input}
          id={`${id}-link`}
          className={cn("field font-mono text-sm", !stacked && "w-auto min-w-0 flex-[1_1_260px]")}
          readOnly
          value={url}
          onFocus={(event) => event.target.select()}
        />
        <button type="button" className={cn("pill pill-dark", stacked && "w-full")} onClick={copy}>
          {state === "copied" ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
          {state === "copied" ? "Copied" : "Copy link"}
        </button>
      </div>
      <span role="status" className="text-[13px] text-subtle">
        {state === "selected"
          ? "The link is selected. Copy it from the box."
          : "Anyone with this link can reserve. They don't need an account."}
      </span>
    </div>
  )
}
