import { ArrowUpRight, Route } from "lucide-react"
import { useEffect, useState } from "react"
import "./App.css"
import { CreateEventDrawer } from "@/components/events/CreateEventDrawer"
import { CreateEventForm } from "@/components/events/CreateEventForm"
import { EventDetailDialog } from "@/components/events/EventDetailDialog"
import { ExpandableEventCard } from "@/components/events/ExpandableEventCard"
import { HowItWorksCarousel } from "@/components/events/HowItWorksCarousel"
import { LoginPage } from "@/components/events/LoginPage"
import { VentraHero } from "@/components/hero/VentraHero"
import { howItWorksSteps, demoEvents } from "@/data/events"
import { buildEventFromDraft } from "@/lib/event-draft"
import type { Event, EventDraft } from "@/types/events"

function App() {
  const [events, setEvents] = useState<Event[]>(demoEvents)
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
  }

  const handleReserve = () => navigateTo("/login")

  if (pathname === "/login") {
    return <LoginPage featuredEvent={events[0] ?? demoEvents[0]} onBack={() => navigateTo("/")} />
  }

  return (
    <div className="events-app" id="top">
      <main>
        <VentraHero events={events} onCreate={() => setIsCreateOpen(true)} />

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
