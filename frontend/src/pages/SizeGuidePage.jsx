import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Ruler } from "lucide-react";
import useSEO from "../utils/useSEO";

useSEO.displayName = "SizeGuidePage";

const SizeGuidePage = () => {
  useSEO({
    title: "Size Guide",
    description:
      "Find your perfect fit with the Felt & Form size guide. Measurement tables for tops, hoodies, pants and accessories — in centimetres.",
  });

  const [unit, setUnit] = useState("cm");
  const [activeTab, setActiveTab] = useState("tops");

  const toCm  = (v) => v;
  const toIn  = (v) => (v / 2.54).toFixed(1);
  const fmt   = (v) => unit === "cm" ? `${v} cm` : `${toIn(v)}"`;

  // ── Size data (all values in cm) ──────────────────────────────────────
  const TOPS = [
    { size:"XS",      chest:"84–88",  shoulder:"41",  sleeve:"60",  length:"67",  waist:"70–74"  },
    { size:"S",       chest:"88–92",  shoulder:"43",  sleeve:"61",  length:"69",  waist:"74–78"  },
    { size:"M",       chest:"96–100", shoulder:"45",  sleeve:"62",  length:"71",  waist:"80–84"  },
    { size:"L",       chest:"104–108",shoulder:"47",  sleeve:"63",  length:"73",  waist:"88–92"  },
    { size:"XL",      chest:"112–116",shoulder:"49",  sleeve:"64",  length:"75",  waist:"96–100" },
    { size:"XXL",     chest:"120–124",shoulder:"51",  sleeve:"65",  length:"77",  waist:"104–108"},
  ];

  const HOODIES = [
    { size:"XS",  chest:"90–94",  shoulder:"47",  sleeve:"62",  length:"65",  hem:"73"  },
    { size:"S",   chest:"96–100", shoulder:"49",  sleeve:"63",  length:"67",  hem:"78"  },
    { size:"M",   chest:"102–108",shoulder:"52",  sleeve:"65",  length:"69",  hem:"83"  },
    { size:"L",   chest:"110–116",shoulder:"55",  sleeve:"67",  length:"71",  hem:"89"  },
    { size:"XL",  chest:"118–124",shoulder:"58",  sleeve:"69",  length:"73",  hem:"95"  },
    { size:"XXL", chest:"126–132",shoulder:"61",  sleeve:"71",  length:"75",  hem:"101" },
  ];

  const PANTS = [
    { size:"XS",  waist:"68–72",  hips:"88–92",  inseam:"76",  rise:"27",  thigh:"52"  },
    { size:"S",   waist:"72–76",  hips:"92–96",  inseam:"77",  rise:"28",  thigh:"54"  },
    { size:"M",   waist:"80–84",  hips:"100–104",inseam:"78",  rise:"29",  thigh:"58"  },
    { size:"L",   waist:"88–92",  hips:"108–112",inseam:"79",  rise:"30",  thigh:"62"  },
    { size:"XL",  waist:"96–100", hips:"116–120",inseam:"80",  rise:"31",  thigh:"66"  },
    { size:"XXL", waist:"104–108",hips:"124–128",inseam:"81",  rise:"32",  thigh:"70"  },
  ];

  const OVERSIZED = [
    { size:"XS",  chest:"100–106",shoulder:"52",  sleeve:"64",  length:"72" },
    { size:"S",   chest:"108–114",shoulder:"55",  sleeve:"65",  length:"74" },
    { size:"M",   chest:"116–122",shoulder:"58",  sleeve:"66",  length:"76" },
    { size:"L",   chest:"124–130",shoulder:"61",  sleeve:"67",  length:"78" },
    { size:"XL",  chest:"132–138",shoulder:"64",  sleeve:"68",  length:"80" },
    { size:"XXL", chest:"140–146",shoulder:"67",  sleeve:"69",  length:"82" },
  ];

  // Helper to format a range like "84–88"
  const fmtRange = (v) => {
    if (!v.includes("–")) return fmt(parseFloat(v));
    const [a, b] = v.split("–").map(Number);
    return unit === "cm" ? `${a}–${b} cm` : `${toIn(a)}–${toIn(b)}"`;
  };

  const TABS = [
    { key:"tops",      label:"T-Shirts & Tops" },
    { key:"hoodies",   label:"Hoodies & Sweatshirts" },
    { key:"pants",     label:"Pants & Joggers" },
    { key:"oversized", label:"Oversized Fits" },
    { key:"how-to",    label:"How to Measure" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-ink text-paper py-16 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-6 border border-dashed border-paper/15" />
        <div className="flex items-center justify-center gap-3 mb-3">
          <Ruler size={24} className="text-paper/60" />
          <p className="eyebrow text-paper/50">Find your fit</p>
        </div>
        <h1 className="font-display text-5xl">Size Guide</h1>
        <div className="stitch-rule mx-auto mt-5 w-20 text-paper/30" />
        <p className="mt-4 text-sm text-paper/60 max-w-md mx-auto px-4">
          All measurements are in centimetres and taken flat across the garment.
          We recommend measuring yourself and comparing to the chart below.
        </p>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">

        {/* Unit toggle + tab navigation */}
        <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex border border-ink/15 w-fit">
            {["cm", "in"].map(u => (
              <button key={u} onClick={() => setUnit(u)}
                className={`px-5 py-2 text-xs uppercase tracking-wide transition-colors ${
                  unit === u ? "bg-ink text-paper" : "text-charcoal/60 hover:text-ink"
                }`}>
                {u === "cm" ? "Centimetres" : "Inches"}
              </button>
            ))}
          </div>
          <p className="text-xs text-charcoal/50">
            Need help? <Link to="/contact" className="underline hover:text-ink">Contact us</Link> and we'll find your size.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 mb-8 border-b border-ink/10 pb-0">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm -mb-px border-b-2 transition-colors ${
                activeTab === t.key
                  ? "border-ink text-ink font-medium"
                  : "border-transparent text-charcoal/60 hover:text-ink"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── T-Shirts & Tops ─────────────────────────────────────────── */}
        {activeTab === "tops" && (
          <div className="space-y-6">
            <p className="text-sm text-charcoal/70">
              Our T-shirts are cut <strong>true to size</strong>. For a roomier feel, size up one.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-cream">
                    {["Size", "Chest", "Shoulder", "Sleeve", "Body Length", "Waist"].map(h => (
                      <th key={h} className="px-4 py-3 text-left eyebrow text-charcoal/60 font-normal border border-ink/10">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TOPS.map((row, i) => (
                    <tr key={row.size} className={i % 2 === 0 ? "bg-paper" : "bg-cream/40"}>
                      <td className="px-4 py-3 font-medium border border-ink/10">{row.size}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmtRange(row.chest)}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmt(row.shoulder)}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmt(row.sleeve)}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmt(row.length)}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmtRange(row.waist)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border border-ink/10 bg-cream/40 p-4 text-xs text-charcoal/70 space-y-1">
              <p><strong>Chest:</strong> Measured across the front from armhole seam to armhole seam.</p>
              <p><strong>Sleeve:</strong> From center back collar seam, over shoulder, down to cuff.</p>
              <p><strong>Body Length:</strong> From highest point of shoulder to hem.</p>
            </div>
          </div>
        )}

        {/* ── Hoodies ─────────────────────────────────────────────────── */}
        {activeTab === "hoodies" && (
          <div className="space-y-6">
            <p className="text-sm text-charcoal/70">
              Our hoodies are cut with a <strong>relaxed fit</strong>. True-to-size gives a comfortable drape;
              size down for a more fitted look.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-cream">
                    {["Size", "Chest", "Shoulder", "Sleeve", "Body Length", "Ribbed Hem"].map(h => (
                      <th key={h} className="px-4 py-3 text-left eyebrow text-charcoal/60 font-normal border border-ink/10">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOODIES.map((row, i) => (
                    <tr key={row.size} className={i % 2 === 0 ? "bg-paper" : "bg-cream/40"}>
                      <td className="px-4 py-3 font-medium border border-ink/10">{row.size}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmtRange(row.chest)}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmt(row.shoulder)}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmt(row.sleeve)}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmt(row.length)}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmt(row.hem)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border border-ink/10 bg-cream/40 p-4 text-xs text-charcoal/70">
              <p><strong>Ribbed Hem:</strong> Width of the garment measured at the hem after the ribbed band.</p>
            </div>
          </div>
        )}

        {/* ── Pants ───────────────────────────────────────────────────── */}
        {activeTab === "pants" && (
          <div className="space-y-6">
            <p className="text-sm text-charcoal/70">
              Pants are measured at the waistband (with elastic relaxed).
              If you are between sizes, size up for comfort.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-cream">
                    {["Size", "Waist (relaxed)", "Hips", "Inseam", "Rise", "Thigh"].map(h => (
                      <th key={h} className="px-4 py-3 text-left eyebrow text-charcoal/60 font-normal border border-ink/10">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PANTS.map((row, i) => (
                    <tr key={row.size} className={i % 2 === 0 ? "bg-paper" : "bg-cream/40"}>
                      <td className="px-4 py-3 font-medium border border-ink/10">{row.size}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmtRange(row.waist)}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmtRange(row.hips)}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmt(row.inseam)}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmt(row.rise)}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmt(row.thigh)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border border-ink/10 bg-cream/40 p-4 text-xs text-charcoal/70 space-y-1">
              <p><strong>Waist (relaxed):</strong> Measured at the waistband without stretching.</p>
              <p><strong>Rise:</strong> From the top of the waistband to the crotch seam.</p>
              <p><strong>Inseam:</strong> From crotch seam to hem, inner leg.</p>
              <p><strong>Thigh:</strong> Measured 2 cm below the crotch seam, across the full thigh.</p>
            </div>
          </div>
        )}

        {/* ── Oversized ───────────────────────────────────────────────── */}
        {activeTab === "oversized" && (
          <div className="space-y-6">
            <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <strong>Note on Oversized pieces:</strong> These are intentionally cut larger than standard sizing.
              The measurements below are the actual garment dimensions — not your body measurements.
              We recommend selecting your <em>usual</em> size for the intended oversized silhouette,
              or going one size down if you prefer a closer (still relaxed) fit.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-cream">
                    {["Size", "Chest (actual)", "Shoulder Drop", "Sleeve", "Body Length"].map(h => (
                      <th key={h} className="px-4 py-3 text-left eyebrow text-charcoal/60 font-normal border border-ink/10">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OVERSIZED.map((row, i) => (
                    <tr key={row.size} className={i % 2 === 0 ? "bg-paper" : "bg-cream/40"}>
                      <td className="px-4 py-3 font-medium border border-ink/10">{row.size}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmtRange(row.chest)}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmt(row.shoulder)}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmt(row.sleeve)}</td>
                      <td className="px-4 py-3 border border-ink/10">{fmt(row.length)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── How to Measure ───────────────────────────────────────────── */}
        {activeTab === "how-to" && (
          <div className="space-y-8">
            <p className="text-sm text-charcoal/70">
              Use a soft measuring tape. Measure directly against your body wearing only underwear or a thin base layer.
              Keep the tape snug but not tight. All measurements are in {unit === "cm" ? "centimetres" : "inches"}.
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {[
                {
                  title: "Chest / Bust",
                  steps: [
                    "Stand straight with arms relaxed at your sides.",
                    "Wrap the tape around the fullest part of your chest, just under your arms.",
                    "Keep the tape parallel to the floor.",
                    "Take the measurement at the end of a normal breath out.",
                  ],
                },
                {
                  title: "Waist",
                  steps: [
                    "Find your natural waistline — the narrowest part of your torso, usually 2–3 cm above your navel.",
                    "Wrap the tape around your waist.",
                    "The tape should be snug but you should be able to fit one finger underneath.",
                    "For pants: measure where you actually wear them, not your natural waist.",
                  ],
                },
                {
                  title: "Hips",
                  steps: [
                    "Stand with feet together.",
                    "Measure around the fullest part of your hips and seat, about 20 cm below your natural waist.",
                    "Keep the tape parallel to the floor.",
                  ],
                },
                {
                  title: "Inseam",
                  steps: [
                    "Stand straight with feet slightly apart.",
                    "Measure from the top of your inner thigh (crotch) down to the bottom of your ankle.",
                    "Easier with help — have someone else hold the tape at the top.",
                  ],
                },
                {
                  title: "Shoulder Width",
                  steps: [
                    "Measure from the tip of one shoulder across the back to the tip of the other shoulder.",
                    "The shoulder tip is where the shoulder seam of a well-fitting top would sit.",
                  ],
                },
                {
                  title: "Sleeve Length",
                  steps: [
                    "Bend your elbow at 90°.",
                    "Measure from the center back of your neck, over your shoulder, down the outside of your arm to your wrist.",
                  ],
                },
              ].map(({ title, steps }) => (
                <div key={title} className="border border-ink/10 p-5">
                  <h3 className="font-medium text-sm mb-3">{title}</h3>
                  <ol className="space-y-1.5">
                    {steps.map((step, i) => (
                      <li key={i} className="flex gap-2.5 text-xs text-charcoal/70">
                        <span className="shrink-0 h-4 w-4 rounded-full bg-ink text-paper flex items-center justify-center text-[9px] mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            <div className="border border-ink/10 bg-cream/50 p-5 space-y-3">
              <h3 className="font-medium text-sm">Still not sure?</h3>
              <p className="text-xs text-charcoal/70">
                We know fit is personal. If you're between sizes or have questions about a specific item,
                send us your measurements and we'll tell you exactly what to order.
              </p>
              <div className="flex gap-3">
                <Link to="/contact" className="btn-primary text-xs px-4 py-2">Ask Us Your Size</Link>
                <a href="https://wa.me/201000000000" target="_blank" rel="noopener noreferrer"
                  className="btn-outline text-xs px-4 py-2 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a8.16 8.16 0 00-.57-.01c-.198 0-.52.074-.792.372C7.75 9.44 6.71 10.16 6.71 11.62c0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.122 1.534 5.857L0 24l6.335-1.518A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.574-.5-5.063-1.375L2.5 21.5l.906-4.313A9.952 9.952 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="mt-10 text-xs text-center text-charcoal/40">
          Measurements are taken from a flat garment. Actual fit may vary slightly due to fabric stretch and construction.
          Felt &amp; Form is not responsible for sizing decisions made without consulting this guide.
        </p>
      </div>
    </div>
  );
};

export default SizeGuidePage;
