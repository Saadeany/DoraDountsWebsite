import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { getSearchSuggestions } from "../../api/products";
import { formatPrice, getFinalPrice, getPrimaryImage } from "../../utils/format";
import NotificationBell from "../common/NotificationBell";

const NAV_LINKS = [
  { label: "Home",          to: "/"                    },
  { label: "Shop",          to: "/shop"                },
  { label: "Men",           to: "/shop?gender=men"     },
  { label: "Women",         to: "/shop?gender=women"   },
  { label: "New In",        to: "/shop?tag=new"        },
  { label: "Best Sellers",  to: "/shop?tag=best_seller"},
  { label: "Sale",          to: "/shop?tag=sale"       },
  { label: "About",         to: "/about"               },
  { label: "Contact",       to: "/contact"             },
];

const RECENT_KEY = "ff_recent_searches";

const Navbar = () => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [recent, setRecent] = useState([]);
  const debounceRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]")); } catch { setRecent([]); }
  }, []);

  const fetchSuggestions = useCallback((v) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!v.trim()) return setSuggestions([]);
      try { const { data } = await getSearchSuggestions(v); setSuggestions(data.suggestions); }
      catch { setSuggestions([]); }
    }, 250);
  }, []);

  const saveRecent = (term) => {
    if (!term.trim()) return;
    const updated = [term, ...recent.filter(t => t !== term)].slice(0, 5);
    setRecent(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  const submitSearch = (term) => {
    const v = (term ?? query).trim();
    if (!v) return;
    saveRecent(v);
    setSearchOpen(false); setQuery(""); setSuggestions([]);
    navigate(`/shop?search=${encodeURIComponent(v)}`);
  };

  return (
    <>
      {/* ── Main header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper shadow-[0_1px_0_0_rgba(26,26,26,0.06)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link to="/" className="font-display text-xl tracking-widest2 shrink-0">
            Dora Dounts
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} to={link.to}
                className={`text-sm transition-colors pb-0.5 border-b-2 ${
                  location.pathname === link.to
                    ? "border-ink text-ink"
                    : "border-transparent text-ink/70 hover:text-ink hover:border-ink/30"
                }`}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Icon row */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search */}
            <button aria-label="Search" onClick={() => setSearchOpen(v => !v)}
              className="text-ink/70 hover:text-ink transition-colors">
              <Search size={20} />
            </button>

            {/* Wishlist */}
            <Link to="/wishlist" aria-label="Wishlist" className="relative text-ink/70 hover:text-ink transition-colors">
              <Heart size={20} />
              {wishlistItems.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] font-medium text-paper">
                  {wishlistItems.length > 9 ? "9+" : wishlistItems.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" aria-label="Cart" className="relative text-ink/70 hover:text-ink transition-colors">
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] font-medium text-paper">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            {/* Notifications (logged-in only) */}
            {isAuthenticated && <NotificationBell />}

            {/* Account */}
            {isAuthenticated ? (
              <Link to={isAdmin ? "/admin" : "/profile"} aria-label="Account"
                className="text-ink/70 hover:text-ink transition-colors">
                <User size={20} />
              </Link>
            ) : (
              <Link to="/login"
                className="hidden text-xs uppercase tracking-wide text-ink hover:text-charcoal transition-colors sm:block border-b border-ink/30 hover:border-ink pb-0.5">
                Sign In
              </Link>
            )}

            {/* Hamburger */}
            <button
              className="flex items-center justify-center text-ink/70 hover:text-ink transition-colors lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}>
              <Menu size={22} />
            </button>
          </div>
        </div>

        {/* ── Search overlay ─────────────────────────────────────────── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-ink/10 bg-paper">
              <div className="mx-auto max-w-3xl px-4 py-5">
                <div className="flex items-center gap-3 border-b-2 border-ink pb-2">
                  <Search size={18} className="text-charcoal/40 shrink-0" />
                  <input
                    autoFocus
                    value={query}
                    onChange={e => { setQuery(e.target.value); fetchSuggestions(e.target.value); }}
                    onKeyDown={e => e.key === "Enter" && submitSearch()}
                    placeholder="Search products, categories, materials…"
                    className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-charcoal/40" />
                  <button onClick={() => { setSearchOpen(false); setQuery(""); }} aria-label="Close search">
                    <X size={18} className="text-charcoal/50 hover:text-ink" />
                  </button>
                </div>

                {!query && recent.length > 0 && (
                  <div className="mt-4">
                    <p className="eyebrow mb-2 text-charcoal/50">Recent Searches</p>
                    <div className="flex flex-wrap gap-2">
                      {recent.map(t => (
                        <button key={t} onClick={() => submitSearch(t)}
                          className="border border-ink/15 px-3 py-1 text-xs text-charcoal/70 hover:border-ink hover:text-ink transition-colors">
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.length > 0 && (
                  <div className="mt-3 divide-y divide-ink/8">
                    {suggestions.map(p => (
                      <Link key={p.id} to={`/product/${p.slug}`}
                        onClick={() => { saveRecent(query); setSearchOpen(false); setQuery(""); }}
                        className="flex items-center gap-3 py-2.5 hover:bg-cream/60 transition-colors">
                        <img src={getPrimaryImage(p)} alt={p.name} className="h-12 w-10 object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{p.name}</p>
                          <p className="text-xs text-charcoal/55">{formatPrice(getFinalPrice(p.price, p.discount))}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Mobile drawer — full-height, 100% opaque ────────────────── */}
      {/* Rendered outside <header> so it escapes the sticky stacking context */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-ink/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer panel — solid bg-paper, no opacity hack */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
              className="fixed right-0 top-0 z-[70] flex h-full w-[min(320px,90vw)] flex-col bg-paper shadow-2xl lg:hidden"
              aria-label="Mobile navigation">

              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
                <Link to="/" onClick={() => setMobileOpen(false)}
                  className="font-display text-lg tracking-widest2">
                  Dora Dounts
                </Link>
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-cream transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* User greeting */}
              {isAuthenticated && (
                <div className="border-b border-ink/10 bg-cream/50 px-5 py-3">
                  <p className="text-xs text-charcoal/60">Signed in as</p>
                  <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
                </div>
              )}

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto py-3">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-5 py-3.5 text-sm transition-colors border-b border-ink/6 ${
                      location.pathname === link.to
                        ? "text-ink font-medium bg-cream/60"
                        : "text-charcoal/80 hover:text-ink hover:bg-cream/40"
                    }`}>
                    {link.label}
                    <ChevronRight size={14} className="text-charcoal/30" />
                  </Link>
                ))}
              </nav>

              {/* Bottom actions */}
              <div className="border-t border-ink/10 p-5 space-y-3">
                {isAuthenticated ? (
                  <Link to={isAdmin ? "/admin" : "/profile"} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-sm text-charcoal/70 hover:text-ink transition-colors">
                    <User size={16} />
                    {isAdmin ? "Admin Panel" : "My Account"}
                  </Link>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary w-full text-center">
                    Sign In / Register
                  </Link>
                )}
                <div className="flex items-center gap-4 pt-1">
                  <Link to="/wishlist" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-1.5 text-xs text-charcoal/60 hover:text-ink transition-colors">
                    <Heart size={14} /> Wishlist {wishlistItems.length > 0 && `(${wishlistItems.length})`}
                  </Link>
                  <Link to="/cart" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-1.5 text-xs text-charcoal/60 hover:text-ink transition-colors">
                    <ShoppingBag size={14} /> Cart {itemCount > 0 && `(${itemCount})`}
                  </Link>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
