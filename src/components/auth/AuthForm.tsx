import { ArrowUpRight } from "lucide-react"
import { useState, type FormEvent } from "react"
import type { AuthMode } from "@/types/auth"

type AuthFormProps = {
  mode: AuthMode
  onBack: () => void
  onModeChange: (mode: AuthMode) => void
  onSocialSubmit: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  status: string | null
}

const formCopy = {
  "sign-in": {
    eyebrow: "WELCOME BACK",
    title: "Keep your next plan close.",
    description: "Sign in to save the plans worth making and reserve your next one.",
    submitLabel: "Sign in",
    modePrompt: "New to Ventra?",
    modeAction: "Create an account",
  },
  "sign-up": {
    eyebrow: "MAKE AN ACCOUNT",
    title: "Make room for a good plan.",
    description: "Create a Ventra account and keep the plans that make you want to step out.",
    submitLabel: "Create account",
    modePrompt: "Already have an account?",
    modeAction: "Sign in",
  },
} as const

type AuthFieldName = "name" | "email" | "password"

const fieldErrorCopy: Record<AuthFieldName, string> = {
  name: "Add your name to create an account.",
  email: "Enter a valid email address.",
  password: "Use at least 8 characters for your password.",
}

export function AuthForm({
  mode,
  onBack,
  onModeChange,
  onSocialSubmit,
  onSubmit,
  status,
}: AuthFormProps) {
  const copy = formCopy[mode]
  const nextMode: AuthMode = mode === "sign-in" ? "sign-up" : "sign-in"
  const [invalidFields, setInvalidFields] = useState<Partial<Record<AuthFieldName, boolean>>>({})

  const markInvalid = (field: AuthFieldName) => {
    setInvalidFields((current) => ({ ...current, [field]: true }))
  }

  const clearInvalid = (field: AuthFieldName) => {
    setInvalidFields((current) => (current[field] ? { ...current, [field]: false } : current))
  }

  const handleModeChange = () => {
    setInvalidFields({})
    onModeChange(nextMode)
  }

  return (
    <div className="auth-form-wrap">
      <div className="auth-form-heading">
        <p className="auth-kicker">{copy.eyebrow}</p>
        <h1 id="auth-form-title">{copy.title}</h1>
        <p className="auth-intro">{copy.description}</p>
      </div>

      <div className="auth-mode-switch">
        <span>{copy.modePrompt}</span>
        <button className="auth-mode-action" onClick={handleModeChange} type="button">
          {copy.modeAction}
        </button>
      </div>

      <p className="auth-demo-note">Demo mode: no account or session is created.</p>

      <button className="auth-social-button" onClick={onSocialSubmit} type="button">
        <span aria-hidden="true" className="auth-social-mark">G</span>
        Continue with Google
      </button>

      <div aria-hidden="true" className="auth-divider">
        <span>or continue with email</span>
      </div>

      <form aria-label={mode === "sign-in" ? "Sign in form" : "Create account form"} className="auth-form" onSubmit={onSubmit}>
        {mode === "sign-up" ? (
          <label className="auth-field" data-invalid={invalidFields.name ? "true" : undefined} htmlFor="login-name" key="name">
            <span>Name</span>
            <input
              aria-describedby={invalidFields.name ? "login-name-error" : undefined}
              aria-invalid={invalidFields.name || undefined}
              autoComplete="name"
              id="login-name"
              name="name"
              onInput={() => clearInvalid("name")}
              onInvalid={() => markInvalid("name")}
              required
              type="text"
            />
            {invalidFields.name ? (
              <span className="auth-field-error" id="login-name-error" role="alert">
                {fieldErrorCopy.name}
              </span>
            ) : null}
          </label>
        ) : null}

        <label className="auth-field" data-invalid={invalidFields.email ? "true" : undefined} htmlFor="login-email" key="email">
          <span>Email address</span>
          <input
            aria-describedby={invalidFields.email ? "login-email-error" : undefined}
            aria-invalid={invalidFields.email || undefined}
            autoComplete="email"
            id="login-email"
            name="email"
            onInput={() => clearInvalid("email")}
            onInvalid={() => markInvalid("email")}
            required
            type="email"
          />
          {invalidFields.email ? (
            <span className="auth-field-error" id="login-email-error" role="alert">
              {fieldErrorCopy.email}
            </span>
          ) : null}
        </label>

        <label className="auth-field" data-invalid={invalidFields.password ? "true" : undefined} htmlFor="login-password" key="password">
          <span>Password</span>
          <input
            aria-describedby={invalidFields.password ? "login-password-error" : undefined}
            aria-invalid={invalidFields.password || undefined}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            id="login-password"
            minLength={8}
            name="password"
            onInput={() => clearInvalid("password")}
            onInvalid={() => markInvalid("password")}
            required
            type="password"
          />
          {invalidFields.password ? (
            <span className="auth-field-error" id="login-password-error" role="alert">
              {fieldErrorCopy.password}
            </span>
          ) : null}
        </label>

        <button className="primary-button auth-submit" type="submit">
          {copy.submitLabel}
          <ArrowUpRight aria-hidden="true" size={16} />
        </button>
      </form>

      {status ? (
        <p aria-live="polite" className="auth-status" role="status">
          {status}
        </p>
      ) : null}

      <button className="secondary-button auth-return" onClick={onBack} type="button">
        Keep browsing <ArrowUpRight aria-hidden="true" size={16} />
      </button>
    </div>
  )
}
