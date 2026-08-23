import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AnimatedEventHero } from "@/components/events/AnimatedEventHero"
import { demoEvents } from "@/data/events"

describe("AnimatedEventHero", () => {
  it("does not expose an event category in the hero metadata", () => {
    render(
      <AnimatedEventHero
        activeEventId={demoEvents[0].id}
        autoplay={false}
        events={[demoEvents[0]]}
        onActiveChange={vi.fn()}
        onOpen={vi.fn()}
      />,
    )

    expect(screen.queryByText("Markets / Lagos")).toBeNull()
    expect(screen.getByText("Lagos")).not.toBeNull()
  })
})
