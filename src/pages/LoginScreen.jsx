import { useState } from "react";
import { COLORS } from "../utils/constants";
import { Icon } from "../components/Icons";
import { useToast } from "../components/UI";
import { useUser } from "../context/UserContext";

export function LoginScreen({ onBack }) {
  const [role, setRole] = useState("user");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { show, node: toastNode } = useToast();
  const { login } = useUser();

  const handleSendOTP = async () => {
    if (!phone) { show("Enter your phone number", "error"); return; }
    setLoading(true);

    try {
      const res = await fetch("https://ka4hjb23ie.execute-api.ap-south-1.amazonaws.com/dev/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        console.log("✅ OTP Received from Lambda:", data.otp);
        setOtpSent(true);
        show("OTP sent! Check your browser console.", "info");
      } else {
        show(data.error || "Failed to send OTP", "error");
      }
    } catch (err) {
      setLoading(false);
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
      const res = await fetch("https://ka4hjb23ie.execute-api.ap-south-1.amazonaws.com/dev/login", {
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
              <button key={r} className={`tab ${role === r ? "active" : ""}`} onClick={() => { setRole(r); setOtpSent(false); setOtp(""); }}>{l}</button>
            ))}
          </div>

          {(role === "user" || role === "hsa") && (
            <>
              <div className="field">
                <label className="label">Phone Number</label>
                <input className="input" placeholder="+91 98765 43210" value={phone} disabled={otpSent} onChange={e => setPhone(e.target.value)} />
              </div>

              {otpSent && (
                <div className="field">
                  <label className="label">Received OTP</label>
                  <input className="input" placeholder="••••••" maxLength={6} style={{ letterSpacing: "0.4em", fontSize: 22, textAlign: "center" }} value={otp} onChange={e => setOtp(e.target.value)} />
                </div>
              )}

              <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} onClick={!otpSent ? handleSendOTP : handleLogin}>
                {!otpSent ? "Send OTP →" : "Login"}
              </button>
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
