import { Container, Notice, Sheet } from "@/components/common"
import { PhotoHero } from "@/components/shell"
import { PRIVACY, TERMS, type LegalDocument } from "@/content/legal"
import { Link } from "@/lib/router"

function LegalLayout({ document, current }: { document: LegalDocument; current: "terms" | "privacy" }) {
  return (
    <div className="min-h-screen bg-paper">
      <PhotoHero image="/events/sketch-walk.webp" minHeight="min-h-[340px] md:min-h-[380px]">
        <Container className="flex flex-col gap-2">
          {document.updated ? <span className="font-semibold text-white/85">Last updated {document.updated}</span> : null}
          <h1 className="m-0 font-display text-[clamp(34px,5vw,60px)] leading-none tracking-tight">{document.title}</h1>
        </Container>
      </PhotoHero>

      <Sheet>
        <Container className="pt-7 md:pt-9">
          <div className="flex flex-wrap items-start gap-8 lg:gap-10">
            <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-7">
              <nav aria-label="Legal pages" className="segmented self-stretch sm:self-start">
                <Link to="/terms" aria-current={current === "terms" ? "page" : undefined}>
                  Terms
                </Link>
                <Link to="/privacy" aria-current={current === "privacy" ? "page" : undefined}>
                  Privacy
                </Link>
              </nav>
              {document.draft ? <Notice tone="info">Draft. This page doesn't have its final legal text yet.</Notice> : null}
              <article className="flex max-w-3xl flex-col gap-8">
                {document.sections.map((section) => (
                  <section key={section.id} id={section.id} className="flex scroll-mt-6 flex-col gap-2.5">
                    <h2 className="m-0 text-2xl">{section.title}</h2>
                    <p className="m-0 whitespace-pre-line text-[17px] leading-[1.7] text-ink-soft">{section.body}</p>
                  </section>
                ))}
              </article>
            </div>

            <aside aria-labelledby="legal-contents-title" className="card flex min-w-0 flex-[1_1_280px] flex-col p-6">
              <h2 id="legal-contents-title" className="m-0 mb-2 text-[17px]">
                On this page
              </h2>
              <ul className="m-0 flex list-none flex-col p-0">
                {document.sections.map((section, index) => (
                  <li key={section.id} className={index > 0 ? "border-t border-line" : undefined}>
                    <a href={`#${section.id}`} className="flex min-h-11 items-center font-semibold text-ink-soft no-underline hover:text-ink">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </Container>
      </Sheet>
    </div>
  )
}

export function TermsPage() {
  return <LegalLayout document={TERMS} current="terms" />
}

export function PrivacyPage() {
  return <LegalLayout document={PRIVACY} current="privacy" />
}
