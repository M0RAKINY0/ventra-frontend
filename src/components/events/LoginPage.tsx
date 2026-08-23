import { ArrowLeft, Route } from "lucide-react"
import { useState, type FormEvent } from "react"
import { AuthForm } from "@/components/auth/AuthForm"
import { AuthVisualPanel } from "@/components/auth/AuthVisualPanel"
import type { AuthMode } from "@/types/auth"
import type { Event } from "@/types/events"

type LoginPageProps = {
  featuredEvent: Event
  onBack: () => void
}

export function LoginPage({ featuredEvent, onBack }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>("sign-in")
  const [status, setStatus] = useState<string | null>(null)

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode)
    setStatus(null)
  }

  const handleDemoSubmit = () => {
    setStatus(mode === "sign-in" ? "You are back in. Your plans are ready." : "Your Ventra account is ready in this demo.")
  }

  const handleSubmit = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()
    handleDemoSubmit()
  }

  return (
    <div className="events-app login-view" id="top">
      <header className="site-header">
        <div className="nav-wrap login-nav">
          <button className="login-back" onClick={onBack} type="button">
            <ArrowLeft aria-hidden="true" size={15} />
            Back to Ventra
          </button>
          <button className="route-brand-lockup login-brand" onClick={onBack} type="button">
            <span aria-hidden="true" className="route-brand-mark">
              <Route size={18} />
            </span>
            <span className="route-brand-name">Ventra</span>
            <span className="route-brand-tag">A city guide</span>
          </button>
        </div>
      </header>

      <main className="login-main">
        <div className="login-layout">
          <section aria-labelledby="auth-form-title" className="auth-form-panel">
            <AuthForm
              mode={mode}
              onBack={onBack}
              onModeChange={handleModeChange}
              onSocialSubmit={handleDemoSubmit}
              onSubmit={handleSubmit}
              status={status}
            />
          </section>
          <AuthVisualPanel event={featuredEvent} />
        </div>
      </main>
    </div>
  )
}
