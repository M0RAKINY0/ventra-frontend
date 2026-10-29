import { useEffect, useState } from "react"
import "./App.css"
import { CreateEventDrawer } from "@/components/events/CreateEventDrawer"
import { EventDetailDialog } from "@/components/events/EventDetailDialog"
import { ExpandableEventCard } from "@/components/events/ExpandableEventCard"
import { LoginPage } from "@/components/events/LoginPage"
import { VentraHero } from "@/components/hero/VentraHero"
import { AudienceSection } from "@/components/home/AudienceSection"
import { GlobeSection } from "@/components/home/GlobeSection"
import { HowToUseSection } from "@/components/home/HowToUseSection"
import { SharePlanSection } from "@/components/home/SharePlanSection"
import { SiteFooter } from "@/components/home/SiteFooter"
import { demoEvents } from "@/data/events"
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
    return <LoginPage featuredEvent={events[0] ?? demoEvents[0]} onBack={() => navigateTo("/")} />
  }

  return (
    <div className="events-app" id="top">
      <main>
        <VentraHero
          activeEventId={activeEventId}
          events={events}
          onActiveChange={setActiveEventId}
          onCreate={() => setIsCreateOpen(true)}
          onOpen={setSelectedEvent}
        />

        <AudienceSection />
        <GlobeSection events={events} />

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

        <HowToUseSection />
        <SharePlanSection onCreate={handleCreate} />
      </main>

      <SiteFooter onNavigate={navigateTo} />

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
