import { useNavigate } from "react-router-dom";
import { COLORS } from "../utils/constants";
import { Icon } from "./Icons";

/**
 * Reusable Breadcrumb component for all dashboards.
 *
 * Props:
 *  - section       : current active section id (e.g. "overview")
 *  - navItems      : array of { id, label } nav items for the dashboard
 *  - onNavigate    : fn(sectionId) called when "Dashboard" crumb is clicked
 *  - dashboardLabel: text for the middle crumb (default "Dashboard")
 */
export function Breadcrumb({ section, navItems = [], onNavigate, dashboardLabel = "Dashboard" }) {
  const nav = useNavigate();
  const currentLabel = navItems.find(n => n.id === section)?.label || "";
  const isRoot = !currentLabel || section === navItems[0]?.id;

  return (
    <nav
      aria-label="breadcrumb"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        color: COLORS.slate,
        padding: "10px 0 18px",
        flexWrap: "wrap",
      }}
    >
      {/* Home */}
      <span
        onClick={() => nav("/")}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === "Enter" && nav("/")}
        style={{
          cursor: "pointer",
          color: COLORS.emerald,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 4,
          transition: "opacity 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      >
        <span style={{ width: 14, height: 14, display: "inline-flex" }}>
          <Icon.Home />
        </span>
        Home
      </span>

      <Separator />

      {/* Dashboard (middle crumb) */}
      <span
        onClick={() => onNavigate && onNavigate(navItems[0]?.id || "overview")}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === "Enter" && onNavigate && onNavigate(navItems[0]?.id || "overview")}
        style={{
          cursor: onNavigate ? "pointer" : "default",
          color: isRoot ? COLORS.navy : COLORS.slate,
          fontWeight: isRoot ? 700 : 400,
          transition: "color 0.15s",
        }}
        onMouseEnter={e => !isRoot && onNavigate && (e.currentTarget.style.color = COLORS.navy)}
        onMouseLeave={e => !isRoot && onNavigate && (e.currentTarget.style.color = COLORS.slate)}
      >
        {dashboardLabel}
      </span>

      {/* Current section (final crumb) — only when not on root */}
      {!isRoot && currentLabel && (
        <>
          <Separator />
          <span style={{ color: COLORS.navy, fontWeight: 700 }}>{currentLabel}</span>
        </>
      )}
    </nav>
  );
}

function Separator() {
  return <span style={{ opacity: 0.35, userSelect: "none" }}>/</span>;
}
