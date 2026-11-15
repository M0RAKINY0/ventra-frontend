import { useState, type FormEvent } from "react"
import { FieldLabel, Notice } from "@/components/common"
import { api } from "@/lib/api"
import { errorMessage } from "@/lib/format"
import { Link } from "@/lib/router"
import { useSession } from "@/lib/session"
import { AuthLayout } from "@/pages/AuthPages"

/**
 * Resends ticket links to a guest who lost the email. The page says the same
 * thing for every address, so it can't be used to check who bought a ticket.
 */
export function FindTicketsPage() {
  const { user } = useSession()
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setSent(false)
    try {
      await api.recoverTickets(email.trim())
      setSent(true)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      image="/events/street-sessions.webp"
      headline="Get your tickets back."
      sub="Lost the email? Tell us where we sent it and we'll send the links again."
    >
      <p className="m-0 leading-relaxed text-ink-soft">
        Enter the email you reserved with. We send a link for every reservation under it.
      </p>
      <form className="flex flex-col gap-3.5" onSubmit={submit}>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="find-email">Email</FieldLabel>
          <input
            id="find-email"
            className="field"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(change) => setEmail(change.target.value)}
            placeholder="you@example.com"
          />
        </div>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {sent ? (
          <Notice tone="success">
            If that email has tickets, the links are on their way. Check your inbox and your spam folder.
          </Notice>
        ) : null}
        <button type="submit" className="pill pill-dark w-full" disabled={busy}>
          {busy ? "Sending…" : sent ? "Send again" : "Email my tickets"}
        </button>
      </form>
      <div className="flex items-center gap-3 text-[13px] text-subtle">
        <span className="h-px flex-1 bg-line-strong" />
        or
        <span className="h-px flex-1 bg-line-strong" />
      </div>
      <Link
        to={user ? "/tickets" : "/login?next=%2Ftickets"}
        className="pill w-full border border-line-strong bg-white text-ink hover:border-ink"
      >
        {user ? "Open My tickets" : "Log in to see My tickets"}
      </Link>
      <p className="m-0 text-center text-xs leading-relaxed text-subtle">
        We never show tickets on this page. They only go to the email that reserved them.
      </p>
    </AuthLayout>
  )
}
