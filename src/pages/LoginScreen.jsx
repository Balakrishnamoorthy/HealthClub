import { useState } from "react";
import { COLORS } from "../utils/constants";
import { Icon } from "../components/Icons";
import { useToast } from "../components/UI";
import { useUser } from "../context/UserContext";

const API_BASE = import.meta.env.VITE_API_BASE;

export function LoginScreen({ onBack }) {
  const [role, setRole] = useState("user");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { show, node: toastNode } = useToast();
  const { login } = useUser();

  // Role-aware OTP flow:
  // Step 1 — verify that the phone+role exists in DB
  // Step 2 — only then send OTP
  const handleSendOTP = async () => {
    if (!phone) { show("Enter your phone number", "error"); return; }
    setVerifying(true);

    try {
      // Step 1: Check if user exists for this role
      const verifyRes = await fetch(`${API_BASE}/verify-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, role })
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.found) {
        setVerifying(false);
        const roleLabel = role === "user" ? "member" : "HSA";
        const errMsg = verifyData.error ||
          `No ${roleLabel} account found with this number. Please register first.`;
        show(errMsg, "error");
        return;
      }

      // Step 2: User exists — now send OTP
      const otpRes = await fetch(`${API_BASE}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const otpData = await otpRes.json();
      setVerifying(false);

      if (otpRes.ok) {
        console.log("✅ OTP Received from Lambda:", otpData.otp);
        setOtpSent(true);
        show("OTP sent! Check your browser console.", "info");
      } else {
        show(otpData.error || "Failed to send OTP", "error");
      }
    } catch (err) {
      setVerifying(false);
      show("Network connection error.", "error");
    }
  };

  const handleLogin = async () => {
    if (role === "admin") {
      if (pin !== "123456") {
        show("Invalid Admin PIN", "error");
        return;
      }
      setLoading(true);
      setTimeout(() => { setLoading(false); login("admin", {}); }, 1000);
      return;
    }

    if (otpSent && !otp) { show("Please enter the OTP", "error"); return; }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, role })
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        login(role, data.user);
      } else {
        show(data.error || "Login failed", "error");
      }
    } catch (err) {
      setLoading(false);
      show("Network connection error.", "error");
    }
  };

  const resetFlow = () => {
    setOtpSent(false);
    setOtp("");
    setPhone("");
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      {toastNode}
      <div className="dot-grid" />
      <div className="hero-glow" />
      <div style={{ width: "100%", maxWidth: 460, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", width: 56, height: 56, background: COLORS.emerald, borderRadius: 16, alignItems: "center", justifyContent: "center", color: COLORS.navy, marginBottom: 16 }}>
            <Icon.Heart />
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, color: "white", marginBottom: 8 }}>HealthClub</h1>
          <p style={{ color: COLORS.slate, fontSize: 15 }}>Sign in to your account</p>
        </div>

        <div className="card" style={{ padding: 36 }}>
          <div className="tab-list" style={{ marginBottom: 28 }}>
            {[["user", "Member"], ["hsa", "HSA"], ["admin", "Admin"]].map(([r, l]) => (
              <button key={r} className={`tab ${role === r ? "active" : ""}`} onClick={() => { setRole(r); setOtpSent(false); setOtp(""); setPhone(""); }}>{l}</button>
            ))}
          </div>

          {(role === "user" || role === "hsa") && (
            <>
              <div className="field">
                <label className="label">Phone Number</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className="input"
                    placeholder="+91 98765 43210"
                    value={phone}
                    disabled={otpSent}
                    onChange={e => setPhone(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {otpSent && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={resetFlow}
                      title="Change number"
                      style={{ flexShrink: 0, padding: "8px 10px" }}
                    >
                      <Icon.Edit />
                    </button>
                  )}
                </div>
              </div>

              {/* Role-aware hint */}
              {!otpSent && (
                <p style={{ fontSize: 12, color: COLORS.slate, marginBottom: 16, marginTop: -8 }}>
                  {role === "user"
                    ? "Enter the phone number you registered as a member."
                    : "Enter your HSA assigned phone number."}
                </p>
              )}

              {otpSent && (
                <div className="field">
                  <label className="label">Enter OTP</label>
                  <input
                    className="input"
                    placeholder="••••••"
                    maxLength={6}
                    style={{ letterSpacing: "0.4em", fontSize: 22, textAlign: "center" }}
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    autoFocus
                  />
                  <p style={{ fontSize: 12, color: COLORS.slate, marginTop: 6 }}>
                    OTP sent to {phone}. Check your browser console (demo mode).
                  </p>
                </div>
              )}

              <button
                className="btn btn-primary w-full"
                style={{ justifyContent: "center" }}
                onClick={!otpSent ? handleSendOTP : handleLogin}
                disabled={verifying || loading}
              >
                {verifying ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 8 }} />Checking...</>
                ) : loading ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 8 }} />Logging in...</>
                ) : !otpSent ? (
                  "Send OTP →"
                ) : (
                  "Login →"
                )}
              </button>

              {!otpSent && (
                <p style={{ textAlign: "center", fontSize: 13, color: COLORS.slate, marginTop: 16 }}>
                  Don't have an account?{" "}
                  <a href="/onboarding" style={{ color: COLORS.emerald, fontWeight: 600, textDecoration: "none" }}>
                    Register here
                  </a>
                </p>
              )}
            </>
          )}

          {role === "admin" && (
            <>
              <div className="field">
                <label className="label">Admin PIN</label>
                <input className="input" type="password" placeholder="••••••" maxLength={6} style={{ letterSpacing: "0.4em", fontSize: 22, textAlign: "center" }} value={pin} onChange={e => setPin(e.target.value)} />
              </div>
              <button className="btn btn-primary w-full" style={{ justifyContent: "center", background: "#A855F7" }} onClick={handleLogin}>
                Admin Login →
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ color: COLORS.slate }}>← Back to Home</button>
        </div>
      </div>
    </div>
  );
}
