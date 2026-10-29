import { ArrowRight, Route } from "lucide-react"
import type { MouseEvent } from "react"

type SiteFooterProps = {
  onNavigate: (path: string) => void
}

export function SiteFooter({ onNavigate }: SiteFooterProps) {
  const goTo = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    onNavigate(path)
  }

  return (
    <footer className="vfoot">
      <div className="vfoot-inner">
        <div className="vfoot-top">
          <div className="vfoot-brand">
            <a aria-label="Ventra home" className="vfoot-lockup" href="#top">
              <span aria-hidden="true" className="vfoot-mark">
                <Route size={20} />
              </span>
              <span className="vfoot-name">Ventra</span>
            </a>
            <p className="vfoot-tagline">Good plans, close to home.</p>
            <a className="vfoot-cta" href="#create-event">
              Share a plan <ArrowRight aria-hidden="true" size={15} />
            </a>
          </div>

          <nav aria-label="Explore" className="vfoot-col">
            <p className="vfoot-label">Explore</p>
            <a href="#browse-plans">Browse plans</a>
            <a href="#how-it-works">How it works</a>
            <a href="#create-event">Share a plan</a>
          </nav>

          <nav aria-label="Account" className="vfoot-col">
            <p className="vfoot-label">Account</p>
            <a href="/login" onClick={goTo("/login")}>
              Sign in
            </a>
            <a href="/login" onClick={goTo("/login")}>
              Create an account
            </a>
            <a href="/login" onClick={goTo("/login")}>
              My tickets
            </a>
          </nav>

          {/* TODO: swap in the real social handles and contact address. */}
          <div className="vfoot-col">
            <p className="vfoot-label">Follow</p>
            <span>[Instagram]</span>
            <span>[X / Twitter]</span>
            <span>[Email address]</span>
          </div>
        </div>

        <p aria-hidden="true" className="vfoot-wordmark">
          VENTRA
        </p>

        <div className="vfoot-bottom">
          <span>© 2026 Ventra</span>
          <span className="vfoot-coordinate">06°27&apos;N / 03°24&apos;E</span>
        </div>
      </div>
    </footer>
  )
}
