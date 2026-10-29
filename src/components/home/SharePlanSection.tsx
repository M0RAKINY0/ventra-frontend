import { ArrowRight, ImagePlus, X } from "lucide-react"
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react"
import { formatDateInput, formatTimeInput } from "@/lib/event-input-format"
import { validateEventImage } from "@/lib/event-validation"
import type { EventDraft } from "@/types/events"

const CATEGORIES = ["Markets", "Film", "Workshop", "Music + Food", "Walks"]

type Fields = {
  title: string
  category: string
  priceLabel: string
  date: string
  time: string
  venue: string
  city: string
  description: string
}

const emptyFields: Fields = {
  title: "",
  category: CATEGORIES[0],
  priceLabel: "",
  date: "",
  time: "",
  venue: "",
  city: "",
  description: "",
}

type SharePlanSectionProps = {
  onCreate: (draft: EventDraft) => void
}

export function SharePlanSection({ onCreate }: SharePlanSectionProps) {
  const [fields, setFields] = useState<Fields>(emptyFields)
  const [image, setImage] = useState<{ file: File; url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [published, setPublished] = useState(false)
  const imageRef = useRef(image)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    imageRef.current = image
  }, [image])

  useEffect(() => {
    return () => {
      if (imageRef.current) URL.revokeObjectURL(imageRef.current.url)
    }
  }, [])

  const update = (key: keyof Fields) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFields((previous) => ({ ...previous, [key]: event.target.value }))
    setError(null)
    setPublished(false)
  }

  const chooseImage = (file: File | undefined) => {
    if (!file) return
    const validation = validateEventImage(file)
    if (!validation.valid) {
      setError(validation.error)
      return
    }
    if (image) URL.revokeObjectURL(image.url)
    setImage({ file, url: URL.createObjectURL(file) })
    setError(null)
    setPublished(false)
  }

  const removeImage = () => {
    if (image) URL.revokeObjectURL(image.url)
    setImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    chooseImage(event.dataTransfer.files[0])
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const required: Array<[keyof Fields, string]> = [
      ["title", "Add a title."],
      ["date", "Add a date."],
      ["time", "Add a time."],
      ["venue", "Add a venue."],
      ["description", "Add a short description."],
    ]
    const missing = required.find(([key]) => !fields[key].trim())
    if (missing) {
      setError(missing[1])
      return
    }
    if (!image) {
      setError("Add a photo before publishing.")
      return
    }

    onCreate({
      title: fields.title.trim(),
      category: fields.category,
      date: formatDateInput(fields.date),
      time: formatTimeInput(fields.time),
      venue: fields.venue.trim(),
      city: fields.city.trim() || "Lagos",
      description: fields.description.trim(),
      priceLabel: fields.priceLabel.trim() || "Free entry",
      imageFile: image.file,
      imagePreviewUrl: image.url,
    })

    // The new event now owns the preview URL, so only drop our reference to it.
    setImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setFields(emptyFields)
    setError(null)
    setPublished(true)
  }

  return (
    <section aria-labelledby="share-title" className="share" id="create-event">
      <div className="share-inner">
        <div className="share-copy">
          <h2 className="share-heading" id="share-title">
            {"Got a plan? "}
            <br />
            Share it.
          </h2>
          <p className="share-lede">Say what it is, when and where. Add a photo so it stands out in the guide.</p>
        </div>

        <form aria-label="Share a plan" className="share-form" noValidate onSubmit={handleSubmit}>
          <label className="share-field share-full">
            Title
            <input onChange={update("title")} placeholder="e.g. Sunday Sketch Club" type="text" value={fields.title} />
          </label>
          <label className="share-field">
            Category
            <select onChange={update("category")} value={fields.category}>
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="share-field">
            Price
            <input onChange={update("priceLabel")} placeholder="Free entry" type="text" value={fields.priceLabel} />
          </label>
          <label className="share-field">
            Date
            <input onChange={update("date")} type="date" value={fields.date} />
          </label>
          <label className="share-field">
            Time
            <input onChange={update("time")} type="time" value={fields.time} />
          </label>
          <label className="share-field">
            Venue
            <input onChange={update("venue")} placeholder="The name of the place" type="text" value={fields.venue} />
          </label>
          <label className="share-field">
            City
            <input onChange={update("city")} placeholder="Lagos" type="text" value={fields.city} />
          </label>
          <label className="share-field share-full">
            Description
            <textarea
              onChange={update("description")}
              placeholder="What should people know about the feeling of this event?"
              value={fields.description}
            />
          </label>

          {image ? (
            <div className="share-photo share-full">
              <img alt="" className="share-photo-preview" src={image.url} />
              <span className="share-photo-text">
                <span>{image.file.name}</span>
                <span>Looks good. This is what people will see.</span>
              </span>
              <button aria-label="Remove photo" className="share-photo-remove" onClick={removeImage} type="button">
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="share-photo share-full" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
              <span aria-hidden="true" className="share-photo-icon">
                <ImagePlus size={18} />
              </span>
              <span className="share-photo-text">
                <span>Add a photo</span>
                <span>Drop an image here or browse your files</span>
              </span>
              <input
                accept="image/jpeg,image/png,image/webp"
                className="share-photo-input"
                onChange={(event) => chooseImage(event.target.files?.[0])}
                ref={fileInputRef}
                type="file"
              />
            </label>
          )}

          {error ? (
            <p className="share-message share-full" data-tone="error" role="alert">
              {error}
            </p>
          ) : null}
          {published ? (
            <p className="share-message share-full" role="status">
              Your plan is live in the guide.
            </p>
          ) : null}

          <button className="share-submit share-full" type="submit">
            Publish plan <ArrowRight aria-hidden="true" size={16} />
          </button>
        </form>
      </div>
    </section>
  )
}
