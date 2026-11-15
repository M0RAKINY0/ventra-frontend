import { Eye, EyeOff } from "lucide-react"
import { useState, type FormEvent, type ReactNode } from "react"
import { Container, FieldLabel, Notice } from "@/components/common"
import { ApiError } from "@/lib/api"
import { auth, getPendingEmail } from "@/lib/auth"
import { errorMessage } from "@/lib/format"
import { Link, useRouter } from "@/lib/router"
import { useSession } from "@/lib/session"

/** Only same-site paths, so a crafted ?next= can't send people off-site. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/events"
  return value
}

/** Full-screen photo with a headline on it and a form panel. Shared by every signed-out form page. */
export function AuthLayout({ image, headline, sub, children }: { image: string; headline: string; sub: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-ink">
      <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,16,14,0.55),rgba(10,16,14,0.25)_35%,rgba(10,16,14,0.8))] md:bg-[linear-gradient(to_right,rgba(10,16,14,0.82),rgba(10,16,14,0.35)_55%,rgba(10,16,14,0.55))]"
      />
      <Container className="on-photo relative flex items-center justify-between py-4 md:py-5">
        <Link to="/" className="flex min-h-11 items-center font-display text-2xl text-white no-underline">
          Ventra
        </Link>
        <Link to="/events" className="glass inline-flex min-h-11 items-center rounded-full px-4 font-semibold text-white no-underline">
          Browse events
        </Link>
      </Container>
      <Container className="relative flex flex-1 flex-wrap items-end justify-between gap-8 px-0 pb-0 sm:px-6 md:items-center md:pb-12 lg:px-10">
        <div className="on-photo flex max-w-2xl flex-[1_1_420px] flex-col gap-3 px-5 pt-10 text-white sm:px-0 md:gap-4">
          <h1 className="m-0 font-display text-[clamp(34px,5.5vw,76px)] leading-[0.98] tracking-tight">{headline}</h1>
          <p className="m-0 max-w-md text-base leading-relaxed text-white/85 md:text-lg">{sub}</p>
        </div>
        <main className="flex w-full min-w-0 flex-col gap-4 rounded-t-[30px] bg-[rgba(244,246,242,0.95)] p-6 backdrop-blur-xl md:w-auto md:flex-[0_1_460px] md:rounded-[32px] md:p-8 md:shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
          {children}
        </main>
      </Container>
    </div>
  )
}

function GoogleButton({ next }: { next: string }) {
  const [error, setError] = useState<string | null>(null)
  return (
    <>
      <button
        type="button"
        className="pill w-full border border-line-strong bg-white text-ink hover:border-ink"
        onClick={async () => {
          setError(null)
          try {
            await auth.signInWithGoogle(next)
          } catch (caught) {
            setError(errorMessage(caught))
          }
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
          <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9z" />
          <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
        </svg>
        Continue with Google
      </button>
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </>
  )
}

export function LoginPage() {
  const { search, navigate } = useRouter()
  const { refresh } = useSession()
  const next = safeNext(search.get("next"))
  const [mode, setMode] = useState<"in" | "up">(search.get("mode") === "signup" ? "up" : "in")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const verified = search.get("verified") === "1"
  const passwordReset = search.get("reset") === "1"

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === "up") {
        await auth.signUp(name.trim(), email.trim(), password)
        navigate(`/verify?email=${encodeURIComponent(email.trim())}&next=${encodeURIComponent(next)}`)
        return
      }
      await auth.signIn(email.trim(), password)
      await refresh()
      navigate(next, { replace: true })
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "EMAIL_NOT_VERIFIED") {
        try {
          await auth.resendCode(email.trim())
        } catch {
          // The verify page offers "send a new code" if this one didn't go out.
        }
        navigate(`/verify?email=${encodeURIComponent(email.trim())}&next=${encodeURIComponent(next)}`)
        return
      }
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      image="/events/night-market.webp"
      headline={mode === "in" ? "Keep your next plan close." : "Make room for a good plan."}
      sub={
        mode === "in"
          ? "Log in to reserve spots and keep your tickets ready for the door."
          : "Create an account. We'll email you a code to confirm it's you."
      }
    >
      <div role="group" aria-label="Account mode" className="segmented">
        <button type="button" aria-pressed={mode === "in"} onClick={() => setMode("in")}>
          Log in
        </button>
        <button type="button" aria-pressed={mode === "up"} onClick={() => setMode("up")}>
          Sign up
        </button>
      </div>
      {verified ? <Notice tone="success">Email confirmed. Log in to continue.</Notice> : null}
      {passwordReset ? <Notice tone="success">Password changed. Log in with the new one.</Notice> : null}
      <form className="flex flex-col gap-3.5" onSubmit={submit}>
        {mode === "up" ? (
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="auth-name">Full name</FieldLabel>
            <input
              id="auth-name"
              className="field"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="auth-email">Email</FieldLabel>
          <input
            id="auth-email"
            className="field"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="auth-password">Password</FieldLabel>
          <div className="field flex items-center gap-2 py-0 pr-1.5 focus-within:border-ink">
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby={mode === "up" ? "auth-password-hint" : undefined}
              className="min-h-12 min-w-0 flex-1 border-0 bg-transparent outline-none"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
              className="flex size-11 items-center justify-center rounded-xl border-0 bg-transparent text-subtle hover:text-ink"
            >
              {showPassword ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
            </button>
          </div>
          {mode === "up" ? (
            <span id="auth-password-hint" className="text-[13px] text-subtle">
              At least 8 characters.
            </span>
          ) : (
            <Link
              to={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
              className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-cobalt"
            >
              Forgot password?
            </Link>
          )}
        </div>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <button type="submit" className="pill pill-dark mt-1 w-full" disabled={busy}>
          {busy ? "One moment…" : mode === "in" ? "Log in" : "Create account"}
        </button>
      </form>
      <div className="flex items-center gap-3 text-[13px] text-subtle">
        <span className="h-px flex-1 bg-line-strong" />
        or
        <span className="h-px flex-1 bg-line-strong" />
      </div>
      <GoogleButton next={next} />
      <p className="m-0 text-center text-xs leading-relaxed text-subtle">
        By continuing you agree to Ventra's{" "}
        <Link to="/terms" className="font-semibold text-ink">
          Terms
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="font-semibold text-ink">
          Privacy policy
        </Link>
        .
      </p>
    </AuthLayout>
  )
}

export function VerifyPage() {
  const { search, navigate } = useRouter()
  const { refresh } = useSession()
  const email = search.get("email") ?? getPendingEmail() ?? ""
  const next = safeNext(search.get("next"))
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { signedIn } = await auth.verifyEmail(email, code)
      if (signedIn) {
        await refresh()
        navigate(next, { replace: true })
      } else {
        navigate(`/login?verified=1&next=${encodeURIComponent(next)}`, { replace: true })
      }
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setError(null)
    setSent(false)
    try {
      await auth.resendCode(email)
      setSent(true)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <AuthLayout image="/events/street-sessions.webp" headline="Almost there." sub="Confirm your email to finish signing up.">
      {email ? (
        <>
          <p className="m-0 leading-relaxed text-ink-soft">
            We sent a 6-digit code to <strong className="text-ink">{email}</strong>. It expires after 5 minutes.
          </p>
          <form className="flex flex-col gap-3.5" onSubmit={submit}>
            <FieldLabel htmlFor="verify-code">Verification code</FieldLabel>
            <input
              id="verify-code"
              className="field text-center font-mono text-[28px] tracking-[0.5em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              aria-invalid={error ? true : undefined}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
            />
            {error ? <Notice tone="danger">{error}</Notice> : null}
            {sent ? <Notice tone="success">New code sent. Older codes no longer work.</Notice> : null}
            <button type="submit" className="pill pill-dark w-full" disabled={busy || code.length !== 6}>
              {busy ? "Checking…" : "Verify email"}
            </button>
          </form>
          <div className="flex flex-wrap items-center justify-center gap-1 text-[15px] text-subtle">
            <span>No email?</span>
            <button type="button" className="min-h-11 border-0 bg-transparent px-1.5 font-bold text-ink underline" onClick={resend}>
              Send a new code
            </button>
          </div>
        </>
      ) : (
        <Notice tone="info">Start from sign up so we know which email to verify.</Notice>
      )}
      <Link to="/login?mode=signup" className="self-center font-semibold text-cobalt">
        Use a different email
      </Link>
    </AuthLayout>
  )
}
