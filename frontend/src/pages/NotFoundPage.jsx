import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
    <p className="font-display text-[8rem] leading-none text-ink/10">404</p>
    <h1 className="font-display text-3xl -mt-4">Page Not Found</h1>
    <div className="stitch-rule mx-auto mt-4 w-20 text-ink/20" />
    <p className="mt-4 text-sm text-charcoal/60 max-w-xs">
      The page you're looking for has moved, been removed, or never existed.
    </p>
    <div className="mt-8 flex gap-4">
      <Link to="/" className="btn-outline">Go Home</Link>
      <Link to="/shop" className="btn-primary">Shop All</Link>
    </div>
  </div>
);

export default NotFoundPage;
