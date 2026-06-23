import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import "./Dashboard.css";
import ChatTab from "../chat/ChatTab";
import { getLeads } from "../chat/useChat";

// ─── Default Data ────────────────────────────────────────────────────────────
const DEFAULT_USERS = [
  { id: 1, name: "أحمد محمد", email: "ahmed@ex.com", role: "student", status: "pending", date: "2026-06-10", scholarship: "DAAD" },
  { id: 2, name: "سارة علي", email: "sara@ex.com", role: "student", status: "pending", date: "2026-06-12", scholarship: "تشيفنينج" },
  { id: 3, name: "كريم وليد", email: "karim@ex.com", role: "student", status: "pending", date: "2026-06-14", scholarship: "تركيا" },
  { id: 4, name: "ليلى حسن", email: "layla@ex.com", role: "student", status: "active", date: "2026-05-20", scholarship: "فولبرايت" },
  { id: 5, name: "يوسف طارق", email: "yousef@ex.com", role: "student", status: "active", date: "2026-05-15", scholarship: "DAAD" },
  { id: 6, name: "م. عمر فارس", email: "omar@masar.com", role: "admin", status: "active", date: "2024-01-01", scholarship: "—" },
  { id: 7, name: "أ. ليان حسن", email: "lian@masar.com", role: "admin", status: "active", date: "2024-01-01", scholarship: "—" },
  { id: 8, name: "محمد رامي", email: "rami@ex.com", role: "student", status: "blocked", date: "2026-04-30", scholarship: "—" },
];

const DEFAULT_SCHOLS = [
  { id: 1, flag: "🇩🇪", cAr: "ألمانيا", cEn: "Germany", tAr: "منحة DAAD للدراسات العليا", tEn: "DAAD Graduate Scholarship", dAr: "حتى 15 أكتوبر", dEn: "Oct 15", lAr: "ماجستير / دكتوراه", lEn: "Master / PhD", type: "full", sAr: "منحة حكومية ألمانية مرموقة.", sEn: "Prestigious German scholarship.", req: "<ul><li>بكالوريوس بتقدير جيد جداً</li><li>إجادة الإنجليزية أو الألمانية</li><li>سنتان خبرة عملية</li></ul>", cov: "<ul><li><strong>إعانة شهرية:</strong> 934 يورو</li><li>تأمين صحي كامل</li><li>تذاكر سفر</li></ul>", url1: "https://daad.de", url2: "https://daad.de", tags: ["ألمانيا", "ماجستير", "ممول بالكامل"], img: "" },
  { id: 2, flag: "🇬🇧", cAr: "بريطانيا", cEn: "UK", tAr: "منحة تشيفنينج البريطانية", tEn: "Chevening Scholarship", dAr: "حتى 2 نوفمبر", dEn: "Nov 2", lAr: "ماجستير", lEn: "Master", type: "full", sAr: "منحة حكومة المملكة المتحدة.", sEn: "UK government scholarship.", req: "<ul><li>سنتان خبرة عملية</li><li>IELTS 6.5</li></ul>", cov: "<ul><li>رسوم دراسية كاملة</li><li>مصاريف معيشة</li></ul>", url1: "https://chevening.org", url2: "https://chevening.org", tags: ["بريطانيا", "ماجستير"], img: "" },
  { id: 3, flag: "🇹🇷", cAr: "تركيا", cEn: "Turkey", tAr: "منحة الحكومة التركية", tEn: "Türkiye Scholarships", dAr: "حتى 20 فبراير", dEn: "Feb 20", lAr: "بكالوريوس / ماجستير", lEn: "Bach / Master", type: "full", sAr: "منحة تركية لمختلف المستويات.", sEn: "Turkish scholarship.", req: "<ul><li>معدل 70%+</li></ul>", cov: "<ul><li>رسوم + سكن</li></ul>", url1: "", url2: "", tags: ["تركيا", "بكالوريوس"], img: "" },
  { id: 4, flag: "🇺🇸", cAr: "الولايات المتحدة", cEn: "USA", tAr: "منحة فولبرايت", tEn: "Fulbright Scholarship", dAr: "حتى 1 مايو", dEn: "May 1", lAr: "ماجستير / دكتوراه", lEn: "Master / PhD", type: "full", sAr: "أشهر منحة أمريكية.", sEn: "America's most prestigious scholarship.", req: "<ul><li>TOEFL 80+</li></ul>", cov: "<ul><li>رسوم كاملة + تأمين</li></ul>", url1: "", url2: "", tags: ["أمريكا", "دكتوراه"], img: "" },
];

const DEFAULT_COURSES = [
  { id: 1, tAr: "دورة التحضير المكثف للأيلتس والتوفل", tEn: "IELTS & TOEFL Prep", dAr: "تأهيل أكاديمي متقدم لاجتياز اختبارات اللغة.", dEn: "Advanced academic coaching." },
  { id: 2, tAr: "ورشة خطابات النية والـ CV الأكاديمي", tEn: "Motivation Letter Workshop", dAr: "صياغة خطاب حافز متميز.", dEn: "Craft standout letters." },
  { id: 3, tAr: "توجيه القبول للمنح التركية والأوروبية", tEn: "Scholarship Masterclass", dAr: "شرح شامل للنظم التعليمية.", dEn: "Deep dive into requirements." },
];

const DEFAULT_RES_SERVICES = [
  { id: 1, ar: "التدقيق اللغوي والتنسيق العام", en: "Language editing & formatting" },
  { id: 2, ar: "إعداد المقترح البحثي", en: "Research proposal preparation" },
  { id: 3, ar: "توفير مصادر علمية", en: "Providing academic sources" },
  { id: 4, ar: "إعداد الملخصات", en: "Preparing summaries" },
];

const DEFAULT_RES_SPECS = [
  { id: 1, ar: "العلوم السياسية والعلاقات الدولية", en: "Political Science & IR" },
  { id: 2, ar: "القانون", en: "Law" },
  { id: 3, ar: "إدارة الأعمال", en: "Business Administration" },
  { id: 4, ar: "الاقتصاد", en: "Economics" },
];

const DEFAULT_TEAM = [
  { id: 1, nAr: "أ. ليان حسن", rAr: "مستشارة منح دراسية" },
  { id: 2, nAr: "م. عمر فارس", rAr: "مؤسس ومدير عام" },
];

const DEFAULT_FAQS = [
  { id: 1, q: "هل تضمنون قبولي في المنحة؟", a: "لا نملك قرار الجهة المانحة، لكننا نقوّي ملفك بشكل كبير." },
  { id: 2, q: "ما الفرق بين خدماتكم والتقديم المباشر؟", a: "نساعدك على تفادي الأخطاء الشائعة في الملفات والمواعيد." },
];

const DEFAULT_SOCIALS = [
  { id: "facebook", label: "فيسبوك", ico: "ti-brand-facebook", color: "#1877F2", url: "https://facebook.com/yourpage" },
  { id: "whatsapp", label: "واتساب", ico: "ti-brand-whatsapp", color: "#25D366", url: "https://wa.me/200000000000" },
  { id: "instagram", label: "إنستجرام", ico: "ti-brand-instagram", color: "#E1306C", url: "https://instagram.com/yourpage" },
  { id: "youtube", label: "يوتيوب", ico: "ti-brand-youtube", color: "#FF0000", url: "https://youtube.com/@yourchannel" },
  { id: "tiktok", label: "تيك توك", ico: "ti-brand-tiktok", color: "#010101", url: "" },
];

const PERMS_DEFAULT = [
  { id: "act", n: "تفعيل الطلاب", d: "السماح بتفعيل الحسابات المنتظرة", on: false },
  { id: "cnt", n: "تعديل المحتوى", d: "تغيير المنح والشهادات والأسئلة", on: true },
  { id: "team", n: "إدارة الفريق", d: "إضافة وحذف أعضاء فريق العمل", on: false },
  { id: "cfg", n: "الوصول للإعدادات", d: "تعديل بيانات الموقع والهوية", on: false },
];

const ACTS = [
  { t: "تم تفعيل حساب أحمد محمد", tm: "منذ 5 دقائق", c: "#2F7B6E" },
  { t: "طلب تسجيل جديد: سارة علي", tm: "منذ 20 دقيقة", c: "#C8932B" },
  { t: "تم تحديث منحة DAAD", tm: "منذ ساعة", c: "#6B5DD3" },
  { t: "تم رفع شعار الموقع", tm: "أمس", c: "#2F7B6E" },
  { t: "تم حظر حساب محمد رامي", tm: "أمس", c: "#e84545" },
];

const ALLOWED_EMAILS = ["omar@masar.com", "lian@masar.com"];
const TYPE_LBL = { full: "ممولة بالكامل", partial: "جزئية", tuition: "رسوم فقط", research: "بحث علمي" };

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
      <label style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)" }}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="dash-tog">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="dash-tog-sl" />
    </label>
  );
}

function ActionBtn({ icon, className = "", onClick, title }) {
  return (
    <button className={`dash-act-btn ${className}`} onClick={onClick} title={title}>
      <i className={`ti ${icon}`} style={{ fontSize: 13 }} />
    </button>
  );
}

function RichEditor({ id, placeholder, initialHTML, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && initialHTML !== undefined) ref.current.innerHTML = initialHTML;
  }, [initialHTML]);
  const fmt = (cmd) => { ref.current?.focus(); document.execCommand(cmd, false, null); onChange?.(ref.current?.innerHTML); };
  const fmtBlock = (tag) => { ref.current?.focus(); document.execCommand("formatBlock", false, tag); };
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "6px 7px", background: "var(--surface2)", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        {[["ti-bold","bold"],["ti-italic","italic"]].map(([ico,cmd])=>(
          <button key={cmd} onClick={()=>fmt(cmd)} style={{ width:27,height:27,borderRadius:5,border:"none",background:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--tx)",transition:".15s" }}>
            <i className={`ti ${ico}`} />
          </button>
        ))}
        <div style={{ width:1,height:16,background:"var(--border)",margin:"0 2px" }} />
        <button onClick={()=>fmtBlock("h3")} style={{ width:27,height:27,borderRadius:5,border:"none",background:"none",cursor:"pointer",color:"var(--tx)" }}><i className="ti ti-heading" /></button>
        <button onClick={()=>fmt("insertUnorderedList")} style={{ width:27,height:27,borderRadius:5,border:"none",background:"none",cursor:"pointer",color:"var(--tx)" }}><i className="ti ti-list" /></button>
        <button onClick={()=>fmt("insertOrderedList")} style={{ width:27,height:27,borderRadius:5,border:"none",background:"none",cursor:"pointer",color:"var(--tx)" }}><i className="ti ti-list-numbers" /></button>
        <div style={{ width:1,height:16,background:"var(--border)",margin:"0 2px" }} />
        <button onClick={()=>fmt("undo")} style={{ width:27,height:27,borderRadius:5,border:"none",background:"none",cursor:"pointer",color:"var(--tx)" }}><i className="ti ti-arrow-back-up" /></button>
        <button onClick={()=>fmt("redo")} style={{ width:27,height:27,borderRadius:5,border:"none",background:"none",cursor:"pointer",color:"var(--tx)" }}><i className="ti ti-arrow-forward-up" /></button>
      </div>
      <div
        ref={ref}
        id={id}
        className="dash-ea"
        contentEditable
        data-placeholder={placeholder}
        onInput={() => onChange?.(ref.current?.innerHTML)}
        suppressContentEditableWarning
      />
      <div style={{ padding:"5px 9px",borderTop:"1px solid var(--border)",background:"var(--surface2)",display:"flex",justifyContent:"space-between" }}>
        <span style={{ fontSize:10,color:"var(--muted)" }} id={`cc_${id}`}>0 حرف</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH SCREENS
// ═══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onOtpSent }) {
  const handleGoogle = () => {
    // In production: trigger real Google OAuth here (e.g. firebase.auth().signInWithPopup)
    // For demo: simulate with a known allowed email
    const email = "omar@masar.com";
    if (!ALLOWED_EMAILS.includes(email)) { alert("هذا البريد غير مصرح له بالدخول."); return; }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    onOtpSent({ email, otp, name: "م. عمر فارس", initials: "م.ع" });
  };
  return (
    <div className="dash-auth-screen">
      <div className="dash-auth-box">
        <div style={{ width:56,height:56,borderRadius:14,background:"#C8932B",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px" }}>
          <i className="ti ti-school" style={{ fontSize:28,color:"#13213B" }} />
        </div>
        <div style={{ fontWeight:800,fontSize:20,color:"#F0EDE4",marginBottom:7 }}>لوحة تحكم مسار</div>
        <div style={{ fontSize:12.5,color:"rgba(255,255,255,0.5)",marginBottom:24,lineHeight:1.7 }}>
          تسجيل الدخول مخصص للمدير والمشرفين فقط.<br />استخدم حساب Google المعتمد.
        </div>
        <button onClick={handleGoogle} style={{ width:"100%",padding:12,borderRadius:10,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.07)",color:"#F0EDE4",fontSize:13.5,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontFamily:"inherit",marginBottom:16,transition:".15s" }}>
          <svg width={21} height={21} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          المتابعة بحساب Google
        </button>
        <div style={{ fontSize:11.5,color:"rgba(255,255,255,0.35)",lineHeight:1.7 }}>
          سيتم إرسال كود تحقق مكون من 6 أرقام<br />إلى بريدك الإلكتروني المسجّل بعد تسجيل Google.
        </div>
      </div>
    </div>
  );
}

function OtpScreen({ otpData, onVerified, onBack }) {
  const [digits, setDigits] = useState(["","","","","",""]);
  const [error, setError] = useState(false);
  const [seconds, setSeconds] = useState(120);
  const [showResend, setShowResend] = useState(false);
  const refs = [useRef(),useRef(),useRef(),useRef(),useRef(),useRef()];

  useEffect(() => {
    refs[0].current?.focus();
    const t = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(t); setShowResend(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const handleChange = (i, val) => {
    const v = val.replace(/\D/g,"").slice(-1);
    const next = [...digits]; next[i] = v; setDigits(next); setError(false);
    if (v && i < 5) refs[i+1].current?.focus();
    if (next.every(d=>d) && next.join("") === otpData.otp) onVerified();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs[i-1].current?.focus();
  };

  const verify = () => {
    if (digits.join("") === otpData.otp) onVerified();
    else { setError(true); setDigits(["","","","","",""]); refs[0].current?.focus(); }
  };

  const resend = () => {
    setSeconds(120); setShowResend(false); setDigits(["","","","","",""]); setError(false);
    refs[0].current?.focus();
  };

  return (
    <div className="dash-auth-screen">
      <div className="dash-auth-box">
        <div style={{ width:56,height:56,borderRadius:"50%",background:"rgba(47,123,110,0.2)",border:"2px solid #2F7B6E",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
          <i className="ti ti-mail-check" style={{ fontSize:26,color:"#2F7B6E" }} />
        </div>
        <div style={{ fontWeight:800,fontSize:20,color:"#F0EDE4",marginBottom:7 }}>تحقق من بريدك</div>
        <div style={{ fontSize:12.5,color:"rgba(255,255,255,0.5)",marginBottom:4,lineHeight:1.7 }}>
          أرسلنا كود مكون من 6 أرقام إلى<br />
          <strong style={{ color:"#F0EDE4" }}>{otpData.email}</strong>
        </div>
        <div style={{ fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:6 }}>
          (للتجربة — الكود هو: <strong style={{ color:"var(--gold)",letterSpacing:3 }}>{otpData.otp}</strong>)
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:9,margin:"18px 0" }}>
          {digits.map((d,i) => (
            <input key={i} ref={refs[i]} className="otp-inp" maxLength={1} value={d} type="text" inputMode="numeric"
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
            />
          ))}
        </div>
        {seconds > 0 && <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:8 }}>تنتهي صلاحية الكود خلال <span style={{ color:"var(--gold)",fontWeight:700 }}>{fmt(seconds)}</span></div>}
        {error && <div style={{ fontSize:12,color:"#e84545",marginBottom:8 }}>الكود غير صحيح، حاول مجدداً</div>}
        <button onClick={verify} style={{ width:"100%",padding:12,borderRadius:10,background:"var(--gold)",color:"var(--ink)",fontSize:13.5,fontWeight:800,cursor:"pointer",border:"none",fontFamily:"inherit",marginBottom:12 }}>
          تحقق والدخول
        </button>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <span onClick={onBack} style={{ fontSize:12,color:"rgba(255,255,255,0.4)",cursor:"pointer" }}>تسجيل الدخول بحساب آخر</span>
          {showResend && <span onClick={resend} style={{ fontSize:12,color:"var(--gold)",cursor:"pointer",fontWeight:700 }}>إعادة إرسال الكود</span>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardApp({ adminInfo, onLogout }) {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQ, setSearchQ] = useState("");
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [schols, setSchols] = useState(DEFAULT_SCHOLS);
  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [resServices, setResServices] = useState(DEFAULT_RES_SERVICES);
  const [resSpecs, setResSpecs] = useState(DEFAULT_RES_SPECS);
  const [team, setTeam] = useState(DEFAULT_TEAM);
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [socials, setSocials] = useState(DEFAULT_SOCIALS);
  const [perms, setPerms] = useState(PERMS_DEFAULT);
  const [uFilter, setUFilter] = useState("all");
  const [curScholId, setCurScholId] = useState(null);
  const [scholTags, setScholTags] = useState([]);
  const [modal, setModal] = useState(null);
  const [logoSrc, setLogoSrc] = useState(null);
  const [brandName, setBrandName] = useState("مسار");
  const [accentColor, setAccentColor] = useState("#C8932B");
  const [saveMsg, setSaveMsg] = useState(false);

  // Rich editor refs for scholarship detail
  const reqRef = useRef(null);
  const covRef = useRef(null);

  const pending = users.filter(u => u.status === "pending");
  const curSchol = schols.find(s => s.id === curScholId);

  const showSaveMsg = () => { setSaveMsg(true); setTimeout(() => setSaveMsg(false), 2500); };

  const goTab = (id) => { setActiveTab(id); if (id !== "scholarships") setCurScholId(null); };

  // User actions
  const activateUser = (id) => setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "active" } : u));
  const blockUser = (id) => setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "blocked" } : u));
  const deleteUser = (id) => { if (!confirm("حذف هذا المستخدم نهائياً؟")) return; setUsers(prev => prev.filter(u => u.id !== id)); };
  const addUser = (data) => setUsers(prev => [...prev, { id: uid(), date: new Date().toISOString().slice(0,10), scholarship: "—", ...data }]);

  // Scholarship actions
  const openScholDetail = (id) => {
    const s = schols.find(x => x.id === id);
    if (!s) return;
    setCurScholId(id);
    setScholTags([...s.tags]);
    setActiveTab("scholarships");
    setTimeout(() => {
      if (reqRef.current) reqRef.current.innerHTML = s.req || "";
      if (covRef.current) covRef.current.innerHTML = s.cov || "";
    }, 50);
  };
  const saveSchol = () => {
    if (!curScholId) return;
    setSchols(prev => prev.map(s => s.id === curScholId ? {
      ...s,
      tAr: document.getElementById("f_tAr")?.value ?? s.tAr,
      tEn: document.getElementById("f_tEn")?.value ?? s.tEn,
      cAr: document.getElementById("f_cAr")?.value ?? s.cAr,
      cEn: document.getElementById("f_cEn")?.value ?? s.cEn,
      flag: document.getElementById("f_flag")?.value || s.flag,
      dAr: document.getElementById("f_dAr")?.value ?? s.dAr,
      dEn: document.getElementById("f_dEn")?.value ?? s.dEn,
      lAr: document.getElementById("f_lAr")?.value ?? s.lAr,
      lEn: document.getElementById("f_lEn")?.value ?? s.lEn,
      type: document.getElementById("f_type")?.value ?? s.type,
      sAr: document.getElementById("f_sAr")?.value ?? s.sAr,
      sEn: document.getElementById("f_sEn")?.value ?? s.sEn,
      url1: document.getElementById("f_url1")?.value ?? s.url1,
      url2: document.getElementById("f_url2")?.value ?? s.url2,
      req: reqRef.current?.innerHTML ?? s.req,
      cov: covRef.current?.innerHTML ?? s.cov,
      tags: [...scholTags],
    } : s));
    showSaveMsg();
  };

  const filteredUsers = (() => {
    let list = uFilter === "all" ? users : users.filter(u => ({
      pending: u.status === "pending", active: u.status === "active",
      admin: u.role === "admin", blocked: u.status === "blocked",
    })[uFilter]);
    if (searchQ) list = list.filter(u => u.name.includes(searchQ) || u.email.includes(searchQ));
    return list;
  })();

  const handleLogoUpload = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = d => setLogoSrc(d.result); r.readAsDataURL(f);
  };

  const handleCoverUpload = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = d => setSchols(prev => prev.map(s => s.id === curScholId ? { ...s, img: d.result } : s));
    r.readAsDataURL(f);
  };

  const NAV = [
    { id: "overview",     label: "نظرة عامة",          icon: "ti-layout-dashboard", section: "لوحة التحكم" },
    { id: "users",        label: "المستخدمون",          icon: "ti-users",            section: "الإدارة", badge: pending.length },
    { id: "leads",        label: "العملاء المحتملون",   icon: "ti-clipboard-list" },
    { id: "chat",         label: "الشات",               icon: "ti-messages" },
    { id: "scholarships", label: "المنح",               icon: "ti-certificate",      section: "المحتوى" },
    { id: "courses",      label: "الكورسات",            icon: "ti-book" },
    { id: "research",     label: "الأبحاث",             icon: "ti-flask" },
    { id: "content",      label: "محتوى الموقع",        icon: "ti-layout-cards" },
    { id: "hero",         label: "الصفحة الرئيسية",    icon: "ti-home" },
    { id: "team",         label: "فريق العمل",          icon: "ti-id-badge" },
    { id: "faq",          label: "الأسئلة الشائعة",    icon: "ti-help-circle" },
    { id: "settings",     label: "الإعدادات",           icon: "ti-settings",         section: "الإعدادات" },
  ];

  const statsData = [
    { num: users.filter(u=>u.role==="student").length, label:"إجمالي الطلاب", icon:"ti-users", color:"#2F7B6E", bg:"rgba(47,123,110,0.12)", sub:<><i className="ti ti-trending-up" style={{fontSize:11}}/> +4 هذا الشهر</> },
    { num: pending.length, label:"بانتظار التفعيل", icon:"ti-clock-pause", color:"#C8932B", bg:"rgba(200,147,43,0.14)", sub:<><i className="ti ti-alert-triangle" style={{fontSize:11}}/> يحتاج مراجعة</> },
    { num: users.filter(u=>u.status==="active"&&u.role==="student").length, label:"مفعّلون", icon:"ti-user-check", color:"#2F7B6E", bg:"rgba(47,123,110,0.12)", pct: users.filter(u=>u.role==="student").length ? Math.round(users.filter(u=>u.status==="active"&&u.role==="student").length/users.filter(u=>u.role==="student").length*100) : 0 },
    { num: users.filter(u=>u.role==="admin").length, label:"المشرفون", icon:"ti-shield-half", color:"var(--ink)", bg:"rgba(19,33,59,0.08)", sub:<><i className="ti ti-lock" style={{fontSize:11}}/> صلاحية كاملة</> },
  ];

  return (
    <div className={`dash-app ${isDark?"dark":"light"}`} style={{ background:"var(--bg)",color:"var(--tx)",display:"flex",height:"100vh",overflow:"hidden" }}>
      {/* ── Sidebar ── */}
      <aside style={{ width:215,background:"var(--sidebar)",display:"flex",flexDirection:"column",flexShrink:0 }}>
        <div style={{ padding:"13px 15px",display:"flex",alignItems:"center",gap:9,borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ width:32,height:32,borderRadius:8,background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden" }}>
            {logoSrc ? <img src={logoSrc} style={{ width:"100%",height:"100%",objectFit:"contain",borderRadius:8 }} alt="logo" /> : <i className="ti ti-school" style={{ fontSize:17,color:"var(--ink)" }} />}
          </div>
          <span style={{ color:"#F0EDE4",fontWeight:800,fontSize:15 }}>{brandName}</span>
        </div>
        <nav style={{ flex:1,padding:8,overflowY:"auto" }}>
          {NAV.map((item, i) => (
            <div key={item.id}>
              {item.section && <div style={{ fontSize:9.5,fontWeight:700,color:"rgba(255,255,255,0.28)",padding:"12px 8px 5px",letterSpacing:".07em",textTransform:"uppercase" }}>{item.section}</div>}
              <button className={`dash-ni${activeTab===item.id?" active":""}`} onClick={()=>goTab(item.id)}>
                <i className={`ti ${item.icon}`} style={{ fontSize:16 }} />
                {item.label}
                {!!item.badge && <span style={{ marginRight:"auto",background:"rgba(220,60,60,0.9)",color:"#fff",fontSize:9.5,padding:"1px 6px",borderRadius:99,fontWeight:700,lineHeight:1.6 }}>{item.badge}</span>}
              </button>
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0 }}>
        {/* Topbar */}
        <div style={{ height:52,background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",padding:"0 15px",gap:9,flexShrink:0 }}>
          <span style={{ fontWeight:800,fontSize:15,flex:1 }}>
            {{ overview:"نظرة عامة",users:"المستخدمون",leads:"العملاء المحتملون",chat:"الشات",scholarships: curScholId ? (curSchol?.tAr||"تفاصيل المنحة") : "المنح الدراسية",courses:"الكورسات",research:"الأبحاث",content:"محتوى الموقع",hero:"الصفحة الرئيسية",team:"فريق العمل",faq:"الأسئلة الشائعة",settings:"الإعدادات" }[activeTab]}
          </span>
          <div style={{ display:"flex",alignItems:"center",gap:6,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:7,padding:"0 9px",width:190 }}>
            <i className="ti ti-search" style={{ color:"var(--muted)",fontSize:15 }} />
            <input className="dash-input" style={{ border:"none",background:"none",padding:"7px 0",width:"100%" }} placeholder="بحث..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} />
          </div>
          <div style={{ width:1,height:22,background:"var(--border)" }} />
          <button className="dash-act-btn" onClick={()=>goTab("users")} style={{ position:"relative" }}>
            <i className="ti ti-bell" style={{ fontSize:16 }} />
            {pending.length > 0 && <span style={{ position:"absolute",top:5,right:5,width:6,height:6,borderRadius:"50%",background:"#e84545",border:`1.5px solid var(--surface)` }} />}
          </button>
          <button className="dash-act-btn" onClick={()=>setIsDark(d=>!d)}>
            <i className={`ti ${isDark?"ti-sun":"ti-moon"}`} style={{ fontSize:16 }} />
          </button>
          <div style={{ width:1,height:22,background:"var(--border)" }} />
          <div style={{ display:"flex",alignItems:"center",gap:7,padding:"4px 10px 4px 5px",borderRadius:99,background:"var(--surface2)",border:"1px solid var(--border)",cursor:"pointer" }} onClick={()=>goTab("settings")}>
            <div style={{ width:24,height:24,borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"var(--ink)",flexShrink:0 }}>{adminInfo.initials}</div>
            <div>
              <div style={{ fontSize:11.5,fontWeight:700 }}>{adminInfo.name}</div>
              <div style={{ fontSize:9.5,color:"var(--muted)" }}>{adminInfo.email}</div>
            </div>
          </div>
          <button onClick={()=>{ if(confirm("تسجيل الخروج؟")) onLogout(); }} style={{ width:32,height:32,borderRadius:7,border:"1px solid rgba(220,60,60,0.25)",background:"rgba(220,60,60,0.07)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(220,60,60,0.7)",flexShrink:0 }}>
            <i className="ti ti-logout" style={{ fontSize:15 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex:1,overflowY:"auto",padding:16 }}>

          {/* ── Chat ── */}
          {activeTab === "chat" && <ChatTab />}

          {/* ── Leads ── */}
          {activeTab === "leads" && <LeadsTab />}

          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14 }}>
                {statsData.map((s,i) => (
                  <div key={i} className="dash-card">
                    <div style={{ width:34,height:34,borderRadius:8,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8 }}>
                      <i className={`ti ${s.icon}`} style={{ fontSize:18,color:s.color }} />
                    </div>
                    <div style={{ fontSize:24,fontWeight:800,lineHeight:1,color:s.color||"var(--tx)" }}>{s.num}</div>
                    <div style={{ fontSize:11,color:"var(--muted)",fontWeight:600,marginTop:2 }}>{s.label}</div>
                    {s.pct !== undefined ? (
                      <div style={{ height:5,borderRadius:99,background:"var(--surface2)",overflow:"hidden",marginTop:6 }}>
                        <div style={{ height:"100%",borderRadius:99,background:"var(--gold)",width:`${s.pct}%`,transition:".4s" }} />
                      </div>
                    ) : <div style={{ fontSize:10.5,fontWeight:600,display:"flex",alignItems:"center",gap:3,marginTop:4,color:s.color||"var(--muted)" }}>{s.sub}</div>}
                  </div>
                ))}
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                <div className="dash-card">
                  <div style={{ fontWeight:800,fontSize:13,marginBottom:11,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:7 }}><i className="ti ti-clock" style={{ color:"#C8932B",fontSize:15 }} />طلبات التفعيل</div>
                    <button className="dash-btn gold" style={{ fontSize:11,padding:"5px 10px" }} onClick={()=>goTab("users")}>عرض الكل</button>
                  </div>
                  <div style={{ borderRadius:10,border:"1px solid var(--border)",overflow:"hidden" }}>
                    <table className="dash-tbl"><thead><tr><th>الطالب</th><th>المنحة</th><th>إجراء</th></tr></thead>
                      <tbody>
                        {pending.length === 0 ? <tr><td colSpan={3} style={{ textAlign:"center",padding:16,color:"var(--muted)" }}>لا توجد طلبات معلقة</td></tr> :
                          pending.map(u => (
                            <tr key={u.id}>
                              <td><div style={{ display:"flex",alignItems:"center",gap:7 }}><div style={{ width:24,height:24,borderRadius:"50%",background:"rgba(200,147,43,0.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#a07318" }}>{u.name[0]}</div>{u.name}</div></td>
                              <td>{u.scholarship}</td>
                              <td><div style={{ display:"flex",gap:5 }}><ActionBtn icon="ti-check" className="g" onClick={()=>activateUser(u.id)} title="تفعيل" /><ActionBtn icon="ti-x" className="r" onClick={()=>blockUser(u.id)} title="رفض" /></div></td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="dash-card">
                  <div style={{ fontWeight:800,fontSize:13,marginBottom:11,display:"flex",alignItems:"center",gap:7 }}><i className="ti ti-activity" style={{ color:"var(--gold)",fontSize:15 }} />آخر النشاطات</div>
                  {ACTS.map((a,i) => (
                    <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:9,padding:"7px 0",borderBottom:`1px solid var(--border)` }}>
                      <div style={{ width:7,height:7,borderRadius:"50%",background:a.c,flexShrink:0,marginTop:4 }} />
                      <div><div style={{ fontSize:11.5 }}>{a.t}</div><div style={{ fontSize:10,color:"var(--muted)",marginTop:1 }}>{a.tm}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Users ── */}
          {activeTab === "users" && (
            <div>
              <div style={{ display:"flex",gap:3,marginBottom:12,background:"var(--surface2)",padding:3,borderRadius:8 }}>
                {["all","pending","active","admin","blocked"].map(f => (
                  <button key={f} className={`dash-tab${uFilter===f?" active":""}`} onClick={()=>setUFilter(f)}>
                    {{ all:"الكل",pending:"منتظر",active:"مفعّل",admin:"مشرف",blocked:"محظور" }[f]}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                <span style={{ fontWeight:800,fontSize:14 }}>{{ all:"جميع المستخدمين",pending:"بانتظار التفعيل",active:"المفعّلون",admin:"المشرفون",blocked:"المحظورون" }[uFilter]}</span>
                <button className="dash-btn gold" onClick={()=>setModal("addUser")}><i className="ti ti-plus" style={{ fontSize:12 }} />إضافة</button>
              </div>
              <div style={{ borderRadius:10,border:"1px solid var(--border)",overflow:"hidden" }}>
                <table className="dash-tbl">
                  <thead><tr><th>المستخدم</th><th>البريد</th><th>الدور</th><th>الحالة</th><th>المنحة</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
                  <tbody>
                    {filteredUsers.length === 0 ? <tr><td colSpan={7} style={{ textAlign:"center",padding:18,color:"var(--muted)" }}>لا توجد نتائج</td></tr> :
                      filteredUsers.map(u => (
                        <tr key={u.id}>
                          <td><div style={{ display:"flex",alignItems:"center",gap:7 }}><div style={{ width:26,height:26,borderRadius:"50%",background:u.role==="admin"?"rgba(19,33,59,0.1)":"rgba(47,123,110,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:u.role==="admin"?"var(--tx)":"#2F7B6E" }}>{u.name[0]}</div>{u.name}</div></td>
                          <td style={{ direction:"ltr",textAlign:"right",fontSize:11 }}>{u.email}</td>
                          <td><span className="dash-badge" style={{ background:"rgba(19,33,59,0.1)",color:"var(--tx)" }}>{u.role==="admin"?"مشرف":"طالب"}</span></td>
                          <td><span className="dash-badge" style={{ background:{ pending:"rgba(200,147,43,0.14)",active:"rgba(47,123,110,0.14)",blocked:"rgba(220,60,60,0.12)" }[u.status], color:{ pending:"#a07318",active:"#2F7B6E",blocked:"#b83030" }[u.status] }}>{{ pending:"منتظر",active:"مفعّل",blocked:"محظور" }[u.status]}</span></td>
                          <td style={{ fontSize:11 }}>{u.scholarship}</td>
                          <td style={{ fontSize:11 }}>{u.date}</td>
                          <td><div style={{ display:"flex",gap:5 }}>
                            {u.status==="pending" && <ActionBtn icon="ti-check" className="g" onClick={()=>activateUser(u.id)} title="تفعيل" />}
                            {u.status==="active"&&u.role!=="admin" && <ActionBtn icon="ti-ban" className="r" onClick={()=>blockUser(u.id)} title="حظر" />}
                            {u.status==="blocked" && <ActionBtn icon="ti-refresh" className="g" onClick={()=>activateUser(u.id)} title="إلغاء الحظر" />}
                            {u.role!=="admin" && <ActionBtn icon="ti-trash" className="r" onClick={()=>deleteUser(u.id)} title="حذف" />}
                          </div></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Scholarships ── */}
          {activeTab === "scholarships" && !curScholId && (
            <div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                <span style={{ fontWeight:800,fontSize:14 }}>المنح الدراسية</span>
                <button className="dash-btn gold" onClick={()=>{ const nid=uid(); setSchols(p=>[...p,{id:nid,flag:"🌍",cAr:"دولة",cEn:"Country",tAr:"منحة جديدة",tEn:"New Scholarship",dAr:"حدد الموعد",dEn:"TBD",lAr:"ماجستير",lEn:"Master",type:"full",sAr:"",sEn:"",req:"",cov:"",url1:"",url2:"",tags:[],img:""}]); openScholDetail(nid); }}><i className="ti ti-plus" style={{ fontSize:12 }} />إضافة منحة</button>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10 }}>
                {schols.map(s => (
                  <div key={s.id} className="dash-sch-card">
                    <div style={{ width:"100%",height:90,background:"var(--surface2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,position:"relative",overflow:"hidden" }}>
                      {s.img ? <img src={s.img} alt={s.tAr} style={{ width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0 }} /> : <span>{s.flag}</span>}
                    </div>
                    <div style={{ padding:11 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
                        <span style={{ fontSize:16 }}>{s.flag}</span>
                        <span className="dash-badge" style={{ background:"rgba(200,147,43,0.12)",color:"#8B6419",fontSize:10 }}>{TYPE_LBL[s.type]}</span>
                      </div>
                      <div style={{ fontSize:10.5,fontWeight:700,color:"var(--gold)" }}>{s.dAr}</div>
                      <div style={{ fontWeight:800,fontSize:12.5,lineHeight:1.35,margin:"3px 0" }}>{s.tAr}</div>
                      <div style={{ fontSize:11,color:"var(--muted)",marginBottom:9 }}>{s.cAr} — {s.lAr}</div>
                      <div style={{ display:"flex",gap:6 }}>
                        <button className="dash-btn gold" style={{ flex:1,justifyContent:"center",fontSize:11 }} onClick={()=>openScholDetail(s.id)}><i className="ti ti-edit" style={{ fontSize:12 }} />تفاصيل</button>
                        <button className="dash-btn out" style={{ fontSize:11 }} onClick={()=>{ if(!confirm("حذف؟"))return; setSchols(p=>p.filter(x=>x.id!==s.id)); }}><i className="ti ti-trash" style={{ fontSize:12 }} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Scholarship Detail ── */}
          {activeTab === "scholarships" && curScholId && curSchol && (
            <div>
              <button onClick={()=>setCurScholId(null)} style={{ display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:"var(--muted)",fontSize:12.5,fontWeight:700,padding:0,marginBottom:13,fontFamily:"inherit" }}>
                <i className="ti ti-arrow-right" style={{ fontSize:14 }} />العودة للمنح
              </button>
              {/* Cover hero */}
              <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:11,overflow:"hidden",marginBottom:13 }}>
                <div style={{ width:"100%",height:120,background:"var(--surface2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:54,position:"relative",overflow:"hidden" }}>
                  {curSchol.img && <img src={curSchol.img} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0 }} />}
                  <span style={{ position:"relative",zIndex:1 }}>{curSchol.flag}</span>
                  <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.45),transparent)" }} />
                  <div style={{ position:"absolute",bottom:10,right:13,background:"var(--gold)",color:"var(--ink)",padding:"3px 11px",borderRadius:99,fontSize:10.5,fontWeight:800 }}>{TYPE_LBL[curSchol.type]}</div>
                </div>
                <div style={{ padding:"12px 15px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
                  {[["الدولة",curSchol.cAr],["الموعد",curSchol.dAr,"var(--gold)"],["المستوى",curSchol.lAr]].map(([l,v,c])=>(
                    <div key={l}><div style={{ fontSize:10,color:"var(--muted)",fontWeight:700,marginBottom:2 }}>{l}</div><div style={{ fontSize:13,fontWeight:700,color:c||"var(--tx)" }}>{v}</div></div>
                  ))}
                </div>
              </div>
              {/* Fields */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                <div>
                  {[["المعلومات الأساسية","ti-info-circle","var(--gold)",[["f_tAr","اسم المنحة (عربي)",curSchol.tAr],["f_tEn","اسم المنحة (إنجليزي)",curSchol.tEn],["f_cAr","الدولة (عربي)",curSchol.cAr],["f_cEn","الدولة (إنجليزي)",curSchol.cEn],["f_flag","رمز العلم",curSchol.flag]]],
                    ["التواريخ والمستوى","ti-calendar","var(--teal)",[["f_dAr","الموعد (عربي)",curSchol.dAr],["f_dEn","الموعد (إنجليزي)",curSchol.dEn],["f_lAr","المستوى (عربي)",curSchol.lAr],["f_lEn","المستوى (إنجليزي)",curSchol.lEn]]]
                  ].map(([title,ico,color,fields])=>(
                    <div key={title} className="dash-card" style={{ marginBottom:10 }}>
                      <div style={{ fontWeight:800,fontSize:13,marginBottom:11,display:"flex",alignItems:"center",gap:7 }}><i className={`ti ${ico}`} style={{ color }} />{title}</div>
                      {fields.map(([id,label,def])=>(
                        <Field key={id} label={label}><input id={id} className="dash-input" defaultValue={def} /></Field>
                      ))}
                      {title==="التواريخ والمستوى" && (
                        <Field label="نوع المنحة">
                          <select id="f_type" className="dash-select" defaultValue={curSchol.type}>
                            {Object.entries(TYPE_LBL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                          </select>
                        </Field>
                      )}
                    </div>
                  ))}
                  <div className="dash-card">
                    <div style={{ fontWeight:800,fontSize:13,marginBottom:11,display:"flex",alignItems:"center",gap:7 }}><i className="ti ti-photo" style={{ color:"#6B5DD3" }} />صورة الغلاف</div>
                    <div className="dash-iua" onClick={()=>document.getElementById("coverIn").click()}>
                      {curSchol.img ? <img src={curSchol.img} style={{ width:"100%",height:70,objectFit:"cover",borderRadius:6,marginBottom:5 }} alt="" /> : <><i className="ti ti-cloud-upload" style={{ fontSize:20,color:"var(--muted)" }} /><div style={{ fontSize:11,color:"var(--muted)",marginTop:4 }}>انقر لرفع صورة الغلاف</div></>}
                    </div>
                    <input type="file" id="coverIn" accept="image/*" style={{ display:"none" }} onChange={handleCoverUpload} />
                  </div>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                  <div className="dash-card">
                    <div style={{ fontWeight:800,fontSize:13,marginBottom:11,display:"flex",alignItems:"center",gap:7 }}><i className="ti ti-align-right" style={{ color:"var(--teal)" }} />ملخص المنحة</div>
                    <Field label="ملخص (عربي)"><textarea id="f_sAr" className="dash-textarea" rows={3} defaultValue={curSchol.sAr} /></Field>
                    <Field label="ملخص (إنجليزي)"><textarea id="f_sEn" className="dash-textarea" rows={3} defaultValue={curSchol.sEn} /></Field>
                  </div>
                  <div className="dash-card">
                    <div style={{ fontWeight:800,fontSize:13,marginBottom:11,display:"flex",alignItems:"center",gap:7 }}><i className="ti ti-list-check" style={{ color:"var(--gold)" }} />شروط التقديم</div>
                    <div style={{ border:"1px solid var(--border)",borderRadius:8,overflow:"hidden" }}>
                      <div style={{ display:"flex",gap:2,padding:"6px 7px",background:"var(--surface2)",borderBottom:"1px solid var(--border)",flexWrap:"wrap" }}>
                        {[["ti-bold","bold"],["ti-italic","italic"],["ti-heading","h3"],["ti-list","insertUnorderedList"],["ti-list-numbers","insertOrderedList"],["ti-arrow-back-up","undo"]].map(([ico,cmd])=>(
                          <button key={cmd} onClick={()=>{ reqRef.current?.focus(); cmd==="h3"?document.execCommand("formatBlock",false,"h3"):document.execCommand(cmd,false,null); }} style={{ width:27,height:27,borderRadius:5,border:"none",background:"none",cursor:"pointer",color:"var(--tx)" }}><i className={`ti ${ico}`} /></button>
                        ))}
                      </div>
                      <div ref={reqRef} className="dash-ea" contentEditable suppressContentEditableWarning data-placeholder="شروط التقديم..." dangerouslySetInnerHTML={{ __html: curSchol.req || "" }} />
                    </div>
                  </div>
                  <div className="dash-card">
                    <div style={{ fontWeight:800,fontSize:13,marginBottom:11,display:"flex",alignItems:"center",gap:7 }}><i className="ti ti-gift" style={{ color:"#6B5DD3" }} />ماذا تشمل المنحة</div>
                    <div style={{ border:"1px solid var(--border)",borderRadius:8,overflow:"hidden" }}>
                      <div style={{ display:"flex",gap:2,padding:"6px 7px",background:"var(--surface2)",borderBottom:"1px solid var(--border)",flexWrap:"wrap" }}>
                        {[["ti-bold","bold"],["ti-italic","italic"],["ti-list","insertUnorderedList"],["ti-arrow-back-up","undo"]].map(([ico,cmd])=>(
                          <button key={cmd} onClick={()=>{ covRef.current?.focus(); document.execCommand(cmd,false,null); }} style={{ width:27,height:27,borderRadius:5,border:"none",background:"none",cursor:"pointer",color:"var(--tx)" }}><i className={`ti ${ico}`} /></button>
                        ))}
                      </div>
                      <div ref={covRef} className="dash-ea" contentEditable suppressContentEditableWarning data-placeholder="محتويات المنحة..." dangerouslySetInnerHTML={{ __html: curSchol.cov || "" }} />
                    </div>
                  </div>
                  {/* Tags */}
                  <div className="dash-card">
                    <div style={{ fontWeight:800,fontSize:13,marginBottom:11,display:"flex",alignItems:"center",gap:7 }}><i className="ti ti-tags" style={{ color:"var(--teal)" }} />وسوم</div>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:4,padding:"6px 8px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface2)",minHeight:36,cursor:"text" }} onClick={()=>document.getElementById("tagInput")?.focus()}>
                      {scholTags.map(t=>(
                        <span key={t} style={{ display:"flex",alignItems:"center",gap:3,background:"rgba(200,147,43,0.15)",color:"#8B6419",padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:700 }}>
                          {t}<span onClick={()=>setScholTags(p=>p.filter(x=>x!==t))} style={{ cursor:"pointer",opacity:.6,fontSize:10 }}>✕</span>
                        </span>
                      ))}
                      <input id="tagInput" style={{ border:"none",outline:"none",background:"none",fontSize:12,color:"var(--tx)",fontFamily:"inherit",minWidth:80,padding:"2px 3px" }} placeholder="اكتب + Enter"
                        onKeyDown={e=>{ if(e.key==="Enter"||e.key===","){e.preventDefault();const v=e.target.value.trim();if(v&&!scholTags.includes(v)){setScholTags(p=>[...p,v]);}e.target.value="";} }} />
                    </div>
                  </div>
                  {/* Links */}
                  <div className="dash-card">
                    <div style={{ fontWeight:800,fontSize:13,marginBottom:11,display:"flex",alignItems:"center",gap:7 }}><i className="ti ti-link" style={{ color:"var(--gold)" }} />روابط مهمة</div>
                    <Field label="رابط التقديم الرسمي"><input id="f_url1" className="dash-input" type="url" defaultValue={curSchol.url1} placeholder="https://..." /></Field>
                    <Field label="الموقع الرسمي"><input id="f_url2" className="dash-input" type="url" defaultValue={curSchol.url2} placeholder="https://..." /></Field>
                  </div>
                </div>
              </div>
              {/* Save bar */}
              <div style={{ position:"sticky",bottom:0,background:"var(--surface)",borderTop:"1px solid var(--border)",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:16 }}>
                <span style={{ fontSize:11.5,color:"var(--teal)",fontWeight:700,display:"flex",alignItems:"center",gap:5,opacity:saveMsg?1:0,transition:".3s" }}><i className="ti ti-circle-check" />تم الحفظ بنجاح</span>
                <div style={{ display:"flex",gap:8 }}>
                  <button className="dash-btn red" onClick={()=>{ if(!confirm("حذف هذه المنحة نهائياً؟"))return; setSchols(p=>p.filter(x=>x.id!==curScholId)); setCurScholId(null); }}><i className="ti ti-trash" style={{ fontSize:12 }} />حذف المنحة</button>
                  <button className="dash-btn out" onClick={()=>setCurScholId(null)}>إلغاء</button>
                  <button className="dash-btn gold" onClick={saveSchol}><i className="ti ti-device-floppy" style={{ fontSize:12 }} />حفظ التغييرات</button>
                </div>
              </div>
            </div>
          )}

          {/* ── Courses ── */}
          {activeTab === "courses" && (
            <div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                <span style={{ fontWeight:800,fontSize:14 }}>إدارة الكورسات</span>
                <button className="dash-btn gold" onClick={()=>setCourses(p=>[...p,{id:uid(),tAr:"كورس جديد",tEn:"New Course",dAr:"وصف الكورس",dEn:"Course description",priceOriginal:"",priceDiscount:""}])}><i className="ti ti-plus" style={{ fontSize:12 }} />إضافة كورس</button>
              </div>
              {courses.map(c => (
                <div key={c.id} className="dash-card" style={{ marginBottom:9 }}>
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:9 }}>
                      <div style={{ width:32,height:32,borderRadius:8,background:"rgba(200,147,43,0.12)",display:"flex",alignItems:"center",justifyContent:"center" }}><i className="ti ti-book" style={{ color:"#C8932B",fontSize:16 }} /></div>
                      <span style={{ fontWeight:700,fontSize:13 }}>{c.tAr}</span>
                    </div>
                    <button className="dash-btn red" onClick={()=>setCourses(p=>p.filter(x=>x.id!==c.id))}><i className="ti ti-trash" style={{ fontSize:12 }} />حذف</button>
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9 }}>
                    <Field label="العنوان (عربي)"><input className="dash-input" defaultValue={c.tAr} onChange={e=>setCourses(p=>p.map(x=>x.id===c.id?{...x,tAr:e.target.value}:x))} /></Field>
                    <Field label="العنوان (إنجليزي)"><input className="dash-input" defaultValue={c.tEn} onChange={e=>setCourses(p=>p.map(x=>x.id===c.id?{...x,tEn:e.target.value}:x))} /></Field>
                    <Field label="الوصف (عربي)"><textarea className="dash-textarea" rows={2} defaultValue={c.dAr} onChange={e=>setCourses(p=>p.map(x=>x.id===c.id?{...x,dAr:e.target.value}:x))} /></Field>
                    <Field label="الوصف (إنجليزي)"><textarea className="dash-textarea" rows={2} defaultValue={c.dEn} onChange={e=>setCourses(p=>p.map(x=>x.id===c.id?{...x,dEn:e.target.value}:x))} /></Field>
                    <Field label="السعر الأصلي (جنيه)">
                      <input className="dash-input" type="number" placeholder="مثال: 1500" defaultValue={c.priceOriginal} onChange={e=>setCourses(p=>p.map(x=>x.id===c.id?{...x,priceOriginal:e.target.value}:x))} />
                    </Field>
                    <Field label="السعر بعد الخصم (جنيه)">
                      <input className="dash-input" type="number" placeholder="اتركه فارغاً لو مفيش خصم" defaultValue={c.priceDiscount} onChange={e=>setCourses(p=>p.map(x=>x.id===c.id?{...x,priceDiscount:e.target.value}:x))} />
                    </Field>
                  </div>
                  {/* زرار الحفظ لكل كورس */}
                  <div style={{ display:"flex",justifyContent:"flex-end",marginTop:10,borderTop:"1px solid var(--border)",paddingTop:10 }}>
                    <button className="dash-btn gold" onClick={()=>showSaveMsg()}>
                      <i className="ti ti-device-floppy" style={{ fontSize:12 }} />حفظ التغييرات
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Research ── */}
          {activeTab === "research" && (
            <div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}><span style={{ fontWeight:800,fontSize:14 }}>صفحة الأبحاث</span></div>
              <div className="dash-card" style={{ marginBottom:10 }}>
                <div style={{ fontWeight:800,fontSize:13,marginBottom:12,display:"flex",alignItems:"center",gap:7 }}><i className="ti ti-flask" style={{ color:"#6B5DD3" }} />نص المقدمة</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                  <Field label="العنوان (عربي)"><input className="dash-input" defaultValue="نحن مركز بحثي متخصص لخدمة الدارسين" /></Field>
                  <Field label="العنوان (إنجليزي)"><input className="dash-input" defaultValue="A Research Center Dedicated to Students" /></Field>
                  <Field label="النص التعريفي (عربي)"><textarea className="dash-textarea" rows={3} defaultValue="يقدم المركز خدمات مساعدة الدارسين في المراحل التعليمية المختلفة..." /></Field>
                  <Field label="النص التعريفي (إنجليزي)"><textarea className="dash-textarea" rows={3} defaultValue="An Egyptian research center specialized in helping students..." /></Field>
                </div>
              </div>
              {[["الخدمات البحثية","ti-list-check","var(--gold)",resServices,setResServices,DEFAULT_RES_SERVICES[0]],
                ["التخصصات","ti-tags","var(--teal)",resSpecs,setResSpecs,DEFAULT_RES_SPECS[0]]
              ].map(([title,ico,color,list,setList,tmpl])=>(
                <div key={title} className="dash-card" style={{ marginBottom:10 }}>
                  <div style={{ fontWeight:800,fontSize:13,marginBottom:12,display:"flex",alignItems:"center",gap:7 }}>
                    <i className={`ti ${ico}`} style={{ color }} />{title}
                    <button className="dash-btn gold" style={{ marginRight:"auto",fontSize:11,padding:"4px 9px" }} onClick={()=>setList(p=>[...p,{id:uid(),...tmpl}])}><i className="ti ti-plus" style={{ fontSize:10 }} />إضافة</button>
                  </div>
                  {list.map(s=>(
                    <div key={s.id} style={{ display:"flex",alignItems:"center",gap:9,marginBottom:8 }}>
                      <div style={{ flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                        <input className="dash-input" defaultValue={s.ar} onChange={e=>setList(p=>p.map(x=>x.id===s.id?{...x,ar:e.target.value}:x))} placeholder="عربي" />
                        <input className="dash-input" defaultValue={s.en} onChange={e=>setList(p=>p.map(x=>x.id===s.id?{...x,en:e.target.value}:x))} placeholder="English" dir="ltr" />
                      </div>
                      <button className="dash-btn red" onClick={()=>setList(p=>p.filter(x=>x.id!==s.id))}><i className="ti ti-trash" style={{ fontSize:12 }} /></button>
                    </div>
                  ))}
                </div>
              ))}
              <button className="dash-btn gold" onClick={()=>alert("تم حفظ صفحة الأبحاث")}><i className="ti ti-device-floppy" style={{ fontSize:12 }} />حفظ التغييرات</button>
            </div>
          )}

          {/* ── Content ── */}
          {activeTab === "content" && (
            <div>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>محتوى الموقع</div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10 }}>
                {[
                  {ico:"ti-certificate",bg:"rgba(200,147,43,0.12)",c:"#C8932B",ttl:"المنح الدراسية",dsc:"إضافة وتعديل المنح",tab:"scholarships"},
                  {ico:"ti-book",bg:"rgba(47,123,110,0.12)",c:"#2F7B6E",ttl:"الكورسات",dsc:"إدارة الدورات التدريبية",tab:"courses"},
                  {ico:"ti-flask",bg:"rgba(107,93,211,0.12)",c:"#6B5DD3",ttl:"الأبحاث",dsc:"إدارة صفحة الأبحاث",tab:"research"},
                  {ico:"ti-id-badge",bg:"rgba(200,147,43,0.12)",c:"#C8932B",ttl:"فريق العمل",dsc:"إدارة أعضاء الفريق",tab:"team"},
                  {ico:"ti-help-circle",bg:"rgba(107,93,211,0.12)",c:"#6B5DD3",ttl:"الأسئلة الشائعة",dsc:"الأسئلة والأجوبة",tab:"faq"},
                  {ico:"ti-home",bg:"rgba(19,33,59,0.08)",c:"var(--ink)",ttl:"الصفحة الرئيسية",dsc:"نصوص Hero وأزرار CTA",tab:"hero"},
                ].map(item => (
                  <div key={item.tab} className="dash-card" style={{ display:"flex",flexDirection:"column",gap:9 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ width:36,height:36,borderRadius:8,background:item.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        <i className={`ti ${item.ico}`} style={{ color:item.c,fontSize:18 }} />
                      </div>
                      <div>
                        <div style={{ fontWeight:800,fontSize:13 }}>{item.ttl}</div>
                        <div style={{ fontSize:11,color:"var(--muted)" }}>{item.dsc}</div>
                      </div>
                    </div>
                    <button className="dash-btn gold" style={{ width:"100%",justifyContent:"center" }} onClick={()=>goTab(item.tab)}>
                      فتح <i className="ti ti-arrow-left" style={{ fontSize:11 }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Hero ── */}
          {activeTab === "hero" && (
            <div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                <span style={{ fontWeight:800,fontSize:14 }}>الصفحة الرئيسية (Hero)</span>
                <button className="dash-btn gold" onClick={()=>alert("تم حفظ الصفحة الرئيسية")}><i className="ti ti-device-floppy" style={{ fontSize:12 }} />حفظ</button>
              </div>
              <div className="dash-card" style={{ display:"grid",gap:10 }}>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                  <Field label="النص العلوي (عربي)"><input className="dash-input" defaultValue="بوابتك الموثوقة للدراسة بالخارج" /></Field>
                  <Field label="النص العلوي (إنجليزي)"><input className="dash-input" defaultValue="Your trusted gateway to studying abroad" /></Field>
                  <Field label="العنوان الرئيسي (عربي)"><input className="dash-input" defaultValue="مسارك نحو منحتك الدراسية يبدأ من هنا" /></Field>
                  <Field label="العنوان الرئيسي (إنجليزي)"><input className="dash-input" defaultValue="Your path to a scholarship starts here" /></Field>
                </div>
                <Field label="الوصف (عربي)"><textarea className="dash-textarea" rows={2} defaultValue="نرافقك خطوة بخطوة من اختيار التخصص والجامعة، وحتى تجهيز ملفك والقبول النهائي في منحتك." /></Field>
                <Field label="الوصف (إنجليزي)"><textarea className="dash-textarea" rows={2} defaultValue="We guide you step by step — from choosing a major and university to preparing your file and final acceptance." /></Field>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                  <Field label="زر 1 (عربي)"><input className="dash-input" defaultValue="احجز استشارة الآن" /></Field>
                  <Field label="زر 2 (عربي)"><input className="dash-input" defaultValue="تصفح المنح المتاحة" /></Field>
                </div>
              </div>
            </div>
          )}

          {/* ── Team ── */}
          {activeTab === "team" && (
            <div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                <span style={{ fontWeight:800,fontSize:14 }}>فريق العمل</span>
                <button className="dash-btn gold" onClick={()=>setTeam(p=>[...p,{id:uid(),nAr:"عضو جديد",rAr:"الدور"}])}>
                  <i className="ti ti-plus" style={{ fontSize:12 }} />إضافة عضو
                </button>
              </div>
              {team.map(m => (
                <div key={m.id} className="dash-card" style={{ marginBottom:9,display:"flex",alignItems:"center",gap:11 }}>
                  <div style={{ width:38,height:38,borderRadius:"50%",background:"rgba(200,147,43,0.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"#a07318",flexShrink:0 }}>
                    {m.nAr[0]}
                  </div>
                  <div style={{ flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:9 }}>
                    <Field label="الاسم"><input className="dash-input" defaultValue={m.nAr} onChange={e=>setTeam(p=>p.map(x=>x.id===m.id?{...x,nAr:e.target.value}:x))} /></Field>
                    <Field label="الدور"><input className="dash-input" defaultValue={m.rAr} onChange={e=>setTeam(p=>p.map(x=>x.id===m.id?{...x,rAr:e.target.value}:x))} /></Field>
                  </div>
                  <button className="dash-btn red" onClick={()=>setTeam(p=>p.filter(x=>x.id!==m.id))}>
                    <i className="ti ti-trash" style={{ fontSize:12 }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── FAQ ── */}
          {activeTab === "faq" && (
            <div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                <span style={{ fontWeight:800,fontSize:14 }}>الأسئلة الشائعة</span>
                <button className="dash-btn gold" onClick={()=>setFaqs(p=>[...p,{id:uid(),q:"سؤال جديد",a:"الإجابة هنا"}])}>
                  <i className="ti ti-plus" style={{ fontSize:12 }} />إضافة سؤال
                </button>
              </div>
              {faqs.map(f => (
                <div key={f.id} className="dash-card" style={{ marginBottom:9 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                    <span style={{ fontSize:11,fontWeight:700,color:"var(--muted)" }}>سؤال #{f.id}</span>
                    <button className="dash-btn red" onClick={()=>setFaqs(p=>p.filter(x=>x.id!==f.id))}>
                      <i className="ti ti-trash" style={{ fontSize:12 }} />حذف
                    </button>
                  </div>
                  <Field label="السؤال">
                    <input className="dash-input" defaultValue={f.q} onChange={e=>setFaqs(p=>p.map(x=>x.id===f.id?{...x,q:e.target.value}:x))} />
                  </Field>
                  <Field label="الإجابة">
                    <textarea className="dash-textarea" rows={2} defaultValue={f.a} onChange={e=>setFaqs(p=>p.map(x=>x.id===f.id?{...x,a:e.target.value}:x))} />
                  </Field>
                </div>
              ))}
            </div>
          )}

          {/* ── Settings ── */}
          {activeTab === "settings" && (
            <div>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>الإعدادات</div>

              {/* Branding */}
              <div className="dash-card" style={{ marginBottom:10 }}>
                <div style={{ fontWeight:800,fontSize:13,marginBottom:12,display:"flex",alignItems:"center",gap:7 }}>
                  <i className="ti ti-palette" style={{ color:"var(--gold)" }} />الهوية البصرية
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"auto 1fr",gap:14,alignItems:"start",marginBottom:12 }}>
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
                    <div style={{ width:52,height:52,borderRadius:10,background:"var(--ink)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",border:"2px solid var(--gold)" }}>
                      {logoSrc
                        ? <img src={logoSrc} style={{ width:"100%",height:"100%",objectFit:"contain",borderRadius:8 }} alt="logo" />
                        : <i className="ti ti-school" style={{ color:"var(--gold)",fontSize:24 }} />}
                    </div>
                    <div className="dash-iua" style={{ padding:"8px 14px" }} onClick={()=>document.getElementById("lgoIn").click()}>
                      <i className="ti ti-upload" style={{ fontSize:16,color:"var(--muted)" }} />
                      <div style={{ fontSize:10,color:"var(--muted)",marginTop:2 }}>رفع شعار</div>
                    </div>
                    <input type="file" id="lgoIn" accept="image/*" style={{ display:"none" }} onChange={handleLogoUpload} />
                  </div>
                  <div style={{ display:"grid",gap:9 }}>
                    <Field label="اسم الموقع (عربي)">
                      <input className="dash-input" value={brandName} onChange={e=>setBrandName(e.target.value)} />
                    </Field>
                    <Field label="اسم الموقع (إنجليزي)">
                      <input className="dash-input" defaultValue="Masar" />
                    </Field>
                    <Field label="لون التمييز">
                      <div style={{ display:"flex",alignItems:"center",gap:7,flexWrap:"wrap" }}>
                        {["#C8932B","#2F7B6E","#6B5DD3","#2563EB","#DC2626"].map(c => (
                          <div key={c} onClick={()=>setAccentColor(c)} style={{ width:26,height:26,borderRadius:6,background:c,cursor:"pointer",border:`2px solid ${accentColor===c?"#fff":"transparent"}`,transform:accentColor===c?"scale(1.12)":"scale(1)",transition:".15s" }} />
                        ))}
                      </div>
                    </Field>
                  </div>
                </div>
                <div style={{ display:"flex",justifyContent:"flex-end",marginTop:10,borderTop:"1px solid var(--border)",paddingTop:10 }}>
                  <button className="dash-btn gold" onClick={()=>showSaveMsg()}>
                    <i className="ti ti-device-floppy" style={{ fontSize:12 }} />حفظ الهوية البصرية
                  </button>
                </div>
              </div>

              {/* Social */}
              <div className="dash-card" style={{ marginBottom:10 }}>
                <div style={{ fontWeight:800,fontSize:13,marginBottom:12,display:"flex",alignItems:"center",gap:7 }}>
                  <i className="ti ti-brand-facebook" style={{ color:"#1877F2" }} />روابط السوشيال ميديا
                </div>
                {socials.map(s => (
                  <div key={s.id} style={{ display:"flex",alignItems:"center",gap:9,padding:"9px 0",borderBottom:"1px solid var(--border)" }}>
                    <div style={{ width:34,height:34,borderRadius:8,background:`${s.color}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <i className={`ti ${s.ico}`} style={{ color:s.color,fontSize:17 }} />
                    </div>
                    <span style={{ fontWeight:700,fontSize:12,minWidth:72 }}>{s.label}</span>
                    <input className="dash-input" style={{ flex:1,direction:"ltr" }} value={s.url} placeholder="الرابط..."
                      onChange={e=>setSocials(p=>p.map(x=>x.id===s.id?{...x,url:e.target.value}:x))} />
                    <Toggle checked={!!s.url} onChange={e=>{ if(!e.target.checked) setSocials(p=>p.map(x=>x.id===s.id?{...x,url:""}:x)); }} />
                  </div>
                ))}
                <button className="dash-btn gold" style={{ marginTop:11 }} onClick={()=>alert("تم حفظ روابط السوشيال ميديا")}>
                  <i className="ti ti-device-floppy" style={{ fontSize:12 }} />حفظ
                </button>
              </div>

              {/* Contact */}
              <div className="dash-card" style={{ marginBottom:10 }}>
                <div style={{ fontWeight:800,fontSize:13,marginBottom:12,display:"flex",alignItems:"center",gap:7 }}>
                  <i className="ti ti-address-book" style={{ color:"var(--teal)" }} />بيانات التواصل
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                  <Field label="البريد الإلكتروني"><input className="dash-input" defaultValue="info@masar.com" /></Field>
                  <Field label="الهاتف / واتساب"><input className="dash-input" defaultValue="+20 100 000 0000" /></Field>
                  <Field label="العنوان (عربي)"><input className="dash-input" defaultValue="القاهرة، مصر" /></Field>
                  <Field label="العنوان (إنجليزي)"><input className="dash-input" defaultValue="Cairo, Egypt" /></Field>
                </div>
                <button className="dash-btn gold" style={{ marginTop:10 }} onClick={()=>alert("تم حفظ بيانات التواصل")}>
                  <i className="ti ti-device-floppy" style={{ fontSize:12 }} />حفظ
                </button>
              </div>

              {/* Permissions */}
              <div className="dash-card" style={{ marginBottom:10 }}>
                <div style={{ fontWeight:800,fontSize:13,marginBottom:12,display:"flex",alignItems:"center",gap:7 }}>
                  <i className="ti ti-shield-check" style={{ color:"#6B5DD3" }} />صلاحيات المشرف الثانوي
                </div>
                {perms.map(p => (
                  <div key={p.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)" }}>
                    <div>
                      <div style={{ fontWeight:700,fontSize:12.5 }}>{p.n}</div>
                      <div style={{ fontSize:11,color:"var(--muted)",marginTop:1 }}>{p.d}</div>
                    </div>
                    <Toggle checked={p.on} onChange={e=>setPerms(prev=>prev.map(x=>x.id===p.id?{...x,on:e.target.checked}:x))} />
                  </div>
                ))}
              </div>

              {/* Login settings */}
              <div className="dash-card" style={{ marginBottom:10 }}>
                <div style={{ fontWeight:800,fontSize:13,marginBottom:12,display:"flex",alignItems:"center",gap:7 }}>
                  <i className="ti ti-brand-google" style={{ color:"#EA4335" }} />إعدادات تسجيل الدخول
                </div>
                <Field label="البريد المعتمد للمدير"><input className="dash-input" defaultValue="omar@masar.com" /></Field>
                <Field label="البريد المعتمد للمشرف"><input className="dash-input" defaultValue="lian@masar.com" /></Field>
                {[
                  ["طلب كود OTP عند كل دخول","إرسال كود تحقق للبريد بعد Google",true],
                  ["جلسة لمدة 24 ساعة","عدم طلب OTP مجدداً خلال 24 ساعة",false],
                ].map(([n,d,def]) => (
                  <div key={n} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)" }}>
                    <div>
                      <div style={{ fontWeight:700,fontSize:12.5 }}>{n}</div>
                      <div style={{ fontSize:11,color:"var(--muted)",marginTop:1 }}>{d}</div>
                    </div>
                    <Toggle checked={def} onChange={()=>{}} />
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Modal */}
      {modal === "addUser" && (
        <AddUserModal onSave={(data)=>{ addUser(data); setModal(null); }} onClose={()=>setModal(null)} />
      )}
    </div>
  );
}

// ─── Leads Tab ───────────────────────────────────────────────────────────────
function LeadsTab() {
  const [leads, setLeads] = useState(() => getLeads());
  const [statusFilter, setStatusFilter] = useState("الكل");

  const statuses = ["الكل", "جديد", "تم التواصل", "مهتم", "غير مهتم"];

  const filtered = statusFilter === "الكل"
    ? leads
    : leads.filter(l => l.status === statusFilter);

  const updateStatus = (id, status) => {
    const updated = leads.map(l => l.id === id ? { ...l, status } : l);
    setLeads(updated);
    localStorage.setItem("masar_leads", JSON.stringify(updated));
  };

  const deleteLead = (id) => {
    if (!confirm("حذف هذا العميل نهائياً؟")) return;
    const updated = leads.filter(l => l.id !== id);
    setLeads(updated);
    localStorage.setItem("masar_leads", JSON.stringify(updated));
  };

  const exportExcel = () => {
    const rows = leads.map(l => ({
      "الاسم":              l.name,
      "رقم الهاتف":        l.phone,
      "البريد الإلكتروني": l.email,
      "المنحة المطلوبة":   l.scholarship,
      "الرسالة":           l.message,
      "المصدر":            l.source === "chat" ? "شات" : "فورم",
      "تاريخ التسجيل":     new Date(l.date).toLocaleDateString("ar-EG"),
      "الحالة":            l.status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [20, 16, 24, 24, 30, 10, 18, 14].map(wch => ({ wch }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "العملاء");
    XLSX.writeFile(wb, `masar_leads_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const sourceCount = { form: leads.filter(l => l.source === "form").length, chat: leads.filter(l => l.source === "chat").length };

  return (
    <div>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
        {[
          { label:"إجمالي العملاء", num:leads.length, color:"#2F7B6E", bg:"rgba(47,123,110,0.12)", icon:"ti-users" },
          { label:"جدد", num:leads.filter(l=>l.status==="جديد").length, color:"#C8932B", bg:"rgba(200,147,43,0.14)", icon:"ti-clock" },
          { label:"من الشات", num:sourceCount.chat, color:"#6B5DD3", bg:"rgba(107,93,211,0.12)", icon:"ti-message-circle" },
          { label:"من الفورم", num:sourceCount.form, color:"#2F7B6E", bg:"rgba(47,123,110,0.12)", icon:"ti-forms" },
        ].map((s,i) => (
          <div key={i} className="dash-card">
            <div style={{ width:34,height:34,borderRadius:8,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize:18,color:s.color }} />
            </div>
            <div style={{ fontSize:24,fontWeight:800,lineHeight:1,color:s.color }}>{s.num}</div>
            <div style={{ fontSize:11,color:"var(--muted)",fontWeight:600,marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Export */}
      <div className="dash-card">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {statuses.map(s => (
              <button key={s} className={`dash-btn ${statusFilter === s ? "gold" : "out"}`} style={{ fontSize:11,padding:"5px 10px" }} onClick={() => setStatusFilter(s)}>
                {s}
                {s !== "الكل" && <span style={{ marginRight:4,opacity:.7 }}>({leads.filter(l=>l.status===s).length})</span>}
              </button>
            ))}
          </div>
          <button className="dash-btn gold" onClick={exportExcel}>
            <i className="ti ti-file-spreadsheet" style={{ fontSize:13 }} />
            تصدير Excel ({leads.length})
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX:"auto" }}>
          <table className="dash-tbl" style={{ width:"100%" }}>
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>رقم الهاتف</th>
                <th>البريد</th>
                <th>المنحة</th>
                <th>المصدر</th>
                <th>التاريخ</th>
                <th>الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign:"center", padding:"2rem", color:"var(--muted)" }}>
                    لا يوجد بيانات بعد — ستظهر هنا بمجرد تسجيل أول عميل
                  </td>
                </tr>
              ) : filtered.map((lead, i) => (
                <tr key={lead.id}>
                  <td style={{ color:"var(--muted)", fontSize:11 }}>{i + 1}</td>
                  <td style={{ fontWeight:700 }}>{lead.name}</td>
                  <td dir="ltr" style={{ fontFamily:"monospace", fontSize:12.5 }}>{lead.phone}</td>
                  <td style={{ fontSize:12, color:"var(--muted)" }}>{lead.email || "—"}</td>
                  <td style={{ fontSize:12 }}>{lead.scholarship || "—"}</td>
                  <td>
                    <span className={`dash-badge${lead.source === "chat" ? "" : " green"}`}>
                      {lead.source === "chat" ? "💬 شات" : "📝 فورم"}
                    </span>
                  </td>
                  <td style={{ fontSize:11, color:"var(--muted)" }}>{new Date(lead.date).toLocaleDateString("ar-EG")}</td>
                  <td>
                    <select
                      className="dash-select"
                      style={{ fontSize:11, padding:"3px 6px" }}
                      value={lead.status}
                      onChange={e => updateStatus(lead.id, e.target.value)}
                    >
                      {["جديد","تم التواصل","مهتم","غير مهتم"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className="dash-act-btn red" onClick={() => deleteLead(lead.id)} title="حذف">
                      <i className="ti ti-trash" style={{ fontSize:13 }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leads.length > 0 && (
          <div style={{ marginTop:8, fontSize:11, color:"var(--muted)" }}>
            إجمالي: {leads.length} عميل محتمل
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add User Modal ───────────────────────────────────────────────────────────
function AddUserModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name:"", email:"", role:"student", status:"pending" });
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(11,18,32,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999 }} onClick={onClose}>
      <div style={{ background:"var(--surface)",borderRadius:12,padding:20,width:340,maxWidth:"92%",border:"1px solid var(--border)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontWeight:800,fontSize:15,marginBottom:13 }}>إضافة مستخدم جديد</div>
        <Field label="الاسم الكامل">
          <input className="dash-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="اسم المستخدم" />
        </Field>
        <Field label="البريد الإلكتروني">
          <input className="dash-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com" />
        </Field>
        <Field label="الدور">
          <select className="dash-select" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
            <option value="student">طالب</option>
            <option value="admin">مشرف</option>
          </select>
        </Field>
        <Field label="الحالة">
          <select className="dash-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
            <option value="pending">منتظر التفعيل</option>
            <option value="active">مفعّل مباشرة</option>
          </select>
        </Field>
        <div style={{ display:"flex",gap:7,justifyContent:"flex-end",marginTop:13 }}>
          <button className="dash-btn out" onClick={onClose}>إلغاء</button>
          <button className="dash-btn gold" onClick={()=>{ if(!form.name||!form.email){alert("يرجى ملء جميع الحقول");return;} onSave(form); }}>حفظ</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [screen, setScreen] = useState("login");
  const [otpData, setOtpData] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => { }, []);

  const handleOtpSent = (data) => { setOtpData(data); setScreen("otp"); };
  const handleVerified = () => {
    setAdminInfo({ name: otpData.name, email: otpData.email, initials: otpData.initials });
    setScreen("dash");
  };
  const handleLogout = () => { setScreen("login"); setOtpData(null); setAdminInfo(null); };

  if (screen === "login") return <LoginScreen onOtpSent={handleOtpSent} />;
  if (screen === "otp")   return <OtpScreen otpData={otpData} onVerified={handleVerified} onBack={()=>setScreen("login")} />;
  return <DashboardApp adminInfo={adminInfo} onLogout={handleLogout} />;
}
