import React, { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { getAdminProducts, createProduct, updateProduct, deleteProduct, deleteProductImage } from "../../api/admin";
import { getCategories, getFilterOptions } from "../../api/products";
import { formatPrice, getFinalPrice, getPrimaryImage } from "../../utils/format";
import Loader from "../../components/common/Loader";

const GENDER_OPTIONS = ["men", "women", "unisex"];
const TAGS_OPTIONS = ["new", "best_seller", "trending", "sale"];

const emptyForm = () => ({
  name: "", description: "", price: "", discount: "0", stock: "",
  category_id: "", material: "", brand: "Felt & Form", gender: "unisex",
  tags: [], sizes: [], colors: [],
  images: [],
});

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | "add" | "edit"
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAdminProducts({ search, page, limit: 15 });
      setProducts(data.products);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data.categories)).catch(() => {});
    getFilterOptions().then(({ data }) => { setSizes(data.sizes); setColors(data.colors); }).catch(() => {});
  }, []);

  const openAdd = () => { setForm(emptyForm()); setEditing(null); setFormError(""); setModal("add"); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || "", price: p.price, discount: p.discount,
      stock: p.stock, category_id: p.category_id || "", material: p.material || "",
      brand: p.brand || "Felt & Form", gender: p.gender,
      tags: p.tags || [],
      sizes: p.sizes?.map((s) => ({ size_id: s.id, stock: s.ProductSize?.stock || 0 })) || [],
      colors: p.colors?.map((c) => c.id) || [],
      images: [],
    });
    setFormError("");
    setModal("edit");
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await deleteProduct(p.id);
    fetchProducts();
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return setFormError("Name and price are required.");
    setSaving(true);
    setFormError("");
    try {
      const fd = new FormData();
      const fields = ["name", "description", "price", "discount", "stock", "category_id", "material", "brand", "gender"];
      fields.forEach((f) => form[f] !== undefined && fd.append(f, form[f]));
      fd.append("tags", JSON.stringify(form.tags));
      fd.append("sizes", JSON.stringify(form.sizes));
      fd.append("colors", JSON.stringify(form.colors));
      form.images.forEach((img) => fd.append("images", img));

      if (modal === "add") {
        await createProduct(fd);
      } else {
        await updateProduct(editing.id, fd);
      }
      setModal(null);
      fetchProducts();
    } catch (e) {
      setFormError(e.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tag) => setForm((f) => ({
    ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
  }));
  const toggleColor = (id) => setForm((f) => ({
    ...f, colors: f.colors.includes(id) ? f.colors.filter((c) => c !== id) : [...f.colors, id],
  }));
  const toggleSize = (id) => setForm((f) => {
    const exists = f.sizes.find((s) => s.size_id === id);
    return {
      ...f,
      sizes: exists ? f.sizes.filter((s) => s.size_id !== id) : [...f.sizes, { size_id: id, stock: 0 }],
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl">Products</h1>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Product</button>
      </div>

      <div className="flex items-center gap-2 border border-ink/15 px-3 py-2 max-w-xs">
        <Search size={15} className="text-charcoal/40 shrink-0" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {loading ? <Loader /> : (
        <div className="overflow-x-auto border border-ink/10">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 bg-cream">
              <tr>
                {["Image", "Name", "Price", "Stock", "Category", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left eyebrow text-charcoal/60 font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-cream/50 transition-colors">
                  <td className="px-4 py-3">
                    <img src={getPrimaryImage(p)} alt={p.name} className="h-12 w-10 object-cover" />
                  </td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">
                    {parseFloat(p.discount) > 0 ? (
                      <div>
                        <span>{formatPrice(getFinalPrice(p.price, p.discount))}</span>
                        <span className="ml-1 text-xs text-charcoal/40 line-through">{formatPrice(p.price)}</span>
                      </div>
                    ) : formatPrice(p.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.stock <= 5 ? "text-red-500" : ""}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-charcoal/60">{p.Category?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${p.is_active ? "text-green-600" : "text-red-500"}`}>
                      {p.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="text-charcoal/50 hover:text-ink"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(p)} className="text-charcoal/50 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.total_pages > 1 && (
        <div className="flex gap-1">
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`h-8 w-8 text-xs border transition-colors ${p === page ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"}`}>{p}</button>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 overflow-y-auto" onClick={() => setModal(null)}>
          <div className="relative w-full max-w-2xl bg-paper p-6 my-4 space-y-4 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl">{modal === "add" ? "Add Product" : "Edit Product"}</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: "Name *", key: "name" }, { label: "Price (EGP) *", key: "price", type: "number" },
                { label: "Discount (%)", key: "discount", type: "number" }, { label: "Stock", key: "stock", type: "number" },
                { label: "Material", key: "material" }, { label: "Brand", key: "brand" },
              ].map(({ label, key, type = "text" }) => (
                <div key={key}>
                  <label className="eyebrow mb-1 block text-charcoal/60">{label}</label>
                  <input type={type} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="input-field" />
                </div>
              ))}
              <div>
                <label className="eyebrow mb-1 block text-charcoal/60">Category</label>
                <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} className="input-field">
                  <option value="">— None —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="eyebrow mb-1 block text-charcoal/60">Gender</label>
                <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className="input-field">
                  {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="eyebrow mb-1 block text-charcoal/60">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field resize-none" />
            </div>

            <div>
              <p className="eyebrow mb-2 text-charcoal/60">Tags</p>
              <div className="flex flex-wrap gap-2">
                {TAGS_OPTIONS.map((t) => (
                  <button key={t} type="button" onClick={() => toggleTag(t)} className={`border px-3 py-1 text-xs transition-colors ${form.tags.includes(t) ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"}`}>{t}</button>
                ))}
              </div>
            </div>
          <div>
            <p className="eyebrow mb-2 text-charcoal/60">Sizes &amp; Stock</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {sizes.map((s) => (
                <button key={s.id} type="button" onClick={() => toggleSize(s.id)}
                  className={`border px-3 py-1 text-xs transition-colors ${form.sizes.find((fs) => fs.size_id === s.id) ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"}`}>
                  {s.name}
                </button>
              ))}
            </div>
            {form.sizes.length > 0 && (
              <div className="space-y-2">
                {form.sizes.map((fs) => {
                  const sizeName = sizes.find((s) => s.id === fs.size_id)?.name;
                  return (
                    <div key={fs.size_id} className="flex items-center gap-3">
                      <span className="w-16 text-xs text-charcoal/70">{sizeName}</span>
                      <input
                        type="number"
                        min="0"
                        value={fs.stock}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          sizes: f.sizes.map((x) =>
                            x.size_id === fs.size_id ? { ...x, stock: parseInt(e.target.value, 10) || 0 } : x
                          ),
                        }))}
                        className="input-field text-xs py-1.5 w-24"
                        placeholder="Stock"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

            <div>
              <p className="eyebrow mb-2 text-charcoal/60">Colors</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button key={c.id} type="button" onClick={() => toggleColor(c.id)} title={c.name} className={`h-8 w-8 rounded-full border-2 transition-transform ${form.colors.includes(c.id) ? "border-ink scale-110" : "border-ink/10"}`} style={{ backgroundColor: c.hex_code || "#ccc" }} />
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow mb-2 text-charcoal/60">Images</p>
              <input type="file" multiple accept="image/*" onChange={(e) => setForm((f) => ({ ...f, images: Array.from(e.target.files) }))} className="text-sm" />
              {editing?.images?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editing.images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img src={img.image_url} alt="" className="h-16 w-14 object-cover" />
                      <button
                        type="button"
                        onClick={async () => { await deleteProductImage(editing.id, img.id); openEdit({ ...editing, images: editing.images.filter((i) => i.id !== img.id) }); }}
                        className="absolute inset-0 bg-ink/60 text-paper text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formError && <p className="text-sm text-red-500">{formError}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save Product"}</button>
              <button onClick={() => setModal(null)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
