import { useState } from "react"
import "@/App.css"
import { CreateEventDrawer } from "@/components/events/CreateEventDrawer"
import { EventDetailDialog } from "@/components/events/EventDetailDialog"
import { VentraHero } from "@/components/hero/VentraHero"
import { AudienceSection } from "@/components/home/AudienceSection"
import { FaqSection } from "@/components/home/FaqSection"
import { GlobeSection } from "@/components/home/GlobeSection"
import { HowToUseSection } from "@/components/home/HowToUseSection"
import { SharePlanSection } from "@/components/home/SharePlanSection"
import { SiteFooter } from "@/components/home/SiteFooter"
import { demoEvents } from "@/data/events"
import { buildEventFromDraft } from "@/lib/event-draft"
import { useRouter } from "@/lib/router"
import type { Event, EventDraft } from "@/types/events"

/** The redesigned Ventra landing page from main (Figma redesign). It still runs on local demo events. */
export function LandingPage() {
  const { navigate } = useRouter()
  const [events, setEvents] = useState<Event[]>(demoEvents)
  const [activeEventId, setActiveEventId] = useState(demoEvents[0].id)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const navigateTo = (nextPath: string) => {
    setSelectedEvent(null)
    navigate(nextPath)
  }

  const handleCreate = (draft: EventDraft) => {
    const event = buildEventFromDraft(draft, `event-${crypto.randomUUID()}`)
    setEvents((previousEvents) => [...previousEvents, event])
    setActiveEventId(event.id)
  }

  const handleReserve = () => navigateTo("/login")

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
        <HowToUseSection />
        <FaqSection />
        <SharePlanSection onCreate={handleCreate} />
      </main>

      <SiteFooter onNavigate={navigateTo} />

      <CreateEventDrawer onCreate={handleCreate} onOpenChange={setIsCreateOpen} open={isCreateOpen} />
      <EventDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} onReserve={handleReserve} />
    </div>
  )
}
