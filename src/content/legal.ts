// Text for /terms and /privacy. Each body below is a note on what the section
// has to cover, not legal text. Replace the bodies, set `updated`, and set
// `draft` to false. The pages show a draft warning until then.

export type LegalSection = { id: string; title: string; body: string }

export type LegalDocument = {
  title: string
  /** For example "15 November 2026". Hidden while null. */
  updated: string | null
  draft: boolean
  sections: LegalSection[]
}

export const TERMS: LegalDocument = {
  title: "Terms of service",
  updated: null,
  draft: true,
  sections: [
    {
      id: "tickets",
      title: "Reserving tickets",
      body: "To be written: who the buyer's agreement is with, what a ticket entitles them to, and how guest reservations work without an account.",
    },
    {
      id: "cancellations",
      title: "Refunds and cancelled events",
      body: "To be written: the refund policy, and what happens to tickets when an organizer cancels.",
    },
    {
      id: "organizers",
      title: "Running events as an organizer",
      body: "To be written: what organizers may list, fees, who holds ticket money, and payout timing.",
    },
    {
      id: "account",
      title: "Your account",
      body: "To be written: account rules, and when Ventra can suspend an account or remove an event.",
    },
    {
      id: "contact",
      title: "Contact",
      body: "To be written: where questions about these terms go.",
    },
  ],
}

export const PRIVACY: LegalDocument = {
  title: "Privacy policy",
  updated: null,
  draft: true,
  sections: [
    {
      id: "collect",
      title: "What we collect",
      body: "To be written: names and emails from guests and account holders, event details from organizers, and check-in records.",
    },
    {
      id: "use",
      title: "How we use it",
      body: "To be written: sending tickets and account emails, running check-in, and showing organizers who reserved.",
    },
    {
      id: "sharing",
      title: "Who sees it",
      body: "To be written: what organizers see about their attendees, and which providers handle email and sign-in.",
    },
    {
      id: "retention",
      title: "How long we keep it",
      body: "To be written: how long reservations, tickets and accounts stay on record.",
    },
    {
      id: "choices",
      title: "Your choices",
      body: "To be written: how to see, correct or delete your data.",
    },
    {
      id: "contact",
      title: "Contact",
      body: "To be written: where privacy questions go.",
    },
  ],
}
