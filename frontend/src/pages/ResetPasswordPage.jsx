import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { resetPassword } from "../api/auth";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [form, setForm] = useState({ new_password: "", confirm_password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 text-center">
        <div className="space-y-4">
          <h1 className="font-display text-2xl">Invalid Link</h1>
          <p className="text-sm text-charcoal/70">This password reset link is missing a token.</p>
          <Link to="/forgot-password" className="btn-primary inline-flex">Request New Link</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.new_password !== form.confirm_password) {
      return setError("Passwords do not match.");
    }
    if (form.new_password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }
    setLoading(true);
    try {
      await resetPassword(token, form.new_password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <CheckCircle size={56} className="mx-auto text-green-500" strokeWidth={1.5} />
          <h1 className="font-display text-3xl">Password Reset</h1>
          <div className="stitch-rule mx-auto w-20 text-ink/20" />
          <p className="text-sm text-charcoal/70">Your password has been changed. Redirecting you to Sign In…</p>
          <Link to="/login" className="btn-primary inline-flex">Sign In Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl">FELT &amp; FORM</h1>
          <div className="stitch-rule mx-auto mt-3 w-20 text-ink" />
          <h2 className="mt-5 font-display text-2xl">Choose a new password</h2>
          <p className="mt-2 text-sm text-charcoal/60">Must be at least 8 characters.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="eyebrow mb-1 block">New Password</label>
            <input
              type="password" required minLength={8} autoFocus
              value={form.new_password}
              onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
              className="input-field"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="eyebrow mb-1 block">Confirm Password</label>
            <input
              type="password" required minLength={8}
              value={form.confirm_password}
              onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
              className="input-field"
              placeholder="Repeat new password"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
