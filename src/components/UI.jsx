import { useState, useEffect } from "react";
import { COLORS } from "../utils/constants";
import { X, Check, Info } from "lucide-react";
import { Icon } from "./Icons";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart as RechartBar, Bar, Cell, Legend
} from "recharts";

export function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast toast-${type}`}>
      <span style={{ fontSize: 18 }}>{type === "success" ? <Check size={16} /> : type === "error" ? <X size={16} /> : <Info size={16} />}</span>
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
  const pct = Math.round(Math.min((value / max) * 100, 100));
  const data = [{ name: label, value: pct, fill: color }];
  return (
    <div style={{ width: 120, height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <ResponsiveContainer width={140} height={140}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="62%" outerRadius="85%"
          startAngle={210} endAngle={-30} data={data} barSize={10}>
          <RadialBar background={{ fill: "rgba(0,0,0,0.06)" }} dataKey="value" cornerRadius={6} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: color, fontFamily: "'DM Serif Display', serif", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 9, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

export function MiniChart({ data, color, height = 56 }) {
  if (!data || data.length < 2) return null;
  const chartData = data.map((v, i) => ({ i, v }));
  const gradId = `mg${color.replace('#', '')}${height}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2}
          fill={`url(#${gradId})`} dot={false} isAnimationActive />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarChart({ data, colors }) {
  const color = colors?.[0] || COLORS.emerald;
  return (
    <ResponsiveContainer width="100%" height={180}>
      <RechartBar data={data} barSize={28} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.slate }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: COLORS.slate }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: COLORS.white, border: "1px solid #eee", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.10)" }}
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length] || color} />
          ))}
        </Bar>
      </RechartBar>
    </ResponsiveContainer>
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
  // Dynamically import qrcode.react to avoid SSR issues
  const [QR, setQR] = useState(null);
  useEffect(() => {
    import("qrcode.react").then(mod => setQR(() => mod.QRCodeSVG));
  }, []);

  const qrData = JSON.stringify({ type: "healthclub-user", id: userId });
  if (!QR) return <div style={{ width: 160, height: 160, background: "#f0f0f0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 12 }}>Loading QR...</div>;
  return (
    <div style={{ display: "inline-block", padding: 12, background: "white", borderRadius: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
      <QR value={qrData} size={150} level="M" includeMargin={false} />
    </div>
  );
}
