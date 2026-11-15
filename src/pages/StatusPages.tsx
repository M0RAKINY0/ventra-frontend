import type { ReactNode } from "react"
import { Container } from "@/components/common"
import { SiteHeader } from "@/components/shell"
import { Link } from "@/lib/router"

function StatusLayout({ code, title, body, extra }: { code: string; title: string; body: string; extra?: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-ink text-white">
      <img src="/events/sketch-walk.webp" alt="" className="absolute inset-0 size-full object-cover" />
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[rgba(10,16,14,0.9)] to-[rgba(10,16,14,0.4)]" />
      <SiteHeader />
      <Container className="on-photo relative my-auto flex flex-col gap-4 pb-28 pt-10 md:pb-16">
        <span className="glass self-start rounded-full px-3.5 py-1.5 text-sm font-bold">{code}</span>
        <h1 className="m-0 max-w-3xl font-display text-[clamp(36px,6vw,84px)] leading-[0.98] tracking-tight">{title}</h1>
        <p className="m-0 max-w-xl text-lg leading-relaxed text-white/85">{body}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link to="/events" className="pill pill-light">
            Browse events
          </Link>
          {extra}
        </div>
      </Container>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <StatusLayout
      code="404 · Not found"
      title="That plan took a wrong turn."
      body="The link may be old, or the event was removed. The rest of the city is still out there."
    />
  )
}

export function AccessDeniedPage() {
  return (
    <StatusLayout
      code="403 · Access denied"
      title="This page isn't yours to open."
      body="Only the event organizer or an admin can see it. If you run this event, log in with the account that created it."
    />
  )
}
