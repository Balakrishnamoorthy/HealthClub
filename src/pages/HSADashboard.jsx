import { useState, useEffect } from "react";
import { COLORS } from "../utils/constants";
import { Icon } from "../components/Icons";
import { useToast, Modal, Avatar } from "../components/UI";

const API_BASE = "https://ka4hjb23ie.execute-api.ap-south-1.amazonaws.com/dev";

export function HSADashboard({ hsa, onLogout }) {
  const [section, setSection] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadModal, setUploadModal] = useState(null);
  const [uploadData, setUploadData] = useState({ glucose: "", systolic: "", diastolic: "", cholesterol: "", notes: "" });
  const { show, node: toastNode } = useToast();
  
  const [myUsers, setMyUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const myArea = hsa?.area || "AREA1";

  useEffect(() => {
    fetch(`${API_BASE}/hsa/users?area=${encodeURIComponent(myArea)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMyUsers(data);
        }
      })
      .catch(err => console.error("Error fetching users:", err))
      .finally(() => setLoading(false));
  }, [myArea]);

  // For demonstration, taking the first two members as "today's visits"
  const todayVisits = myUsers.slice(0, 2);

  const navItems = [
    { id: "today", label: "Today's Visits", icon: <Icon.Calendar /> },
    { id: "users", label: "My Users", icon: <Icon.Users /> },
    { id: "notifications", label: "Notifications", icon: <Icon.Bell /> },
  ];

  const filteredUsers = myUsers.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery)
  );

  const handleUploadSubmit = async () => {
    if (!uploadModal) return;
    try {
      const res = await fetch(`${API_BASE}/record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: uploadModal.phone,
          hsaId: hsa?.name || "Unknown HSA",
          glucose: uploadData.glucose,
          systolic: uploadData.systolic,
          diastolic: uploadData.diastolic,
          cholesterol: uploadData.cholesterol,
          notes: uploadData.notes
        })
      });
      const data = await res.json();
      if (res.ok) {
        show("Health data uploaded successfully!");
        setUploadModal(null);
        setUploadData({ glucose: "", systolic: "", diastolic: "", cholesterol: "", notes: "" });
      } else {
        show(data.error || "Failed to upload data", "error");
      }
    } catch (err) {
      show("Network error. Please try again.", "error");
    }
  };

  return (
    <div className="dashboard">
      {toastNode}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span style={{ width: 32, height: 32, background: COLORS.info, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
            <Icon.Users />
          </span>
          HSA Portal
        </div>
        <div className="sidebar-section">Navigation</div>
        {navItems.map(item => (
          <div key={item.id} className={`nav-item ${section === item.id ? "active" : ""}`}
            onClick={() => setSection(item.id)}>
            {item.icon}{item.label}
          </div>
        ))}
        <div style={{ marginTop: "auto" }}>
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(59,158,255,0.1)", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Assigned Area</div>
            <div style={{ fontSize: 18, fontFamily: "'DM Serif Display', serif", color: "white" }}>{myArea}</div>
          </div>
          <div className="nav-item" onClick={onLogout}><Icon.Logout /> Log out</div>
        </div>
      </aside>

      <main className="main-content">
        {section === "today" && (
          <>
            <div className="page-header">
              <div>
                <p style={{ fontSize: 13, color: COLORS.slate }}>Health Service Assistant</p>
                <h1 className="page-title">Today's Schedule</h1>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <span className="badge badge-info">{myArea}</span>
                <span className="badge badge-success">{todayVisits.length} visits today</span>
              </div>
            </div>
            <div className="page-body">
              {loading ? (
                 <div style={{ textAlign: "center", padding: 40, color: COLORS.slate }}><span className="spinner"></span><br/><br/>Loading assigned users...</div>
              ) : todayVisits.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {todayVisits.map((u, i) => (
                    <div key={u.id} className="card" style={{ padding: 24 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
                        <div style={{ padding: "10px 14px", background: COLORS.emeraldLight, borderRadius: 10, fontSize: 13, fontWeight: 700, color: COLORS.emerald, textAlign: "center", lineHeight: 1.3 }}>
                          {i === 0 ? "10:00" : "11:30"}<br />AM
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 17, color: COLORS.navy }}>{u.name}</div>
                          <div style={{ fontSize: 13, color: COLORS.slate }}>{u.phone} · {u.plan || 'Standard'}</div>
                        </div>
                        <span className={`badge ${i === 0 ? "badge-warning" : "badge-neutral"}`}>{i === 0 ? "Next up" : "Pending"}</span>
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button className="btn btn-primary btn-sm" onClick={() => setUploadModal(u)}>
                          <Icon.Upload /> Upload Readings
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSection("users")}>
                          <Icon.QrCode /> Search Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: COLORS.slate }}>You have no scheduled visits today.</p>
              )}
            </div>
          </>
        )}

        {section === "users" && (
          <>
            <div className="page-header">
              <h1 className="page-title">My Users — {myArea}</h1>
            </div>
            <div className="page-body">
              <div style={{ position: "relative", marginBottom: 20 }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.slate, pointerEvents: "none" }}><Icon.Search /></div>
                <input className="input" style={{ paddingLeft: 44 }}
                  placeholder="Search by name or phone number..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <div className="card" style={{ overflow: "hidden" }}>
                <table className="table" style={{ width: "100%", textAlign: "left" }}>
                  <thead>
                    <tr><th style={{ padding: 12 }}>User</th><th style={{ padding: 12 }}>Phone</th><th style={{ padding: 12 }}>Plan</th><th style={{ padding: 12 }}>Action</th></tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={u.name} size="sm" />
                            <span style={{ fontWeight: 600 }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ color: COLORS.slate, fontFamily: "monospace", padding: 12 }}>{u.phone}</td>
                        <td style={{ fontSize: 13, padding: 12 }}>{u.plan}</td>
                        <td style={{ padding: 12 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => setUploadModal(u)}>Upload</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {section === "notifications" && (
          <>
            <div className="page-header"><h1 className="page-title">Notifications</h1></div>
            <div className="page-body">
              <div className="card" style={{ padding: 8 }}>
                 <p style={{ padding: 20, color: COLORS.slate }}>You have no new notifications.</p>
              </div>
            </div>
          </>
        )}
      </main>

      {uploadModal && (
        <Modal title={`Upload: ${uploadModal.name}`} onClose={() => setUploadModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setUploadModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUploadSubmit}>Upload Data</button>
          </>}>
          <div style={{ marginBottom: 20 }}>
            <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="field">
                <label className="label" style={{ color: COLORS.glucose, display: "block", marginBottom: 4, fontSize: 12 }}>Glucose (mg/dL)</label>
                <input className="input" type="number" placeholder="94" value={uploadData.glucose} onChange={e => setUploadData({...uploadData, glucose: e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
              </div>
              <div className="field">
                <label className="label" style={{ color: COLORS.pressure, display: "block", marginBottom: 4, fontSize: 12 }}>Systolic (mmHg)</label>
                <input className="input" type="number" placeholder="118" value={uploadData.systolic} onChange={e => setUploadData({...uploadData, systolic: e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
              </div>
              <div className="field">
                <label className="label" style={{ color: "#A855F7", display: "block", marginBottom: 4, fontSize: 12 }}>Diastolic (mmHg)</label>
                <input className="input" type="number" placeholder="76" value={uploadData.diastolic} onChange={e => setUploadData({...uploadData, diastolic: e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
              </div>
              <div className="field">
                <label className="label" style={{ color: COLORS.cholesterol, display: "block", marginBottom: 4, fontSize: 12 }}>Cholesterol (mg/dL)</label>
                <input className="input" type="number" placeholder="182" value={uploadData.cholesterol} onChange={e => setUploadData({...uploadData, cholesterol: e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
              </div>
            </div>
            <div className="field" style={{ marginTop: 16 }}>
               <label className="label" style={{ display: "block", marginBottom: 4, fontSize: 12, color: COLORS.slate }}>Visit Notes</label>
               <textarea className="input" rows={3} placeholder="Patient was calm. Device readings consistent..." value={uploadData.notes} onChange={e => setUploadData({...uploadData, notes: e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
