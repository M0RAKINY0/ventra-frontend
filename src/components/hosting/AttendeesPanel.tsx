import { Download } from "lucide-react"
import { useState } from "react"
import { EmptyState, ErrorState, Loading, Notice, StatusPill, type Tone } from "@/components/common"
import { api } from "@/lib/api"
import { errorMessage, shortDate, ticketCode, ticketDisplay, time } from "@/lib/format"
import { useAsync } from "@/lib/use-async"
import { cn } from "@/lib/utils"
import type { Attendee, VentraEvent } from "@/types/api"

const PAGE_SIZE = 20

/** A cancelled reservation or a check-in says more than the raw ticket status. */
function attendeeStatus(row: Attendee, event: VentraEvent): { label: string; tone: Tone } {
  if (row.reservation.status === "CANCELLED") return { label: "Cancelled", tone: "void" }
  if (row.checkIn) return { label: "Checked in", tone: "used" }
  return ticketDisplay(row.status, event.status)
}

function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Every ticket for one event, a page at a time, with a CSV export. */
export function AttendeesPanel({ event }: { event: VentraEvent }) {
  const draft = event.status === "DRAFT"
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const attendees = useAsync(
    (signal) => (draft ? Promise.resolve(null) : api.listAttendees(event.id, { page, pageSize: PAGE_SIZE }, signal)),
    [event.id, page, draft],
  )

  async function exportCsv() {
    setExporting(true)
    setExportError(null)
    try {
      saveFile(await api.attendeesCsv(event.id), `attendees-${event.slug || event.id}.csv`)
    } catch (caught) {
      setExportError(errorMessage(caught))
    } finally {
      setExporting(false)
    }
  }

  if (draft) {
    return <EmptyState title="No attendees yet." body="People can reserve once you publish the event." />
  }
  if (attendees.error) return <ErrorState error={attendees.error} onRetry={attendees.reload} />
  if (!attendees.data) return <Loading label="Loading attendees" />

  const { items, total } = attendees.data
  if (total === 0) {
    return <EmptyState title="No one has a ticket yet." body="Share your event link and reservations show up here." />
  }

  const first = (page - 1) * PAGE_SIZE + 1
  const last = Math.min(total, first + items.length - 1)
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-semibold text-ink-soft">
          {total.toLocaleString()} {total === 1 ? "ticket" : "tickets"}
        </span>
        <button type="button" className="pill pill-dark w-full sm:w-auto" disabled={exporting} onClick={exportCsv}>
          <Download aria-hidden="true" size={18} />
          {exporting ? "Preparing…" : "Export CSV"}
        </button>
      </div>
      {exportError ? <Notice tone="danger">{exportError}</Notice> : null}

      <div className={cn("card overflow-x-auto", attendees.loading && "opacity-60")} aria-busy={attendees.loading}>
        <table className="w-full min-w-[720px] border-collapse text-[15px]">
          <caption className="sr-only-safe">Tickets for {event.title}</caption>
          <thead>
            <tr className="text-left text-[13px] text-subtle">
              {["Buyer", "Ticket", "Code", "Reserved", "Status"].map((heading) => (
                <th key={heading} scope="col" className="whitespace-nowrap border-b border-line px-5 py-3.5 font-bold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((row, index) => {
              const status = attendeeStatus(row, event)
              const cell = cn("px-5 py-4 align-middle", index > 0 && "border-t border-line")
              return (
                <tr key={row.id}>
                  <td className={cell}>
                    <span className="flex flex-col">
                      <span className="font-bold">{row.reservation.buyerName}</span>
                      <span className="text-sm text-subtle">{row.reservation.buyerEmail}</span>
                    </span>
                  </td>
                  <td className={cell}>{row.ticketType.name}</td>
                  <td className={cn(cell, "whitespace-nowrap font-mono text-sm font-bold")}>{ticketCode(row.publicId)}</td>
                  <td className={cn(cell, "whitespace-nowrap text-ink-soft")}>
                    {shortDate(row.createdAt, event.timezone)}, {time(row.createdAt, event.timezone)}
                  </td>
                  <td className={cell}>
                    <span className="flex flex-col items-start gap-1">
                      <StatusPill tone={status.tone} className="whitespace-nowrap border border-line">
                        {status.label}
                      </StatusPill>
                      {row.checkIn ? (
                        <span className="whitespace-nowrap text-[13px] text-subtle">
                          {shortDate(row.checkIn.checkedInAt, event.timezone)}, {time(row.checkIn.checkedInAt, event.timezone)}
                        </span>
                      ) : null}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-subtle">
          Showing {first.toLocaleString()} to {last.toLocaleString()} of {total.toLocaleString()}
        </span>
        <div className="flex gap-2.5">
          <button type="button" className="pill pill-soft" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <button type="button" className="pill pill-soft" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      </div>
      <p className="m-0 text-[13px] text-subtle">
        The CSV has one row per ticket: buyer, email, ticket type, status, price and check-in time. It leaves out QR
        codes and ticket links.
      </p>
    </div>
  )
}
