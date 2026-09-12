import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, MapPin, Mail, Phone } from "lucide-react";
import { subscribeNewsletter } from "../../api/newsletter";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await subscribeNewsletter(email);
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <footer className="border-t border-charcoal/10 bg-stone text-charcoal">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-display text-2xl tracking-widest2 text-charcoal">DORA DONUTS &amp; PASTRY</h3>
            <div className="stitch-rule w-16 bg-charcoal/40" />
            <p className="text-sm leading-relaxed text-charcoal/80">
              Freshly made donuts and pastries, baked with love — every single day.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-charcoal/70 hover:text-charcoal transition-colors">
                <Instagram size={18} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-charcoal/70 hover:text-charcoal transition-colors">
                <Twitter size={18} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-charcoal/70 hover:text-charcoal transition-colors">
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Shop links */}
          <div className="space-y-4">
            <h4 className="eyebrow text-charcoal/70">Shop</h4>
            {[
              { label: "Donuts", to: "/shop?gender=men" },
              { label: "Pastries", to: "/shop?gender=women" },
              { label: "New Collection", to: "/shop?tag=new" },
              { label: "Best Sellers", to: "/shop?tag=best_seller" },
              { label: "Sale", to: "/shop?tag=sale" },
              { label: "Accessories", to: "/shop?category=accessories" },
            ].map((l) => (
              <Link key={l.label} to={l.to} className="block text-sm text-charcoal/80 hover:text-charcoal transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Company links */}
          <div className="space-y-4">
            <h4 className="eyebrow text-charcoal/70">Company</h4>
            {[
              { label: "About Us", to: "/about" },
              { label: "Contact", to: "/contact" },
              { label: "FAQ", to: "/faq" },
              { label: "Size Guide", to: "/size-guide" },
              { label: "Privacy Policy", to: "/privacy" },
              { label: "Terms & Conditions", to: "/terms" },
            ].map((l) => (
              <Link key={l.label} to={l.to} className="block text-sm text-charcoal/80 hover:text-charcoal transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Newsletter + contact */}
          <div className="space-y-5">
            <h4 className="eyebrow text-charcoal/70">Stay in the loop</h4>
            <p className="text-sm text-charcoal/80">New Dounts and exclusive offers, straight to your inbox.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="border border-charcoal/30 bg-transparent px-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal/50 focus:border-charcoal focus:outline-none"
              />
              <button type="submit" className="border border-charcoal px-4 py-2.5 text-xs uppercase tracking-wide text-charcoal hover:bg-charcoal hover:text-paper transition-colors">
                Subscribe
              </button>
              {status === "success" && <p className="text-xs text-charcoal">You're on the list.</p>}
              {status === "error" && <p className="text-xs text-charcoal">Something went wrong. Try again.</p>}
            </form>

            <div className="space-y-2 pt-2">
              <div className="flex items-start gap-2 text-sm text-charcoal/80">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span>48 El Fardous Compound Al Ahly Club, Nasr City, Cairo, Egypt</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-charcoal/80">
                <Phone size={14} className="shrink-0" />
                <span>+201104678135</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-charcoal/80">
                <Mail size={14} className="shrink-0" />
                <span>doradounts@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-charcoal/15 pt-8 sm:flex-row">
          <p className="text-xs text-charcoal/60">© {new Date().getFullYear()} DORA Donuts &amp; Pastry. All rights reserved.</p>
          <p className="text-xs text-charcoal/60">Powered By Saadany.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
