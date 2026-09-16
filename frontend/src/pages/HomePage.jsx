import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";

import { getProducts, getCategories } from "../api/products";
import ProductCard from "../components/product/ProductCard";
import QuickViewModal from "../components/product/QuickViewModal";
import RushHourBanner from "../components/product/RushHourBanner";
import Loader from "../components/common/Loader";
import useSEO from "../utils/useSEO";

import doraLogo from "../assets/dora-logo.png";

/* ─────────────────────────────────────────────────────────────
   Section Header
───────────────────────────────────────────────────────────── */

const SectionHeader = ({ eyebrow, title, to }) => (
  <div className="mb-10 flex items-end justify-between">
    <div>
      <p className="eyebrow mb-2 text-stone">{eyebrow}</p>

      <h2 className="font-display text-3xl text-charcoal sm:text-4xl">
        {title}
      </h2>

      <div className="stitch-rule mt-3 w-24 text-ink" />
    </div>

    {to && (
      <Link
        to={to}
        className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink transition-colors hover:text-stone"
      >
        View All
        <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Product Section
───────────────────────────────────────────────────────────── */

const ProductSection = ({
  eyebrow,
  title,
  to,
  products,
  onQuickView,
}) => (
  <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
    <SectionHeader
      eyebrow={eyebrow}
      title={title}
      to={to}
    />

    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onQuickView={onQuickView}
        />
      ))}
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────
   Category Tile
   Uses the uploaded category image from the database.
───────────────────────────────────────────────────────────── */

const CategoryTile = ({ category }) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2 }}
  >
    <Link
      to={`/shop?category=${category.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden border-2 border-stone/20 bg-paper transition-colors hover:border-ink"
    >
      {/* Category Image */}
      <img
        src={category.image || "/placeholder.svg"}
        alt={category.name}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />

      {/* Gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent"
        aria-hidden="true"
      />

      {/* Category information */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
        <span className="text-sm font-medium uppercase tracking-wide text-paper">
          {category.name}
        </span>

        <ChevronRight
          size={16}
          className="text-paper/80 transition-transform duration-300 group-hover:translate-x-1"
        />
      </div>
    </Link>
  </motion.div>
);

/* ─────────────────────────────────────────────────────────────
   Home Page
───────────────────────────────────────────────────────────── */

const HomePage = () => {
  useSEO({
    title: undefined,
    description:
      "DORA Donuts & Pastry — freshly made donuts, muffins, waffles and pastries. Order online.",
  });

  const navigate = useNavigate();

  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [trending, setTrending] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  /* ─────────────────────────────────────────────────────────
     Load homepage data
  ────────────────────────────────────────────────────────── */

  useEffect(() => {
    const load = async () => {
      try {
        const [
          newArrivalsResponse,
          bestSellersResponse,
          trendingResponse,
          saleResponse,
          categoriesResponse,
        ] = await Promise.all([
          getProducts({
            tag: "new",
            limit: 4,
          }),

          getProducts({
            tag: "best_seller",
            limit: 4,
          }),

          getProducts({
            tag: "trending",
            limit: 4,
          }),

          getProducts({
            tag: "sale",
            limit: 4,
          }),

          getCategories(),
        ]);

        setNewArrivals(
          newArrivalsResponse?.data?.products || []
        );

        setBestSellers(
          bestSellersResponse?.data?.products || []
        );

        setTrending(
          trendingResponse?.data?.products || []
        );

        setSaleItems(
          saleResponse?.data?.products || []
        );

        setCategories(
          categoriesResponse?.data?.categories || []
        );
      } catch (error) {
        console.error(
          "Failed to load homepage data:",
          error
        );

        setNewArrivals([]);
        setBestSellers([]);
        setTrending([]);
        setSaleItems([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════ */}

      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden bg-paper">
        {/* Decorative border */}
        <div
          className="pointer-events-none absolute inset-6 border border-dashed border-stone/25"
          aria-hidden="true"
        />

        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
          className="relative z-10 flex flex-col items-center gap-6 px-4 text-center"
        >
          {/* Dora Logo */}
          <img
            src={doraLogo}
            alt="DORA Donuts & Pastry"
            className="w-full max-w-md sm:max-w-lg"
          />

          {/* Hero Description */}
          <p className="max-w-sm text-sm leading-relaxed tracking-wide text-charcoal/70 sm:text-base">
            Freshly made donuts, muffins, waffles and pastries,
            baked with love every single day.
          </p>

          {/* Order Button */}
          <motion.button
            whileHover={{
              scale: 1.03,
            }}
            whileTap={{
              scale: 0.98,
            }}
            onClick={() => navigate("/shop")}
            className="mt-2 border-2 border-ink bg-paper px-10 py-4 text-xs font-medium uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Order Now
          </motion.button>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          RUSH HOUR
      ═══════════════════════════════════════════════════════ */}

      <RushHourBanner />

      {/* ═══════════════════════════════════════════════════════
          CATEGORIES
      ═══════════════════════════════════════════════════════ */}

      <section className="mx-auto max-w-7xl bg-paper px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Browse by"
          title="Categories"
        />

        {loading ? (
          <Loader />
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryTile
                key={category.id}
                category={category}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-charcoal/60">
            No categories available yet.
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════
          NEW ARRIVALS
      ═══════════════════════════════════════════════════════ */}

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

      {/* ═══════════════════════════════════════════════════════
          FEATURED CATEGORIES
      ═══════════════════════════════════════════════════════ */}

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 sm:px-6 lg:px-8">

        {/* Donuts */}
        <Link
          to="/shop?category=donut"
          className="group relative flex min-h-56 flex-col items-start justify-end overflow-hidden border-2 border-ink bg-paper p-8"
        >
          <div
            className="pointer-events-none absolute inset-4 border border-dashed border-ink/20 transition-all duration-500 group-hover:inset-2"
            aria-hidden="true"
          />

          <p className="eyebrow mb-2 text-stone">
            Explore
          </p>

          <h3 className="font-display text-4xl text-ink">
            Donuts
          </h3>

          <ArrowRight
            size={20}
            className="mt-3 text-ink transition-transform group-hover:translate-x-2"
          />
        </Link>

        {/* Waffles */}
        <Link
          to="/shop?category=waffle"
          className="group relative flex min-h-56 flex-col items-start justify-end overflow-hidden border-2 border-stone bg-paper p-8"
        >
          <div
            className="pointer-events-none absolute inset-4 border border-dashed border-stone/20 transition-all duration-500 group-hover:inset-2"
            aria-hidden="true"
          />

          <p className="eyebrow mb-2 text-ink">
            Explore
          </p>

          <h3 className="font-display text-4xl text-stone">
            Pastries
          </h3>

          <ArrowRight
            size={20}
            className="mt-3 text-stone transition-transform group-hover:translate-x-2"
          />
        </Link>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BEST SELLERS
      ═══════════════════════════════════════════════════════ */}

      {bestSellers.length > 0 && (
        <ProductSection
          eyebrow="Crowd favourites"
          title="Best Sellers"
          to="/shop?tag=best_seller"
          products={bestSellers}
          onQuickView={setQuickViewProduct}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          TRENDING
      ═══════════════════════════════════════════════════════ */}

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

      {/* ═══════════════════════════════════════════════════════
          SALE
      ═══════════════════════════════════════════════════════ */}

      {saleItems.length > 0 && (
        <>
          <section className="border-y-2 border-stone bg-paper py-10 text-center">
            <p className="eyebrow mb-3 text-ink">
              Limited time
            </p>

            <h2 className="font-display text-5xl text-stone">
              Sale
            </h2>

            <div className="stitch-rule mx-auto mt-4 w-20 text-stone/40" />

            <p className="mt-4 text-sm text-charcoal/60">
              Selected treats up to 20% off. While stocks last.
            </p>
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

      {/* ═══════════════════════════════════════════════════════
          QUICK VIEW
      ═══════════════════════════════════════════════════════ */}

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
};

export default HomePage;
