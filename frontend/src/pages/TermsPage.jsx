import React from "react";

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="font-display text-xl">{title}</h2>
    <div className="stitch-rule w-12 text-ink/20" />
    <div className="text-sm text-charcoal/70 leading-relaxed space-y-2">{children}</div>
  </div>
);

const TermsPage = () => (
  <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 space-y-10">
    <div>
      <p className="eyebrow mb-2">Last updated: June 2024</p>
      <h1 className="font-display text-4xl">Terms &amp; Conditions</h1>
      <div className="stitch-rule mt-4 w-20 text-ink/30" />
    </div>
          <Section title="Acceptance of Terms">
            <p>By accessing or purchasing from the Dora Donuts website, you agree to be bound by these terms. If you do not agree, please do not use the site.</p>
          </Section>

          <Section title="Orders and Payment">
            <p>All prices are listed in Egyptian Pounds (EGP) and include applicable taxes. Orders are confirmed after they are successfully placed. We reserve the right to cancel or modify orders due to product availability, incorrect order information, payment issues, or suspected fraudulent activity.</p>
          </Section>

          <Section title="Shipping and Delivery">
            <p>Our donuts are freshly prepared and delivered directly to you. Delivery usually takes 30 minutes to 1 hour, depending on your location, traffic conditions, and order volume. Delivery times are estimates and may occasionally be affected by circumstances outside our control.</p>
          </Section>

          <Section title="Returns and Refunds">
            <p>Because our products are freshly prepared food items, we generally do not accept returns. If you receive an incorrect, damaged, or unsatisfactory order, please contact us as soon as possible after delivery. We will review the issue and, where appropriate, offer a replacement or suitable resolution.</p>
          </Section>

          <Section title="Product Information">
            <p>We make every effort to ensure that product descriptions, images, flavors, ingredients, and prices displayed on the website are accurate. Product availability may vary, and we reserve the right to change or discontinue products without prior notice.</p>
          </Section>

          <Section title="Intellectual Property">
            <p>All content on this website — including photography, copy, logo, branding, and design — is the property of Dora Donuts and may not be reproduced, copied, or used without written permission.</p>
          </Section>

          <Section title="Limitation of Liability">
            <p>Dora Donuts is not liable for indirect, incidental, or consequential damages arising from your use of our products or website beyond the amount you paid for the relevant order, to the extent permitted by applicable law.</p>
          </Section>
  </div>
);

export default TermsPage;
