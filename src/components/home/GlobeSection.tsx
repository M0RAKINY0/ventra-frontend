import { useEffect, useRef } from "react"
import { createGlobe, decodeLandDots, type GlobeFrame, type GlobeRoute } from "@/lib/globe"
import type { Event } from "@/types/events"

const cities = {
  lagos: { name: "Lagos", lon: 3.38, lat: 6.52 },
  london: { name: "London", lon: -0.13, lat: 51.51 },
  newYork: { name: "New York", lon: -74.0, lat: 40.71 },
  rio: { name: "Rio", lon: -43.17, lat: -22.91 },
}

// Each route lands on one event; the city pairings are illustrative.
const routes: Array<GlobeRoute & { eventId: string; day: string }> = [
  { from: cities.lagos, to: cities.london, eventId: "rooftop-cinema-sunlit", day: "Sat" },
  { from: cities.london, to: cities.newYork, eventId: "street-sessions", day: "Sat" },
  { from: cities.newYork, to: cities.rio, eventId: "night-market-after-dark", day: "Fri" },
  { from: cities.rio, to: cities.lagos, eventId: "clay-after-hours", day: "Sun" },
]

const FLYER_WIDTH = 172
const FLYER_HEIGHT = 170

type GlobeSectionProps = {
  events: Event[]
}

export function GlobeSection({ events }: GlobeSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chipRefs = useRef<Array<HTMLSpanElement | null>>([])
  const flyerRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    const shown = new Set<HTMLElement>()

    const place = (element: HTMLElement | null, on: boolean, x: number, y: number, pop: boolean) => {
      if (!element) return
      element.style.left = `${x}px`
      element.style.top = `${y}px`
      element.style.opacity = on ? "1" : "0"
      if (on && !shown.has(element) && !reduceMotion) {
        const target = (pop ? element.firstElementChild : element) as HTMLElement | null
        target?.animate?.(
          pop
            ? [
                { opacity: 0, transform: "translateY(10px) scale(.5)" },
                { opacity: 1, transform: "translateY(-3px) scale(1.04)", offset: 0.6 },
                { opacity: 1, transform: "none" },
              ]
            : [{ opacity: 0 }, { opacity: 1 }],
          { duration: pop ? 480 : 300, easing: "cubic-bezier(.2,.8,.2,1)" },
        )
      }
      if (on) shown.add(element)
      else shown.delete(element)
    }

    const onFrame = (frame: GlobeFrame) => {
      const size = canvas.clientWidth
      const scale = size < 420 ? 0.744 : 1
      const halfWidth = (FLYER_WIDTH * scale) / 2 + 4
      const flyerX = Math.max(halfWidth, Math.min(size - halfWidth, frame.destination.x))
      const flyerY = Math.max(FLYER_HEIGHT * scale, frame.destination.y)

      routes.forEach((_, index) => {
        const active = index === frame.routeIndex
        place(chipRefs.current[index], active && frame.showStart && frame.start.visible, frame.start.x, frame.start.y, false)
        place(flyerRefs.current[index], active && frame.showDestination && frame.destination.visible, flyerX, flyerY, true)
      })
    }

    let globe: ReturnType<typeof createGlobe> | null = null
    let land: ReturnType<typeof decodeLandDots> = []
    const start = () => {
      if (globe) return
      globe = createGlobe(canvas, { routes, accent: "#8fa7ff", animate: !reduceMotion, onFrame })
      globe.setLand(land)
    }
    const stop = () => {
      globe?.stop()
      globe = null
    }

    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}data/land-dots.json`)
      .then((response) => response.json() as Promise<number[]>)
      .then((pairs) => {
        if (cancelled) return
        land = decodeLandDots(pairs)
        globe?.setLand(land)
      })
      .catch(() => {})

    // Only spend frames while the globe is on screen.
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { rootMargin: "200px" })
    if (observer) observer.observe(canvas)
    else start()

    return () => {
      cancelled = true
      observer?.disconnect()
      stop()
    }
  }, [])

  return (
    <section aria-labelledby="globe-title" className="globe">
      <div className="globe-inner">
        <div className="globe-copy">
          <h2 className="globe-heading" id="globe-title">
            Anywhere
            <br />
            round the
            <br />
            <span>globe!</span>
          </h2>
          <p className="globe-lede">
            Land in a new city and the good plans are already waiting. Hosts post a flyer once, and it lands in the
            guide for anyone nearby.
          </p>
        </div>

        <div aria-hidden="true" className="globe-stage">
          <canvas ref={canvasRef} />
          {routes.map((route, index) => {
            const event = events.find((item) => item.id === route.eventId)
            if (!event) return null

            return (
              <span className="globe-chip" key={`chip-${route.eventId}`} ref={(element) => { chipRefs.current[index] = element }}>
                From {route.from.name}
              </span>
            )
          })}
          {routes.map((route, index) => {
            const event = events.find((item) => item.id === route.eventId)
            if (!event) return null

            return (
              <div className="globe-flyer" key={`flyer-${route.eventId}`} ref={(element) => { flyerRefs.current[index] = element }}>
                <div className="globe-flyer-card">
                  <img alt="" src={event.imageSrc} />
                  <p className="globe-flyer-title">{event.title}</p>
                  <p className="globe-flyer-meta">
                    {route.to.name} · {route.day}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
