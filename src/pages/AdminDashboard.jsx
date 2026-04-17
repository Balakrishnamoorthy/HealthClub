import { useState, useEffect } from "react";
import { COLORS, AREAS } from "../utils/constants";
import { Icon } from "../components/Icons";
import { useToast, Modal, Avatar, BarChart } from "../components/UI";

const API_BASE = import.meta.env.VITE_API_BASE;

export function AdminDashboard({ onLogout }) {
  const [section, setSection] = useState("overview");
  const [addHSAModal, setAddHSAModal] = useState(false);
  const { show, node: toastNode } = useToast();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [hsas, setHsas] = useState([]);
  const [loading, setLoading] = useState(true);

  // New HSA form state
  const [newHsa, setNewHsa] = useState({ name: "", phone: "", area: "AREA1", pin: "" });

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHsas = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/hsas`);
      const data = await res.json();
      setHsas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setLoading(true);
    if (section === "overview" || section === "analytics") {
      fetchStats().finally(() => setLoading(false));
    } else if (section === "users") {
      fetchUsers().finally(() => setLoading(false));
    } else if (section === "hsas") {
      fetchHsas().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [section]);

  const handleCreateHsa = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/hsas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHsa)
      });
      if (res.ok) {
        show("HSA created successfully!");
        setAddHSAModal(false);
        setNewHsa({ name: "", phone: "", area: "AREA1", pin: "" });
        fetchHsas(); // refresh list
      } else {
        const d = await res.json();
        show(d.error || "Failed to create HSA", "error");
      }
    } catch (err) {
      show("Network error", "error");
    }
  };

  const handleDeleteHsa = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete HSA ${name}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/hsas/${id}`, { method: "DELETE" });
      if (res.ok) {
        show(`${name} deleted!`);
        fetchHsas();
      } else {
        show("Failed to delete", "error");
      }
    } catch (err) {
      show("Network error", "error");
    }
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: <Icon.Home /> },
    { id: "users", label: "All Users", icon: <Icon.Users /> },
    { id: "hsas", label: "HSA Management", icon: <Icon.Shield /> },
    { id: "analytics", label: "Analytics", icon: <Icon.TrendingUp /> },
  ];

  const totalUsers = stats?.totalUsers || 0;
  const totalHsas = stats?.totalHsas || 0;
  const revenue = stats?.revenue || 0;
  const plansData = stats?.plans || {};
  const areasData = stats?.areas || {};

  const summaryStats = [
    { label: "Total Users", value: totalUsers.toString(), change: "+2", up: true },
    { label: "Active Subscriptions", value: totalUsers.toString(), change: "+2", up: true },
    { label: "Revenue (₹)", value: `₹${(revenue / 1000).toFixed(1)}k`, change: "+1", up: true },
    { label: "HSA Workforce", value: totalHsas.toString(), change: "0", up: null },
  ];

  return (
    <div className="dashboard">
      {toastNode}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span style={{ width: 32, height: 32, background: "#A855F7", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
            <Icon.Shield />
          </span>
          <span className="sidebar-logo-text">
            Admin Panel
          </span>
        </div>
        <div className="sidebar-section">Management</div>
        {navItems.map(item => (
          <div key={item.id} className={`nav-item ${section === item.id ? "active" : ""}`}
            onClick={() => setSection(item.id)}>
            {item.icon}<span className="nav-label">{item.label}</span>
          </div>
        ))}
        <div style={{ marginTop: "auto" }}>
          <div className="nav-item" onClick={onLogout}><Icon.Logout /><span className="nav-label">Log out</span></div>
        </div>
      </aside>

      <main className="main-content">
        {section === "overview" && (
          <>
            <div className="page-header">
              <h1 className="page-title">Admin Overview</h1>
              <span className="badge badge-danger"><Icon.Lock /> Secure Access</span>
            </div>
            <div className="page-body">
              {loading ? <div style={{ textAlign: "center", padding: 40 }}><span className="spinner"></span></div> : (
                <>
                  <div className="grid-4" style={{ gap: 16, marginBottom: 24 }}>
                    {summaryStats.map(s => (
                      <div key={s.label} className="card metric">
                        <div className="metric-label">{s.label}</div>
                        <div className="metric-value">{s.value}</div>
                        {s.up !== null && (
                          <div className={`metric-change ${s.up ? "up" : "down"}`}>
                            {s.up ? "↑" : "↓"} {s.change} this month
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="grid-2" style={{ gap: 20 }}>
                    <div className="card" style={{ padding: 24 }}>
                      <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: COLORS.navy, marginBottom: 16 }}>Users by Area</h3>
                      {["AREA1", "AREA2", "AREA3", "AREA4"].map((area, i) => {
                        const count = areasData[area] || 0;
                        const colors = [COLORS.emerald, COLORS.pressure, "#A855F7", COLORS.cholesterol];
                        return (
                          <div key={area} className="stat-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 10, height: 10, borderRadius: "50%", background: colors[i] }} />
                              <span style={{ fontWeight: 600, fontSize: 14 }}>{area}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 120, height: 6, borderRadius: 3, background: "rgba(0,0,0,0.06)" }}>
                                <div style={{ height: "100%", width: `${totalUsers ? (count / totalUsers) * 100 : 0}%`, background: colors[i], borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy, minWidth: 36 }}>{count}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="card" style={{ padding: 24 }}>
                      <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: COLORS.navy, marginBottom: 16 }}>Plan Distribution</h3>
                      {["standard", "basic", "cholesterol"].map((plan, i) => {
                        const count = plansData[plan] || 0;
                        const colors = [COLORS.emerald, COLORS.pressure, COLORS.cholesterol];
                        return (
                          <div key={plan} className="stat-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                            <span style={{ fontSize: 14, color: COLORS.slate }}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 90, height: 6, borderRadius: 3, background: "rgba(0,0,0,0.06)" }}>
                                <div style={{ height: "100%", width: `${totalUsers ? (count / totalUsers) * 100 : 0}%`, background: colors[i], borderRadius: 3 }} />
                              </div>
                              <span style={{ fontWeight: 700, fontSize: 14, minWidth: 36 }}>{count}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {section === "users" && (
          <>
            <div className="page-header">
              <h1 className="page-title">All Users</h1>
            </div>
            <div className="page-body">
              {loading ? <div style={{ textAlign: "center", padding: 40 }}><span className="spinner"></span></div> : (
                <div className="card" style={{ overflow: "hidden" }}>
                  <table className="table" style={{ width: "100%", textAlign: "left" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: 12 }}>User</th>
                        <th style={{ padding: 12 }}>Phone</th>
                        <th style={{ padding: 12 }}>Area</th>
                        <th style={{ padding: 12 }}>Plan</th>
                        <th style={{ padding: 12 }}>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? <tr><td colSpan="5" style={{ padding: 20, textAlign: "center", color: COLORS.slate }}>No users found</td></tr> : users.map(u => (
                        <tr key={u.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Avatar name={u.name} size="sm" />
                              <div>
                                <div style={{ fontWeight: 600 }}>{u.name}</div>
                                <div style={{ fontSize: 11, color: COLORS.slate }}>{u.id.substring(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontFamily: "monospace", fontSize: 13, padding: 12 }}>{u.phone}</td>
                          <td style={{ padding: 12 }}><span className="badge badge-neutral" style={{ fontSize: 12 }}>{u.area}</span></td>
                          <td style={{ fontSize: 13, padding: 12 }}>{u.plan}</td>
                          <td style={{ fontSize: 13, padding: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {section === "hsas" && (
          <>
            <div className="page-header">
              <h1 className="page-title">HSA Management</h1>
              <button className="btn btn-primary btn-sm" onClick={() => setAddHSAModal(true)}><Icon.Plus /> Add HSA</button>
            </div>
            <div className="page-body">
              {loading ? <div style={{ textAlign: "center", padding: 40 }}><span className="spinner"></span></div> : (
                <div className="grid-2" style={{ gap: 16 }}>
                  {hsas.length === 0 && <p style={{ color: COLORS.slate }}>No HSAs found.</p>}
                  {hsas.map(hsa => (
                    <div key={hsa.id} className="card" style={{ padding: 24 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <Avatar name={hsa.name} size="md" color={hsa.status === "active" ? COLORS.emerald : COLORS.slate} />
                          <div>
                            <div style={{ fontWeight: 700, color: COLORS.navy }}>{hsa.name}</div>
                            <div style={{ fontSize: 13, color: COLORS.slate }}>{hsa.phone}</div>
                          </div>
                        </div>
                        <span className={`badge ${hsa.status === "active" ? "badge-success" : "badge-neutral"}`}>{hsa.status}</span>
                      </div>
                      <div className="stat-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: COLORS.slate }}>Assigned Area</span>
                        <span className="area-chip" style={{ fontSize: 12 }}>{hsa.area}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                        <button className="btn btn-ghost btn-sm" style={{ color: COLORS.danger }} onClick={() => handleDeleteHsa(hsa.id, hsa.name)}>
                          <Icon.Trash /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {section === "analytics" && (
          <>
            <div className="page-header"><h1 className="page-title">Analytics</h1></div>
            <div className="page-body">
              <div className="grid-2" style={{ gap: 20, marginBottom: 24 }}>
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: COLORS.navy, marginBottom: 20 }}>Monthly Revenue</h3>
                  <BarChart
                    data={[{ label: "Nov", value: 16 }, { label: "Dec", value: 17 }, { label: "Jan", value: 18 }, { label: "Feb", value: revenue > 0 ? Math.round(revenue / 1000) : 19 }]}
                    colors={[COLORS.emerald]}
                  />
                  <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 8, textAlign: "center" }}>Revenue in Thousands (₹)</div>
                </div>
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: COLORS.navy, marginBottom: 20 }}>New Subscriptions</h3>
                  <BarChart
                    data={[{ label: "Nov", value: 18 }, { label: "Dec", value: 20 }, { label: "Jan", value: 24 }, { label: "Feb", value: totalUsers }]}
                    colors={[COLORS.pressure]}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {addHSAModal && (
        <Modal title="Add New HSA" onClose={() => setAddHSAModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setAddHSAModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateHsa}>Create HSA</button>
          </>}>
          <div className="field" style={{ marginBottom: 12 }}>
            <label className="label" style={{ display: "block", fontSize: 12, marginBottom: 4, color: COLORS.slate }}>Full Name</label>
            <input className="input" placeholder="Ramesh Kumar" value={newHsa.name} onChange={e => setNewHsa({ ...newHsa, name: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label className="label" style={{ display: "block", fontSize: 12, marginBottom: 4, color: COLORS.slate }}>Phone Number</label>
            <input className="input" placeholder="+91 99887 76655" value={newHsa.phone} onChange={e => setNewHsa({ ...newHsa, phone: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label className="label" style={{ display: "block", fontSize: 12, marginBottom: 4, color: COLORS.slate }}>Assign Area</label>
            <select className="input select" value={newHsa.area} onChange={e => setNewHsa({ ...newHsa, area: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }}>
              {AREAS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label className="label" style={{ display: "block", fontSize: 12, marginBottom: 4, color: COLORS.slate }}>Set PIN (HSA Login)</label>
            <input className="input" type="password" placeholder="6-digit PIN" maxLength={6} value={newHsa.pin} onChange={e => setNewHsa({ ...newHsa, pin: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
          </div>
        </Modal>
      )}
    </div>
  );
}
