import { describe, expect, it } from "vitest"
import { demoEvents } from "@/data/events"
import { eventSrcSet } from "./event-image"

const publicPhotos = new Set(
  Object.keys(import.meta.glob("/public/events/*.webp")).map((file) => file.replace(/^\/public/, "")),
)

describe("eventSrcSet", () => {
  it("lists a 640px and 1280px file that exist for every event photo", () => {
    for (const { imageSrc } of demoEvents) {
      const srcSet = eventSrcSet(imageSrc)
      expect(srcSet).toBeDefined()

      for (const entry of srcSet!.split(", ")) {
        const [file] = entry.split(" ")
        expect(publicPhotos.has(file), file).toBe(true)
      }
    }
  })

  it("returns undefined for images that are not event photos", () => {
    expect(eventSrcSet("blob:http://localhost/123")).toBeUndefined()
  })
})
