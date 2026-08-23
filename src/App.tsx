import { ArrowDown, ArrowUpRight, Plus, Route } from "lucide-react"
import { useEffect, useState } from "react"
import "./App.css"
import { AnimatedEventHero } from "@/components/events/AnimatedEventHero"
import { CreateEventDrawer } from "@/components/events/CreateEventDrawer"
import { CreateEventForm } from "@/components/events/CreateEventForm"
import { EventDetailDialog } from "@/components/events/EventDetailDialog"
import { ExpandableEventCard } from "@/components/events/ExpandableEventCard"
import { HowItWorksCarousel } from "@/components/events/HowItWorksCarousel"
import { LoginPage } from "@/components/events/LoginPage"
import { howItWorksSteps, demoEvents } from "@/data/events"
import { buildEventFromDraft } from "@/lib/event-draft"
import type { Event, EventDraft } from "@/types/events"

function App() {
  const [events, setEvents] = useState<Event[]>(demoEvents)
  const [activeEventId, setActiveEventId] = useState(demoEvents[0].id)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname)
    window.addEventListener("popstate", handlePopState)

    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const navigateTo = (nextPath: string) => {
    window.history.pushState({}, "", nextPath)
    setPathname(nextPath)
    setSelectedEvent(null)
  }

  const handleCreate = (draft: EventDraft) => {
    const event = buildEventFromDraft(draft, `event-${crypto.randomUUID()}`)
    setEvents((previousEvents) => [...previousEvents, event])
    setActiveEventId(event.id)
  }

  const handleReserve = () => navigateTo("/login")

  if (pathname === "/login") {
    return <LoginPage onBack={() => navigateTo("/")} />
  }

  return (
    <div className="events-app" id="top">
      <header className="site-header route-site-header">
        <div className="nav-wrap route-header-inner">
          <a className="route-brand-lockup" href="#top" aria-label="Ventra home">
            <span aria-hidden="true" className="route-brand-mark">
              <Route size={18} />
            </span>
            <span className="route-brand-name">Ventra</span>
            <span className="route-brand-tag">A city guide</span>
          </a>
          <nav aria-label="Primary navigation" className="route-nav">
            <a className="route-nav-link" href="#browse-plans">
              Browse
            </a>
            <a className="route-nav-link" href="#how-it-works">
              How it works
            </a>
            <a className="route-nav-link" href="#create-event">
              Create
            </a>
            <button
              aria-label="Create an event"
              className="route-nav-create"
              onClick={() => setIsCreateOpen(true)}
              title="Create an event"
              type="button"
            >
              <Plus aria-hidden="true" size={15} />
              <span>Create a plan</span>
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section aria-labelledby="hero-title" className="main-shell hero-section">
          <div className="hero-copy">
            <p className="eyebrow">
              <span aria-hidden="true" className="hero-live-dot" /> Lagos / open plans
            </p>
            <h1 className="hero-title" id="hero-title">
              Find a plan you will be <span className="title-accent">glad you made.</span>
            </h1>
            <p className="hero-lede">
              Browse easygoing local plans, see the useful details, and find a reason to
              step out with someone you like.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#browse-plans">
                Browse plans <ArrowDown aria-hidden="true" size={16} />
              </a>
              <button className="secondary-button" onClick={() => setIsCreateOpen(true)} type="button">
                Create a plan <Plus aria-hidden="true" size={16} />
              </button>
            </div>
            <div className="hero-proof">
              <span aria-hidden="true" className="proof-dots">
                <span className="proof-dot" />
                <span className="proof-dot" />
                <span className="proof-dot" />
              </span>
              <span>A little time well spent.</span>
            </div>
          </div>

          <div className="hero-stage">
            <AnimatedEventHero
              activeEventId={activeEventId}
              autoplay
              events={events}
              onActiveChange={setActiveEventId}
              onOpen={setSelectedEvent}
            />
          </div>
        </section>

        <section className="section-band" id="browse-plans">
          <div className="main-shell section-shell">
            <div className="section-heading-row">
              <div>
                <p className="section-kicker">Browse together</p>
                <h2 className="section-title">Plans worth leaving the house for.</h2>
              </div>
            </div>
            <div className="event-grid">
              {events.map((event) => (
                <ExpandableEventCard
                  event={event}
                  key={event.id}
                  onOpen={setSelectedEvent}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="main-shell section-shell">
            <div className="section-heading-row">
              <div>
                <p className="section-kicker">How Ventra works</p>
                <h2 className="section-title">Three easy moves to a good plan.</h2>
              </div>
            </div>
            <div className="how-carousel-shell">
              <HowItWorksCarousel steps={howItWorksSteps} />
            </div>
            <div className="how-carousel-note">
              <span>
                <strong>A little guidance before you decide.</strong>
              </span>
            </div>
          </div>
        </section>

        <section className="create-band" id="create-event">
          <div className="main-shell section-shell create-layout">
            <div className="create-header">
              <div>
                <p className="section-kicker">Share something</p>
                <h2 className="section-title">Make your next good idea easy to find.</h2>
              </div>
            </div>
            <div className="create-station">
              <div className="create-aside">
                <h3>Your plan belongs here too.</h3>
                <p>
                  Share it once and it appears in the guide straight away. This demo keeps it here until refresh.
                </p>
                <button className="create-aside-action" onClick={() => setIsCreateOpen(true)} type="button">
                  Open the creator <ArrowUpRight aria-hidden="true" size={15} />
                </button>
              </div>
              <div aria-label="Create an event" className="create-interface">
                <div className="create-interface-header">
                  <div>
                    <p className="create-interface-kicker">New / plan</p>
                    <h3 className="create-interface-title">Share a plan</h3>
                  </div>
                  <span className="create-form-signal"><span /> Almost ready</span>
                </div>
                <CreateEventForm
                  className="event-form-inline"
                  onCreate={handleCreate}
                  submitLabel="Publish event"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="main-shell footer-row">
          <a aria-label="Ventra home" className="footer-brand" href="#top">
            <span aria-hidden="true" className="footer-brand-mark">
              <Route size={16} />
            </span>
            <strong>Ventra</strong>
            <span>Good plans, close to home.</span>
          </a>
          <div className="footer-links">
            <a className="footer-link" href="#browse-plans">
              Browse
            </a>
            <a className="footer-link" href="#how-it-works">
              How it works
            </a>
            <button className="footer-link" onClick={() => setIsCreateOpen(true)} type="button">
              Share a plan <ArrowUpRight aria-hidden="true" size={14} />
            </button>
          </div>
          <span className="footer-coordinate">06°27&apos;N / 03°24&apos;E</span>
        </div>
      </footer>

      <CreateEventDrawer
        onCreate={handleCreate}
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
      />
      <EventDetailDialog
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onReserve={handleReserve}
      />
    </div>
  )
}

export default App
