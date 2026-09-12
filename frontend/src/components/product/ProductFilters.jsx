import React from "react";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "most_popular", label: "Most Popular" },
  { value: "best_rated", label: "Best Rated" },
];

const ProductFilters = ({ filters, setFilters, categories = [], sizes = [], colors = [] }) => {
  const update = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const clearAll = () =>
    setFilters({ category: "", min_price: "", max_price: "", size: "", color: "", sort: "newest", availability: "" });

  return (
    <aside className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="eyebrow">Filters</h3>
        <button onClick={clearAll} className="text-xs text-charcoal/60 underline hover:text-ink">
          Clear all
        </button>
      </div>

      <div>
        <p className="eyebrow mb-3">Sort By</p>
        <select
          value={filters.sort}
          onChange={(e) => update("sort", e.target.value)}
          className="input-field"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="eyebrow mb-3">Category</p>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={filters.category === cat.slug}
                onChange={() => update("category", cat.slug)}
              />
              {cat.name}
            </label>
          ))}
          {filters.category && (
            <button onClick={() => update("category", "")} className="text-xs text-charcoal/60 underline">
              Reset category
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-3">Price Range (EGP)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_price}
            onChange={(e) => update("min_price", e.target.value)}
            className="input-field"
            min="0"
          />
          <span className="text-charcoal/40">–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.max_price}
            onChange={(e) => update("max_price", e.target.value)}
            className="input-field"
            min="0"
          />
        </div>
      </div>

      <div>
        <p className="eyebrow mb-3">Size</p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s.id}
              onClick={() => update("size", filters.size === s.name ? "" : s.name)}
              className={`border px-3 py-1.5 text-xs uppercase transition-colors ${
                filters.size === s.name ? "border-ink bg-ink text-paper" : "border-ink/25 hover:border-ink"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-3">Color</p>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c.id}
              title={c.name}
              onClick={() => update("color", filters.color === c.name ? "" : c.name)}
              className={`h-7 w-7 rounded-full border-2 transition-transform ${
                filters.color === c.name ? "border-ink scale-110" : "border-ink/10"
              }`}
              style={{ backgroundColor: c.hex_code || "#ccc" }}
            />
          ))}
        </div>
      </div>
    </aside>
  );
};

export default ProductFilters;
