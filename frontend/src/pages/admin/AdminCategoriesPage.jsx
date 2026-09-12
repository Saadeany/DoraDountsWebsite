import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getCategories } from "../../api/products";
import { createCategory, updateCategory, deleteCategory } from "../../api/admin";
import Loader from "../../components/common/Loader";

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", image: null });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const fetch = async () => { setLoading(true); const { data } = await getCategories(); setCategories(data.categories); setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setForm({ name: "", description: "", image: null }); setEditing(null); setErr(""); setModal("add"); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || "", image: null }); setErr(""); setModal("edit"); };

  const handleSave = async () => {
    if (!form.name) return setErr("Name is required.");
    setSaving(true); setErr("");
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      if (form.description) fd.append("description", form.description);
      if (form.image) fd.append("image", form.image);
      if (modal === "add") await createCategory(fd);
      else await updateCategory(editing.id, fd);
      setModal(null); fetch();
    } catch (e) { setErr(e.response?.data?.message || "Save failed."); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Categories</h1>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Category</button>
      </div>
      {loading ? <Loader /> : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <div key={c.id} className="border border-ink/10 p-4 space-y-2">
              {c.image && <img src={c.image} alt={c.name} className="h-20 w-full object-cover" />}
              <p className="font-medium text-sm">{c.name}</p>
              {c.description && <p className="text-xs text-charcoal/60 line-clamp-2">{c.description}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => openEdit(c)} className="text-charcoal/50 hover:text-ink"><Pencil size={14} /></button>
                <button onClick={async () => { if (window.confirm("Delete this category?")) { try { await deleteCategory(c.id); fetch(); } catch (e) { alert(e.response?.data?.message); } }}} className="text-charcoal/50 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-sm bg-paper p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl">{modal === "add" ? "Add Category" : "Edit Category"}</h2>
            <div>
              <label className="eyebrow mb-1 block text-charcoal/60">Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="eyebrow mb-1 block text-charcoal/60">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field resize-none" />
            </div>
            <div>
              <label className="eyebrow mb-1 block text-charcoal/60">Image</label>
              <input type="file" accept="image/*" onChange={(e) => setForm((f) => ({ ...f, image: e.target.files[0] }))} className="text-sm" />
            </div>
            {err && <p className="text-sm text-red-500">{err}</p>}
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save"}</button>
              <button onClick={() => setModal(null)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
