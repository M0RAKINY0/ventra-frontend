import { useState, type FormEvent } from "react"
import { FieldError, FieldLabel, Notice, PasswordInput } from "@/components/common"
import { ApiError } from "@/lib/api"
import { auth } from "@/lib/auth"
import { errorMessage } from "@/lib/format"
import { Link, useRouter } from "@/lib/router"
import { AuthLayout } from "@/pages/AuthPages"

/** Matches the API's reset token lifetime. */
const RESET_LINK_MINUTES = 15

export function ForgotPasswordPage() {
  const { search } = useRouter()
  const [email, setEmail] = useState(search.get("email") ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setSent(false)
    try {
      await auth.requestPasswordReset(email.trim())
      setSent(true)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      image="/events/night-market.webp"
      headline="Forgot your password?"
      sub="We'll email you a link to set a new one. Your tickets stay where they are."
    >
      <p className="m-0 leading-relaxed text-ink-soft">Enter the email on your Ventra account.</p>
      <form className="flex flex-col gap-3.5" onSubmit={submit}>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
          <input
            id="forgot-email"
            className="field"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(change) => setEmail(change.target.value)}
            placeholder="you@example.com"
          />
        </div>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {sent ? (
          <Notice tone="success">
            If an account uses that email, a reset link is on its way. It expires after {RESET_LINK_MINUTES} minutes.
          </Notice>
        ) : null}
        <button type="submit" className="pill pill-dark w-full" disabled={busy}>
          {busy ? "Sending…" : sent ? "Send again" : "Send reset link"}
        </button>
      </form>
      <Notice tone="info">
        <span className="text-sm font-medium">
          Signed up with Google? You don't have a Ventra password. Use Continue with Google on the log in page.
        </span>
      </Notice>
      <Link to="/login" className="inline-flex min-h-11 items-center self-center font-semibold text-cobalt">
        Back to log in
      </Link>
    </AuthLayout>
  )
}

export function ResetPasswordPage() {
  const { search, navigate } = useRouter()
  // The emailed link goes through the API first. It lands here with ?token=,
  // or with ?error=INVALID_TOKEN when the link is old or already used.
  const token = search.get("token")
  const [expired, setExpired] = useState(!token || search.get("error") !== null)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [mismatch, setMismatch] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    if (password !== confirm) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    setBusy(true)
    setError(null)
    try {
      await auth.resetPassword(token, password)
      navigate("/login?reset=1", { replace: true })
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "INVALID_TOKEN") setExpired(true)
      else setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      image="/events/sketch-walk.webp"
      headline="Pick a new password."
      sub="Saving it signs you out on every other device."
    >
      {expired ? (
        <>
          <Notice tone="danger">This reset link has expired or was already used.</Notice>
          <Link to="/forgot-password" className="pill pill-dark w-full">
            Send a new link
          </Link>
        </>
      ) : (
        <form className="flex flex-col gap-3.5" onSubmit={submit}>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="reset-password">New password</FieldLabel>
            <PasswordInput
              id="reset-password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              describedBy="reset-password-hint"
            />
            <span id="reset-password-hint" className="text-[13px] text-subtle">
              At least 8 characters.
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="reset-confirm">Type it again</FieldLabel>
            <PasswordInput
              id="reset-confirm"
              value={confirm}
              onChange={(value) => {
                setConfirm(value)
                setMismatch(false)
              }}
              autoComplete="new-password"
              describedBy={mismatch ? "reset-confirm-error" : undefined}
              invalid={mismatch}
            />
            <FieldError id="reset-confirm-error" message={mismatch ? "These two don't match yet." : undefined} />
          </div>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <button type="submit" className="pill pill-dark mt-1 w-full" disabled={busy}>
            {busy ? "Saving…" : "Save new password"}
          </button>
        </form>
      )}
      <Link to="/login" className="inline-flex min-h-11 items-center self-center font-semibold text-cobalt">
        Back to log in
      </Link>
    </AuthLayout>
  )
}
