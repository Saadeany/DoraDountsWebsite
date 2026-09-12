import React from "react";

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="font-display text-xl">{title}</h2>
    <div className="stitch-rule w-12 text-ink/20" />
    <div className="text-sm text-charcoal/70 leading-relaxed space-y-2">{children}</div>
  </div>
);

const PrivacyPage = () => (
  <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 space-y-10">
    <div>
      <p className="eyebrow mb-2">Last updated: June 2026</p>
      <h1 className="font-display text-4xl">Privacy Policy</h1>
      <div className="stitch-rule mt-4 w-20 text-ink/30" />
    </div>
    <Section title="Information We Collect">
      <p>When you create an account or place an order, we collect your name, email address, phone number, and shipping address. We also collect information about your orders and browsing activity on our site.</p>
    </Section>
    <Section title="How We Use Your Information">
      <p>We use your information to process orders, communicate about your purchases, send promotional emails (with your consent), and improve our website and services.</p>
    </Section>
    <Section title="Data Security">
      <p>All passwords are hashed using bcrypt. We use HTTPS for all data transmission. We do not store credit card details on our servers.</p>
    </Section>
    <Section title="Your Rights">
      <p>You may request a copy of your personal data, ask us to correct inaccurate data, or request deletion of your account by contacting doradounts@gmail.com.</p>
    </Section>
    <Section title="Contact">
      <p>For privacy-related questions, email us at doradounts@gmail.com or write to 48 El Fardous Compound Al Ahly Club, Nasr City, Cairo, Egypt.</p>
    </Section>
  </div>
);

export default PrivacyPage;
