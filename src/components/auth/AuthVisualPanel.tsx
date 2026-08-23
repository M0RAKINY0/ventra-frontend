import { MapPin, Route } from "lucide-react"
import { useState } from "react"
import { EventMedia } from "@/components/events/EventMedia"
import type { AuthVisualMode } from "@/types/auth"
import type { Event } from "@/types/events"

type AuthVisualPanelProps = {
  event: Event
}

const visualModes: Array<{ id: AuthVisualMode; label: string }> = [
  { id: "event", label: "Event view" },
  { id: "city", label: "City view" },
  { id: "signal", label: "Signal view" },
]

function EventVisual({ event }: AuthVisualPanelProps) {
  return (
    <div className="auth-visual-stage auth-visual-stage-event">
      <EventMedia alt={`${event.title} event photography`} className="auth-visual-image" src={event.imageSrc} />
      <div aria-hidden="true" className="auth-visual-scrim" />
      <div className="auth-event-copy">
        <p className="auth-visual-kicker">Right now / Lagos</p>
        <h2>{event.title}</h2>
        <div className="auth-event-meta">
          <span>
            <MapPin aria-hidden="true" size={14} /> {event.city}
          </span>
          <span>{event.date}</span>
        </div>
      </div>
    </div>
  )
}

function CityVisual({ event }: AuthVisualPanelProps) {
  return (
    <div className="auth-visual-stage auth-visual-stage-city">
      <div className="auth-city-image auth-city-image-back">
        <EventMedia alt="People gathering in Lagos after sunset" src={event.imageSrc} />
      </div>
      <div className="auth-city-image auth-city-image-front">
        <EventMedia alt="A lively local plan in Lagos" src="/events/street-sessions.png" />
      </div>
      <div className="auth-city-copy">
        <p className="auth-visual-kicker">A city worth wandering</p>
        <h2>Good plans are already happening nearby.</h2>
        <span>Plans begin with a feeling.</span>
      </div>
    </div>
  )
}

function SignalVisual() {
  return (
    <div className="auth-visual-stage auth-visual-stage-signal">
      <EventMedia alt="People making ceramics together in a bright studio" src="/events/ceramics-club.png" />
      <div aria-hidden="true" className="auth-signal-overlay" />
      <div aria-hidden="true" className="auth-signal-lines" />
      <div className="auth-signal-copy">
        <span className="auth-signal-mark">
          <Route aria-hidden="true" size={19} />
        </span>
        <p className="auth-visual-kicker">The city is open</p>
        <h2>A little time well spent.</h2>
        <p>One clear plan can change the shape of an ordinary day.</p>
      </div>
    </div>
  )
}

export function AuthVisualPanel({ event }: AuthVisualPanelProps) {
  const [visualMode, setVisualMode] = useState<AuthVisualMode>("event")

  return (
    <aside aria-label="Ventra visual preview" className="auth-visual-panel" data-visual-mode={visualMode}>
      <div className="auth-visual-topline">
        <span className="auth-visual-status">
          <span aria-hidden="true" /> Ventra / live guide
        </span>
        <span className="auth-visual-location">06°27&apos;N / 03°24&apos;E</span>
      </div>

      {visualMode === "event" ? <EventVisual event={event} /> : null}
      {visualMode === "city" ? <CityVisual event={event} /> : null}
      {visualMode === "signal" ? <SignalVisual /> : null}

      <div className="auth-visual-footer">
        <p>A little time well spent.</p>
        <div aria-label="Visual treatment" className="auth-visual-switcher">
          {visualModes.map((mode) => (
            <button
              aria-label={mode.label}
              aria-pressed={visualMode === mode.id}
              className="auth-visual-switch"
              key={mode.id}
              onClick={() => setVisualMode(mode.id)}
              type="button"
            >
              {mode.id}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
