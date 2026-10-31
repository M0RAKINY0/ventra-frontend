// Every photo in public/events ships at two widths: name.webp (1280px) and
// name-640.webp (640px). Phones pick the small one through srcset.
const EVENT_PHOTO = /^\/events\/[\w-]+\.webp$/

export function eventSrcSet(src: string): string | undefined {
  if (!EVENT_PHOTO.test(src)) return undefined
  return `${src.replace(/\.webp$/, "-640.webp")} 640w, ${src} 1280w`
}
