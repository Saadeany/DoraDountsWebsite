import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminLoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== "admin") {
        setError("You do not have admin access.");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm bg-paper p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl">FELT &amp; FORM</h1>
          <p className="eyebrow text-charcoal/60">Admin Panel</p>
          <div className="stitch-rule mx-auto w-16 text-ink" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="eyebrow mb-1 block">Email</label>
            <input type="email" required value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input-field" placeholder="admin@feltandform.com" />
          </div>
          <div>
            <label className="eyebrow mb-1 block">Password</label>
            <input type="password" required value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="input-field" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in…" : "Sign In to Admin"}
          </button>
        </form>
        <p className="text-center text-xs text-charcoal/50">
          Admin only. Return to{" "}
          <a href="/" className="underline hover:text-ink">store</a>.
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
