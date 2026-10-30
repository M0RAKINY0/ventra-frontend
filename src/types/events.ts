export type Event = {
  id: string
  title: string
  category: string
  date: string
  time: string
  venue: string
  city: string
  description: string
  priceLabel: string
  imageSrc: string
  /** Maximum number of reservations. Unset means no limit. */
  capacity?: number
}
export type EventDraft = Omit<Event, "id" | "imageSrc"> & {
  imageFile: File | null
  imagePreviewUrl: string | null
}

export type HowItWorksStep = {
  id: string
  stepLabel: string
  title: string
  description: string
  imageSrc: string
  imageAlt: string
}
