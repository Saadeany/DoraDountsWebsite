import React from "react";

const Loader = ({ label = "Loading" }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-20 text-charcoal/60">
    <div className="h-8 w-8 border-2 border-ink/15 border-t-ink rounded-full animate-spin" />
    <span className="eyebrow">{label}</span>
  </div>
);

export default Loader;
