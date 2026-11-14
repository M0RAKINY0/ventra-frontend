import { request } from "@/lib/api"

// Better Auth is mounted at /api/v1/auth on the API and uses an HTTP-only
// session cookie. Nothing here stores tokens in browser storage.
const AUTH = "/api/v1/auth"

// Sign-up requires an emailed code before the first sign-in. Keep the
// credentials in memory only, so the verify step can finish signing in.
let pendingCredentials: { email: string; password: string } | null = null

export function getPendingEmail(): string | null {
  return pendingCredentials?.email ?? null
}

export const auth = {
  async signIn(email: string, password: string): Promise<void> {
    await request(`${AUTH}/sign-in/email`, { method: "POST", body: { email, password } })
  },

  async signUp(name: string, email: string, password: string): Promise<void> {
    await request(`${AUTH}/sign-up/email`, { method: "POST", body: { name, email, password } })
    pendingCredentials = { email, password }
  },

  /** Verifies the emailed code, then signs in if the password is still in memory. */
  async verifyEmail(email: string, otp: string): Promise<{ signedIn: boolean }> {
    await request(`${AUTH}/email-otp/verify-email`, { method: "POST", body: { email, otp } })
    const credentials = pendingCredentials?.email === email ? pendingCredentials : null
    pendingCredentials = null
    if (!credentials) return { signedIn: false }
    await auth.signIn(credentials.email, credentials.password)
    return { signedIn: true }
  },

  async resendCode(email: string): Promise<void> {
    await request(`${AUTH}/email-otp/send-verification-otp`, {
      method: "POST",
      body: { email, type: "email-verification" },
    })
  },

  async signInWithGoogle(returnTo = "/"): Promise<void> {
    const callbackURL = new URL(returnTo, window.location.origin).toString()
    const result = await request<{ url?: string }>(`${AUTH}/sign-in/social`, {
      method: "POST",
      body: { provider: "google", callbackURL },
    })
    if (result.url) window.location.assign(result.url)
  },

  async signOut(): Promise<void> {
    await request(`${AUTH}/sign-out`, { method: "POST", body: {} })
  },
}
