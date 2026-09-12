import React, { useState } from "react";
import { MailWarning, X, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { resendVerification } from "../../api/auth";

const VerificationBanner = () => {
  const { user, isAuthenticated } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthenticated || user?.is_email_verified || user?.role === "admin" || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    setError("");
    try {
      await resendVerification();
      setSent(true);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to resend. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative bg-amber-50 border-b border-amber-200">
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <MailWarning size={16} className="text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              <strong>Verify your email</strong> to place orders.
              We sent a link to <strong>{user?.email}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!sent ? (
              <button
                onClick={handleResend}
                disabled={sending}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-700 underline hover:text-amber-900 disabled:opacity-50"
              >
                <RefreshCw size={12} className={sending ? "animate-spin" : ""} />
                {sending ? "Sending…" : "Resend link"}
              </button>
            ) : (
              <span className="text-xs text-green-700 font-medium">✓ Email sent — check your inbox</span>
            )}
            {error && <span className="text-xs text-red-600">{error}</span>}
            <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-amber-500 hover:text-amber-700">
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationBanner;
