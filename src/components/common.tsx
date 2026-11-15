import { LoaderCircle } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { errorMessage } from "@/lib/format"

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-10", className)}>{children}</div>
}

/** Rounded panel that slides up over the photo above it. */
export function Sheet({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <main
      className={cn(
        "relative z-10 -mt-8 rounded-t-[28px] bg-paper pb-32 md:-mt-12 md:rounded-t-[40px] md:pb-20",
        className,
      )}
    >
      {children}
    </main>
  )
}

const TONES = {
  ready: "bg-lime text-[#234528]",
  live: "bg-lime text-[#234528]",
  pending: "bg-[#fbe6c8] text-[#6b3a0a]",
  used: "bg-white text-ink-soft",
  draft: "bg-white text-ink-soft",
  void: "bg-[#f8dcd6] text-[#6e2219]",
  admin: "bg-ink text-cream",
  user: "bg-paper-deep text-ink-soft",
} as const

export type Tone = keyof typeof TONES

export function StatusPill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold", TONES[tone], className)}>
      {children}
    </span>
  )
}

export function Loading({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn("flex items-center justify-center gap-3 py-16 text-subtle", className)}>
      <LoaderCircle aria-hidden="true" className="spin" size={22} />
      <span>{label}…</span>
    </div>
  )
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn("card flex flex-col items-center gap-3 px-6 py-10 text-center", className)}>
      <strong className="text-lg">That didn't load.</strong>
      <p className="m-0 max-w-md text-subtle">{errorMessage(error)}</p>
      {onRetry ? (
        <button type="button" className="pill pill-soft" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  )
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <strong className="text-lg">{title}</strong>
      {body ? <p className="m-0 max-w-md leading-relaxed text-subtle">{body}</p> : null}
      {action}
    </div>
  )
}

export function Notice({ tone, children }: { tone: "success" | "danger" | "info"; children: ReactNode }) {
  const styles = {
    success: "bg-lime text-[#234528]",
    danger: "bg-[#f8dcd6] text-[#6e2219]",
    info: "bg-white text-ink-soft border border-line",
  }[tone]
  return (
    <p role={tone === "danger" ? "alert" : "status"} className={cn("m-0 rounded-2xl px-5 py-4 font-semibold", styles)}>
      {children}
    </p>
  )
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-soft">
      {children}
    </label>
  )
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <span id={id} className="text-sm font-semibold text-danger">
      {message}
    </span>
  )
}
