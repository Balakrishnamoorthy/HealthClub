import { useState, useEffect } from "react";
import { COLORS } from "../utils/constants";
import { Icon } from "./Icons";

export function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast toast-${type}`}>
      <span style={{ fontSize: 18 }}>{type === "success" ? "✓" : type === "error" ? "✗" : "ℹ"}</span>
      {msg}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = "success") => setToast({ msg, type, id: Date.now() });
  const node = toast ? <Toast key={toast.id} msg={toast.msg} type={toast.type} onClose={() => setToast(null)} /> : null;
  return { show, node };
}

export function Modal({ title, children, footer, onClose, size = "md" }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: size === "lg" ? 680 : size === "sm" ? 380 : 520 }}>
        <div className="modal-header flex items-center justify-between">
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: COLORS.navy }}>{title}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: "6px 10px" }}><Icon.X /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Avatar({ name, size = "md", color }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#00C896", "#4ECDC4", "#FFD93D", "#FF6B6B", "#3B9EFF", "#A855F7"];
  const bg = color || colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`avatar avatar-${size}`} style={{ background: bg + "22", color: bg }}>
      {initials}
    </div>
  );
}

export function Gauge({ value, max, label, color }) {
  const pct = Math.min(value / max, 1);
  const r = 42, cx = 52, cy = 52;
  const circumference = 2 * Math.PI * r;
  const dash = pct * circumference * 0.75;
  return (
    <div className="gauge-wrap" style={{ width: 104, height: 104 }}>
      <svg width="104" height="104" viewBox="0 0 104 104" className="gauge-svg">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference}`} strokeDashoffset={0} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`} strokeDashoffset={0} style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <div className="gauge-text">
        <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy, fontFamily: "'DM Serif Display', serif" }}>{value}</div>
        <div style={{ fontSize: 10, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      </div>
    </div>
  );
}

export function MiniChart({ data, color, height = 56 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const w = 160, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 8) - 4}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BarChart({ data, colors }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
      {data.map((d, i) => (
        <div key={i} className="chart-bar">
          <div style={{ fontSize: 11, color: COLORS.slate, marginBottom: 4 }}>{d.value}</div>
          <div className="chart-bar-fill" style={{ height: `${(d.value / max) * 100}%`, background: colors[i % colors.length] }} />
          <div className="chart-bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export function Steps({ current, steps }) {
  return (
    <div className="steps">
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
          <div className="step">
            <div className={`step-circle ${i < current ? "done" : i === current ? "active" : "pending"}`}>
              {i < current ? <Icon.Check /> : i + 1}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: i === current ? COLORS.navy : COLORS.slate, whiteSpace: "nowrap" }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`step-line ${i < current ? "done" : ""}`} style={{ flex: 1, margin: "0 12px" }} />}
        </div>
      ))}
    </div>
  );
}

export function QRCode({ userId }) {
  const seed = userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const cells = Array.from({ length: 100 }, (_, i) => ((seed * (i + 7) * 13 + i * 31) % 5) < 2);
  [0,1,2,7,8,9,10,11,12,13,14,21,63,70,77,84,85,86,87,88,89,90,91,92,98,99].forEach(i => cells[i] = true);
  return (
    <div className="qr-wrapper">
      <div className="qr-inner">
        {cells.map((filled, i) => (
          <div key={i} className="qr-cell" style={{ background: filled ? COLORS.navy : "white", borderRadius: 1 }} />
        ))}
      </div>
    </div>
  );
}
