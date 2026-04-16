import { useState, useEffect } from "react";
import { COLORS, AREAS, PLANS } from "../utils/constants";
import { Icon } from "../components/Icons";
import { useToast, Modal, Avatar, Gauge, MiniChart, BarChart, QRCode } from "../components/UI";

const API_BASE = "https://ka4hjb23ie.execute-api.ap-south-1.amazonaws.com/dev";

export function UserDashboard({ user, onLogout }) {
  const [section, setSection] = useState("overview");
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comment: "" });
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const { show, node: toastNode } = useToast();
  
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const plan = user?.planObj || PLANS.find(p => p.id === user?.plan) || PLANS[1];

  useEffect(() => {
    if (!user?.phone) return;
    
    fetch(`${API_BASE}/records/${encodeURIComponent(user.phone)}`)
      .then(res => res.json())
      .then(data => {
        // Sort by timestamp
        if (Array.isArray(data)) {
          const sorted = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          setReports(sorted);
        }
      })
      .catch(err => {
        console.error("Failed to load reports:", err);
      })
      .finally(() => {
        setLoadingReports(false);
      });
  }, [user]);

  const latestReport = reports.length > 0 ? reports[reports.length - 1] : null;
  const glucoseData = reports.map(r => parseInt(r.glucose) || 0);
  const pressureData = reports.map(r => parseInt(r.systolic) || 0);

  // Calendar state (Mock Schedule)
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const scheduledDays = [6, 13, 20, 27];
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m, y) => new Date(y, m, 1).getDay();

  const navItems = [
    { id: "overview", label: "Overview", icon: <Icon.Home /> },
    { id: "reports", label: "Health Reports", icon: <Icon.BarChart /> },
    { id: "calendar", label: "Schedule", icon: <Icon.Calendar /> },
    { id: "notifications", label: "Notifications", icon: <Icon.Bell /> },
    { id: "profile", label: "Profile", icon: <Icon.Settings /> },
  ];

  return (
    <div className="dashboard">
      {toastNode}
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span style={{ width: 32, height: 32, background: COLORS.emerald, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.navy, flexShrink: 0 }}>
            <Icon.Heart />
          </span>
          HealthClub
        </div>
        <div className="sidebar-section">Main Menu</div>
        {navItems.map(item => (
          <div key={item.id} className={`nav-item ${section === item.id ? "active" : ""}`}
            onClick={() => setSection(item.id)}>
            {item.icon}{item.label}
          </div>
        ))}
        <div className="sidebar-section" style={{ marginTop: "auto" }}>Account</div>
        <div className="nav-item" onClick={onLogout}><Icon.Logout /> Log out</div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        {/* OVERVIEW */}
        {section === "overview" && (
          <>
            <div className="page-header">
              <div>
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
                 <div style={{ textAlign: "center", padding: 40, color: COLORS.slate }}>
                    <span className="spinner" style={{ borderColor: COLORS.emerald, borderTopColor: "transparent" }}></span>
                    <br/><br/>Loading health data...
                 </div>
              ) : !latestReport ? (
                 <div className="card" style={{ padding: 40, textAlign: "center", background: COLORS.offWhite }}>
                    <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: COLORS.navy, marginBottom: 12 }}>No Health Records Found</h3>
                    <p style={{ color: COLORS.slate }}>Your HSA hasn't uploaded any readings for you yet. They will appear here once submitted.</p>
                 </div>
              ) : (
                <>
                  {/* Gauges */}
                  <div className="card" style={{ padding: "28px 32px", marginBottom: 24, background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)` }}>
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
                    <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
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
                        <MiniChart data={reports.map(r => parseInt(r.cholesterol)||0)} color={COLORS.cholesterol} />
                      </div>
                    )}
                  </div>
                </>
              )}
              {/* Upcoming + Subscription */}
              <div className="grid-2" style={{ gap: 20 }}>
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: COLORS.navy, marginBottom: 16 }}>Next Visit</h3>
                  <div style={{ background: COLORS.emeraldLight, border: `1px solid ${COLORS.emerald}22`, borderRadius: 12, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, background: COLORS.emerald, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.navy, fontSize: 20 }}>📅</div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy }}>Pending Schedule Conf.</div>
                        <div style={{ fontSize: 13, color: COLORS.slate }}>Your HSA will contact you soon</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.slate, marginBottom: 16 }}>Location: <strong style={{ color: COLORS.navy }}>{user?.area || "N/A"}</strong></div>
                    <button className="btn btn-outline btn-sm" onClick={() => setRescheduleModal(true)} style={{ width: "100%", justifyContent: "center" }}>
                      <Icon.Edit /> Reschedule Visit
                    </button>
                  </div>
                </div>
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: COLORS.navy, marginBottom: 16 }}>Subscription</h3>
                  <div className="stat-row" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "8px 0", display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 14, color: COLORS.slate }}>Plan</span><span className="badge badge-success">{plan.name}</span></div>
                  <button className="btn btn-outline btn-sm mt-16">Upgrade Plan →</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* REPORTS */}
        {section === "reports" && (
          <>
            <div className="page-header">
              <h1 className="page-title">Health Reports</h1>
              <button className="btn btn-outline btn-sm"><Icon.Upload /> Export PDF</button>
            </div>
            <div className="page-body">
              {reports.length > 0 ? (
                <>
                  <div className="card" style={{ padding: 28, marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                      <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: COLORS.navy }}>Blood Glucose Trend</h3>
                    </div>
                    <BarChart
                      data={reports.map((r, i) => ({ label: `Visit ${i+1}`, value: parseInt(r.glucose) || 0 }))}
                      colors={[COLORS.glucose, COLORS.glucose + "99"]}
                    />
                  </div>
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
              <h1 className="page-title">Schedule</h1>
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
                      const isScheduled = scheduledDays.includes(day);
                      return (
                        <div key={day} className={`cal-day ${isScheduled ? "scheduled" : ""} ${isToday ? "today" : ""}`} style={{ 
                          padding: 10, 
                          textAlign: "center", 
                          borderRadius: 8, 
                          border: isToday ? `2px solid ${COLORS.emerald}` : "none",
                          background: isScheduled ? COLORS.emerald : "transparent",
                          color: isScheduled ? COLORS.navy : COLORS.navy
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
                    <p style={{ fontSize: 14, color: COLORS.slate }}>No visits dynamically synchronized yet. Feature coming soon!</p>
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
              <h1 className="page-title">Notifications</h1>
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
              <h1 className="page-title">Profile & Settings</h1>
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
                    <div className="field" style={{ marginBottom: 12 }}><label className="label" style={{ display: "block", fontSize: 12, color: COLORS.slate }}>Name</label><input className="input" defaultValue={user?.name || ""} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }} /></div>
                    <div className="field" style={{ marginBottom: 12 }}><label className="label" style={{ display: "block", fontSize: 12, color: COLORS.slate }}>Email</label><input className="input" defaultValue={user?.email || ""} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }} /></div>
                    <div className="field" style={{ marginBottom: 12 }}><label className="label" style={{ display: "block", fontSize: 12, color: COLORS.slate }}>Area</label>
                      <select className="input select" defaultValue={user?.area || "AREA1"} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }}>
                        {AREAS.map(a => <option key={a}>{a}</option>)}
                      </select>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => show("Profile updated successfully!")}>Save Changes</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
