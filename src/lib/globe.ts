// Orthographic dotted globe drawn on a canvas. Land dots come from
// public/data/land-dots.json as flat [lat*10, lon*10, ...] pairs.

export type GlobeCity = { name: string; lon: number; lat: number }

export type GlobeRoute = { from: GlobeCity; to: GlobeCity }

export type GlobeFrame = {
  routeIndex: number
  start: { x: number; y: number; visible: boolean }
  destination: { x: number; y: number; visible: boolean }
  showStart: boolean
  showDestination: boolean
}

type Vec3 = [number, number, number]

type PreparedRoute = GlobeRoute & {
  a: Vec3
  b: Vec3
  angle: number
  midLon: number
  midLat: number
}

const DEG = Math.PI / 180
const ROUTE_MS = 4300
const ROTATE_MS = 1200
const DRAW_DELAY_MS = 350
const DRAW_MS = 1100

export function toVector(lon: number, lat: number): Vec3 {
  return [
    Math.cos(lat * DEG) * Math.cos(lon * DEG),
    Math.cos(lat * DEG) * Math.sin(lon * DEG),
    Math.sin(lat * DEG),
  ]
}

export function decodeLandDots(pairs: number[]): Vec3[] {
  const dots: Vec3[] = []
  for (let i = 0; i + 1 < pairs.length; i += 2) {
    dots.push(toVector(pairs[i + 1] / 10, pairs[i] / 10))
  }
  return dots
}

function prepareRoute(route: GlobeRoute): PreparedRoute {
  const a = toVector(route.from.lon, route.from.lat)
  const b = toVector(route.to.lon, route.to.lat)
  const mid: Vec3 = [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
  const length = Math.hypot(...mid)
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))

  return {
    ...route,
    a,
    b,
    angle: Math.acos(dot),
    midLon: Math.atan2(mid[1], mid[0]) / DEG,
    midLat: Math.max(-22, Math.min(32, Math.asin(mid[2] / length) / DEG)),
  }
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

type GlobeOptions = {
  routes: GlobeRoute[]
  accent: string
  animate: boolean
  onFrame: (frame: GlobeFrame) => void
}

export function createGlobe(canvas: HTMLCanvasElement, options: GlobeOptions) {
  const routes = options.routes.map(prepareRoute)
  const view = { lon: routes[0].midLon - 40, lat: 10 }
  let land: Vec3[] = []
  let routeIndex = 0
  let routeStart = performance.now()
  let rotateFrom = { ...view }
  let frameId = 0
  let running = true

  const project = (p: Vec3, height = 1) => {
    const cl = Math.cos(view.lon * DEG)
    const sl = Math.sin(view.lon * DEG)
    const cp = Math.cos(view.lat * DEG)
    const sp = Math.sin(view.lat * DEG)
    const x1 = p[0] * cl + p[1] * sl
    const y1 = -p[0] * sl + p[1] * cl
    const z1 = p[2]
    return { x: y1 * height, y: (-x1 * sp + z1 * cp) * height, depth: (x1 * cp + z1 * sp) * height }
  }

  const draw = (ctx: CanvasRenderingContext2D, size: number, route: PreparedRoute, progress: number, now: number) => {
    const radius = size * 0.4
    const cx = size / 2
    const cy = size / 2
    const toScreen = (q: { x: number; y: number }) => [cx + radius * q.x, cy - radius * q.y] as const

    ctx.clearRect(0, 0, size, size)

    const atmosphere = ctx.createRadialGradient(cx, cy, radius * 0.92, cx, cy, radius * 1.28)
    atmosphere.addColorStop(0, "rgba(120,145,255,0.35)")
    atmosphere.addColorStop(1, "rgba(120,145,255,0)")
    ctx.fillStyle = atmosphere
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 1.28, 0, Math.PI * 2)
    ctx.fill()

    const sphere = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.4, radius * 0.05, cx, cy, radius * 1.05)
    sphere.addColorStop(0, "#1d2d6e")
    sphere.addColorStop(0.55, "#0d1640")
    sphere.addColorStop(1, "#050817")
    ctx.fillStyle = sphere
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.lineWidth = 1
    ctx.strokeStyle = "rgba(143,167,255,0.11)"
    const strokeLine = (points: Vec3[]) => {
      ctx.beginPath()
      let drawing = false
      for (const point of points) {
        const q = project(point)
        if (q.depth > 0) {
          const [x, y] = toScreen(q)
          if (drawing) ctx.lineTo(x, y)
          else ctx.moveTo(x, y)
          drawing = true
        } else {
          drawing = false
        }
      }
      ctx.stroke()
    }
    for (let lon = -180; lon < 180; lon += 30) {
      const points: Vec3[] = []
      for (let lat = -84; lat <= 84; lat += 4) points.push(toVector(lon, lat))
      strokeLine(points)
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const points: Vec3[] = []
      for (let lon = -180; lon <= 180; lon += 4) points.push(toVector(lon, lat))
      strokeLine(points)
    }

    const dotRadius = Math.max(0.9, radius * 0.0074)
    for (const dot of land) {
      const q = project(dot)
      if (q.depth <= 0.02) continue
      const [x, y] = toScreen(q)
      ctx.fillStyle = `rgba(205,215,255,${(0.22 + 0.78 * q.depth).toFixed(3)})`
      ctx.beginPath()
      ctx.arc(x, y, dotRadius * (0.6 + 0.4 * q.depth), 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.strokeStyle = "rgba(165,185,255,0.6)"
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.stroke()

    const pin = (p: Vec3, color: string, pulse: boolean) => {
      const q = project(p)
      if (q.depth <= 0) return
      const [x, y] = toScreen(q)
      if (pulse) {
        const f = (now % 1600) / 1600
        ctx.strokeStyle = color
        ctx.globalAlpha = 1 - f
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x, y, 5 + f * 15, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#050817"
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
    }

    pin(route.a, "#fbfbf9", progress < 1)

    if (progress > 0) {
      ctx.save()
      ctx.strokeStyle = options.accent
      ctx.lineWidth = 2.4
      ctx.lineCap = "round"
      ctx.shadowColor = options.accent
      ctx.shadowBlur = 12
      ctx.beginPath()
      let drawing = false
      let head: readonly [number, number] | null = null
      const sinAngle = Math.sin(route.angle) || 1
      for (let i = 0; i <= 70; i++) {
        const t = (i / 70) * progress
        const w1 = Math.sin((1 - t) * route.angle) / sinAngle
        const w2 = Math.sin(t * route.angle) / sinAngle
        const lift = 1 + Math.sin(Math.PI * t) * (0.1 + (0.28 * route.angle) / Math.PI)
        const q = project(
          [route.a[0] * w1 + route.b[0] * w2, route.a[1] * w1 + route.b[1] * w2, route.a[2] * w1 + route.b[2] * w2],
          lift,
        )
        if (q.depth > 0 || q.x * q.x + q.y * q.y > 1) {
          const point = toScreen(q)
          if (drawing) ctx.lineTo(point[0], point[1])
          else ctx.moveTo(point[0], point[1])
          drawing = true
          head = point
        } else {
          drawing = false
        }
      }
      ctx.stroke()
      if (head && progress < 1) {
        ctx.fillStyle = "#ffffff"
        ctx.shadowBlur = 18
        ctx.beginPath()
        ctx.arc(head[0], head[1], 4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    if (progress >= 1) pin(route.b, options.accent, true)
  }

  const tick = (now: number) => {
    if (!running) return
    frameId = requestAnimationFrame(tick)

    const ctx = canvas.getContext("2d")
    const size = canvas.clientWidth
    if (!ctx || !size) return

    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== Math.round(size * dpr)) {
      canvas.width = Math.round(size * dpr)
      canvas.height = Math.round(size * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    let elapsed: number
    if (options.animate) {
      elapsed = now - routeStart
      if (elapsed > ROUTE_MS) {
        routeIndex = (routeIndex + 1) % routes.length
        routeStart = now
        rotateFrom = { ...view }
        elapsed = 0
      }
    } else {
      routeIndex = 0
      elapsed = 3000
      rotateFrom = { lon: routes[0].midLon, lat: routes[0].midLat }
    }

    const route = routes[routeIndex]
    const turn = easeInOutCubic(Math.min(1, elapsed / ROTATE_MS))
    const lonDelta = ((route.midLon - rotateFrom.lon + 540) % 360) - 180
    view.lon = rotateFrom.lon + lonDelta * turn
    view.lat = rotateFrom.lat + (route.midLat - rotateFrom.lat) * turn
    const progress = Math.max(0, Math.min(1, (elapsed - DRAW_DELAY_MS) / DRAW_MS))

    draw(ctx, size, route, progress, now)

    const radius = size * 0.4
    const start = project(route.a)
    const destination = project(route.b)
    options.onFrame({
      routeIndex,
      start: { x: size / 2 + radius * start.x, y: size / 2 - radius * start.y, visible: start.depth > 0 },
      destination: {
        x: size / 2 + radius * destination.x,
        y: size / 2 - radius * destination.y,
        visible: destination.depth > 0,
      },
      showStart: elapsed > 150 && elapsed < ROUTE_MS - 300,
      showDestination: progress >= 1 && elapsed < ROUTE_MS - 250,
    })
  }

  frameId = requestAnimationFrame(tick)

  return {
    setLand(dots: Vec3[]) {
      land = dots
    },
    stop() {
      running = false
      cancelAnimationFrame(frameId)
    },
  }
}
