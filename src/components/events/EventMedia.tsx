import { eventSrcSet } from "@/lib/event-image"

type EventMediaProps = {
  src: string
  alt: string
  className?: string
}
export function EventMedia({ src, alt, className = "" }: EventMediaProps) {
  return (
    <img
      alt={alt}
      className={`event-media-image ${className}`}
      decoding="async"
      height={640}
      loading="lazy"
      sizes="(max-width: 768px) 100vw, 50vw"
      src={src}
      srcSet={eventSrcSet(src)}
      width={860}
    />
  )
}
