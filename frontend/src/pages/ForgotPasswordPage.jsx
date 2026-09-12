import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { forgotPassword } from "../api/auth";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl">FELT &amp; FORM</h1>
          <div className="stitch-rule mx-auto mt-3 w-20 text-ink" />
          <h2 className="mt-5 font-display text-2xl">Reset your password</h2>
        </div>

        {submitted ? (
          <div className="border border-ink/10 p-8 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 mx-auto">
              <Mail size={24} className="text-green-600" />
            </div>
            <h3 className="font-display text-xl">Check your inbox</h3>
            <p className="text-sm text-charcoal/70">
              If an account exists for <strong>{email}</strong>, you'll receive a password reset link within a few minutes.
            </p>
            <p className="text-xs text-charcoal/50">
              The link expires in {process.env.VITE_RESET_EXPIRES_MIN || 15} minutes.
              Check your spam folder if you don't see it.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button onClick={() => { setSubmitted(false); setEmail(""); }} className="text-xs text-charcoal/60 underline hover:text-ink">
                Try a different email
              </button>
              <Link to="/login" className="btn-primary text-center">Back to Sign In</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-charcoal/70">
              Enter your account email and we'll send you a secure link to create a new password.
            </p>
            <div>
              <label className="eyebrow mb-1 block">Email address</label>
              <input
                type="email" required autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
            <div className="text-center">
              <Link to="/login" className="text-xs text-charcoal/60 hover:text-ink underline">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
