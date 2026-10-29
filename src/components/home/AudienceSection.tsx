import { Compass, Megaphone, Users, type LucideIcon } from "lucide-react"
import { useState } from "react"

type Audience = {
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  icon: LucideIcon
  featured?: boolean
}

const audiences: Audience[] = [
  {
    title: "Plan-goers",
    description: "See what's on tonight and pick something you'll actually enjoy.",
    imageSrc: "/events/street-sessions.png",
    imageAlt: "A crowd dancing at a street party in the afternoon",
    icon: Compass,
  },
  {
    title: "Friends & night-outs",
    description: "Pick a plan together and get everyone out the door.",
    imageSrc: "/events/night-market.png",
    imageAlt: "Friends gathering under string lights at a night market",
    icon: Users,
    featured: true,
  },
  {
    title: "Hosts & creators",
    description: "Post your plan once and it shows up in the guide straight away.",
    imageSrc: "/events/ceramics-club.png",
    imageAlt: "People shaping clay at a ceramics workshop",
    icon: Megaphone,
  },
]

function AudienceCard({ audience, hidden = false }: { audience: Audience; hidden?: boolean }) {
  const Icon = audience.icon

  return (
    <article aria-hidden={hidden || undefined} className="aud-card" data-featured={audience.featured || undefined}>
      <img alt={hidden ? "" : audience.imageAlt} src={audience.imageSrc} />
      <div className="aud-strip">
        <span aria-hidden="true" className="aud-icon">
          <Icon size={18} />
        </span>
        <div>
          {hidden ? <p className="aud-title">{audience.title}</p> : <h3 className="aud-title">{audience.title}</h3>}
          <p className="aud-description">{audience.description}</p>
        </div>
      </div>
    </article>
  )
}

export function AudienceSection() {
  const [isPaused, setIsPaused] = useState(false)

  return (
    <section aria-labelledby="aud-title" className="aud" data-paused={isPaused || undefined}>
      <h2 className="aud-heading" id="aud-title">
        <span>Built for people</span> who go out.
      </h2>

      <div className="aud-reel">
        <button
          aria-label={isPaused ? "Play the slideshow" : "Pause the slideshow"}
          aria-pressed={isPaused}
          className="aud-tap"
          onClick={() => setIsPaused((paused) => !paused)}
          type="button"
        />
        <div className="aud-track">
          {audiences.map((audience) => (
            <AudienceCard audience={audience} key={audience.title} />
          ))}
          {audiences.map((audience) => (
            <AudienceCard audience={audience} hidden key={`${audience.title}-loop`} />
          ))}
        </div>
      </div>

      <p aria-live="polite" className="aud-hint">
        <span aria-hidden="true" className="aud-hint-dot" />
        {isPaused ? "Paused · tap to play" : "Tap the cards to pause"}
      </p>
    </section>
  )
}
