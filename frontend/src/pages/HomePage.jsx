import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import { getProducts, getCategories } from "../api/products";
import ProductCard from "../components/product/ProductCard";
import QuickViewModal from "../components/product/QuickViewModal";
import Loader from "../components/common/Loader";
import useSEO from "../utils/useSEO";
import doraLogo from "../assets/dora-logo.png";

const CATEGORY_ICONS = {
  Donuts: "🍩", Pastries: "🍰", Muffins: "🧁", Waffles: "🥞",
  Hoodies: "🧥", "T-Shirts": "👕", Pants: "👖", Oversized: "📦", Accessories: "🎒",
};

const SectionHeader = ({ eyebrow, title, to }) => (
  <div className="mb-10 flex items-end justify-between">
    <div>
      <p className="eyebrow mb-2 text-stone">{eyebrow}</p>
      <h2 className="font-display text-3xl sm:text-4xl text-charcoal">{title}</h2>
      <div className="stitch-rule mt-3 w-24 text-ink" />
    </div>
    {to && (
      <Link to={to} className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink hover:text-stone transition-colors">
        View All <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

const ProductSection = ({ eyebrow, title, to, products, onQuickView }) => (
  <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
    <SectionHeader eyebrow={eyebrow} title={title} to={to} />
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onQuickView={onQuickView} />
      ))}
    </div>
  </section>
);

const HomePage = () => {
  useSEO({
    title: undefined,
    description: "DORA Donuts & Pastry — freshly made donuts and pastries. Order online.",
  });
  const navigate = useNavigate();
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [trending, setTrending] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [na, bs, tr, sl, cats] = await Promise.all([
          getProducts({ tag: "new", limit: 4 }),
          getProducts({ tag: "best_seller", limit: 4 }),
          getProducts({ tag: "trending", limit: 4 }),
          getProducts({ tag: "sale", limit: 4 }),
          getCategories(),
        ]);
        setNewArrivals(na.data.products);
        setBestSellers(bs.data.products);
        setTrending(tr.data.products);
        setSaleItems(sl.data.products);
        setCategories(cats.data.categories);
      } catch {
        // ignore network errors — sections just stay empty
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden bg-paper">
        {/* Stitched frame border */}
        <div
          className="pointer-events-none absolute inset-6 border border-dashed border-stone/25"
          aria-hidden
        />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center gap-6 px-4 text-center"
        >
          <img
            src={doraLogo}
            alt="DORA Donuts & Pastry"
            className="w-full max-w-md sm:max-w-lg"
          />
          <p className="max-w-sm text-sm leading-relaxed tracking-wide text-charcoal/70 sm:text-base">
            Freshly made donuts and pastries, baked with love — every single day.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            onClick={() => navigate("/shop")}
            className="mt-2 border-2 border-ink bg-paper px-10 py-4 text-xs font-medium uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Order Now
          </motion.button>
        </motion.div>
      </section>

      {/* ── Featured Categories ────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 bg-paper">
        <SectionHeader eyebrow="Browse by" title="Categories" />
        {loading ? <Loader /> : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to={`/shop?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-4 border-2 border-stone/20 bg-paper p-6 text-center hover:border-ink transition-colors"
                >
                  <span className="text-3xl">{CATEGORY_ICONS[cat.name] || "🍩"}</span>
                  <span className="text-sm uppercase tracking-wide text-charcoal">{cat.name}</span>
                  <ChevronRight size={14} className="text-stone group-hover:text-ink transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── New Arrivals ───────────────────────────────────────── */}
      {newArrivals.length > 0 && (
        <div className="bg-paper">
          <ProductSection
            eyebrow="Just baked"
            title="New Arrivals"
            to="/shop?tag=new"
            products={newArrivals}
            onQuickView={setQuickViewProduct}
          />
        </div>
      )}

      {/* ── Split Banner ───────────────────────────────────────── */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 sm:px-6 lg:px-8">
        <Link
          to="/shop?gender=men"
          className="group relative flex min-h-56 flex-col items-start justify-end overflow-hidden border-2 border-ink bg-paper p-8"
        >
          <div className="pointer-events-none absolute inset-4 border border-dashed border-ink/20 transition-all duration-500 group-hover:inset-2" aria-hidden />
          <p className="eyebrow text-stone mb-2">Explore</p>
          <h3 className="font-display text-4xl text-ink">Donuts</h3>
          <ArrowRight size={20} className="mt-3 text-ink transition-transform group-hover:translate-x-2" />
        </Link>
        <Link
          to="/shop?gender=women"
          className="group relative flex min-h-56 flex-col items-start justify-end overflow-hidden border-2 border-stone bg-paper p-8"
        >
          <div className="pointer-events-none absolute inset-4 border border-dashed border-stone/20 transition-all duration-500 group-hover:inset-2" aria-hidden />
          <p className="eyebrow text-ink mb-2">Explore</p>
          <h3 className="font-display text-4xl text-stone">Pastries</h3>
          <ArrowRight size={20} className="mt-3 text-stone transition-transform group-hover:translate-x-2" />
        </Link>
      </section>

      {/* ── Best Sellers ───────────────────────────────────────── */}
      {bestSellers.length > 0 && (
        <ProductSection
          eyebrow="Crowd favourites"
          title="Best Sellers"
          to="/shop?tag=best_seller"
          products={bestSellers}
          onQuickView={setQuickViewProduct}
        />
      )}

      {/* ── Trending ───────────────────────────────────────────── */}
      {trending.length > 0 && (
        <div className="bg-paper">
          <ProductSection
            eyebrow="Right now"
            title="Trending"
            to="/shop?tag=trending"
            products={trending}
            onQuickView={setQuickViewProduct}
          />
        </div>
      )}

      {/* ── Sale ───────────────────────────────────────────────── */}
      {saleItems.length > 0 && (
        <>
          <section className="border-y-2 border-stone bg-paper py-10 text-center">
            <p className="eyebrow text-ink mb-3">Limited time</p>
            <h2 className="font-display text-5xl text-stone">Sale</h2>
            <div className="stitch-rule mx-auto mt-4 w-20 text-stone/40" />
            <p className="mt-4 text-sm text-charcoal/60">Selected treats up to 20% off. While stocks last.</p>
          </section>
          <ProductSection
            eyebrow="Marked down"
            title="Sale Items"
            to="/shop?tag=sale"
            products={saleItems}
            onQuickView={setQuickViewProduct}
          />
        </>
      )}

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </>
  );
};

export default HomePage;
