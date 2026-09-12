import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import useSEO from "../utils/useSEO";
import { submitContact } from "../api/orders";

const ContactPage = () => {
  useSEO({
    title: "Contact Us",
    description: "Get in touch with Felt & Form. Find our Cairo store location, phone, email, and opening hours.",
  });
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await submitContact(form);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="bg-ink text-paper py-20 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-6 border border-dashed border-paper/15" />
        <p className="eyebrow text-paper/50 mb-3">We'd love to hear from you</p>
        <h1 className="font-display text-5xl">Contact Us</h1>
        <div className="stitch-rule mx-auto mt-5 w-20 text-paper/30" />
      </section>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="space-y-8">
          <div>
            <p className="eyebrow mb-4">Find Us</p>
            <div className="space-y-4">
              {[
                { icon: MapPin, text: "48 El Fardous Compound Al Ahly Club, Nasr City, Cairo, Egypt" },
                { icon: Phone, text: "+201104678135" },
                { icon: Mail, text: "doradounts@gmail.com" },
                { icon: Clock, text: "Sat – Wed: 11:00 AM – 9:00 PM\nThu – Fri: 11:00 AM – 10:00 PM" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 text-sm text-charcoal/70">
                  <Icon size={16} className="mt-0.5 shrink-0 text-ink" />
                  <span className="whitespace-pre-line">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {submitted ? (
          <div className="flex items-center justify-center border border-ink/10 p-10">
            <div className="text-center space-y-3">
              <h2 className="font-display text-2xl">Message Sent</h2>
              <div className="stitch-rule mx-auto w-12 text-ink/30" />
              <p className="text-sm text-charcoal/60">We'll get back to you within 24 hours.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {[{ label: "Your Name", key: "name" }, { label: "Email", key: "email", type: "email" }, { label: "Subject", key: "subject" }].map(({ label, key, type = "text" }) => (
              <div key={key}>
                <label className="eyebrow mb-1 block">{label}</label>
                <input type={type} required value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="input-field" />
              </div>
            ))}
            <div>
              <label className="eyebrow mb-1 block">Message</label>
              <textarea required rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="input-field resize-none" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Sending…" : "Send Message"}</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactPage;
