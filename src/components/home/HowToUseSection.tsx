import { Check, CircleCheck, ScanLine, Ticket } from "lucide-react"
import { TICKET_QR_PATH, TICKET_QR_SIZE } from "@/components/home/ticket-qr"

const steps = [
  { title: "Discover", detail: "Find a plan that fits your day." },
  { title: "Details", detail: "Time, place and price, all in one view." },
  { title: "Reserve", detail: "Save your spot and get a QR ticket for the door." },
  { title: "Create", detail: "Put your own plan on the map." },
]

export function HowToUseSection() {
  return (
    <section aria-labelledby="use-title" className="use" id="how-it-works">
      <div className="use-inner">
        <div aria-hidden="true" className="use-panel">
          <div className="use-phone">
            <div className="use-screen">
              <span className="use-island" />
              <p className="use-screen-title">Your ticket</p>
              <div className="use-ticket">
                <div className="use-ticket-event">
                  <span className="use-reserved">
                    <Check size={11} strokeWidth={3} />
                    Reserved
                  </span>
                  <p className="use-ticket-name">Night Market After Dark</p>
                  <p className="use-ticket-meta">
                    Fri 28 Aug · 6:30 PM
                    <br />
                    Harbor Square, Lagos
                  </p>
                </div>
                <div className="use-tear" />
                <div className="use-qr-block">
                  <div className="use-qr">
                    <svg
                      height="144"
                      shapeRendering="crispEdges"
                      viewBox={`0 0 ${TICKET_QR_SIZE} ${TICKET_QR_SIZE}`}
                      width="144"
                    >
                      <path d={TICKET_QR_PATH} fill="#111110" />
                    </svg>
                    <span className="use-scan" />
                  </div>
                  <p className="use-ticket-code">A1F4 · ADMIT 1</p>
                </div>
              </div>
              <p className="use-door">
                <ScanLine size={14} />
                Show this at the door
              </p>
            </div>
          </div>

          <div className="use-admit">
            <div className="use-admit-card">
              <span className="use-admit-icon">
                <Ticket size={20} />
              </span>
              <span className="use-admit-text">
                <span>Night Market</span>
                <span>Spot reserved</span>
              </span>
              <span className="use-admit-count">Admit 1</span>
              <span className="use-admit-dot" />
            </div>
          </div>
        </div>

        <div className="use-copy">
          <h2 className="use-heading" id="use-title">
            How to use Ventra.
          </h2>
          <span aria-hidden="true" className="use-rule" />
          <p className="use-lede">
            Ventra keeps going out simple. Browse what's on, check the details that matter, and save your spot. When
            you have a plan of your own, post it and it shows up in the guide straight away.
          </p>
          <ol className="use-steps">
            {steps.map((step, index) => (
              <li className="use-step" key={step.title} style={{ animationDelay: `${0.1 + index * 0.12}s` }}>
                <CircleCheck aria-hidden="true" size={22} />
                <span>
                  <strong>{step.title}</strong> · {step.detail}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
