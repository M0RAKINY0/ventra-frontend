import { Plus } from "lucide-react"
import { useId, useState } from "react"

// TODO: replace [FEE] with Ventra's ticket fee once it's set.
const questions = [
  {
    question: "Is it free to post a plan?",
    answer:
      "Yes. Listing a plan is free. If you sell tickets, Ventra keeps a small fee from each paid ticket ([FEE]%). Free plans never cost anything.",
  },
  {
    question: "Can I change or delete my plan after it goes live?",
    answer: "Yes. Edit the details or delete the plan whenever you need to. Changes show up in the guide straight away.",
  },
  {
    question: "Can I limit how many people come?",
    answer: "Yes. Set the number of spots when you post. Once they are all reserved, reservations close on their own.",
  },
  {
    question: "How do guests get in on the day?",
    answer:
      "Everyone who reserves gets a ticket with a QR code in Ventra. They show it at the door, so you know who is on the list.",
  },
  {
    question: "Who can see my plan?",
    answer: "Anyone browsing Ventra. Once you publish, your plan shows up in the guide for people nearby.",
  },
  {
    question: "Do guests need an account?",
    answer: "Only to reserve. Signing in keeps their ticket saved and ready at the door. Browsing plans needs no account.",
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0)
  const idPrefix = useId()

  return (
    <section aria-labelledby="faq-title" className="faq" id="faq">
      <div className="faq-inner">
        <div className="faq-copy">
          <h2 className="faq-heading" id="faq-title">
            Questions hosts ask.
          </h2>
          <p className="faq-lede">The short answers before you post your first plan.</p>
        </div>

        <div className="faq-list">
          {questions.map((item, index) => {
            const isOpen = index === openIndex
            const panelId = `${idPrefix}-panel-${index}`
            const buttonId = `${idPrefix}-button-${index}`

            return (
              <div className="faq-item" data-open={isOpen || undefined} key={item.question}>
                <h3 className="faq-question">
                  <button
                    aria-controls={panelId}
                    aria-expanded={isOpen}
                    className="faq-toggle"
                    id={buttonId}
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    type="button"
                  >
                    <span>{item.question}</span>
                    <span aria-hidden="true" className="faq-icon">
                      <Plus size={16} strokeWidth={2.2} />
                    </span>
                  </button>
                </h3>
                <div aria-labelledby={buttonId} className="faq-panel" id={panelId} role="region">
                  <div>
                    <p>{item.answer}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
