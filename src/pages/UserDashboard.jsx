import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, AREAS, PLANS } from "../utils/constants";
import { Icon } from "../components/Icons";
import { useToast, Modal, Avatar, Gauge, MiniChart, BarChart, QRCode } from "../components/UI";
import { useUser } from "../context/UserContext";

const API_BASE = import.meta.env.VITE_API_BASE;

// ── Breadcrumb Component ─────────────────────────────────────────────────────
function Breadcrumb({ section, navItems, onNavigate }) {
  const nav = useNavigate();
  const currentLabel = navItems.find(n => n.id === section)?.label || "Overview";
  return (
    <nav aria-label="breadcrumb" style={{
      display: "flex", alignItems: "center", gap: 6,
      fontSize: 13, color: COLORS.slate,
      padding: "10px 0 18px",
      flexWrap: "wrap"
    }}>
      <span
        onClick={() => nav("/")}
        style={{ cursor: "pointer", color: COLORS.emerald, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
      >
        <span style={{ width: 14, height: 14, display: "inline-flex" }}><Icon.Home /></span>
        Home
      </span>
      <span style={{ opacity: 0.4 }}>/</span>
      <span
        onClick={() => onNavigate("overview")}
        style={{ cursor: "pointer", color: section === "overview" ? COLORS.navy : COLORS.slate, fontWeight: section === "overview" ? 700 : 400 }}
      >
        Dashboard
      </span>
      {section !== "overview" && (
        <>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ color: COLORS.navy, fontWeight: 700 }}>{currentLabel}</span>
        </>
      )}
    </nav>
  );
}

// ── Star Rating subcomponent ─────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 28, padding: 2, lineHeight: 1,
            color: star <= (hover || value) ? "#FFB547" : "#ddd",
            transition: "color 0.15s, transform 0.1s",
            transform: star <= (hover || value) ? "scale(1.15)" : "scale(1)"
          }}
        >★</button>
      ))}
    </div>
  );
}

export function UserDashboard({ user, onLogout }) {
  const [section, setSection] = useState("overview");
  const { updateUser } = useUser();
  const { show, node: toastNode } = useToast();

  // ── Modal state ──────────────────────────────────────────────────────────
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [upgradePlanModal, setUpgradePlanModal] = useState(false);

  // ── Feedback state ───────────────────────────────────────────────────────
  const [feedback, setFeedback] = useState({ rating: 5, comment: "" });
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // ── Reschedule state ─────────────────────────────────────────────────────
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [selectedOriginalDate, setSelectedOriginalDate] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // ── Upgrade Plan state ───────────────────────────────────────────────────
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // ── Profile state (controlled) ───────────────────────────────────────────
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profileArea, setProfileArea] = useState(user?.area || "AREA1");
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Reports ──────────────────────────────────────────────────────────────
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const plan = user?.planObj || PLANS.find(p => p.id === user?.plan) || PLANS[1];
  const duration = (user?.duration || "3M").toUpperCase();
  const durationMap = { "3M": "3 MONTHS", "6M": "6 MONTHS", "1Y": "1 YEAR" };
  const durationLabel = durationMap[duration] || duration;

  useEffect(() => {
    if (!user?.phone) return;
    fetch(`${API_BASE}/records/${encodeURIComponent(user.phone)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReports(data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        }
      })
      .catch(err => console.error("Failed to load reports:", err))
      .finally(() => setLoadingReports(false));
  }, [user]);

  const latestReport = reports.length > 0 ? reports[reports.length - 1] : null;
  const glucoseData = reports.map(r => parseInt(r.glucose) || 0);
  const pressureData = reports.map(r => parseInt(r.systolic) || 0);

  // ── Schedule ─────────────────────────────────────────────────────────────
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m, y) => new Date(y, m, 1).getDay();

  const [scheduleData, setScheduleData] = useState(null);

  // Extract as a named function so we can refresh after reschedule
  const fetchSchedule = () => {
    if (!user?.id) return;
    fetch(`${API_BASE}/user-schedule/${user.id}`)
      .then(res => res.json())
      .then(data => setScheduleData(data))
      .catch(err => console.error("Failed to load schedule:", err));
  };

  useEffect(() => { fetchSchedule(); }, [user]);

  const scheduledDates = new Set(scheduleData?.schedule || []);
  const scheduledDaysInMonth = Array.from(scheduledDates)
    .filter(d => {
      const dt = new Date(d + "T00:00:00");
      return dt.getFullYear() === calYear && dt.getMonth() === calMonth;
    })
    .map(d => new Date(d + "T00:00:00").getDate());

  const nextVisit = scheduleData?.nextVisit || null;
  const upcomingVisits = scheduleData?.upcomingVisits?.slice(0, 5) || [];

  // ── Nav items ────────────────────────────────────────────────────────────
  const navItems = [
    { id: "overview", label: "Overview", icon: <Icon.Home /> },
    { id: "reports", label: "Health Reports", icon: <Icon.BarChart /> },
    { id: "calendar", label: "Schedule", icon: <Icon.Calendar /> },
    { id: "notifications", label: "Notifications", icon: <Icon.Bell /> },
    { id: "profile", label: "Profile", icon: <Icon.Settings /> },
  ];

  // ── Sidebar collapse ─────────────────────────────────────────────────────
  const sidebarRef = useRef(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSidebarExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  // Date helpers
  const todayISO = new Date().toISOString().split("T")[0];
  const addDaysISO = (dateStr, days) => {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };
  const tomorrowISO = addDaysISO(todayISO, 1);

  // Compute min/max for the date picker based on the selected original date
  const computeRescheduleRange = (originalDate) => {
    if (!originalDate) return { min: tomorrowISO, max: "" };
    if (originalDate <= todayISO) {
      // Visit is today or already in the past — only postpone allowed
      const max = addDaysISO(originalDate, 2);
      return { min: tomorrowISO, max: max < tomorrowISO ? addDaysISO(todayISO, 2) : max };
    } else {
      // Future visit — allow ±2 days but never before today
      const minus2 = addDaysISO(originalDate, -2);
      return { min: minus2 < todayISO ? todayISO : minus2, max: addDaysISO(originalDate, 2) };
    }
  };

  const { min: rescheduleMin, max: rescheduleMax } = computeRescheduleRange(selectedOriginalDate);
  // Whether prepone is disallowed (visit is today or past)
  const onlyPostpone = selectedOriginalDate <= todayISO;

  const handleReschedule = async () => {
    if (!selectedOriginalDate) { show("Please select a visit to reschedule", "error"); return; }
    if (!rescheduleDate) { show("Please pick a new date", "error"); return; }
    if (rescheduleDate < tomorrowISO) { show("New date must be in the future", "error"); return; }
    if (onlyPostpone && rescheduleDate <= selectedOriginalDate) {
      show("This visit has already arrived — you can only postpone it", "error"); return;
    }
    setRescheduleLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          originalDate: selectedOriginalDate,  // the effective date user sees
          newDate: rescheduleDate
        })
      });
      const data = await res.json();
      if (res.ok) {
        show(`Visit rescheduled to ${new Date(rescheduleDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`, "success");
        setRescheduleModal(false);
        setRescheduleDate("");
        setSelectedOriginalDate("");
        // Refresh schedule so next-visit card updates immediately
        fetchSchedule();
      } else {
        show(data.error || "Failed to reschedule", "error");
      }
    } catch {
      show("Network error. Please try again.", "error");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleUpgradePlan = async () => {
    if (!selectedPlan) { show("Please select a plan", "error"); return; }
    setUpgradeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/${user?.id}/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan.id, planName: selectedPlan.name })
      });
      const data = await res.json();
      if (res.ok) {
        updateUser({ plan: selectedPlan.id, planObj: selectedPlan });
        show(`Upgraded to ${selectedPlan.name}!`, "success");
        setUpgradePlanModal(false);
        setSelectedPlan(null);
      } else {
        show(data.error || "Upgrade failed", "error");
      }
    } catch {
      show("Network error. Please try again.", "error");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.comment.trim()) { show("Please write a comment", "error"); return; }
    setFeedbackLoading(true);
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.name,
          phone: user?.phone,
          rating: feedback.rating,
          comment: feedback.comment
        })
      });
      const data = await res.json();
      if (res.ok) {
        show("Thank you for your feedback! 💚", "success");
        setFeedbackModal(false);
        setFeedback({ rating: 5, comment: "" });
      } else {
        show(data.error || "Failed to submit feedback", "error");
      }
    } catch {
      show("Network error. Please try again.", "error");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) { show("Name cannot be empty", "error"); return; }
    setProfileSaving(true);
    try {
      const res = await fetch(`${API_BASE}/user/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, email: profileEmail, area: profileArea })
      });
      const data = await res.json();
      if (res.ok) {
        updateUser({ name: profileName, email: profileEmail, area: profileArea });
        show("Profile saved successfully!", "success");
      } else {
        show(data.error || "Failed to save profile", "error");
      }
    } catch {
      show("Network error. Please try again.", "error");
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Shared modal footer button style ──────────────────────────────────────
  const primaryBtnStyle = { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };

  return (
    <div className="dashboard">
      {toastNode}

      {/* ── MODALS ── */}

      {/* Feedback Modal */}
      {feedbackModal && (
        <Modal
          title="Share Your Feedback"
          onClose={() => { setFeedbackModal(false); setFeedback({ rating: 5, comment: "" }); }}
          footer={
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setFeedbackModal(false)}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSubmitFeedback}
                disabled={feedbackLoading}
                style={primaryBtnStyle}
              >
                {feedbackLoading
                  ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Submitting...</>
                  : "Submit Feedback"}
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: COLORS.offWhite, borderRadius: 12, padding: 20, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: COLORS.slate, marginBottom: 12 }}>How would you rate your HealthClub experience?</p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <StarRating value={feedback.rating} onChange={r => setFeedback(f => ({ ...f, rating: r }))} />
              </div>
              <p style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: COLORS.navy }}>
                {["", "Poor", "Fair", "Good", "Great", "Excellent! 🎉"][feedback.rating]}
              </p>
            </div>
            <div>
              <label className="label" style={{ display: "block", fontSize: 12, color: COLORS.slate, marginBottom: 6 }}>
                Your comments (required)
              </label>
              <textarea
                className="input"
                placeholder="Tell us about your experience with HealthClub and your HSA..."
                value={feedback.comment}
                onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))}
                rows={4}
                style={{ width: "100%", padding: 12, resize: "vertical", fontFamily: "inherit", fontSize: 14, borderRadius: 10, border: "1px solid #e0e0e0" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, background: COLORS.emeraldLight, borderRadius: 10, fontSize: 13, color: COLORS.navy }}>
              <span>💚</span> Your feedback helps us improve the experience for all members.
            </div>
          </div>
        </Modal>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <Modal
          title="Reschedule Your Visit"
          onClose={() => { setRescheduleModal(false); setRescheduleDate(""); setSelectedOriginalDate(""); }}
          footer={
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setRescheduleModal(false)}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleReschedule}
                disabled={rescheduleLoading || !rescheduleDate || !selectedOriginalDate}
                style={primaryBtnStyle}
              >
                {rescheduleLoading
                  ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</>
                  : "Confirm Reschedule"}
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Step 1: Select which visit to reschedule */}
            <div>
              <label className="label" style={{ display: "block", fontSize: 12, color: COLORS.slate, marginBottom: 8, fontWeight: 700 }}>
                Which visit do you want to reschedule?
              </label>
              {upcomingVisits.length === 0 ? (
                <div style={{ padding: 14, background: COLORS.offWhite, borderRadius: 10, fontSize: 13, color: COLORS.slate }}>
                  No upcoming visits found.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {upcomingVisits.map((dateStr, idx) => {
                    const isToday = dateStr === todayISO;
                    const isPast = dateStr < todayISO;
                    const isSelected = selectedOriginalDate === dateStr;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedOriginalDate(dateStr);
                          setRescheduleDate(""); // reset date when switching visit
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "12px 14px", borderRadius: 10,
                          border: `2px solid ${isSelected ? COLORS.emerald : "#e5e7eb"}`,
                          background: isSelected ? COLORS.emeraldLight : "white",
                          cursor: "pointer", transition: "all 0.15s"
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: isSelected ? COLORS.emerald : COLORS.offWhite,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700,
                          color: isSelected ? COLORS.navy : COLORS.slate, flexShrink: 0
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy }}>
                            {new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                          </div>
                          <div style={{ fontSize: 11, color: COLORS.slate }}>HSA Home Visit · {user?.area}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {isToday && <span className="badge badge-warning" style={{ fontSize: 10 }}>Today</span>}
                          {isPast && <span className="badge" style={{ fontSize: 10, background: "#fee", color: "#c00" }}>Past</span>}
                          {isSelected && <span className="badge badge-success" style={{ fontSize: 10 }}>Selected</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Pick new date (only shown after selecting a visit) */}
            {selectedOriginalDate && (
              <>
                <div style={{ height: 1, background: "#f0f0f0" }} />
                {/* Constraint info */}
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  padding: 12, borderRadius: 10, fontSize: 13,
                  background: onlyPostpone ? "#FFF8E6" : COLORS.emeraldLight,
                  color: onlyPostpone ? "#92680A" : COLORS.navy
                }}>
                  <span style={{ flexShrink: 0 }}>{onlyPostpone ? "⚠️" : "ℹ️"}</span>
                  <span>
                    {onlyPostpone
                      ? `This visit is ${selectedOriginalDate === todayISO ? "today" : "in the past"} — you can only postpone it (up to ${new Date(rescheduleMax + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}).`
                      : `You can reschedule this visit ±2 days (${new Date(rescheduleMin + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(rescheduleMax + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}).`
                    }
                  </span>
                </div>
                <div>
                  <label className="label" style={{ display: "block", fontSize: 12, color: COLORS.slate, marginBottom: 6, fontWeight: 700 }}>
                    Select New Date
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={rescheduleDate}
                    min={rescheduleMin}
                    max={rescheduleMax}
                    onChange={e => setRescheduleDate(e.target.value)}
                    style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #e0e0e0", fontSize: 15 }}
                  />
                </div>
                <div style={{ fontSize: 12, color: COLORS.slate, padding: "0 4px" }}>
                  ⚡ Your HSA will be notified of the change. Rescheduling is limited to once per interval.
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Upgrade Plan Modal */}
      {upgradePlanModal && (
        <Modal
          title="Upgrade Your Plan"
          size="lg"
          onClose={() => { setUpgradePlanModal(false); setSelectedPlan(null); }}
          footer={
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setUpgradePlanModal(false)}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleUpgradePlan}
                disabled={upgradeLoading || !selectedPlan || selectedPlan?.id === plan?.id}
                style={primaryBtnStyle}
              >
                {upgradeLoading
                  ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Upgrading...</>
                  : selectedPlan
                    ? `Upgrade to ${selectedPlan.name}`
                    : "Select a Plan"}
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, color: COLORS.slate }}>
              Currently on <strong style={{ color: COLORS.navy }}>{plan?.name}</strong>. Select a new plan below.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PLANS.map(p => {
                const isCurrent = p.id === (user?.plan || plan?.id);
                const isSelected = selectedPlan?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isCurrent && setSelectedPlan(p)}
                    style={{
                      border: `2px solid ${isSelected ? p.color : isCurrent ? COLORS.emerald : "#e5e7eb"}`,
                      borderRadius: 14,
                      padding: "16px 20px",
                      cursor: isCurrent ? "not-allowed" : "pointer",
                      opacity: isCurrent ? 0.6 : 1,
                      background: isSelected ? p.color + "10" : isCurrent ? COLORS.emeraldLight : "white",
                      transition: "all 0.18s",
                      display: "flex", alignItems: "center", gap: 16
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: p.color + "22", display: "flex", alignItems: "center", justifyContent: "center", color: p.color, flexShrink: 0 }}>
                      <Icon.Activity />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: COLORS.navy }}>{p.name}</span>
                        {isCurrent && <span className="badge badge-success" style={{ fontSize: 10 }}>Current</span>}
                        {p.popular && !isCurrent && <span className="badge badge-info" style={{ fontSize: 10 }}>Popular</span>}
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.slate }}>{p.description}</div>
                      <div style={{ fontSize: 13, color: COLORS.slate, marginTop: 4 }}>
                        {p.features.slice(0, 2).join(" · ")}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: p.color, fontFamily: "'DM Serif Display', serif" }}>
                        ₹{p.price.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.slate }}>/month</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: COLORS.slate, textAlign: "center" }}>
              Plan changes are prorated · No hidden fees · Cancel anytime
            </div>
          </div>
        </Modal>
      )}

      {/* SIDEBAR */}
      <aside
        ref={sidebarRef}
        className={`sidebar${sidebarExpanded ? " sidebar-expanded" : ""}`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div className="sidebar-logo">
          <span style={{ width: 32, height: 32, background: COLORS.emerald, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.navy, flexShrink: 0 }}>
            <Icon.Heart />
          </span>
          <span className="sidebar-logo-text">HealthClub</span>
        </div>
        <div className="sidebar-section">Main Menu</div>
        {navItems.map(item => (
          <div key={item.id} className={`nav-item ${section === item.id ? "active" : ""}`}
            onClick={() => { setSection(item.id); setSidebarExpanded(false); }}>
            {item.icon}<span className="nav-label">{item.label}</span>
          </div>
        ))}
        <div className="sidebar-section" style={{ marginTop: "auto" }}><span className="nav-label">Account</span></div>
        <div className="nav-item" onClick={() => { setSidebarExpanded(false); onLogout(); }}><Icon.Logout /><span className="nav-label">Log out</span></div>
      </aside>

      {/* MAIN */}
      <main className="main-content">

        {/* OVERVIEW */}
        {section === "overview" && (
          <>
            <div className="page-header">
              <div>
                <Breadcrumb section={section} navItems={navItems} onNavigate={setSection} />
                <p style={{ fontSize: 13, color: COLORS.slate, marginBottom: 4 }}>Welcome back 👋</p>
                <h1 className="page-title">{user?.name || "Member"}</h1>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="badge badge-success">● {plan.name} Active</span>
                <button className="btn btn-outline btn-sm" onClick={() => setFeedbackModal(true)}>
                  <Icon.MessageSquare /> Feedback
                </button>
              </div>
            </div>
            <div className="page-body">
              {loadingReports ? (
                <div style={{ textAlign: "center", padding: 40, color: COLORS.slate, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span className="spinner" style={{ borderColor: COLORS.emerald, borderTopColor: "transparent" }}></span>
                  <br /><br />Loading health data...
                </div>
              ) : !latestReport ? (
                <div className="card" style={{ padding: 40, textAlign: "center", background: COLORS.offWhite }}>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: COLORS.navy, marginBottom: 12 }}>No Health Records Found</h3>
                  <p style={{ color: COLORS.slate }}>Your HSA hasn't uploaded any readings for you yet. They will appear here once submitted.</p>
                </div>
              ) : (
                <>
                  {/* Gauges */}
                  <div className="card overviewCard" style={{ padding: "28px 32px", marginBottom: 24, background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Latest Reading</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                          {new Date(latestReport.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <span className={`badge ${latestReport.status === 'attention' ? 'badge-warning' : 'badge-success'}`}>
                        {latestReport.status === 'attention' ? 'Needs Attention' : 'All Normal'}
                      </span>
                    </div>
                    <div className="gauge-grid">
                      <Gauge value={latestReport.glucose} max={200} label="Glucose" color={COLORS.glucose} />
                      <Gauge value={latestReport.systolic} max={200} label="Systolic" color={COLORS.pressure} />
                      <Gauge value={latestReport.diastolic} max={120} label="Diastolic" color="#A855F7" />
                      {plan.metrics?.includes("cholesterol") && (
                        <Gauge value={latestReport.cholesterol} max={300} label="Cholesterol" color={COLORS.cholesterol} />
                      )}
                    </div>
                  </div>
                  {/* Trend cards */}
                  <div className="grid-3" style={{ gap: 20, marginBottom: 24 }}>
                    <div className="card" style={{ padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.07em" }}>Blood Glucose</div>
                      </div>
                      <div style={{ fontSize: 28, fontFamily: "'DM Serif Display', serif", color: COLORS.glucose, marginBottom: 8 }}>{latestReport.glucose} <span style={{ fontSize: 13, color: COLORS.slate, fontFamily: "Sora" }}>mg/dL</span></div>
                      <MiniChart data={glucoseData} color={COLORS.glucose} />
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.07em" }}>Blood Pressure</div>
                      </div>
                      <div style={{ fontSize: 28, fontFamily: "'DM Serif Display', serif", color: COLORS.pressure, marginBottom: 8 }}>{latestReport.systolic}/{latestReport.diastolic} <span style={{ fontSize: 13, color: COLORS.slate, fontFamily: "Sora" }}>mmHg</span></div>
                      <MiniChart data={pressureData} color={COLORS.pressure} />
                    </div>
                    {plan.metrics?.includes("cholesterol") && (
                      <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.07em" }}>Cholesterol</div>
                        </div>
                        <div style={{ fontSize: 28, fontFamily: "'DM Serif Display', serif", color: COLORS.cholesterol, marginBottom: 8 }}>{latestReport.cholesterol} <span style={{ fontSize: 13, color: COLORS.slate, fontFamily: "Sora" }}>mg/dL</span></div>
                        <MiniChart data={reports.map(r => parseInt(r.cholesterol) || 0)} color={COLORS.cholesterol} />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Upcoming + Subscription */}
              <div className="grid-2" style={{ gap: 20, marginTop: 20 }}>
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: COLORS.navy, marginBottom: 16 }}>Next Visit</h3>
                  <div style={{ background: COLORS.emeraldLight, border: `1px solid ${COLORS.emerald}22`, borderRadius: 12, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, background: COLORS.emerald, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.navy, fontSize: 20 }}>📅</div>
                      <div>
                        {nextVisit ? (
                          <>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy }}>
                                {nextVisit === todayISO
                                  ? "Today"
                                  : new Date(nextVisit + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
                                }
                              </div>
                              {nextVisit === todayISO && (
                                <span className="badge badge-warning" style={{ fontSize: 10 }}>Today</span>
                              )}
                            </div>
                            <div style={{ fontSize: 13, color: COLORS.slate }}>HSA Home Visit · {user?.area || ""}</div>
                            {nextVisit === todayISO && upcomingVisits.length > 1 && (
                              <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 4 }}>
                                Next after today: <strong style={{ color: COLORS.navy }}>
                                  {new Date(upcomingVisits[1] + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </strong>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy }}>No upcoming visits</div>
                            <div style={{ fontSize: 13, color: COLORS.slate }}>Your subscription may have ended</div>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.slate, marginBottom: 16 }}>Location: <strong style={{ color: COLORS.navy }}>{user?.area || "N/A"}</strong></div>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        // Pre-select the first upcoming visit (or nextVisit) on open
                        setSelectedOriginalDate(upcomingVisits[0] || nextVisit || "");
                        setRescheduleDate("");
                        setRescheduleModal(true);
                      }}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      <Icon.Edit /> Reschedule Visit
                    </button>
                  </div>
                </div>
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: COLORS.navy, marginBottom: 16 }}>Subscription</h3>
                  <div className="stat-row" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "8px 0", display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 14, color: COLORS.slate }}>Plan</span><span className="badge badge-success">{plan.name}</span></div>
                  <div className="stat-row" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "8px 0", display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 14, color: COLORS.slate }}>Duration</span><span className="badge badge-success">{durationLabel}</span></div>
                  <button
                    className="btn btn-outline btn-sm mt-16"
                    onClick={() => setUpgradePlanModal(true)}
                  >
                    Upgrade Plan →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* REPORTS */}
        {section === "reports" && (
          <>
            <div className="page-header">
              <div>
                <Breadcrumb section={section} navItems={navItems} onNavigate={setSection} />
                <h1 className="page-title">Health Reports</h1>
              </div>
              <button className="btn btn-outline btn-sm"><Icon.Upload /> Export PDF</button>
            </div>
            <div className="page-body">
              {reports.length > 0 ? (
                <>
                  {plan.metrics?.includes("blood_glucose") && (
                    <div className="card" style={{ padding: 28, marginBottom: 24 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: COLORS.navy }}>Blood Glucose Trend</h3>
                        <span className="badge badge-neutral" style={{ background: COLORS.glucose + "22", color: COLORS.glucose }}>mg/dL</span>
                      </div>
                      <p style={{ fontSize: 12, color: COLORS.slate, marginBottom: 20 }}>Normal range: 70 – 140 mg/dL</p>
                      <BarChart
                        data={reports.map((r, i) => ({ label: `Visit${i + 1}`, value: parseInt(r.glucose) || 0 }))}
                        colors={[COLORS.glucose, COLORS.glucose + "99"]}
                      />
                    </div>
                  )}
                  {plan.metrics?.includes("blood_pressure") && (
                    <div className="card" style={{ padding: 28, marginBottom: 24 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: COLORS.navy }}>Blood Pressure Trend</h3>
                        <span className="badge badge-neutral" style={{ background: COLORS.pressure + "22", color: COLORS.pressure }}>mmHg</span>
                      </div>
                      <p style={{ fontSize: 12, color: COLORS.slate, marginBottom: 20 }}>Systolic · Normal range: &lt;120 mmHg &nbsp;|&nbsp; Diastolic · Normal range: &lt;80 mmHg</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Systolic</div>
                          <BarChart
                            data={reports.map((r, i) => ({ label: `V${i + 1}`, value: parseInt(r.systolic) || 0 }))}
                            colors={[COLORS.pressure, COLORS.pressure + "99"]}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Diastolic</div>
                          <BarChart
                            data={reports.map((r, i) => ({ label: `V${i + 1}`, value: parseInt(r.diastolic) || 0 }))}
                            colors={["#A855F7", "#A855F799"]}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {plan.metrics?.includes("cholesterol") && (
                    <div className="card" style={{ padding: 28, marginBottom: 24 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: COLORS.navy }}>Cholesterol Trend</h3>
                        <span className="badge badge-neutral" style={{ background: COLORS.cholesterol + "44", color: "#b07e00" }}>mg/dL</span>
                      </div>
                      <p style={{ fontSize: 12, color: COLORS.slate, marginBottom: 20 }}>Normal total cholesterol: &lt;200 mg/dL</p>
                      <BarChart
                        data={reports.map((r, i) => ({ label: `Visit${i + 1}`, value: parseInt(r.cholesterol) || 0 }))}
                        colors={[COLORS.cholesterol, COLORS.cholesterol + "99"]}
                      />
                    </div>
                  )}
                  <div className="card" style={{ overflow: "hidden" }}>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: COLORS.navy }}>All Reports</h3>
                    </div>
                    <table className="table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #ddd" }}>
                          <th style={{ padding: "12px" }}>Date</th>
                          <th style={{ padding: "12px" }}>Glucose (mg/dL)</th>
                          <th style={{ padding: "12px" }}>BP (mmHg)</th>
                          <th style={{ padding: "12px" }}>Cholesterol (mg/dL)</th>
                          <th style={{ padding: "12px" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...reports].reverse().map(r => (
                          <tr key={r.recordId} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ fontWeight: 600, padding: "12px" }}>{new Date(r.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                            <td style={{ color: COLORS.glucose, fontWeight: 600, padding: "12px" }}>{r.glucose}</td>
                            <td style={{ color: COLORS.pressure, fontWeight: 600, padding: "12px" }}>{r.systolic}/{r.diastolic}</td>
                            <td style={{ color: COLORS.cholesterol, fontWeight: 600, padding: "12px" }}>{r.cholesterol}</td>
                            <td style={{ padding: "12px" }}><span className={`badge ${r.status !== "attention" ? "badge-success" : "badge-warning"}`}>{r.status !== "attention" ? "Normal" : "Review"}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="card" style={{ padding: 40, textAlign: "center", background: COLORS.offWhite }}>
                  <p style={{ color: COLORS.slate }}>No reports available yet.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* CALENDAR */}
        {section === "calendar" && (
          <>
            <div className="page-header">
              <div>
                <Breadcrumb section={section} navItems={navItems} onNavigate={setSection} />
                <h1 className="page-title">Schedule</h1>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}>←</button>
                <span style={{ fontWeight: 600, minWidth: 130, textAlign: "center" }}>
                  {new Date(calYear, calMonth).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}>→</button>
              </div>
            </div>
            <div className="page-body">
              <div className="grid-2" style={{ gap: 24, alignItems: "start" }}>
                <div className="card" style={{ padding: 24 }}>
                  <div className="cal-grid" style={{ marginBottom: 8, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                      <div key={d} className="cal-header" style={{ fontSize: 11, fontWeight: "bold", textAlign: "center", color: COLORS.slate }}>{d}</div>
                    ))}
                  </div>
                  <div className="cal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                    {Array.from({ length: getFirstDay(calMonth, calYear) }, (_, i) => (
                      <div key={`e${i}`} className="cal-day other-month" style={{ padding: 10, opacity: 0.2 }} />
                    ))}
                    {Array.from({ length: getDaysInMonth(calMonth, calYear) }, (_, i) => {
                      const day = i + 1;
                      const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                      const isScheduled = scheduledDaysInMonth.includes(day);
                      return (
                        <div key={day} className={`cal-day ${isScheduled ? "scheduled" : ""} ${isToday ? "today" : ""}`} style={{
                          padding: 10,
                          textAlign: "center",
                          borderRadius: 8,
                          border: isToday ? `2px solid ${COLORS.emerald}` : "none",
                          background: isScheduled ? COLORS.emerald : "transparent",
                          color: COLORS.navy,
                          fontWeight: isScheduled ? 700 : 400,
                          cursor: isScheduled ? "pointer" : "default"
                        }}>
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                    <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: COLORS.navy, marginBottom: 16 }}>Upcoming Visits</h3>
                    {upcomingVisits.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {upcomingVisits.map((dateStr, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: idx < upcomingVisits.length - 1 ? "1px solid #eee" : "none" }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: COLORS.emeraldLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: COLORS.emerald }}>{idx + 1}</div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy }}>
                                {new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                              </div>
                              <div style={{ fontSize: 12, color: COLORS.slate }}>HSA Home Visit · {user?.area}</div>
                            </div>
                            <span className="badge badge-info" style={{ marginLeft: "auto" }}>Scheduled</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 14, color: COLORS.slate }}>No upcoming visits scheduled.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* NOTIFICATIONS */}
        {section === "notifications" && (
          <>
            <div className="page-header">
              <div>
                <Breadcrumb section={section} navItems={navItems} onNavigate={setSection} />
                <h1 className="page-title">Notifications</h1>
              </div>
            </div>
            <div className="page-body">
              <div className="card" style={{ padding: 8 }}>
                <p style={{ padding: 20, color: COLORS.slate }}>You have no new notifications.</p>
              </div>
            </div>
          </>
        )}

        {/* PROFILE */}
        {section === "profile" && (
          <>
            <div className="page-header">
              <div>
                <Breadcrumb section={section} navItems={navItems} onNavigate={setSection} />
                <h1 className="page-title">Profile & Settings</h1>
              </div>
            </div>
            <div className="page-body">
              <div className="grid-2" style={{ gap: 24 }}>
                <div className="card" style={{ padding: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                    <Avatar name={user?.name || "Member"} size="lg" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.navy }}>{user?.name || "Member"}</div>
                      <div style={{ fontSize: 14, color: COLORS.slate }}>{user?.phone || ""}</div>
                    </div>
                  </div>
                  <div style={{ padding: 20, borderRadius: 12, background: COLORS.offWhite, textAlign: "center" }}>
                    <div style={{ marginBottom: 12 }}>
                      <QRCode userId={user?.phone || "U001"} />
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.slate }}>Your QR Code · Share with HSA for quick check-in</div>
                  </div>
                </div>
                <div>
                  <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                    <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: COLORS.navy, marginBottom: 16 }}>Account Details</h3>
                    <div className="field" style={{ marginBottom: 12 }}>
                      <label className="label" style={{ display: "block", fontSize: 12, color: COLORS.slate }}>Full Name</label>
                      <input
                        className="input"
                        value={profileName}
                        onChange={e => setProfileName(e.target.value)}
                        placeholder="Your full name"
                        style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
                      />
                    </div>
                    <div className="field" style={{ marginBottom: 12 }}>
                      <label className="label" style={{ display: "block", fontSize: 12, color: COLORS.slate }}>Email</label>
                      <input
                        className="input"
                        value={profileEmail}
                        onChange={e => setProfileEmail(e.target.value)}
                        placeholder="your@email.com"
                        style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
                      />
                    </div>
                    <div className="field" style={{ marginBottom: 16 }}>
                      <label className="label" style={{ display: "block", fontSize: 12, color: COLORS.slate }}>Service Area</label>
                      <select
                        className="input select"
                        value={profileArea}
                        onChange={e => setProfileArea(e.target.value)}
                        style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
                      >
                        {AREAS.map(a => <option key={a}>{a}</option>)}
                      </select>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {profileSaving
                        ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</>
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-nav">
        {navItems.map(item => (
          <div key={item.id} className={`mobile-nav-item ${section === item.id ? "active" : ""}`}
            onClick={() => setSection(item.id)}>
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
        <div className="mobile-nav-item" onClick={onLogout}>
          <Icon.Logout />
          <span>Logout</span>
        </div>
      </nav>
    </div>
  );
}
