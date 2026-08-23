import { ArrowLeft, ArrowUpRight, Route } from "lucide-react"
import { useState } from "react"

type LoginPageProps = {
  onBack: () => void
}

export function LoginPage({ onBack }: LoginPageProps) {
  const [submitted, setSubmitted] = useState(false)

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
        <section aria-labelledby="login-title" className="login-panel">
          <p className="eyebrow">Your plans, together</p>
          <h1 id="login-title">Log in to keep your spot.</h1>
          <p className="login-intro">
            Sign in to keep your plans together and reserve the next one in a few taps.
          </p>
          <form
            className="login-form"
            onSubmit={(submitEvent) => {
              submitEvent.preventDefault()
              setSubmitted(true)
            }}
          >
            <label className="login-field" htmlFor="login-email">
              Email address
              <input autoComplete="email" id="login-email" required type="email" />
            </label>
            <label className="login-field" htmlFor="login-password">
              Password
              <input autoComplete="current-password" id="login-password" required type="password" />
            </label>
            <button className="primary-button login-submit" type="submit">
              Continue to your plans <ArrowUpRight aria-hidden="true" size={16} />
            </button>
          </form>
          {submitted ? (
            <p className="login-status" role="status">
              Login is not connected in this demo yet, but your plan is still here.
            </p>
          ) : null}
          <button className="secondary-button login-return" onClick={onBack} type="button">
            Keep browsing <ArrowLeft aria-hidden="true" size={16} />
          </button>
        </section>
      </main>
    </div>
  )
}
