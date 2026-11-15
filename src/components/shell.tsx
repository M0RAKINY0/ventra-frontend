import { CalendarDays, Compass, LogOut, ScanLine, ShieldCheck, Ticket } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link, useRouter } from "@/lib/router"
import { useSession } from "@/lib/session"
import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Container } from "@/components/common"
import type { User } from "@/types/api"

type NavItem = { to: string; label: string; icon: typeof Compass; match: (path: string) => boolean }

function navItems(user: User | null): NavItem[] {
  const items: NavItem[] = [
    { to: "/events", label: "Browse", icon: Compass, match: (p) => p.startsWith("/events") },
  ]
  if (!user) return items
  items.push(
    { to: "/tickets", label: "My tickets", icon: Ticket, match: (p) => p.startsWith("/tickets") },
    { to: "/hosting", label: "Hosting", icon: CalendarDays, match: (p) => p.startsWith("/hosting") },
    { to: "/check-in", label: "Check-in", icon: ScanLine, match: (p) => p.startsWith("/check-in") },
  )
  if (user.role === "ADMIN") {
    items.push({ to: "/admin", label: "Admin", icon: ShieldCheck, match: (p) => p.startsWith("/admin") })
  }
  return items
}

function AccountButton() {
  const { user, signOut } = useSession()
  const { navigate, pathname } = useRouter()
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (!user) {
    return (
      <Link
        to={`/login?next=${encodeURIComponent(pathname)}`}
        className="glass inline-flex min-h-11 items-center rounded-full px-5 font-semibold text-white no-underline"
      >
        Log in
      </Link>
    )
  }

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        aria-label={`Account: ${user.name}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className="glass flex size-12 items-center justify-center rounded-full font-bold"
      >
        {initials(user.name)}
      </button>
      {open ? (
        <div className="absolute right-0 top-14 z-30 w-64 rounded-3xl border border-line bg-white p-4 text-ink shadow-xl">
          <p className="m-0 font-bold">{user.name}</p>
          <p className="m-0 truncate text-sm text-subtle">{user.email}</p>
          <button
            type="button"
            className="pill pill-soft mt-4 w-full"
            onClick={async () => {
              setOpen(false)
              await signOut()
              navigate("/")
            }}
          >
            <LogOut aria-hidden="true" size={16} />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}

/** Brand, glass navigation and account control. Sits on top of a photo or dark band. */
export function SiteHeader({ className }: { className?: string }) {
  const { user } = useSession()
  const { pathname } = useRouter()
  const items = navItems(user)

  return (
    <header className={cn("on-photo relative z-20 text-white", className)}>
      <Container className="flex flex-wrap items-center justify-between gap-3 py-4 md:py-5">
        <Link to="/" className="flex min-h-11 items-center font-display text-2xl tracking-tight text-white no-underline">
          Ventra
        </Link>
        <nav aria-label="Main" className="glass hidden flex-wrap gap-0.5 rounded-full p-1.5 md:flex">
          {items.map((item) => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-semibold no-underline",
                  active ? "bg-white text-ink" : "text-white hover:bg-white/15",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <AccountButton />
      </Container>
    </header>
  )
}

/** Floating frosted tab bar for phones. Hidden from md up, where SiteHeader shows the nav. */
export function MobileTabBar() {
  const { user } = useSession()
  const { pathname } = useRouter()
  const items = navItems(user)
  if (items.length < 2) return null

  return (
    <nav
      aria-label="Main"
      className="frost fixed inset-x-3.5 bottom-3.5 z-40 flex rounded-[26px] p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] md:hidden"
    >
      {items.map((item) => {
        const active = item.match(pathname)
        const Icon = item.icon
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-[54px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px] text-[11px] font-bold no-underline",
              active ? "bg-ink text-cream" : "text-ink-soft",
            )}
          >
            <Icon aria-hidden="true" size={22} strokeWidth={2} />
            {item.label === "My tickets" ? "Tickets" : item.label}
          </Link>
        )
      })}
    </nav>
  )
}

type PhotoHeroProps = {
  image?: string | null
  dim?: boolean
  blur?: boolean
  minHeight?: string
  children?: ReactNode
  className?: string
}

/** Full-bleed photo with the site header on top and content anchored to the bottom. */
export function PhotoHero({ image, dim, blur, minHeight = "min-h-[360px]", children, className }: PhotoHeroProps) {
  return (
    <section className={cn("relative flex flex-col overflow-hidden bg-ink text-white", minHeight, className)}>
      {image ? (
        <img
          src={image}
          alt=""
          className={cn(
            "absolute inset-0 size-full object-cover",
            dim && "opacity-60",
            blur && "scale-110 blur-md",
          )}
        />
      ) : null}
      <span aria-hidden="true" className="scrim-hero absolute inset-0" />
      <SiteHeader />
      <div className="on-photo relative mt-auto pb-16 md:pb-24">{children}</div>
    </section>
  )
}
