import React, { useState, useEffect, useRef } from "react";
import AdminDashboard from "./AdminDashboard.jsx";
import {
  Menu, X, ChevronDown, Mail, Phone, MapPin, GraduationCap,
  Users, FileCheck, Award, ArrowLeft, ArrowRight, Facebook,
  Instagram, Youtube, Send, Lock, User as UserIcon, BookOpen,
} from "lucide-react";
/* ---------------- Translations ---------------- */
const T = {
  ar: {
    dir: "rtl",
    brand: "مسار",
    nav: { 
      home: "الرئيسية", 
      about: "من نحن", 
      scholarships: "المنح", 
      courses: "الكورسات", // تمت إضافة الكورسات للترجمة العربية
      team: "فريقنا", 
      faq: "الأسئلة الشائعة", 
      contact: "تواصل معنا" 
    },
    login: "تسجيل الدخول",
    heroEyebrow: "بوابتك الموثوقة للدراسة بالخارج",
    heroTitle: "مسارك نحو منحتك الدراسية يبدأ من هنا",
    heroSub: "نرافقك خطوة بخطوة من اختيار التخصص والجامعة، وحتى تجهيز ملفك والقبول النهائي في منحتك.",
    heroCta1: "احجز استشارة مجانية",
    heroCta2: "تصفح المنح المتاحة",
    heroStamp: "موثوق",
    aboutEyebrow: "من نحن",
    aboutTitle: "فريق من المستشارين، لا مجرد موقع",
    aboutText: "في مسار، يعمل معك مستشارون تم قبولهم فعليًا في منح دولية، لمساعدتك على بناء ملف تنافسي وتفادي أخطاء التقديم الشائعة.",
    aboutPoints: [
      { t: "مراجعة وإعداد الملفات", d: "خطابات النية والتوصية والسيرة الذاتية الأكاديمية" },
      { t: "اختيار الجامعة والمنحة", d: "وفق تخصصك وميزانيتك وفرص قبولك الواقعية" },
      { t: "متابعة بعد التقديم", d: "تجهيز للمقابلات ومتابعة حالة الطلب أولاً بأول" },
    ],
    statsEyebrow: "بالأرقام",
    stats: [
      { n: "12", s: "+", l: "سنة خبرة" },
      { n: "3500", s: "+", l: "طالب تمت مساعدته" },
      { n: "40", s: "+", l: "دولة دراسة" },
      { n: "92", s: "%", l: "رضا العملاء" },
    ],
    schEyebrow: "أحدث الفرص",
    schTitle: "منح دراسية متاحة الآن",
    schCta: "التفاصيل",
    scholarships: [
      { flag: "🇩🇪", country: "ألمانيا", title: "منحة DAAD للدراسات العليا", deadline: "التقديم حتى 15 أكتوبر", level: "ماجستير / دكتوراه" },
      { flag: "🇬🇧", country: "بريطانيا", title: "منحة تشيفنينج البريطانية", deadline: "التقديم حتى 2 نوفمبر", level: "ماجستير" },
      { flag: "🇹🇷", country: "تركيا", title: "منحة الحكومة التركية", deadline: "التقديم حتى 20 فبراير", level: "بكالوريوس / ماجستير" },
      { flag: "🇺🇸", country: "الولايات المتحدة", title: "منحة فولبرايت", deadline: "التقديم حتى 1 مايو", level: "ماجستير / دكتوراه" },
    ],
    // داتا الكورسات الخاصة بمسار
    coursesEyebrow: "برامجنا التدريبية",
    coursesTitle: "تطوير مهاراتك الأكاديمية",
    courses: [
      { title: "دورة التحضير المكثف للأيلتس والتوفر", desc: "تأهيل أكاديمي متقدم لاجتياز اختبارات اللغة بنجاح وضمان معايير القبول الدولي." },
      { title: "ورشة عمل خطابات النية والـ CV الأكاديمي", desc: "خطوة بخطوة لصياغة خطاب حافز متميز وملف شخصي يلفت انتباه لجان المنح." },
      { title: "توجيه القبول للمنح التركية والأوروبية", desc: "شرح شامل للنظم التعليمية وكيفية تجهيز مستنداتك وتفادي الأخطاء الشائعة." }
    ],
    teamEyebrow: "العقول خلف مسار",
    teamTitle: "فريق العمل",
    team: [
      { name: "أ. ليان حسن", role: "مستشارة منح دراسية، حاصلة على منحة DAAD سابقًا" },
      { name: "م. عمر فارس", role: "مؤسس ومدير عام، خبرة 10 سنوات في الاستشارات التعليمية" },
    ],
    faqEyebrow: "لديك سؤال؟",
    faqTitle: "الأسئلة الشائعة",
    faq: [
      { q: "هل تضمنون قبولي في المنحة؟", a: "لا نملك قرار الجهة المانحة، لكننا نقوّي ملفك بشكل كبير عبر استشارات مبنية على تجارب قبول حقيقية." },
      { q: "ما الفرق بين خدماتكم والتقديم المباشر؟", a: "نساعدك على تفادي الأخطاء الشائعة في الملفات والمواعيد، ونراجع كل مستند قبل إرساله." },
      { q: "هل يمكن استرداد الرسوم إن لم أُقبل؟", a: "الرسوم مقابل الجهد والوقت المبذول في إعداد ومراجعة ملفك، وليست مقابل ضمان قبول." },
      { q: "متى أبدأ التواصل معكم قبل موعد التقديم؟", a: "ننصح بالتواصل قبل 3 إلى 6 أشهر من الموعد النهائي لإعطاء وقت كافٍ لإعداد ملف قوي." },
    ],
    contactEyebrow: "تواصل معنا",
    contactTitle: "عندك استفسار؟ راسلنا",
    formName: "الاسم الكامل",
    formEmail: "البريد الإلكتروني",
    formScholarship: "المنحة المطلوبة",
    formMsg: "رسالتك",
    formSubmit: "إرسال الرسالة",
    formSent: "تم إرسال رسالتك بنجاح، سنرد عليك قريبًا.",
    footerTag: "مسار هنا ليرشدك نحو القمة",
    footerRights: "© 2026 جميع الحقوق محفوظة — مسار",
    loginTitle: "تسجيل الدخول",
    loginEmail: "البريد الإلكتروني",
    loginPass: "كلمة المرور",
    loginBtn: "دخول",
    loginNote: "هذا واجهة تجريبية فقط",
    // ترجمات الحساب الجديد والاستعادة المضافة
    registerTitle: "إنشاء حساب جديد",
    registerName: "الاسم الكامل",
    registerPassConfirm: "تأكيد كلمة المرور",
    registerBtn: "تأكيد التسجيل",
    forgotPassLink: "نسيت كلمة المرور؟",
    resetPassTitle: "استعادة كلمة المرور",
    sendResetLinkBtn: "إرسال رابط الاستعادة",
    backToLoginBtn: "العودة لتسجيل الدخول",
    noAccount: "ليس لديك حساب؟ سجل الآن",
    haveAccount: "لديك حساب بالفعل؟ سجل دخول",
  },
  en: {
    dir: "ltr",
    brand: "Masar",
    nav: { 
      home: "Home", 
      about: "About", 
      scholarships: "Scholarships", 
      courses: "Courses", // تمت إضافة الكورسات للترجمة الإنجليزية
      team: "Team", 
      faq: "FAQ", 
      contact: "Contact" 
    },
    login: "Log In",
    heroEyebrow: "Your trusted gateway to studying abroad",
    heroTitle: "Your path to a scholarship starts here",
    heroSub: "We guide you step by step — from choosing a major and university to preparing your file and final acceptance.",
    heroCta1: "Book a free consultation",
    heroCta2: "Browse open scholarships",
    heroStamp: "Trusted",
    aboutEyebrow: "About Us",
    aboutTitle: "A team of consultants, not just a website",
    aboutText: "At Masar, you work with consultants who were themselves accepted into international scholarships, helping you build a competitive file and avoid common application mistakes.",
    aboutPoints: [
      { t: "File review & preparation", d: "Statements of purpose, recommendation letters, academic CVs" },
      { t: "University & scholarship match", d: "Based on your major, budget and realistic chances" },
      { t: "Post-application follow-up", d: "Interview prep and tracking your application status" },
    ],
    statsEyebrow: "By the numbers",
    stats: [
      { n: "12", s: "+", l: "Years of experience" },
      { n: "3500", s: "+", l: "Students helped" },
      { n: "40", s: "+", l: "Study destinations" },
      { n: "92", s: "%", l: "Client satisfaction" },
    ],
    schEyebrow: "Latest opportunities",
    schTitle: "Scholarships open now",
    schCta: "Details",
    scholarships: [
      { flag: "🇩🇪", country: "Germany", title: "DAAD Graduate Scholarship", deadline: "Deadline Oct 15", level: "Master / PhD" },
      { flag: "🇬🇧", country: "UK", title: "Chevening Scholarship", deadline: "Deadline Nov 2", level: "Master" },
      { flag: "🇹🇷", country: "Turkey", title: "Türkiye Government Scholarship", deadline: "Deadline Feb 20", level: "Bachelor / Master" },
      { flag: "🇺🇸", country: "USA", title: "Fulbright Scholarship", deadline: "Deadline May 1", level: "Master / PhD" },
    ],
    // داتا الكورسات بالإنجليزي
    coursesEyebrow: "Our Courses",
    coursesTitle: "Develop Academic Skills",
    courses: [
      { title: "IELTS & TOEFL Prep Course", desc: "Advanced academic coaching to help you clear international language barriers with confidence." },
      { title: "Motivation Letter & Academic CV Workshop", desc: "Craft highly persuasive letters and resume structures that get noticed by decision makers." },
      { title: "Turkish & European Scholarship Masterclass", desc: "A comprehensive deep dive into requirements, processes, and interview survival tips." }
    ],
    teamEyebrow: "The minds behind Masar",
    teamTitle: "Our Team",
    team: [
      { name: "Lian Hassan", role: "Scholarship consultant, former DAAD grantee" },
      { name: "Omar Fares", role: "Founder & General Manager, 10 yrs in education consulting" },
    ],
    faqEyebrow: "Got a question?",
    faqTitle: "Frequently Asked Questions",
    faq: [
      { q: "Do you guarantee acceptance?", a: "We don't control the grantor's decision, but we significantly strengthen your file through consulting based on real acceptance experience." },
      { q: "How is this different from applying alone?", a: "We help you avoid common file and deadline mistakes, and review every document before submission." },
      { q: "Can I get a refund if not accepted?", a: "Fees cover the time and effort spent preparing and reviewing your file, not a guarantee of acceptance." },
      { q: "When should I reach out before the deadline?", a: "We recommend contacting us 3 to 6 months before the deadline to allow enough time for a strong file." },
    ],
    contactEyebrow: "Contact",
    contactTitle: "Have a question? Reach out",
    formName: "Full name",
    formEmail: "Email address",
    formScholarship: "Requested Scholarship",
    formMsg: "Your message",
    formSubmit: "Send message",
    formSent: "Your message was sent. We'll get back to you soon.",
    footerTag: "Masar is here to guide you to the top",
    footerRights: "© 2026 All rights reserved — Masar",
    loginTitle: "Log In",
    loginEmail: "Email address",
    loginPass: "Password",
    loginBtn: "Log in",
    loginNote: "This is a demo UI only",
    registerTitle: "Create New Account",
    registerName: "Full Name",
    registerPassConfirm: "Confirm Password",
    registerBtn: "Sign Up",
    forgotPassLink: "Forgot Password?",
    resetPassTitle: "Reset Password",
    sendResetLinkBtn: "Send Reset Link",
    backToLoginBtn: "Back to Login",
    noAccount: "Don't have an account? Register now",
    haveAccount: "Already have an account? Log In",
  },
};

/* ---------------- Stamp badge (signature element) ---------------- */
function Stamp({ value, suffix, label, rotate = -6 }) {
  return (
    <div
      className="relative flex flex-col items-center justify-center text-center rounded-full border-2 border-dashed"
      style={{
        width: 132, height: 132,
        borderColor: "var(--gold)",
        transform: `rotate(${rotate}deg)`,
        color: "var(--ink)",
      }}
    >
      <span className="text-3xl font-extrabold leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}<span style={{ color: "var(--gold)" }}>{suffix}</span>
      </span>
      <span className="text-[11px] mt-1 px-2 leading-tight font-semibold opacity-80">{label}</span>
    </div>
  );
}

function HeroIllustration() {
  return (
    <svg viewBox="0 0 360 320" width="100%" height="320" style={{ maxWidth: 360 }} role="img" aria-label="رسم توضيحي لطالب يسافر للدراسة بالخارج">
      <circle cx="180" cy="160" r="140" fill="var(--paper)" opacity="0.06" />
      <circle cx="180" cy="160" r="100" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="3 6" opacity="0.5" />

      {/* globe */}
      <circle cx="120" cy="190" r="46" fill="none" stroke="var(--teal)" strokeWidth="2.5" />
      <ellipse cx="120" cy="190" rx="46" ry="18" fill="none" stroke="var(--teal)" strokeWidth="1.5" opacity="0.7" />
      <ellipse cx="120" cy="190" rx="18" ry="46" fill="none" stroke="var(--teal)" strokeWidth="1.5" opacity="0.7" />
      <line x1="74" y1="190" x2="166" y2="190" stroke="var(--teal)" strokeWidth="1.5" opacity="0.7" />

      {/* flight path */}
      <path d="M150 150 Q 210 90 268 70" fill="none" stroke="var(--gold)" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
      <g transform="translate(268 70) rotate(-28)">
        <path d="M0 0 L20 -4 L26 0 L20 4 Z" fill="var(--gold)" />
        <path d="M6 -1 L0 -10 L4 -10 L11 -2 Z" fill="var(--gold)" />
        <path d="M6 1 L0 10 L4 10 L11 2 Z" fill="var(--gold)" />
      </g>

      {/* graduate figure */}
      <g transform="translate(195 150)">
        <circle cx="0" cy="0" r="20" fill="var(--gold)" />
        <path d="M-22 -4 L0 -16 L22 -4 L0 8 Z" fill="var(--ink)" />
        <line x1="22" y1="-4" x2="22" y2="14" stroke="var(--ink)" strokeWidth="2" />
        <circle cx="22" cy="16" r="2.5" fill="var(--ink)" />
        <rect x="-16" y="20" width="32" height="58" rx="10" fill="var(--ink)" />
        <rect x="-30" y="40" width="18" height="24" rx="4" fill="var(--teal)" />
      </g>

      <circle cx="70" cy="80" r="3" fill="var(--gold)" opacity="0.7" />
      <circle cx="300" cy="180" r="3" fill="var(--teal)" opacity="0.7" />
      <circle cx="250" cy="240" r="2.5" fill="var(--gold)" opacity="0.6" />
    </svg>
  );
}

function useCountUp(target, start) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    const num = parseInt(target, 10) || 0;
    const duration = 1400;
    const startTime = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(num * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target]);
  return val;
}

/* ---------------- Main App ---------------- */
export default function App() {
  const [lang, setLang] = useState("ar");
  const t = T[lang];
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [authView, setAuthView] = useState("login"); // 'login' | 'register' | 'forgot' للتحكم بواجهات المودال المتطورة
  const [openFaq, setOpenFaq] = useState(0);
  const [sent, setSent] = useState(false);
  
  // الـ States المنفصلة لبيانات النماذج لتفادي أي أخطاء برمجية
  const [form, setForm] = useState({ name: "", email: "", scholarship: "", msg: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", passwordConfirm: "" });
  const [forgotEmail, setForgotEmail] = useState("");

  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // إضافة مفتاح الكورسات للمنيو لبنائه تلقائياً
  const navItems = [
    ["home", "#home"], ["about", "#about"], ["scholarships", "#scholarships"],
    ["courses", "#courses"], ["team", "#team"], ["faq", "#faq"], ["contact", "#contact"],
  ];

  return (
    <div dir={t.dir} style={{ fontFamily: "'Cairo', sans-serif", background: "var(--paper)", color: "var(--ink)" }} className="min-h-screen w-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
        :root {
          --ink: #13213B;
          --ink-soft: #2A3A5C;
          --paper: #F7F4EC;
          --paper-soft: #EFEAE0;
          --gold: #C8932B;
          --teal: #2F7B6E;
          --slate: #4B5567;
        }
        * { box-sizing: border-box; }
        .dashed-divider { border-top: 1px dashed #C9C2B2; }
        .btn-gold {
          background: var(--gold); color: var(--ink); font-weight: 700;
          transition: transform .15s ease, box-shadow .15s ease;
        }
        .btn-gold:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(200,147,43,.35); }
        .btn-outline {
          border: 1.5px solid var(--paper); color: var(--paper);
          transition: background .15s ease, color .15s ease;
        }
        .btn-outline:hover { background: var(--paper); color: var(--ink); }
        .card-rise { transition: transform .2s ease, box-shadow .2s ease; }
        .card-rise:hover { transform: translateY(-4px); box-shadow: 0 14px 28px rgba(19,33,59,.10); }
        .accordion-icon { transition: transform .25s ease; }
        @media (prefers-reduced-motion: reduce) {
          .card-rise, .btn-gold, .accordion-icon { transition: none !important; }
        }
      `}</style>

      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-40" style={{ background: "var(--ink)" }}>
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
          <a href="#home" className="flex items-center gap-2 font-extrabold text-xl" style={{ color: "var(--paper)" }}>
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full" style={{ background: "var(--gold)" }}>
              <GraduationCap size={18} color="var(--ink)" />
            </span>
            {t.brand}
          </a>

          <nav className="hidden md:flex items-center gap-7">
            {navItems.map(([key, href]) => (
              <a key={key} href={href} className="text-sm font-semibold opacity-90 hover:opacity-100" style={{ color: "var(--paper)" }}>
                {t.nav[key]}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setLang(isAr ? "en" : "ar")}
              className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ border: "1px solid var(--gold)", color: "var(--gold)" }}
            >
              {isAr ? "EN" : "AR"}
            </button>
            <button onClick={() => { setAuthView("login"); setLoginOpen(true); }} className="btn-gold text-sm px-4 py-2 rounded-full flex items-center gap-1.5">
              <Lock size={14} /> {t.login}
            </button>
          </div>

          <button className="md:hidden" style={{ color: "var(--paper)" }} onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden px-5 pb-4 flex flex-col gap-3" style={{ background: "var(--ink)" }}>
            {navItems.map(([key, href]) => (
              <a key={key} href={href} onClick={() => setMenuOpen(false)} className="text-sm font-semibold" style={{ color: "var(--paper)" }}>
                {t.nav[key]}
              </a>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setLang(isAr ? "en" : "ar")} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ border: "1px solid var(--gold)", color: "var(--gold)" }}>
                {isAr ? "EN" : "AR"}
              </button>
              <button onClick={() => { setAuthView("login"); setLoginOpen(true); setMenuOpen(false); }} className="btn-gold text-sm px-4 py-2 rounded-full">{t.login}</button>
            </div>
          </div>
        )}
      </header>

      {/* ---------------- Hero ---------------- */}
      <section id="home" className="relative overflow-hidden" style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div className="max-w-6xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <span className="inline-block text-xs font-bold tracking-wide px-3 py-1 rounded-full mb-5" style={{ background: "rgba(200,147,43,.15)", color: "var(--gold)" }}>
              {t.heroEyebrow}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5">{t.heroTitle}</h1>
            <p className="text-base opacity-80 leading-relaxed mb-8 max-w-md">{t.heroSub}</p>
            <div className="flex flex-wrap gap-3">
              <a href="#contact" className="btn-gold px-6 py-3 rounded-full text-sm flex items-center gap-2">
                {t.heroCta1} <Arrow size={16} />
              </a>
              <a href="#scholarships" className="btn-outline px-6 py-3 rounded-full text-sm font-semibold">
                {t.heroCta2}
              </a>
            </div>
          </div>

          <div className="relative flex justify-center items-center" style={{ minHeight: 320 }}>
            <div className="absolute inset-0 opacity-25" style={{
              backgroundImage: "radial-gradient(circle, var(--gold) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }} />
            <HeroIllustration />
            <div className="absolute" style={{ insetInlineEnd: 0, bottom: 0 }}>
              <Stamp value={t.heroStamp} suffix="" label={isAr ? "خبرة 12 سنة" : "12 yrs experience"} rotate={-8} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- About ---------------- */}
      <section id="about" className="max-w-6xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-12 items-start">
        <div>
          <span className="text-xs font-bold tracking-wide" style={{ color: "var(--teal)" }}>{t.aboutEyebrow}</span>
          <h2 className="text-3xl font-extrabold mt-2 mb-4">{t.aboutTitle}</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--slate)" }}>{t.aboutText}</p>
        </div>
        <div className="flex flex-col gap-5">
          {t.aboutPoints.map((p, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl card-rise" style={{ background: "white", border: "1px solid var(--paper-soft)" }}>
              <span className="flex items-center justify-center w-10 h-10 rounded-full shrink-0" style={{ background: "var(--paper-soft)" }}>
                {i === 0 ? <FileCheck size={18} color="var(--teal)" /> : i === 1 ? <GraduationCap size={18} color="var(--teal)" /> : <Users size={18} color="var(--teal)" />}
              </span>
              <div>
                <h3 className="font-bold text-sm mb-1">{p.t}</h3>
                <p className="text-xs" style={{ color: "var(--slate)" }}>{p.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Counters ---------------- */}
      <section ref={statsRef} className="py-16" style={{ background: "var(--paper-soft)" }}>
        <div className="max-w-6xl mx-auto px-5">
          <p className="text-center text-xs font-bold tracking-wide mb-10" style={{ color: "var(--gold)" }}>{t.statsEyebrow}</p>
          <div className="flex flex-wrap justify-center gap-8">
            {t.stats.map((s, i) => (
              <CounterStamp key={i} stat={s} start={statsVisible} rotate={i % 2 === 0 ? -6 : 6} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Scholarships ---------------- */}
      <section id="scholarships" className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-wide" style={{ color: "var(--teal)" }}>{t.schEyebrow}</span>
          <h2 className="text-3xl font-extrabold mt-2">{t.schTitle}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {t.scholarships.map((s, i) => (
            <div key={i} className="card-rise rounded-2xl p-5 flex flex-col" style={{ background: "white", border: "1px solid var(--paper-soft)" }}>
              <span className="text-3xl mb-3">{s.flag}</span>
              <span className="text-[11px] font-bold mb-1" style={{ color: "var(--gold)" }}>{s.deadline}</span>
              <h3 className="font-bold text-sm mb-2 leading-snug">{s.title}</h3>
              <p className="text-xs mb-4" style={{ color: "var(--slate)" }}>{s.level}</p>
              <a href="#contact" className="mt-auto text-xs font-bold flex items-center gap-1" style={{ color: "var(--ink)" }}>
                {t.schCta} <Arrow size={13} />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- 🆕 Courses Section (قسم الكورسات الجديد) 🆕 ---------------- */}
      <section id="courses" className="max-w-6xl mx-auto px-5 py-20 border-t border-dashed" style={{ borderColor: "var(--paper-soft)" }}>
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-wide" style={{ color: "var(--teal)" }}>{t.coursesEyebrow}</span>
          <h2 className="text-3xl font-extrabold mt-2">{t.coursesTitle}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.courses.map((course, i) => (
            <div key={i} className="card-rise rounded-2xl p-6 flex flex-col justify-between" style={{ background: "white", border: "1px solid var(--paper-soft)" }}>
              <div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--paper-soft)" }}>
                  <BookOpen size={20} color="var(--teal)" />
                </div>
                <h3 className="font-bold text-sm mb-2 leading-snug" style={{ color: "var(--ink)" }}>{course.title}</h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--slate)" }}>{course.desc}</p>
              </div>
              <a href="#contact" className="text-xs font-bold flex items-center gap-1 mt-auto" style={{ color: "var(--gold)" }}>
                {isAr ? "سجل اهتمامك" : "Register Interest"} <Arrow size={13} />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Team ---------------- */}
      <section id="team" className="py-20" style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-wide" style={{ color: "var(--gold)" }}>{t.teamEyebrow}</span>
            <h2 className="text-3xl font-extrabold mt-2">{t.teamTitle}</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {t.team.map((m, i) => (
              <div key={i} className="w-64 rounded-2xl p-6 text-center" style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)" }}>
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "var(--gold)" }}>
                  <UserIcon size={26} color="var(--ink)" />
                </div>
                <h3 className="font-bold text-sm mb-1">{m.name}</h3>
                <p className="text-xs opacity-75">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="max-w-3xl mx-auto px-5 py-20">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-wide" style={{ color: "var(--teal)" }}>{t.faqEyebrow}</span>
          <h2 className="text-3xl font-extrabold mt-2">{t.faqTitle}</h2>
        </div>
        <div className="flex flex-col">
          {t.faq.map((f, i) => (
            <div key={i} className="dashed-divider py-4">
              <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full flex items-center justify-between text-start gap-4">
                <span className="font-bold text-sm">{f.q}</span>
                <ChevronDown size={18} className="accordion-icon shrink-0" style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0)", color: "var(--gold)" }} />
              </button>
              {openFaq === i && <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--slate)" }}>{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Contact ---------------- */}
      <section id="contact" className="py-20" style={{ background: "var(--paper-soft)" }}>
        <div className="max-w-5xl mx-auto px-5 grid md:grid-cols-2 gap-12">
          <div>
            <span className="text-xs font-bold tracking-wide" style={{ color: "var(--gold)" }}>{t.contactEyebrow}</span>
            <h2 className="text-3xl font-extrabold mt-2 mb-6">{t.contactTitle}</h2>
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex items-center gap-3"><Mail size={16} color="var(--teal)" /> info@masar.com</div>
              <div className="flex items-center gap-3"><Phone size={16} color="var(--teal)" /> +90 530 000 0000</div>
              <div className="flex items-center gap-3"><MapPin size={16} color="var(--teal)" /> {isAr ? "إسطنبول، تركيا" : "Istanbul, Turkey"}</div>
            </div>
            <div className="flex gap-3 mt-6">
              {[Facebook, Instagram, Youtube].map((Icon, i) => (
                <span key={i} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--ink)" }}>
                  <Icon size={15} color="var(--paper)" />
                </span>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setSent(true); setForm({ name: "", email: "", scholarship: "", msg: "" }); }}
            className="flex flex-col gap-3 bg-white rounded-2xl p-6"
            style={{ border: "1px solid var(--paper-soft)" }}
          >
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t.formName}
              className="px-4 py-3 rounded-xl text-sm outline-none" style={{ border: "1px solid var(--paper-soft)" }} />
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t.formEmail}
              className="px-4 py-3 rounded-xl text-sm outline-none" style={{ border: "1px solid var(--paper-soft)" }} />
            <input 
              required 
              type="text" 
              value={form.scholarship || ""} 
              onChange={(e) => setForm({ ...form, scholarship: e.target.value })} 
              placeholder={t.formScholarship}
              className="px-4 py-3 rounded-xl text-sm outline-none" 
              style={{ border: "1px solid var(--paper-soft)" }} 
            />
            <textarea required rows={4} value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} placeholder={t.formMsg}
              className="px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ border: "1px solid var(--paper-soft)" }} />
            <button type="submit" className="btn-gold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
              {t.formSubmit} <Send size={14} />
            </button>
            {sent && <p className="text-xs font-semibold text-center" style={{ color: "var(--teal)" }}>{t.formSent}</p>}
          </form>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="py-10" style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div className="max-w-6xl mx-auto px-5 flex flex-col items-center gap-3 text-center">
          <h3 className="font-extrabold text-lg">{t.footerTag}</h3>
          <p className="text-xs opacity-60">{t.footerRights}</p>
        </div>
      </footer>

      {/* ---------------- 🆕 المودال المطور بـ 3 واجهات للتسجيل والاستعادة 🆕 ---------------- */}
      {loginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: "rgba(19,33,59,.6)" }} onClick={() => setLoginOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-7 w-full max-w-sm relative">
            <button onClick={() => setLoginOpen(false)} className="absolute top-4 end-4"><X size={18} /></button>
            
            {/* 1. واجهة تسجيل الدخول */}
            {authView === "login" && (
              <div>
                <h3 className="font-extrabold text-lg mb-1">{t.loginTitle}</h3>
                <p className="text-[11px] mb-5" style={{ color: "var(--slate)" }}>{t.loginNote}</p>
                <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
                  <input 
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder={t.loginEmail} 
                    className="px-4 py-3 rounded-xl text-sm outline-none" 
                    style={{ border: "1px solid var(--paper-soft)" }} 
                  />
                  <input 
                    type="password" 
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder={t.loginPass} 
                    className="px-4 py-3 rounded-xl text-sm outline-none" 
                    style={{ border: "1px solid var(--paper-soft)" }} 
                  />
                  
                  {/* زر نسيان الباسورد الذكي */}
                  <div className="text-right">
                    <button 
                      type="button" 
                      onClick={() => setAuthView("forgot")} 
                      className="text-xs text-[#c59333] hover:underline bg-transparent border-0 cursor-pointer p-0 font-bold"
                    >
                      {t.forgotPassLink}
                    </button>
                  </div>

                  <button type="submit" className="btn-gold py-3 rounded-xl text-sm mt-1">{t.loginBtn}</button>
                </form>

                <div className="mt-4 text-center">
                  <button 
                    onClick={() => setAuthView("register")} 
                    className="text-xs hover:underline font-bold" 
                    style={{ color: "var(--teal)" }}
                  >
                    {t.noAccount}
                  </button>
                </div>
              </div>
            )}

            {/* 2. واجهة إنشاء حساب جديد */}
            {authView === "register" && (
              <div>
                <h3 className="font-extrabold text-lg mb-1">{t.registerTitle}</h3>
                <p className="text-[11px] mb-5" style={{ color: "var(--slate)" }}>{t.loginNote}</p>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (registerForm.password !== registerForm.passwordConfirm) {
                      alert(isAr ? "كلمتا المرور غير متطابقتين!" : "Passwords do not match!");
                      return;
                    }
                    alert(isAr ? "تم إرسال طلب إنشاء الحساب بنجاح!" : "Registration request submitted!");
                    setAuthView("login");
                  }} 
                  className="flex flex-col gap-3"
                >
                  <input 
                    type="text"
                    required
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    placeholder={t.registerName} 
                    className="px-4 py-3 rounded-xl text-sm outline-none" 
                    style={{ border: "1px solid var(--paper-soft)" }} 
                  />
                  <input 
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder={t.loginEmail} 
                    className="px-4 py-3 rounded-xl text-sm outline-none" 
                    style={{ border: "1px solid var(--paper-soft)" }} 
                  />
                  <input 
                    type="password" 
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder={t.loginPass} 
                    className="px-4 py-3 rounded-xl text-sm outline-none" 
                    style={{ border: "1px solid var(--paper-soft)" }} 
                  />
                  <input 
                    type="password" 
                    required
                    value={registerForm.passwordConfirm}
                    onChange={(e) => setRegisterForm({ ...registerForm, passwordConfirm: e.target.value })}
                    placeholder={t.registerPassConfirm} 
                    className="px-4 py-3 rounded-xl text-sm outline-none" 
                    style={{ border: "1px solid var(--paper-soft)" }} 
                  />
                  <button type="submit" className="btn-gold py-3 rounded-xl text-sm mt-1">{t.registerBtn}</button>
                </form>

                <div className="mt-4 text-center">
                  <button 
                    onClick={() => setAuthView("login")} 
                    className="text-xs hover:underline font-bold" 
                    style={{ color: "var(--teal)" }}
                  >
                    {t.haveAccount}
                  </button>
                </div>
              </div>
            )}

            {/* 3. واجهة استعادة كلمة المرور */}
            {authView === "forgot" && (
              <div>
                <h3 className="font-extrabold text-lg mb-1">{t.resetPassTitle}</h3>
                <p className="text-[11px] mb-5" style={{ color: "var(--slate)" }}>{t.loginNote}</p>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert(isAr ? "تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني!" : "Reset link sent to your email!");
                    setAuthView("login");
                    setForgotEmail("");
                  }} 
                  className="flex flex-col gap-3"
                >
                  <input 
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder={t.loginEmail} 
                    className="px-4 py-3 rounded-xl text-sm outline-none" 
                    style={{ border: "1px solid var(--paper-soft)" }} 
                  />
                  <button type="submit" className="btn-gold py-3 rounded-xl text-sm mt-1">{t.sendResetLinkBtn}</button>
                </form>

                <div className="mt-4 text-center">
                  <button 
                    onClick={() => setAuthView("login")} 
                    className="text-xs hover:underline font-bold" 
                    style={{ color: "var(--teal)" }}
                  >
                    {t.backToLoginBtn}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

function CounterStamp({ stat, start, rotate }) {
  const val = useCountUp(stat.n, start);
  return <Stamp value={val} suffix={stat.s} label={stat.l} rotate={rotate} />;
}


