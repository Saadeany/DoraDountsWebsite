import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getProducts, getCategories, getFilterOptions } from "../api/products";
import ProductCard from "../components/product/ProductCard";
import QuickViewModal from "../components/product/QuickViewModal";
import ProductFilters from "../components/product/ProductFilters";
import Loader from "../components/common/Loader";
import useSEO from "../utils/useSEO";

const ShopPage = () => {
  useSEO({
    title: "Shop All",
    description: "Browse the full Dora Donuts collection — freshly made classics, filled favorites, signature flavors and sweet treats. Crafted in Cairo.",
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const buildFilters = () => ({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    gender: searchParams.get("gender") || "",
    tag: searchParams.get("tag") || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    size: searchParams.get("size") || "",
    color: searchParams.get("color") || "",
    sort: searchParams.get("sort") || "newest",
  });

  const [filters, setFilters] = useState(buildFilters);
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  // Sync filters → URL
  useEffect(() => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    if (page > 1) params.page = page;
    setSearchParams(params, { replace: true });
  }, [filters, page]);

  // Load static filter options once
  useEffect(() => {
    Promise.all([getCategories(), getFilterOptions()]).then(([cats, opts]) => {
      setCategories(cats.data.categories);
      setSizes(opts.data.sizes);
      setColors(opts.data.colors);
    }).catch(() => {});
  }, []);

  // Fetch products on filter/page change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 12 };
      // Remove empty params
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await getProducts(params);
      setProducts(data.products);
      setPagination(data.pagination);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchProducts]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => v && k !== "sort"
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Our collection</p>
          <h1 className="font-display text-3xl">
            {filters.search ? `Results for "${filters.search}"` : "Shop All"}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {pagination.total !== undefined && (
            <p className="text-sm text-charcoal/60">{pagination.total} products</p>
          )}
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 border border-ink/25 px-4 py-2 text-sm hover:border-ink transition-colors lg:hidden"
          >
            <SlidersHorizontal size={16} />
            Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
          </button>
        </div>
      </div>

      <div className="flex gap-10">
        {/* Desktop sidebar */}
        <div className="hidden w-56 shrink-0 lg:block">
          <ProductFilters
            filters={filters}
            setFilters={handleFilterChange}
            categories={categories}
            sizes={sizes}
            colors={colors}
          />
        </div>

        {/* Grid */}
        <div className="flex-1">
          {loading ? (
            <Loader label="Loading products" />
          ) : products.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-display text-2xl text-charcoal/40">No products found</p>
              <p className="mt-2 text-sm text-charcoal/50">Try clearing some filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onQuickView={setQuickViewProduct} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-9 w-9 text-sm border transition-colors ${
                    p === page
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/20 hover:border-ink"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40 lg:hidden"
            onClick={() => setFilterOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-0 flex h-full w-80 flex-col overflow-y-auto bg-paper p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-display text-xl">Filters</h3>
                <button onClick={() => setFilterOpen(false)}><X size={22} /></button>
              </div>
              <ProductFilters
                filters={filters}
                setFilters={(f) => { handleFilterChange(f); setFilterOpen(false); }}
                categories={categories}
                sizes={sizes}
                colors={colors}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
};

export default ShopPage;
