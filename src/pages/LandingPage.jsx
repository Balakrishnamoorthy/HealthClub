import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, ChevronDown } from "lucide-react"
import { COLORS, PLANS } from "../utils/constants";
import { Icon } from "../components/Icons";
import { useUser } from "../context/UserContext";

export function LandingPage() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const nav = useNavigate();
  const dropdownRef = useRef(null);
  const { user, userRole, logout } = useUser();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const onGetStarted = () => {
    nav("/onboarding");
  }

  const dashboardPath = userRole === "hsa" ? "/hsa" : userRole === "admin" ? "/admin" : "/user";

  const faqs = [
    { q: "How does home collection work?", a: "Our Health Service Assistants (HSAs) visit your home at your scheduled time. They use certified medical devices to collect readings and upload them directly to your dashboard." },
    { q: "Can I change my scheduled date?", a: "Yes! You can modify a scheduled date once per interval, within ±2 days of the original date. This flexibility is built into your subscription." },
    { q: "What happens if I want to upgrade my plan?", a: "After completing at least one scheduled session, you can upgrade your plan anytime from your dashboard. The difference in price is prorated automatically." },
    { q: "Is my health data secure?", a: "Absolutely. All data is encrypted and stored on AWS with HIPAA-compliant security measures. Only you and your assigned HSA can access your records." },
  ];

  const TESTIMONIALS = [
    { name: "Ananya S.", area: "AREA2", rating: 5, text: "HealthClub transformed how I manage my blood pressure. The weekly visits are incredibly convenient!", plan: "Basic Care" },
    { name: "Rajan M.", area: "AREA1", rating: 5, text: "Having my cholesterol tracked at home with professional HSA visits makes such a difference. Highly recommend!", plan: "Standard Health" },
    { name: "Shalini V.", area: "AREA3", rating: 5, text: "The trend charts help my doctor understand my progress. Best health investment I made this year.", plan: "Cholesterol Only" },
  ];

  function Avatar({ name, size = "md", color }) {
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const colors = ["#00C896", "#4ECDC4", "#FFD93D", "#FF6B6B", "#3B9EFF", "#A855F7"];
    const bg = color || colors[name.charCodeAt(0) % colors.length];
    return (
      <div className={`avatar avatar-${size}`} style={{ background: bg + "22", color: bg }}>
        {initials}
      </div>
    );
  }

  // Profile initials for nav
  const userName = user?.name || userRole || "User";
  const userInitials = userName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const avatarColors = ["#00C896", "#4ECDC4", "#FFD93D", "#FF6B6B", "#3B9EFF", "#A855F7"];
  const navAvatarBg = avatarColors[userName.charCodeAt(0) % avatarColors.length];

  return (
    <div>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(10,22,40,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 clamp(16px, 5vw, 80px)", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        {/* Logo */}
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "white", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 28, height: 28, background: COLORS.emerald, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ width: 24, height: 24, color: COLORS.navy }}><Icon.Heart /></span>
          </span>
          HealthClub
        </div>

        {/* Desktop links */}
        <div className="nav-desktop-links" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {userRole ? (
            // Logged-in: show profile avatar + dropdown
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                id="nav-profile-avatar"
                onClick={() => setProfileDropdownOpen(o => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 32, padding: "6px 14px 6px 6px",
                  cursor: "pointer", color: "white",
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: navAvatarBg + "33", color: navAvatarBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, border: `2px solid ${navAvatarBg}55`
                }}>
                  {userInitials}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userName}
                </span>
                <ChevronDown size={14} style={{ opacity: 0.6, transform: profileDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>

              {/* Dropdown */}
              {profileDropdownOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 10px)", right: 0,
                  background: "white", borderRadius: 14, minWidth: 200,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
                  overflow: "hidden", animation: "fadeUp 0.15s ease",
                  border: "1px solid rgba(0,0,0,0.06)"
                }}>
                  {/* User info header */}
                  <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.navy }}>{userName}</div>
                    <div style={{ fontSize: 11, color: COLORS.slate, marginTop: 2, textTransform: "capitalize" }}>
                      {userRole === "user" ? "Member" : userRole === "hsa" ? "Health Service Assistant" : "Admin"}
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ padding: "8px 0" }}>
                    <button
                      id="nav-go-to-dashboard"
                      onClick={() => { setProfileDropdownOpen(false); nav(dashboardPath); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "10px 16px",
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 13, color: COLORS.navy, fontWeight: 500,
                        textAlign: "left"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = COLORS.offWhite}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <span style={{ width: 16, height: 16, color: COLORS.emerald }}><Icon.Home /></span>
                      Go to Dashboard
                    </button>
                    <button
                      id="nav-logout"
                      onClick={() => { setProfileDropdownOpen(false); logout(); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "10px 16px",
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 13, color: COLORS.danger, fontWeight: 500,
                        textAlign: "left"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FFF0F3"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <span style={{ width: 16, height: 16 }}><Icon.Logout /></span>
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Not logged in: show Login + Get Started
            <>
              <Link to="/login" className="btn btn-ghost btn-sm" style={{ color: "rgba(255,255,255,0.7)" }}>Login</Link>
              <Link to="/onboarding" className="btn btn-primary btn-sm">Get Started <ArrowRight size={18} /></Link>
            </>
          )}
        </div>

        {/* Hamburger — mobile only */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileMenuOpen(o => !o)}
          aria-label="Toggle menu"
          style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 8, color: "white" }}
        >
          {mobileMenuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          )}
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div
          style={{ position: "fixed", top: 64, left: 0, right: 0, zIndex: 99, background: "rgba(10,22,40,0.98)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12, animation: "fadeUp 0.2s ease" }}
          className="nav-mobile-drawer"
        >
          {userRole ? (
            <>
              {/* Logged-in mobile: profile info + actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: navAvatarBg + "33", color: navAvatarBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700
                }}>
                  {userInitials}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{userName}</div>
                  <div style={{ fontSize: 11, color: COLORS.slate, textTransform: "capitalize" }}>
                    {userRole === "user" ? "Member" : userRole === "hsa" ? "HSA" : "Admin"}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => { setMobileMenuOpen(false); nav(dashboardPath); }}
                style={{ color: "rgba(255,255,255,0.85)", justifyContent: "center", width: "100%" }}
              >
                Go to Dashboard
              </button>
              <button
                className="btn btn-outline"
                onClick={() => { setMobileMenuOpen(false); logout(); }}
                style={{ color: COLORS.danger, borderColor: COLORS.danger + "44", justifyContent: "center", width: "100%" }}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-ghost" style={{ color: "rgba(255,255,255,0.85)", justifyContent: "center", width: "100%" }}>Login</Link>
              <Link to="/onboarding" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ justifyContent: "center", width: "100%" }}>Get Started <ArrowRight size={18} /></Link>
            </>
          )}
        </div>
      )}

      {/* Hero */}
      <section className="hero-section" style={{ paddingTop: 64 }}>
        <div className="hero-dots" />
        <div className="hero-glow" />
        <div className="hero-grid" style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div className="fade-up">
            <div className="hero-eyebrow">
              <span style={{ width: 8, height: 8, background: COLORS.emerald, borderRadius: "50%", animation: "pulse 2s ease-in-out infinite" }} />
              India's #1 Home Health Monitoring
            </div>
            <h1 className="hero-title">Your health, <em>monitored</em> from home.</h1>
            <p className="hero-subtitle">Professional health tracking for Blood Glucose, Blood Pressure, and Cholesterol — delivered by certified HSAs at your doorstep.</p>
          </div>
          <div>
            <div className="cta-wrap">
              {userRole ? (
                // Already logged in — show Go to Dashboard CTA
                <>
                  <button className="btn btn-primary" style={{ animation: "glow 3s ease-in-out infinite" }} onClick={() => nav(dashboardPath)}>
                    Go to Dashboard <ArrowRight size={18} />
                  </button>
                  <button className="btn btn-ghost" onClick={logout}>Log Out</button>
                </>
              ) : (
                <>
                  <Link to="/onboarding" className="btn btn-primary" style={{ animation: "glow 3s ease-in-out infinite" }}>
                    Get Started <ArrowRight size={18} />
                  </Link>
                  <Link to="/login" className="btn btn-ghost">Login to Dashboard</Link>
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
              {[["2,400+", "Active Users"], ["4", "Service Areas"], ["98%", "Satisfaction"]].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 28, fontFamily: "'DM Serif Display', serif", color: "white" }}>{v}</div>
                  <div style={{ fontSize: 13, color: COLORS.slate }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section >

      {/* HOW IT WORKS */}
      <section style={{ padding: "100px 80px", background: COLORS.white }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="text-center mb-28">
            <div className="section-label">How It Works</div>
            <h2 className="section-title">Simple. Professional. Reliable.</h2>
          </div>
          <div className="grid-4" style={{ gap: 28 }}>
            {[
              { icon: "📋", step: "01", title: "Choose Your Plan", desc: "Select from Basic, Standard, or Cholesterol-only plans based on your health needs." },
              { icon: "📅", step: "02", title: "Set Your Schedule", desc: "Pick weekly, bi-weekly, or monthly visits. Choose your preferred start date." },
              { icon: "🏠", step: "03", title: "HSA Home Visit", desc: "Your certified Health Service Assistant visits at the scheduled time." },
              { icon: "📊", step: "04", title: "Track & Trend", desc: "View readings, charts, and insights in your personal health dashboard." },
            ].map(item => (
              <div key={item.step} className="card" style={{ padding: "28px 24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 16, right: 20, fontSize: 40, fontFamily: "'DM Serif Display', serif", color: "rgba(0,0,0,0.04)", fontWeight: 700 }}>{item.step}</div>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: COLORS.navy, marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: COLORS.slate, lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section style={{ padding: "100px 80px", background: COLORS.offWhite }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="text-center mb-28">
            <div className="section-label">Pricing</div>
            <h2 className="section-title">Choose your health plan</h2>
            <p className="section-sub" style={{ margin: "0 auto" }}>Transparent pricing. No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid-3" style={{ gap: 28 }}>
            {PLANS.map(plan => (
              <div key={plan.id} className={`plan-card ${plan.popular ? "popular" : ""}`}
                onClick={onGetStarted}>
                {plan.popular && <div className="plan-popular-badge">Most Popular</div>}
                <div style={{ width: 44, height: 44, background: plan.color + "22", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: plan.color, marginBottom: 20 }}>
                  <Icon.Activity />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{plan.name}</div>
                <div className="plan-price" style={{ marginBottom: 4 }}>
                  <sup>₹</sup>{plan.price.toLocaleString()}<small>/mo</small>
                </div>
                <p style={{ fontSize: 13, color: COLORS.slate, marginBottom: 24, lineHeight: 1.6 }}>{plan.description}</p>
                <div className="divider" />
                {plan.features.map(f => (
                  <div key={f} className="plan-feature">
                    <div className="check"><Icon.Check /></div>
                    {f}
                  </div>
                ))}
                <button className={`btn ${plan.popular ? "btn-primary" : "btn-outline"} w-full mt-20`} style={{ justifyContent: "center" }}>
                  Select Plan
                </button>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 28, fontSize: 14, color: COLORS.slate }}>
            Available for 3, 6, or 12 month durations · Discounts up to 18% for annual plans
          </p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "100px 80px", background: COLORS.navy }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="text-center mb-28">
            <div className="section-label" style={{ color: COLORS.emerald }}>Testimonials</div>
            <h2 className="section-title light">What our members say</h2>
          </div>
          <div className="grid-3" style={{ gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testi-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="stars">{Array.from({ length: t.rating }, (_, i) => <span key={i}><Icon.Star /></span>)}</div>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", lineHeight: 1.75, marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={t.name} size="sm" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.slate }}>{t.plan} · {t.area}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section style={{ padding: "80px 80px", background: COLORS.white }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="text-center mb-28">
            <h2 className="section-title">Frequently asked</h2>
          </div>
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item">
              <div className="faq-q" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                {faq.q}
                <ChevronDown size={18} />
              </div>
              {activeFaq === i && <div className="faq-a">{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA FOOTER */}
      <section style={{ padding: "80px", background: COLORS.emerald, textAlign: "center" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, color: COLORS.navy, marginBottom: 16 }}>Ready to take control of your health?</h2>
        <p style={{ fontSize: 18, color: COLORS.navyMid, marginBottom: 36 }}>Join 2,400+ members monitoring their health from home.</p>
        {userRole ? (
          <button className="btn btn-lg" onClick={() => nav(dashboardPath)} style={{ background: COLORS.navy, color: "white" }}>
            Go to Dashboard <ArrowRight />
          </button>
        ) : (
          <button className="btn btn-lg" onClick={onGetStarted} style={{ background: COLORS.navy, color: "white" }}>
            Get Started Today <ArrowRight />
          </button>
        )}
      </section>

      <footer style={{ background: COLORS.navy, padding: "40px 80px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "white" }}>HealthClub</div>
        <div style={{ fontSize: 13, color: COLORS.slate }}>© 2025 HealthClub. All rights reserved. Madurai, Tamil Nadu</div>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy", "Terms", "Support"].map(l => (
            <span key={l} style={{ fontSize: 13, color: COLORS.slate, cursor: "pointer" }}>{l}</span>
          ))}
        </div>
      </footer>
    </div >
  );
}
