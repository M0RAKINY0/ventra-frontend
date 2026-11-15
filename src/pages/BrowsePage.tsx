import { ArrowRight, Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Container, EmptyState, ErrorState, Loading, Sheet } from "@/components/common"
import { SiteHeader } from "@/components/shell"
import { api, type EventQuery } from "@/lib/api"
import { CATEGORIES, CATEGORY_LABELS, coverFor, lowestPrice, shortDate, spotsLeft, time } from "@/lib/format"
import { Link } from "@/lib/router"
import { useAsync } from "@/lib/use-async"
import { cn } from "@/lib/utils"
import type { EventCategory, Paginated, VentraEvent } from "@/types/api"

type When = "any" | "weekend" | "week" | "month"

const WHEN_LABELS: Record<When, string> = {
  any: "Any date",
  weekend: "This weekend",
  week: "Next 7 days",
  month: "Next 30 days",
}

function dateRange(when: When, now = new Date()): Pick<EventQuery, "from" | "to"> {
  if (when === "any") return {}
  const from = new Date(now)
  const to = new Date(now)
  if (when === "weekend") {
    // From now (if it's already Fri to Sun) or the coming Friday, to Sunday night.
    const day = now.getDay()
    const inWeekend = day === 0 || day >= 5
    if (!inWeekend) {
      from.setDate(now.getDate() + (5 - day))
      from.setHours(0, 0, 0, 0)
    }
    to.setDate(now.getDate() + (day === 0 ? 0 : 7 - day))
    to.setHours(23, 59, 59, 999)
  } else {
    to.setDate(now.getDate() + (when === "week" ? 7 : 30))
  }
  return { from: from.toISOString(), to: to.toISOString() }
}

const PAGE_SIZE = 12

export function BrowsePage() {
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [category, setCategory] = useState<EventCategory | "ALL">("ALL")
  const [when, setWhen] = useState<When>("any")
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search.trim()), 300)
    return () => window.clearTimeout(id)
  }, [search])

  // Changing a filter starts again from page 1 without an extra effect.
  const filterKey = `${debounced}|${category}|${when}`
  const [paging, setPaging] = useState({ key: filterKey, page: 1 })
  const page = paging.key === filterKey ? paging.page : 1
  const loaded = useRef<VentraEvent[]>([])

  const featured = useAsync((signal) => api.listEvents({ pageSize: 3 }, signal), [])
  const results = useAsync<Paginated<VentraEvent>>(
    async (signal) => {
      const next = await api.listEvents(
        {
          query: debounced || undefined,
          category: category === "ALL" ? undefined : category,
          ...dateRange(when),
          page,
          pageSize: PAGE_SIZE,
        },
        signal,
      )
      // "Load more" appends the next page to what's already on screen.
      const items = page === 1 ? next.items : [...loaded.current, ...next.items]
      if (!signal.aborted) loaded.current = items
      return { ...next, items }
    },
    [debounced, category, when, page],
  )
  const items = results.data?.items ?? []

  const heroEvents = featured.data?.items ?? []
  const hero = heroEvents[slide] ?? heroEvents[0]
  const total = results.data?.total ?? 0
  const filtered = debounced !== "" || category !== "ALL" || when !== "any"

  return (
    <div className="min-h-screen bg-paper">
      <section aria-label="Featured event" className="relative flex min-h-[560px] flex-col overflow-hidden bg-ink text-white md:min-h-[700px]">
        <img
          src={hero ? coverFor(hero) : "/events/night-market.webp"}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <span aria-hidden="true" className="scrim-hero absolute inset-0" />
        <SiteHeader />
        <Container className="on-photo relative mt-auto flex flex-wrap items-end justify-between gap-8 pb-16 md:pb-24">
          {hero ? (
            <div className="flex max-w-3xl flex-[1_1_520px] flex-col gap-4">
              <span className="glass self-start rounded-full px-3.5 py-1.5 text-sm font-semibold">
                {shortDate(hero.startsAt, hero.timezone)} · {time(hero.startsAt, hero.timezone)} · {hero.venue}
              </span>
              <h1 className="m-0 font-display text-[clamp(36px,6vw,84px)] leading-[0.98] tracking-tight">{hero.title}</h1>
              <p className="m-0 line-clamp-2 max-w-xl text-lg leading-relaxed text-white/85">{hero.description}</p>
              <div className="mt-1 flex flex-wrap items-center gap-4">
                <Link to={`/events/${hero.id}`} className="pill pill-light min-h-[54px] px-7 text-base">
                  See tickets
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
                {lowestPrice(hero) ? <span className="font-bold">{lowestPrice(hero)}</span> : null}
              </div>
            </div>
          ) : (
            <div className="flex max-w-3xl flex-col gap-4">
              <h1 className="m-0 font-display text-[clamp(36px,6vw,84px)] leading-[0.98] tracking-tight">
                Find a plan you will be glad you made.
              </h1>
              <p className="m-0 max-w-xl text-lg text-white/85">
                {featured.loading ? "Loading what's on…" : "Nothing is listed yet. Check back soon, or host the first event."}
              </p>
            </div>
          )}
          {heroEvents.length > 1 ? (
            <div role="group" aria-label="Featured events" className="flex gap-2 md:flex-col">
              {heroEvents.map((event, index) => (
                <button
                  key={event.id}
                  type="button"
                  aria-pressed={index === slide}
                  aria-label={`Show ${event.title}`}
                  onClick={() => setSlide(index)}
                  className={cn(
                    "glass flex items-center gap-3 rounded-2xl p-2 text-left md:w-64 md:pr-4",
                    index === slide && "bg-white/90 text-ink",
                  )}
                >
                  <img src={coverFor(event)} alt="" className="size-11 flex-none rounded-xl object-cover md:size-12" />
                  <span className="hidden min-w-0 flex-col md:flex">
                    <span className="truncate text-sm font-bold">{event.title}</span>
                    <span className="text-xs opacity-80">{shortDate(event.startsAt, event.timezone)}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </Container>
      </section>

      <Sheet>
        <Container className="flex flex-col gap-6 pt-7 md:gap-7 md:pt-9">
          <form role="search" onSubmit={(event) => event.preventDefault()} className="card flex flex-wrap overflow-hidden rounded-[22px]">
            <div className="flex min-h-[60px] flex-[1_1_320px] items-center gap-3 px-5">
              <Search aria-hidden="true" size={21} className="text-subtle" />
              <label htmlFor="browse-search" className="sr-only-safe">
                Search events
              </label>
              <input
                id="browse-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search events, venues or organizers"
                className="min-w-0 flex-1 border-0 bg-transparent text-[17px] outline-none"
              />
            </div>
            <label htmlFor="browse-when" className="sr-only-safe">
              When
            </label>
            <select
              id="browse-when"
              value={when}
              onChange={(event) => setWhen(event.target.value as When)}
              className="min-h-[60px] flex-[1_1_160px] border-0 border-t border-line bg-transparent px-4 font-semibold sm:flex-none sm:border-l sm:border-t-0"
            >
              {(Object.keys(WHEN_LABELS) as When[]).map((key) => (
                <option key={key} value={key}>
                  {WHEN_LABELS[key]}
                </option>
              ))}
            </select>
          </form>

          <div role="group" aria-label="Category" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {(["ALL", ...CATEGORIES] as const).map((key) => (
              <button
                key={key}
                type="button"
                className="chip flex-none"
                aria-pressed={category === key}
                onClick={() => setCategory(key)}
              >
                {key === "ALL" ? "All" : CATEGORY_LABELS[key]}
              </button>
            ))}
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <h2 className="m-0 font-display text-2xl tracking-tight md:text-3xl">Coming up</h2>
            {results.data ? (
              <span className="text-subtle">{total === 1 ? "1 event" : `${total} events`}</span>
            ) : null}
          </div>

          {results.error && items.length === 0 ? (
            <ErrorState error={results.error} onRetry={results.reload} />
          ) : results.loading && items.length === 0 ? (
            <Loading label="Finding events" />
          ) : items.length === 0 ? (
            <EmptyState
              title={filtered ? "Nothing matches that yet." : "No events listed yet."}
              body={filtered ? "Try another word, category or date." : "Published events show up here as soon as they go live."}
              action={
                filtered ? (
                  <button
                    type="button"
                    className="chip"
                    onClick={() => {
                      setSearch("")
                      setCategory("ALL")
                      setWhen("any")
                    }}
                  >
                    Clear filters
                  </button>
                ) : null
              }
            />
          ) : (
            <>
              <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,270px),1fr))] gap-4 p-0 md:gap-5">
                {items.map((event) => (
                  <li key={event.id}>
                    <EventTile event={event} />
                  </li>
                ))}
              </ul>
              {items.length < total ? (
                <button
                  type="button"
                  className="pill pill-soft self-center"
                  disabled={results.loading}
                  onClick={() => setPaging({ key: filterKey, page: page + 1 })}
                >
                  {results.loading ? "Loading…" : "Load more events"}
                </button>
              ) : null}
            </>
          )}
        </Container>
      </Sheet>
    </div>
  )
}

function EventTile({ event }: { event: VentraEvent }) {
  const left = spotsLeft(event)
  const price = lowestPrice(event)
  const soldOut = event.ticketTypes.length > 0 && left === 0

  return (
    <Link
      to={`/events/${event.id}`}
      className="group relative block aspect-[4/3] overflow-hidden rounded-[26px] bg-ink text-white no-underline md:aspect-[3/4]"
    >
      <img
        src={coverFor(event)}
        alt=""
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span aria-hidden="true" className="scrim-bottom absolute inset-0" />
      <span className="glass absolute left-3.5 top-3.5 rounded-full px-3 py-1.5 text-[13px] font-bold">
        {shortDate(event.startsAt, event.timezone)}
      </span>
      {soldOut ? (
        <span className="absolute right-3.5 top-3.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-ink">
          Sold out
        </span>
      ) : left > 0 && left <= 12 ? (
        <span className="absolute right-3.5 top-3.5 rounded-full bg-tangerine px-3 py-1.5 text-[13px] font-bold text-ink">
          {left} left
        </span>
      ) : null}
      <span className="absolute inset-x-[18px] bottom-[18px] flex flex-col gap-1">
        <span className="text-xl font-bold leading-tight">{event.title}</span>
        <span className="text-sm text-white/85">
          {event.venue}
          {price ? ` · ${price}` : ""}
        </span>
      </span>
    </Link>
  )
}
