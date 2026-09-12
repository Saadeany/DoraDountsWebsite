import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  { q: "How do I track my order?", a: "Log in to your account and visit My Orders. Every order shows its current status from pending through to delivered." },
  { q: "How long does delivery take?", a: "Delivery usually takes 30 minutes to 1 hour, depending on your location and traffic conditions." },
  { q: "Do you deliver outside Cairo?", a: "Currently, we deliver within Cairo only. We're working on expanding our delivery options in the future." },
  { q: "Can I change or cancel my order?", a: "Orders can be cancelled before they enter 'Processing' status. Contact us as soon as possible by phone or email and we'll do our best to help." },
  { q: "What payment methods do you accept?", a: "We accept Cash on Delivery, Vodafone Cash, and InstaPay." },
  { q: "Can I return or exchange my order?", a: "Because our donuts are freshly prepared food products, returns are generally not accepted. If there's an issue with your order, please contact us as soon as possible and we'll be happy to help." },
  { q: "Can I order for a special occasion?", a: "Absolutely! Dora Dounts is perfect for birthdays, celebrations, gatherings, and sweet surprises. Contact us to discuss larger or special orders." },
  { q: "Can I choose different donut flavors in one box?", a: "Yes, where available, you can mix and match your favorite flavors. The available options will be shown when placing your order." },
  { q: "Are your donuts made fresh?", a: "Yes. We prepare our donuts with freshness and quality in mind, so every order is made to be enjoyed at its best." },
];



const FAQPage = () => {
  const [open, setOpen] = useState(null);

  return (
    <div>
      <section className="bg-ink text-paper py-20 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-6 border border-dashed border-paper/15" />
        <h1 className="font-display text-5xl">FAQ</h1>
        <div className="stitch-rule mx-auto mt-5 w-20 text-paper/30" />
      </section>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 space-y-2">
        {FAQS.map(({ q, a }, i) => (
          <div key={i} className="border border-ink/10">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between p-5 text-left"
            >
              <span className="text-sm font-medium">{q}</span>
              <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <div className="border-t border-ink/10 px-5 pb-5">
                <p className="text-sm text-charcoal/70 leading-relaxed pt-3">{a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQPage;
