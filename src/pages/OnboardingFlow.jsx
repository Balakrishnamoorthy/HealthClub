import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, PLANS, DURATIONS, INTERVALS, AREAS } from "../utils/constants";
import { Icon } from "../components/Icons";
import { useToast, Steps } from "../components/UI";

import { useUser } from "../context/UserContext";

export function OnboardingFlow() {

  const nav = useNavigate();
  const { login } = useUser();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState({ plan: null, duration: null, interval: null });
  const [details, setDetails] = useState({ name: "", phone: "", email: "", area: "" });
  const [startDate, setStartDate] = useState("");
  const [errors, setErrors] = useState({});
  const { show, node: toastNode } = useToast();

  const steps = ["Choose Plan", "Select Interval", "Personal Details", "Payment", "Schedule"];
  const planObj = PLANS.find(p => p.id === selected.plan);
  const durationObj = DURATIONS.find(d => d.id === selected.duration);
  const intervalObj = INTERVALS.find(i => i.id === selected.interval);

  const totalPrice = planObj && durationObj
    ? Math.round(planObj.price * durationObj.months * (1 - durationObj.discount / 100))
    : 0;

  const validateDetails = async () => {
    const e = {};
    if (details.name.trim().length < 3) e.name = "Name must be at least 3 characters";
    if (!/^\+?[0-9]{10}$/.test(details.phone.trim())) e.phone = "Phone number must be at least 10 digits";
    if (!/\S+@\S+\.\S+/.test(details.email.trim())) e.email = "Valid email required";
    if (!details.area.trim()) e.area = "Area is required";
    setErrors(e);
    if (Object.keys(e).length > 0) return false;

    // Check phone uniqueness before proceeding to payment
    try {
      const res = await fetch("https://ka4hjb23ie.execute-api.ap-south-1.amazonaws.com/dev/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: details.phone.trim() })
      });
      if (res.status === 409) {
        setErrors(prev => ({ ...prev, phone: "This phone number is already registered. Please login instead." }));
        show("Phone number already registered. Please login instead.", "error");
        return false;
      }
    } catch {
      show("Could not verify phone number. Please try again.", "error");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (step === 0 && (!selected.plan || !selected.duration)) { show("Please select a plan and duration", "error"); return; }
    if (step === 1 && !selected.interval) { show("Please select an interval", "error"); return; }
    if (step === 2 && !(await validateDetails())) return;
    if (step === 3) { show("Payment processed successfully!", "success"); setTimeout(() => setStep(s => s + 1), 800); return; }
    if (step === 4) {
      if (!startDate) { show("Please select a start date", "error"); return; }

      const payload = { ...selected, ...details, startDate, planObj, durationObj, intervalObj, totalPrice };
      try {
        const res = await fetch("https://ka4hjb23ie.execute-api.ap-south-1.amazonaws.com/dev/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok) {
          show("Account created successfully!", "success");
          setTimeout(() => onComplete(data.user), 1500);
        } else if (res.status === 409) {
          show(data.error || "Phone number already registered.", "error");
          setStep(2);
          setErrors(prev => ({ ...prev, phone: "This phone number is already registered. Please login instead." }));
        } else {
          show(data.error || "Failed to create account", "error");
        }
      } catch (err) {
        show("Network connection error.", "error");
      }
      return;
    }
    setStep(s => s + 1);
  };

  const onComplete = (user) => {
    login(user.role, user);
    nav("/user");
  }

  const onBack = () => {
    nav("/");
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.offWhite }}>
      {toastNode}
      <nav style={{ background: COLORS.white, borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "0 60px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: COLORS.navy }}>HealthClub</div>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back to Home</button>
      </nav>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <Steps current={step} steps={steps} />

        {/* STEP 0: Plan & Duration */}
        {step === 0 && (
          <div className="fade-in">
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: COLORS.navy, marginBottom: 8 }}>Choose your health plan</h2>
            <p style={{ color: COLORS.slate, marginBottom: 32 }}>Select the plan that matches your health monitoring needs.</p>
            <div className="grid-3" style={{ gap: 20, marginBottom: 36 }}>
              {PLANS.map(plan => (
                <div key={plan.id} className={`plan-card ${selected.plan === plan.id ? "selected" : ""}`}
                  onClick={() => setSelected(s => ({ ...s, plan: plan.id }))} style={{ position: "relative" }}>
                  {plan.popular && <div className="plan-popular-badge">Popular</div>}
                  {selected.plan === plan.id && (
                    <div style={{ position: "absolute", top: 16, left: 16, width: 22, height: 22, background: COLORS.emerald, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.emeraldLight }}>
                      <Icon.Check />
                    </div>
                  )}
                  <div style={{ width: 40, height: 40, background: plan.color + "22", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: plan.color, marginBottom: 16 }}>
                    <Icon.Activity />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ fontSize: 28, fontFamily: "'DM Serif Display', serif", color: COLORS.navy, marginBottom: 12 }}>₹{plan.price}<span style={{ fontSize: 14, fontFamily: "Sora", fontWeight: 400, color: COLORS.slate }}>/mo</span></div>
                  {plan.features.slice(0, 3).map(f => (
                    <div key={f} className="plan-feature" style={{ fontSize: 13 }}>
                      <div className="check" style={{ width: 16, height: 16 }}><Icon.Check /></div>{f}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {selected.plan && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.navy, marginBottom: 16 }}>Subscription duration</h3>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {DURATIONS.map(d => (
                    <div key={d.id} onClick={() => setSelected(s => ({ ...s, duration: d.id }))}
                      style={{ padding: "16px 24px", borderRadius: 12, border: `2px solid ${selected.duration === d.id ? COLORS.emerald : "rgba(0,0,0,0.1)"}`, cursor: "pointer", transition: "all 0.2s", background: selected.duration === d.id ? COLORS.emeraldLight : COLORS.white, flex: 1, minWidth: 140 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy }}>{d.label}</div>
                      {d.discount > 0 && <div style={{ fontSize: 12, color: COLORS.emerald, fontWeight: 600, marginTop: 4 }}>Save {d.discount}%</div>}
                      {planObj && <div style={{ fontSize: 13, color: COLORS.slate, marginTop: 6 }}>₹{Math.round(planObj.price * d.months * (1 - d.discount / 100)).toLocaleString()} total</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 1: Interval */}
        {step === 1 && planObj && (
          <div className="fade-in">
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: COLORS.navy, marginBottom: 8 }}>Select visit interval</h2>
            <p style={{ color: COLORS.slate, marginBottom: 32 }}>How often would you like your HSA to visit?</p>
            {/* Plan summary */}
            <div className="card" style={{ padding: "20px 24px", marginBottom: 32, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 48, height: 48, background: planObj.color + "22", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: planObj.color }}>
                <Icon.Package />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: COLORS.navy }}>{planObj.name}</div>
                <div style={{ fontSize: 13, color: COLORS.slate }}>{durationObj?.label} · ₹{totalPrice.toLocaleString()} total</div>
              </div>
              <span className="badge badge-success">Confirmed</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {INTERVALS.map(interval => (
                <div key={interval.id} onClick={() => setSelected(s => ({ ...s, interval: interval.id }))}
                  style={{ padding: "20px 24px", borderRadius: 14, border: `2px solid ${selected.interval === interval.id ? COLORS.emerald : "rgba(0,0,0,0.1)"}`, cursor: "pointer", transition: "all 0.2s", background: selected.interval === interval.id ? COLORS.emeraldLight : COLORS.white, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: selected.interval === interval.id ? COLORS.emerald : "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: selected.interval === interval.id ? COLORS.navy : COLORS.slate, transition: "all 0.2s" }}>
                    <Icon.Calendar />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: COLORS.navy, fontSize: 16 }}>{interval.label}</div>
                    <div style={{ fontSize: 13, color: COLORS.slate }}>{interval.desc}</div>
                  </div>
                  {selected.interval === interval.id && <div style={{ color: COLORS.emerald }}><Icon.Check /></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Personal Details */}
        {step === 2 && (
          <div className="fade-in">
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: COLORS.navy, marginBottom: 8 }}>Personal details</h2>
            <p style={{ color: COLORS.slate, marginBottom: 32 }}>Your phone number will be your login ID.</p>
            <div className="grid-2">
              <div className="field">
                <label className="label">Full Name</label>
                <input className="input" placeholder="Priya Sharma" value={details.name}
                  onChange={e => { setDetails({ ...details, name: e.target.value }); setErrors({ ...errors, name: "" }); }} />
                {errors.name && <div className="field-error">{errors.name}</div>}
              </div>
              <div className="field">
                <label className="label">Phone Number (Login ID)</label>
                <input className="input" placeholder="+91 98765 43210" value={details.phone}
                  onChange={e => { setDetails({ ...details, phone: e.target.value }); setErrors({ ...errors, phone: "" }); }} />
                {errors.phone && <div className="field-error">{errors.phone}</div>}
              </div>
              <div className="field">
                <label className="label">Email Address</label>
                <input className="input" placeholder="priya@email.com" value={details.email}
                  onChange={e => { setDetails({ ...details, email: e.target.value }); setErrors({ ...errors, email: "" }); }} />
                {errors.email && <div className="field-error">{errors.email}</div>}
              </div>
              <div className="field">
                <label className="label">Service Area</label>
                <select className="input select" value={details.area}
                  onChange={e => { setDetails({ ...details, area: e.target.value }); setErrors({ ...errors, area: "" }); }}>
                  <option value="">Select your area</option>
                  {AREAS.map(a => <option key={a} value={a}>{a} — {a === "AREA1" ? "Anna Nagar" : a === "AREA2" ? "T. Nagar" : a === "AREA3" ? "Adyar" : "Velachery"}</option>)}
                </select>
                {errors.area && <div className="field-error">{errors.area}</div>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Payment */}
        {step === 3 && (
          <div className="fade-in">
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: COLORS.navy, marginBottom: 8 }}>Secure payment</h2>
            <p style={{ color: COLORS.slate, marginBottom: 32 }}>Complete your subscription to activate your plan.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 28 }}>
              <div>
                <div className="card" style={{ padding: 28 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 20 }}>Payment Method</div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                    {["Credit Card", "UPI", "Net Banking"].map((m, i) => (
                      <div key={m} style={{ flex: 1, padding: "12px 8px", border: `2px solid ${i === 0 ? COLORS.emerald : "rgba(0,0,0,0.1)"}`, borderRadius: 10, textAlign: "center", fontSize: 13, fontWeight: 600, color: i === 0 ? COLORS.emerald : COLORS.slate, cursor: "pointer" }}>{m}</div>
                    ))}
                  </div>
                  <div className="field">
                    <label className="label">Card Number</label>
                    <input className="input" placeholder="4242 4242 4242 4242" />
                  </div>
                  <div className="grid-2">
                    <div className="field"><label className="label">Expiry</label><input className="input" placeholder="MM/YY" /></div>
                    <div className="field"><label className="label">CVV</label><input className="input" placeholder="•••" type="password" /></div>
                  </div>
                  <div className="field">
                    <label className="label">Name on Card</label>
                    <input className="input" placeholder={details.name || "Your Name"} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: COLORS.slate, marginTop: 8 }}>
                    <Icon.Shield /> <span>256-bit SSL secured · Your data is safe</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 20 }}>Order Summary</div>
                  <div className="stat-row"><span style={{ fontSize: 14, color: COLORS.slate }}>Plan</span><span style={{ fontSize: 14, fontWeight: 600 }}>{planObj?.name}</span></div>
                  <div className="stat-row"><span style={{ fontSize: 14, color: COLORS.slate }}>Duration</span><span style={{ fontSize: 14, fontWeight: 600 }}>{durationObj?.label}</span></div>
                  <div className="stat-row"><span style={{ fontSize: 14, color: COLORS.slate }}>Interval</span><span style={{ fontSize: 14, fontWeight: 600 }}>{intervalObj?.label}</span></div>
                  <div className="stat-row"><span style={{ fontSize: 14, color: COLORS.slate }}>Area</span><span className="area-chip">{details.area}</span></div>
                  {durationObj?.discount > 0 && (
                    <div className="stat-row"><span style={{ fontSize: 14, color: COLORS.slate }}>Discount</span><span style={{ color: COLORS.emerald, fontWeight: 700 }}>-{durationObj.discount}%</span></div>
                  )}
                  <div style={{ borderTop: "2px solid rgba(0,0,0,0.08)", marginTop: 16, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700 }}>Total</span>
                    <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: COLORS.navy }}>₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 6, textAlign: "right" }}>One-time payment</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Schedule */}
        {step === 4 && (
          <div className="fade-in">
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: COLORS.navy, marginBottom: 8 }}>Set your start date</h2>
            <p style={{ color: COLORS.slate, marginBottom: 32 }}>Your full schedule will be auto-generated based on your interval.</p>
            <div className="card" style={{ padding: 28, maxWidth: 480 }}>
              <div className="field">
                <label className="label">Start Date</label>
                <input className="input" type="date" value={startDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setStartDate(e.target.value)} />
              </div>
              {startDate && intervalObj && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Generated Schedule Preview</div>
                  {Array.from({ length: Math.min(4, durationObj?.months * (intervalObj.id === "weekly" ? 4 : intervalObj.id === "biweekly" ? 2 : 1)) }, (_, i) => {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() + i * intervalObj.days);
                    return d;
                  }).map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.emeraldLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: COLORS.emerald }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy }}>{d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</div>
                        <div style={{ fontSize: 12, color: COLORS.slate }}>HSA Home Visit · {planObj?.metrics.join(", ").replace(/_/g, " ")}</div>
                      </div>
                      <span className="badge badge-info" style={{ marginLeft: "auto" }}>Scheduled</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 12 }}>+ more visits over {durationObj?.label}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NAV BUTTONS */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40 }}>
          <button className="btn btn-ghost" onClick={() => step === 0 ? onBack() : setStep(s => s - 1)}>
            ← {step === 0 ? "Back to Home" : "Previous"}
          </button>
          <button className="btn btn-primary btn-lg" onClick={handleNext}>
            {step === 3 ? "Pay Now →" : step === 4 ? "Complete Setup →" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}
