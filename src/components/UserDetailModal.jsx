import { useState, useEffect } from "react";
import { COLORS } from "../utils/constants";
import { Icon } from "./Icons";
import { Modal } from "./UI";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function UserDetailModal({ user, onClose, onUploadClick }) {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/user-schedule/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setSchedule(data);
      })
      .catch(err => console.error("Error fetching user schedule:", err))
      .finally(() => setLoading(false));
  }, [user.id]);

  return (
    <Modal title={`User Details: ${user.name}`} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        {/* <button className="btn btn-primary" onClick={onUploadClick}>
          <Icon.Upload /> Upload Readings
        </button> */}
      </>}>

      <div style={{ marginBottom: "20px" }}>

        {/* Basic Info */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", background: "rgba(0,0,0,0.02)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.05)" }}>
          <div style={{ width: 56, height: 56, background: COLORS.emeraldLight, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.emerald, fontSize: 20 }}>
            <Icon.Users />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <div style={{ fontWeight: 700, fontSize: "16px", color: COLORS.navy }}>{user.name}</div>
              <span className="badge badge-info">{user.plan || "Standard"}</span>
            </div>
            <div style={{ fontSize: "13px", color: COLORS.slate }}>{user.phone} • {user.area}</div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: COLORS.slate, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexDirection: "column" }}>
            <span className="spinner"></span>Loading patient data...
          </div>
        ) : schedule && !schedule.error ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Schedule Section */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: COLORS.navy, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon.Calendar /> Visit Schedule
              </h3>
              <div style={{ background: COLORS.white, border: "1px solid #eee", borderRadius: "10px", overflow: "hidden" }}>

                {/* Next Visit Highlight */}
                {schedule.nextVisit && (
                  <div style={{ padding: "12px 16px", background: COLORS.info + "11", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: COLORS.info }}>Next Expected Visit</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: COLORS.navy }}>
                      {new Date(schedule.nextVisit).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                )}

                {/* Upcoming List */}
                <div style={{ padding: "8px 0" }}>
                  {schedule.upcomingVisits?.slice(0, 3).map((dateStr, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px" }}>
                      <div style={{ fontSize: "13px", color: COLORS.navy }}>
                        {new Date(dateStr).toLocaleDateString()}
                      </div>
                      <span className="badge badge-neutral" style={{ fontSize: "11px" }}>Scheduled</span>
                    </div>
                  ))}
                  {(schedule.upcomingVisits?.length || 0) > 3 && (
                    <div style={{ padding: "8px 16px", fontSize: "12px", color: COLORS.slate, textAlign: "center" }}>
                      + {schedule.upcomingVisits.length - 3} more visits
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Past Records Section */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: COLORS.navy, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon.Activity /> Past Records
              </h3>

              {schedule.records && schedule.records.length > 0 ? (
                <div style={{ border: "1px solid #eee", borderRadius: "10px", overflow: "hidden" }}>
                  <table className="table" style={{ width: "100%", fontSize: "13px", textAlign: "left" }}>
                    <thead style={{ background: "#f8f9fa", borderBottom: "1px solid #eee" }}>
                      <tr>
                        <th style={{ padding: "10px 16px", color: COLORS.slate, fontWeight: "600" }}>Date</th>
                        <th style={{ padding: "10px 16px", color: COLORS.slate, fontWeight: "600" }}>Readings</th>
                        <th style={{ padding: "10px 16px", color: COLORS.slate, fontWeight: "600" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5).map((rec, i) => (
                        <tr key={i} style={{ borderBottom: i === Math.min(schedule.records.length - 1, 4) ? "none" : "1px solid #eee" }}>
                          <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                            {new Date(rec.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </td>
                          <td style={{ padding: "12px 16px", color: COLORS.navy }}>
                            <div style={{ display: "flex", gap: "12px" }}>
                              {rec.glucose && <span><span style={{ color: COLORS.slate }}>Glu:</span> {rec.glucose}</span>}
                              {rec.systolic && <span><span style={{ color: COLORS.slate }}>BP:</span> {rec.systolic}/{rec.diastolic}</span>}
                              {rec.cholesterol && rec.cholesterol !== 'N/A' && <span><span style={{ color: COLORS.slate }}>Chol:</span> {rec.cholesterol}</span>}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span className={`badge ${rec.status === 'attention' ? 'badge-warning' : 'badge-success'}`}>
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: "20px", background: "#f8f9fa", borderRadius: "10px", color: COLORS.slate, textAlign: "center", fontSize: "13px" }}>
                  No past health records found for this patient.
                </div>
              )}
            </div>

          </div>
        ) : (
          <div style={{ color: COLORS.error, padding: "20px", textAlign: "center" }}>
            Failed to load patient schedule.
          </div>
        )}
      </div>
    </Modal>
  );
}
