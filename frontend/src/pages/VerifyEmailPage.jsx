import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import { verifyEmail } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { getCurrentUser } from "../api/auth";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("No verification token found in the URL."); return; }
    verifyEmail(token)
      .then(({ data }) => {
        setStatus("success");
        setMessage(data.message);
        // Refresh the auth context so the verification banner disappears immediately
        getCurrentUser().then(({ data: d }) => refreshUser(d.user)).catch(() => {});
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e.response?.data?.message || "Verification failed. The link may have expired.");
      });
  }, [token]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader size={48} className="mx-auto animate-spin text-charcoal/30" strokeWidth={1.5} />
            <h1 className="font-display text-2xl">Verifying your email…</h1>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle size={56} className="mx-auto text-green-500" strokeWidth={1.5} />
            <h1 className="font-display text-3xl">Email Verified</h1>
            <div className="stitch-rule mx-auto w-20 text-ink/20" />
            <p className="text-sm text-charcoal/70">{message}</p>
            <div className="flex justify-center gap-4 pt-2">
              <Link to="/shop" className="btn-primary">Shop Now</Link>
              <Link to="/profile" className="btn-outline">My Account</Link>
            </div>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={56} className="mx-auto text-red-400" strokeWidth={1.5} />
            <h1 className="font-display text-3xl">Verification Failed</h1>
            <div className="stitch-rule mx-auto w-20 text-ink/20" />
            <p className="text-sm text-charcoal/70">{message}</p>
            <p className="text-sm text-charcoal/60">
              If your link expired, sign in and click <strong>Resend link</strong> in the banner at the top of the page.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <Link to="/login" className="btn-primary">Sign In</Link>
              <Link to="/" className="btn-outline">Go Home</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
