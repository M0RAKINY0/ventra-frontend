import { ArrowRight, Route } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { useOutsideClick } from "@/hooks/use-outside-click"
import type { Event } from "@/types/events"

type VentraHeroProps = {
  events: Event[]
  onCreate: () => void
}

// Fan positions from the 1440 x 900 Figma frame: card center (x from page center, y from top), size, rotation.
const printFanLayout: Record<string, { x: number; y: number; w: number; h: number; r: number }> = {
  "street-sessions": { x: -635.67, y: 811.94, w: 310.5, h: 465.75, r: -12 },
  "night-market-after-dark": { x: -334.6, y: 780.38, w: 337.5, h: 506.25, r: -7 },
  "draw-the-city": { x: 636.2, y: 855.09, w: 324, h: 486, r: 10 },
  "rooftop-cinema-sunlit": { x: 303.28, y: 826.98, w: 378, h: 567, r: 4 },
  "clay-after-hours": { x: -4.2, y: 799.75, w: 418.5, h: 627.75, r: -2 },
}

const printFanOrder = [
  "street-sessions",
  "night-market-after-dark",
  "draw-the-city",
  "rooftop-cinema-sunlit",
  "clay-after-hours",
]

export function VentraHero({ events, onCreate }: VentraHeroProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const closeMenu = useCallback(() => setIsMenuOpen(false), [])
  useOutsideClick(menuRef, closeMenu)

  const fanEvents = printFanOrder
    .map((id) => events.find((event) => event.id === id))
    .filter((event): event is Event => Boolean(event))

  return (
    <section aria-labelledby="ventra-hero-title" className="vh">
      <div aria-hidden="true" className="vh-fan">
        {fanEvents.map((event) => {
          const slot = printFanLayout[event.id]

          return (
            <img
              alt=""
              className="vh-print"
              key={event.id}
              src={event.imageSrc}
              style={{
                left: `calc(50% + ${slot.x}px)`,
                top: `${slot.y}px`,
                width: `${slot.w}px`,
                height: `${slot.h}px`,
                transform: `translate(-50%, -50%) rotate(${slot.r}deg)`,
              }}
            />
          )
        })}
      </div>

      <div className="vh-content">
        <header className="vh-header">
          <a aria-label="Ventra home" className="vh-brand" href="#top">
            <span aria-hidden="true" className="vh-logo">
              <span className="vh-route-mark">
                <Route size={19} strokeWidth={2} />
              </span>
            </span>
            <span className="vh-brand-name">Ventra</span>
            <span className="vh-brand-tag">A city guide</span>
          </a>

          <div className="vh-menu" ref={menuRef}>
            <button
              aria-controls="vh-menu-panel"
              aria-expanded={isMenuOpen}
              className="vh-menu-button"
              onClick={() => setIsMenuOpen((open) => !open)}
              type="button"
            >
              <span>Menu</span>
              <span aria-hidden="true" className="vh-menu-lines">
                <span />
                <span />
              </span>
            </button>
            {isMenuOpen ? (
              <nav aria-label="Primary navigation" className="vh-menu-panel" id="vh-menu-panel">
                <a href="#browse-plans" onClick={closeMenu}>Browse</a>
                <a href="#how-it-works" onClick={closeMenu}>How it works</a>
                <button
                  onClick={() => {
                    closeMenu()
                    onCreate()
                  }}
                  type="button"
                >
                  Create a plan
                </button>
              </nav>
            ) : null}
          </div>

          <div className="vh-actions">
            <button className="vh-button" data-variant="primary" onClick={onCreate} type="button">
              Create a plan
            </button>
          </div>
        </header>

        <div className="vh-copy">
          <h1 className="vh-wordmark" id="ventra-hero-title">VENTRA</h1>
          <p className="vh-lede">
            Easygoing plans from people who actually live here, picked for evenings worth leaving the house for.
          </p>
          <div className="vh-ctas">
            <a className="vh-button" data-variant="primary" href="#browse-plans">
              Browse the plans <ArrowRight aria-hidden="true" size={15} />
            </a>
            <a className="vh-button" data-variant="ghost" href="#how-it-works">
              How it works
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
