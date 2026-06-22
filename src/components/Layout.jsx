import { useState, createContext, useContext } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Menu, X, Lock, GraduationCap,
  Facebook, Instagram, Youtube, ChevronDown,
} from "lucide-react";

import { useSiteData } from "../context/SiteDataContext.jsx";
import { UI } from "../i18n.js";
import { BrandStyles } from "../components/visuals.jsx";
import Login from "../pages/Login.jsx";

// ─── WhatsApp icon (lucide doesn't ship one) ────────────────────────────────
function WhatsAppIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 1.67c2.19 0 4.25.85 5.8 2.41a8.23 8.23 0 012.4 5.83c0 4.55-3.7 8.24-8.24 8.24a8.2 8.2 0 01-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 01-1.26-4.38c0-4.54 3.7-8.24 8.29-8.24zm-4.52 4.84c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.67 2.67 4.11 3.64.57.24 1.02.39 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.43-.58 1.63-1.15.2-.56.2-1.05.14-1.15-.06-.1-.22-.16-.46-.28-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.55.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.95-1.22-.72-.64-1.21-1.43-1.35-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.36-.77-1.86-.2-.49-.4-.42-.55-.43h-.47z" />
    </svg>
  );
}

// ─── Footer social links — update hrefs with real accounts ──────────────────
const FOOTER_SOCIAL = [
  { id: "facebook",  Icon: Facebook,     labelAr: "فيسبوك",   labelEn: "Facebook",  href: "https://facebook.com/yourpage" },
  { id: "whatsapp",  Icon: WhatsAppIcon, labelAr: "واتساب",   labelEn: "WhatsApp",  href: "https://wa.me/200000000000" },
  { id: "instagram", Icon: Instagram,    labelAr: "انستجرام", labelEn: "Instagram", href: "https://instagram.com/yourpage" },
  { id: "youtube",   Icon: Youtube,      labelAr: "يوتيوب",   labelEn: "YouTube",   href: "https://youtube.com/@yourchannel" },
];

// ─── Navigation structure ────────────────────────────────────────────────────
// Each item is either:
//   ["navKey", "/path"]          → plain NavLink
//   { type:"dropdown", key, children: [["navKey","/path"], …] }  → dropdown
const NAV_ROUTES = [
  ["home", "/"],
  {
    type: "dropdown",
    key: "OurServices",
    children: [
      ["scholarships", "/scholarships"],
      ["research", "/research"],
      ["courses", "/courses"],
    ],
  },
  ["about", "/about"],
  ["contact", "/contact"],
];

// Falls back to a hardcoded label if a key hasn't been added to ui.nav in i18n.js yet.
const FALLBACK_NAV_LABELS = {
  courses:     { ar: "الكورسات", en: "Courses" },
  OurServices: { ar: "خدماتنا", en: "Our Services" },
};

// ─── Lang context ────────────────────────────────────────────────────────────
const LangContext = createContext(null);
export function useLang() {
  const ctx = useContext(LangContext);
  return ctx ?? { lang: "ar", ui: UI.ar, isAr: true };
}

// ─── Layout ──────────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const { data } = useSiteData();
  const [lang, setLang] = useState("ar");
  const ui = UI[lang];
  const isAr = lang === "ar";
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const navLabel = (key) =>
    ui.nav[key] || (FALLBACK_NAV_LABELS[key]?.[lang] ?? key);

  return (
    <LangContext.Provider value={{ lang, ui, isAr }}>
      <div
        dir={ui.dir}
        style={{ fontFamily: "'Cairo', sans-serif", background: "var(--paper)", color: "var(--ink)" }}
        className="min-h-screen w-full flex flex-col"
      >
        <BrandStyles />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40" style={{ background: "var(--ink)" }}>
          <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-extrabold text-xl" style={{ color: "var(--paper)" }}>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full" style={{ background: "var(--gold)" }}>
                <GraduationCap size={18} color="var(--ink)" />
              </span>
              {isAr ? data.brandAr : data.brandEn}
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {NAV_ROUTES.map((item) => {
                if (Array.isArray(item)) {
                  const [key, path] = item;
                  return (
                    <NavLink
                      key={key}
                      to={path}
                      end={path === "/"}
                      className={({ isActive }) =>
                        `text-sm font-semibold ${isActive ? "opacity-100" : "opacity-80 hover:opacity-100"}`
                      }
                      style={({ isActive }) => ({
                        color: "var(--paper)",
                        borderBottom: isActive ? "2px solid var(--gold)" : "2px solid transparent",
                        paddingBottom: 4,
                      })}
                    >
                      {navLabel(key)}
                    </NavLink>
                  );
                }

                if (item.type === "dropdown") {
                  return (
                    <div key={item.key} className="relative group">
                      <button
                        className="flex items-center gap-1 text-sm font-semibold opacity-80 hover:opacity-100"
                        style={{ color: "var(--paper)" }}
                      >
                        {navLabel(item.key)} <ChevronDown size={14} />
                      </button>
                      <div className="absolute top-full start-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        <div className="bg-white shadow-xl rounded-xl py-2 min-w-[160px]" style={{ border: "1px solid var(--paper-soft)" }}>
                          {item.children.map(([key, path]) => (
                            <Link
                              key={key}
                              to={path}
                              className="block px-4 py-2 text-sm font-semibold hover:opacity-70"
                              style={{ color: "var(--ink)" }}
                            >
                              {navLabel(key)}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </nav>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setLang(isAr ? "en" : "ar")}
                className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ border: "1px solid var(--gold)", color: "var(--gold)" }}
              >
                {isAr ? "EN" : "AR"}
              </button>
              <button
                onClick={() => setLoginOpen(true)}
                className="btn-gold text-sm px-4 py-2 rounded-full flex items-center gap-1.5"
              >
                <Lock size={14} /> {ui.login}
              </button>
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden" style={{ color: "var(--paper)" }} onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden px-5 pb-5 flex flex-col gap-1" style={{ background: "var(--ink)" }}>
              {NAV_ROUTES.map((item) => {
                if (Array.isArray(item)) {
                  const [key, path] = item;
                  return (
                    <Link
                      key={key}
                      to={path}
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-semibold py-2"
                      style={{ color: "var(--paper)" }}
                    >
                      {navLabel(key)}
                    </Link>
                  );
                }

                if (item.type === "dropdown") {
                  return (
                    <div key={item.key}>
                      <p className="text-xs font-bold mt-3 mb-1 opacity-50" style={{ color: "var(--gold)" }}>
                        {navLabel(item.key)}
                      </p>
                      {item.children.map(([key, path]) => (
                        <Link
                          key={key}
                          to={path}
                          onClick={() => setMenuOpen(false)}
                          className="block text-sm font-semibold py-1.5 ps-3"
                          style={{ color: "var(--paper)" }}
                        >
                          {navLabel(key)}
                        </Link>
                      ))}
                    </div>
                  );
                }

                return null;
              })}

              <div className="flex items-center gap-3 pt-3 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,.1)" }}>
                <button
                  onClick={() => setLang(isAr ? "en" : "ar")}
                  className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ border: "1px solid var(--gold)", color: "var(--gold)" }}
                >
                  {isAr ? "EN" : "AR"}
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setLoginOpen(true); }}
                  className="btn-gold text-sm px-4 py-2 rounded-full"
                >
                  {ui.login}
                </button>
              </div>
            </div>
          )}
        </header>

        {/* ── Page content ────────────────────────────────────────────────── */}
        <main className="flex-1">{children}</main>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="py-10" style={{ background: "var(--ink)", color: "var(--paper)" }}>
          <div className="max-w-6xl mx-auto px-5 flex flex-col items-center gap-4 text-center">
            <Link to="/" className="font-extrabold text-lg" style={{ color: "var(--paper)" }}>
              {isAr ? data.brandAr : data.brandEn}
            </Link>
            <div className="flex gap-3">
              {FOOTER_SOCIAL.map(({ id, Icon, labelAr, labelEn, href }) => (
                <a
                  key={id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={isAr ? labelAr : labelEn}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:-translate-y-0.5"
                  style={{ background: "rgba(255,255,255,.08)" }}
                >
                  <Icon size={14} color="var(--paper)" />
                </a>
              ))}
            </div>
            <p className="text-xs opacity-50">{ui.footerRights}</p>
          </div>
        </footer>
      </div>

      {loginOpen && <Login onClose={() => setLoginOpen(false)} />}
    </LangContext.Provider>
  );
}
