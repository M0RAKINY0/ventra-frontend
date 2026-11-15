import { EmptyState, ErrorState, Loading, Notice } from "@/components/common"
import { api } from "@/lib/api"
import { amount } from "@/lib/format"
import { useAsync } from "@/lib/use-async"
import type { VentraEvent } from "@/types/api"

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card flex min-w-0 flex-col gap-1.5 p-5">
      <span className="text-sm font-semibold text-ink-soft">{label}</span>
      <span className="font-display text-[clamp(22px,6.5vw,34px)] leading-none [overflow-wrap:anywhere]">{value}</span>
      <span className="text-[13px] text-subtle">{hint}</span>
    </div>
  )
}

/** Reservation totals for one event: tickets, value, orders and check-ins. */
export function SalesPanel({ event }: { event: VentraEvent }) {
  const draft = event.status === "DRAFT"
  const report = useAsync(
    async (signal) => {
      if (draft) return null
      const [summary, checkIns] = await Promise.all([
        api.eventSales(event.id, signal),
        api.listCheckIns(event.id, signal),
      ])
      return { summary, checkedIn: checkIns.length }
    },
    [event.id, draft],
  )

  if (draft) {
    return <EmptyState title="Sales start after you publish." body="Once the event is live, reservations and ticket value show up here." />
  }
  if (report.error) return <ErrorState error={report.error} onRetry={report.reload} />
  if (!report.data) return <Loading label="Loading sales" />

  const { summary, checkedIn } = report.data
  const totalCapacity = summary.ticketTypes.reduce((sum, type) => sum + type.capacity, 0)
  const perOrder = summary.reservationCount === 0 ? 0 : summary.ticketCount / summary.reservationCount

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Stat label="Tickets reserved" value={summary.ticketCount.toLocaleString()} hint={`of ${totalCapacity.toLocaleString()}`} />
        <Stat
          label="Ticket value"
          value={Number(summary.reservedValue).toLocaleString("en-NG", { maximumFractionDigits: 2 })}
          hint={summary.currency}
        />
        <Stat
          label="Orders"
          value={summary.reservationCount.toLocaleString()}
          hint={summary.reservationCount === 0 ? "None yet" : `${perOrder.toFixed(1)} tickets each`}
        />
        <Stat label="Checked in" value={checkedIn.toLocaleString()} hint={`of ${summary.ticketCount.toLocaleString()}`} />
      </div>

      <Notice tone="info">
        Ticket value adds up the price of every reserved ticket. Ventra doesn't take payments yet, so this isn't money
        collected.
      </Notice>

      <section aria-labelledby="sales-types-title" className="card flex flex-col gap-5 p-5 md:p-6">
        <h2 id="sales-types-title" className="m-0 text-[22px]">
          By ticket type
        </h2>
        {summary.ticketTypes.length === 0 ? (
          <p className="m-0 text-subtle">This event has no ticket types.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-5 p-0">
            {summary.ticketTypes.map((type) => {
              const percent = type.capacity === 0 ? 0 : Math.min(100, Math.round((type.ticketCount / type.capacity) * 100))
              return (
                <li key={type.id} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="font-bold">{type.name}</span>
                    <span className="font-bold">
                      {type.ticketCount} of {type.capacity} · {amount(type.reservedValue, summary.currency)}
                    </span>
                  </div>
                  <span aria-hidden="true" className="block h-2 overflow-hidden rounded-full bg-paper-deep">
                    <span className="block h-full rounded-full bg-ink" style={{ width: `${percent}%` }} />
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
