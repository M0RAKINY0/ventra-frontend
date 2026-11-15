import { LogOut } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Container, FieldLabel, Notice, PasswordInput, Sheet, StatusPill } from "@/components/common"
import { PhotoHero } from "@/components/shell"
import { auth } from "@/lib/auth"
import { errorMessage, initials } from "@/lib/format"
import { Link, useRouter } from "@/lib/router"
import { useSession } from "@/lib/session"
import type { User } from "@/types/api"

/** Name, password and sign out for the signed-in person. */
export function AccountPage() {
  const { user } = useSession()
  // RequireAuth guarantees a user before this renders.
  if (!user) return null

  return (
    <div className="min-h-screen bg-paper">
      <PhotoHero image="/events/ceramics-club.webp" minHeight="min-h-[360px] md:min-h-[400px]">
        <Container className="flex flex-col gap-2">
          <span className="font-semibold text-white/85">Account</span>
          <h1 className="m-0 font-display text-[clamp(34px,5vw,60px)] leading-none tracking-tight">Your profile</h1>
        </Container>
      </PhotoHero>

      <Sheet>
        <Container className="pt-7 md:pt-9">
          <div className="flex flex-wrap items-start gap-7">
            <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-5">
              <DetailsForm user={user} />
              <PasswordForm />
            </div>
            <SignedInCard user={user} />
          </div>
        </Container>
      </Sheet>
    </div>
  )
}

function DetailsForm({ user }: { user: User }) {
  const { refresh } = useSession()
  const [name, setName] = useState(user.name)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const next = name.trim()
    if (!next) return setError("Add your name.")
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      await auth.updateName(next)
      await refresh()
      setSaved(true)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card flex flex-col gap-4 p-5 md:p-6" onSubmit={submit} noValidate>
      <h2 className="m-0 text-[22px]">Your details</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="account-name">Full name</FieldLabel>
          <input
            id="account-name"
            className="field"
            autoComplete="name"
            maxLength={200}
            value={name}
            onChange={(change) => {
              setName(change.target.value)
              setSaved(false)
            }}
            aria-describedby="account-name-hint"
          />
          <span id="account-name-hint" className="text-[13px] text-subtle">
            Shown as the host on your event pages.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="account-email">Email</FieldLabel>
          <input id="account-email" className="field" type="email" value={user.email} disabled aria-describedby="account-email-hint" />
          <span id="account-email-hint" className="text-[13px] text-subtle">
            Your tickets go here. It can't be changed yet.
          </span>
        </div>
      </div>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {saved ? <Notice tone="success">Saved.</Notice> : null}
      <div className="flex justify-end">
        <button type="submit" className="pill pill-dark w-full sm:w-auto" disabled={busy || name.trim() === user.name}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  )
}

function PasswordForm() {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [changed, setChanged] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setChanged(false)
    try {
      await auth.changePassword(current, next)
      setCurrent("")
      setNext("")
      setChanged(true)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card flex flex-col gap-4 p-5 md:p-6" onSubmit={submit}>
      <h2 className="m-0 text-[22px]">Password</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="account-current">Current password</FieldLabel>
          <PasswordInput id="account-current" value={current} onChange={setCurrent} autoComplete="current-password" />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="account-new">New password</FieldLabel>
          <PasswordInput
            id="account-new"
            value={next}
            onChange={setNext}
            autoComplete="new-password"
            describedBy="account-new-hint"
          />
          <span id="account-new-hint" className="text-[13px] text-subtle">
            At least 8 characters.
          </span>
        </div>
      </div>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {changed ? <Notice tone="success">Password changed. Your other devices were signed out.</Notice> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/forgot-password" className="inline-flex min-h-11 items-center font-semibold text-cobalt">
          Forgot it?
        </Link>
        <button type="submit" className="pill pill-soft w-full sm:w-auto" disabled={busy}>
          {busy ? "Changing…" : "Change password"}
        </button>
      </div>
      <p className="m-0 text-[13px] text-subtle">
        Signed up with Google? There's no Ventra password to change. Keep using Continue with Google.
      </p>
    </form>
  )
}

function SignedInCard({ user }: { user: User }) {
  const { signOut } = useSession()
  const { navigate } = useRouter()

  return (
    <aside aria-labelledby="signed-in-title" className="card flex min-w-0 flex-[1_1_300px] flex-col gap-4 p-6">
      <h2 id="signed-in-title" className="m-0 text-[17px]">
        Signed in as
      </h2>
      <div className="flex items-center gap-3.5">
        <span className="flex size-14 flex-none items-center justify-center rounded-full bg-ink font-bold text-cream">
          {initials(user.name)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-bold">{user.name}</span>
          <span className="truncate text-sm text-subtle">{user.email}</span>
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {user.emailVerified ? <StatusPill tone="ready">Email verified</StatusPill> : null}
        {user.role === "ADMIN" ? <StatusPill tone="admin">Admin</StatusPill> : null}
      </div>
      <button
        type="button"
        className="pill pill-soft w-full"
        onClick={async () => {
          await signOut()
          navigate("/")
        }}
      >
        <LogOut aria-hidden="true" size={16} />
        Sign out
      </button>
      <p className="m-0 text-[13px] text-subtle">
        Signing out keeps your tickets. They stay in your email and under My tickets.
      </p>
    </aside>
  )
}
