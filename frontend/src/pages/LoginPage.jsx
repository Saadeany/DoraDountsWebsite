import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ first_name:"", last_name:"", email:"", password:"", phone:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      let user;
      if (mode === "login") user = await login(form.email, form.password);
      else user = await register(form);
      navigate(user.role === "admin" ? "/admin" : from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl">FELT &amp; FORM</h1>
          <div className="stitch-rule mx-auto mt-3 w-20 text-ink" />
          <div className="mt-6 flex border border-ink/15">
            {["login","register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-3 text-xs uppercase tracking-wide transition-colors ${mode === m ? "bg-ink text-paper" : "text-charcoal/60 hover:text-ink"}`}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="eyebrow mb-1 block">First name</label>
                <input required value={form.first_name} onChange={e => update("first_name", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="eyebrow mb-1 block">Last name</label>
                <input required value={form.last_name} onChange={e => update("last_name", e.target.value)} className="input-field" />
              </div>
            </div>
          )}
          <div>
            <label className="eyebrow mb-1 block">Email</label>
            <input type="email" required value={form.email} onChange={e => update("email", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="eyebrow mb-1 block">Password</label>
            <input type="password" required minLength={8} value={form.password} onChange={e => update("password", e.target.value)} className="input-field" />
          </div>
          {/* FIX #2: Forgot password link */}
          {mode === "login" && (
            <div className="text-right -mt-1">
              <Link to="/forgot-password" className="text-xs text-charcoal/60 hover:text-ink underline">
                Forgot your password?
              </Link>
            </div>
          )}
          {mode === "register" && (
            <div>
              <label className="eyebrow mb-1 block">Phone (optional)</label>
              <input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} className="input-field" />
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {mode === "login" && (
          <p className="mt-6 text-center text-xs text-charcoal/60">
            Demo: customer@feltandform.com / Customer@123
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
