import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Info, GraduationCap, Quote, Users, HelpCircle, Mail,
  Facebook, Instagram, Youtube, Send, CheckCircle2, Globe2,ListChecks,Newspaper, 
  PenTool, CalendarClock, ClipboardEdit, BookOpen, FileText, Languages,SpellCheck2 ,
} from "lucide-react";

  
import { useSiteData } from "../context/SiteDataContext.jsx";
import { useLang } from "../components/Layout.jsx";
import { Stamp, CounterStamp, HeroIllustration } from "../components/visuals.jsx";
import ScholarshipCard from "../components/ScholarshipCard";

// Simple inline WhatsApp glyph — lucide doesn't ship a WhatsApp icon
function WhatsAppIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 1.67c2.19 0 4.25.85 5.8 2.41a8.23 8.23 0 012.4 5.83c0 4.55-3.7 8.24-8.24 8.24a8.2 8.2 0 01-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 01-1.26-4.38c0-4.54 3.7-8.24 8.29-8.24zm-4.52 4.84c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.67 2.67 4.11 3.64.57.24 1.02.39 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.43-.58 1.63-1.15.2-.56.2-1.05.14-1.15-.06-.1-.22-.16-.46-.28-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.55.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.95-1.22-.72-.64-1.21-1.43-1.35-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.36-.77-1.86-.2-.49-.4-.42-.55-.43h-.47z" />
    </svg>
  );
}

// Self-contained count-up number, used by the "بالأرقام" stats section below.
// Doesn't depend on CounterStamp/visuals.jsx — just needs `active` to flip true.
function AnimatedNumber({ target, active, duration = 1500 }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    let raf;
    const step = (ts) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return <>{value}</>;
}

// Fallback scholarships shown until real data is wired into SiteDataContext.
// Shape mirrors the rest of the data file (id + *Ar/*En pairs) so it's a
// drop-in once a real `data.scholarships` array exists.
const FALLBACK_SCHOLARSHIPS = [
  {
    id: 1,
    levelAr: "ماجستير", levelEn: "Master's",
    titleAr: "منحة الدراسات العليا الكاملة", titleEn: "Fully-Funded Graduate Scholarship",
    countryAr: "المملكة المتحدة", countryEn: "United Kingdom",
    descAr: "تغطية كاملة للرسوم والسكن لمعظم التخصصات الأكاديمية.",
    descEn: "Full tuition and housing coverage across most academic fields.",
    deadlineAr: "التقديم يفتح ديسمبر", deadlineEn: "Opens December",
  },
  {
    id: 2,
    levelAr: "بكالوريوس", levelEn: "Bachelor's",
    titleAr: "منحة البكالوريوس الدولية", titleEn: "International Undergraduate Scholarship",
    countryAr: "دول أوروبية متعددة", countryEn: "Multiple European Countries",
    descAr: "منح جزئية وكاملة لطلاب الثانوية العامة المتفوقين.",
    descEn: "Partial and full awards for high-achieving high-school graduates.",
    deadlineAr: "التقديم يفتح فبراير", deadlineEn: "Opens February",
  },
  {
    id: 3,
    levelAr: "دكتوراه", levelEn: "PhD",
    titleAr: "منحة الدكتوراه البحثية", titleEn: "Doctoral Research Scholarship",
    countryAr: "الولايات المتحدة", countryEn: "United States",
    descAr: "تمويل بحثي بالكامل مع راتب شهري طوال مدة الدراسة.",
    descEn: "Full research funding with a monthly stipend for the program's duration.",
    deadlineAr: "التقديم يفتح أكتوبر", deadlineEn: "Opens October",
  },
];

// Update these with the real account links before launch.
const SOCIAL_LINKS = [
  { id: "facebook", Icon: Facebook, labelAr: "فيسبوك", labelEn: "Facebook", href: "https://facebook.com/yourpage" },
  { id: "whatsapp", Icon: WhatsAppIcon, labelAr: "واتساب", labelEn: "WhatsApp", href: "https://wa.me/200000000000" },
  { id: "youtube", Icon: Youtube, labelAr: "يوتيوب", labelEn: "YouTube", href: "https://youtube.com/@yourchannel" },
  { id: "instagram", Icon: Instagram, labelAr: "انستجرام", labelEn: "Instagram", href: "https://instagram.com/yourpage" },
];

export default function Home() {
  const { data } = useSiteData();
  const { ui, isAr } = useLang();
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setStatsVisible(true); }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const scholarships = data.scholarships?.length ? data.scholarships : FALLBACK_SCHOLARSHIPS;

  const STATS = [
    { id: "experience", value: 12, suffixAr: "", suffixEn: "+", labelAr: "سنة خبرة", labelEn: "Years of experience" },
    { id: "students", value: 3500, suffixAr: "+", suffixEn: "+", labelAr: "طالب تمت مساعدته", labelEn: "Students helped" },
    { id: "countries", value: 40, suffixAr: "+", suffixEn: "+", labelAr: "دولة دراسة", labelEn: "Study destinations" },
    { id: "satisfaction", value: 92, suffixAr: "%", suffixEn: "%", labelAr: "رضا العملاء", labelEn: "Client satisfaction" },
  ];


  const quickLinks = [
    { to: "/about", icon: Info, labelAr: "من نحن", labelEn: "About us" },
    { to: "/scholarships", icon: GraduationCap, labelAr: "المنح المتاحة", labelEn: "Open scholarships" },
    { to: "/testimonials", icon: Quote, labelAr: "قصص نجاح", labelEn: "Success stories" },
    { to: "/team", icon: Users, labelAr: "فريق العمل", labelEn: "Our team" },
    { to: "/faq", icon: HelpCircle, labelAr: "الأسئلة الشائعة", labelEn: "FAQ" },
    { to: "/contact", icon: Mail, labelAr: "تواصل معنا", labelEn: "Contact us" },
  ];

  // --- Contact form: UI only for now. Wire this handleSubmit up to a real
  // backend / email service (Formspree, EmailJS, your own API...) later. ---
  const [form, setForm] = useState({ name: "", email: "", phone: "", scholarship: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: replace with a real submission (Formspree/EmailJS/API call).
    console.log("Contact form submitted (UI only):", form);
    setSubmitted(true);
    setForm({ name: "", email: "", phone: "", scholarship: "", message: "" });
  };

  const [scholarshipIndex, setScholarshipIndex] = useState(0);
const [cardsPerView, setCardsPerView] = useState(1);

useEffect(() => {
  const mq = window.matchMedia("(min-width: 1024px)");
  const update = () => setCardsPerView(mq.matches ? 3 : 1);
  update();
  mq.addEventListener("change", update);
  return () => mq.removeEventListener("change", update);
}, []);

const scholarshipsList = data.scholarships || [];
const maxScholarshipIndex = Math.max(0, scholarshipsList.length - cardsPerView);

const nextScholarship = () => {
  setScholarshipIndex((i) => (i >= maxScholarshipIndex ? 0 : i + 1));
};
const prevScholarship = () => {
  setScholarshipIndex((i) => (i <= 0 ? maxScholarshipIndex : i - 1));

};
const SERVICES = [
  {
    Icon: BookOpen,
    ar: "استشارات أكاديمية لاختيار التخصص والجامعة المناسبة",
    en: "Academic consulting to pick the right major and university",
  },
  {
    Icon: FileText,
    ar: "إعداد ومراجعة ملفات التقديم والمستندات المطلوبة",
    en: "Preparing and reviewing application files and documents",
  },
  {
    Icon: GraduationCap,
    ar: "ترشيح المنح الدراسية المناسبة لكل طالب",
    en: "Matching students with suitable scholarships",
  },
  {
    Icon: Users,
    ar: "متابعة ودعم الطالب بعد القبول وحتى السفر",
    en: "Ongoing support from acceptance through departure",
  },
  {
    Icon: Languages,
    ar: "الترجمة من وإلى: العربية، الإنجليزية، الفرنسية، الألمانية، التركية، الفارسية، الإندونيسية، الأوردو",
    en: "Translation to/from: Arabic, English, French, German, Turkish, Persian, Indonesian, Urdu",
  },

  { Icon: SpellCheck2, 
    ar: "التدقيق اللغوي والتنسيق العام", 
    en: "Language editing & formatting" 
  },
  { Icon: ClipboardEdit, ar: "إعداد المقترح البحثي", en: "Research proposal preparation" },
  { Icon: FileText, ar: "إعداد الملخصات", en: "Preparing summaries" },
  { Icon: PenTool, ar: "المساهمة في إعداد جزء من الدراسة", en: "Contributing to part of the study" },
  { Icon: ListChecks, ar: "متابعة شاملة", en: "Comprehensive follow-up" },
  { Icon: Newspaper, ar: "عمل تقارير إخبارية", en: "Writing news reports" },
  { Icon: BookOpen, ar: "توفير مصادر علمية", en: "Providing academic sources" },

  

];

  

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div className="max-w-6xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <span className="inline-block text-xs font-bold tracking-wide px-3 py-1 rounded-full mb-5" style={{ background: "rgba(200,147,43,.15)", color: "var(--gold)" }}>
              {isAr ? data.hero.eyebrowAr : data.hero.eyebrowEn}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5">{isAr ? data.hero.titleAr : data.hero.titleEn}</h1>
            <p className="text-base opacity-80 leading-relaxed mb-8 max-w-md">{isAr ? data.hero.subAr : data.hero.subEn}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/contact" className="btn-gold px-6 py-3 rounded-full text-sm flex items-center gap-2">
                {isAr ? data.hero.cta1Ar : data.hero.cta1En} <Arrow size={16} />
              </Link>
              <Link to="/scholarships" className="btn-outline px-6 py-3 rounded-full text-sm font-semibold">
                {isAr ? data.hero.cta2Ar : data.hero.cta2En}
              </Link>
            </div>
          </div>
          <div className="relative flex justify-center items-center" style={{ minHeight: 320 }}>
            <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle, var(--gold) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
            <HeroIllustration />
            <div className="absolute" style={{ insetInlineEnd: 0, bottom: 0 }}>
              <Stamp value={ui.heroStamp} suffix="" label={isAr ? "خبرة 12 سنة" : "12 yrs experience"} rotate={-8} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats — "بالأرقام" */}
      <section ref={statsRef} className="py-16" style={{ background: "var(--paper-soft)" }}>
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-12">
            {isAr ? "بالأرقام" : "By the numbers"}
          </h2>
          <div className="flex flex-wrap justify-center gap-x-10 sm:gap-x-14 lg:gap-x-20 gap-y-12">
            {STATS.map((s, i) => (
              <div
                key={s.id}
                className="flex flex-col items-center justify-center text-center rounded-full shrink-0"
                style={{
                  width: 150,
                  height: 150,
                  border: "2px dashed var(--gold)",
                  background: "white",
                  transform: `rotate(${i % 2 === 0 ? -6 : 6}deg)`,
                }}
              >
                <div
                  className="text-3xl font-extrabold"
                  style={{ color: "var(--gold)", transform: `rotate(${i % 2 === 0 ? 6 : -6}deg)` }}
                >
                  <AnimatedNumber target={s.value} active={statsVisible} />
                  {isAr ? s.suffixAr : s.suffixEn}
                </div>
                <p
                  className="text-[11px] font-semibold opacity-70 px-4 leading-tight mt-1"
                  style={{ transform: `rotate(${i % 2 === 0 ? 6 : -6}deg)` }}
                >
                  {isAr ? s.labelAr : s.labelEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


{/* Scholarships  card preview  */}
<section className="py-20 max-w-6xl mx-auto px-5">
  <h2 className="text-2xl font-bold mb-8 text-center">{ui.schTitle}</h2>

  <div className="flex items-center gap-3">
    <button
      onClick={prevScholarship}
      aria-label={isAr ? "المنحة السابقة" : "Previous scholarship"}
      className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
      style={{ border: "1px solid var(--paper-soft)" }}
    >
      <ArrowLeft size={18} />
    </button>

    <div className="overflow-hidden flex-1" dir="ltr">
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${scholarshipIndex * (100 / cardsPerView)}%)` }}
      >
        {scholarshipsList.map((s) => (
          <div key={s.id} className="w-full lg:w-1/3 shrink-0 px-2.5" dir={isAr ? "rtl" : "ltr"}>
            <div className="rounded-2xl border-2 border-transparent transition-all duration-300 hover:border-[var(--gold)] hover:-translate-y-1">
              <ScholarshipCard s={s} ui={ui} />
            </div>
          </div>
        ))}
      </div>
    </div>

    <button
      onClick={nextScholarship}
      aria-label={isAr ? "المنحة التالية" : "Next scholarship"}
      className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
      style={{ border: "1px solid var(--paper-soft)" }}
    >
      <ArrowRight size={18} />
    </button>
  </div>

  <div className="text-center mt-8">
    <Link
      to="/scholarships"
      className="px-6 py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2"
      style={{ background: "var(--gold)", color: "var(--ink)" }}
    >
      {isAr ? "عرض كل المنح" : "View all scholarships"} <Arrow size={16} />
    </Link>
  </div>
</section>

 {/* Services Section */}
<section className="py-16" style={{ background: "var(--paper-soft)" }}>
  <div className="max-w-6xl mx-auto px-5">
    <div className="text-center mb-12">
      <h2 className="text-2xl md:text-3xl font-extrabold mt-2 inline-block px-8 py-3 rounded-full shadow-md" 
          style={{ background: "var(--gold)", color: "var(--ink)" }}>
        {isAr ? "خدماتنا البحثية" : "Our Research Services"}
      </h2>
    </div>

    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {SERVICES.map(({ Icon, ar, en }, i) => (
        <div
          key={i}
          className="rounded-2xl p-6 flex flex-col gap-3 transition-all duration-500 ease-in-out hover:-translate-y-2 hover:shadow-xl"
          style={{ 
            background: "white", 
            border: "2px solid transparent", // إطار شفاف لضمان استقرار التصميم
            transition: "all 0.5s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--gold)"; // يظهر اللون الذهبي عند الماوس
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "transparent"; // يختفي عند الخروج
          }}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500"
            style={{ background: "var(--ink)" }}
          >
            <Icon size={18} color="var(--gold)" />
          </div>
          <span className="text-xs font-bold opacity-60">0{i + 1}</span>
          <p className="text-sm font-semibold leading-relaxed">{isAr ? ar : en}</p>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* Quick links to other pages */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

      {quickLinks.map((l) => (
      <Link 
        key={l.to} 
        to={l.to} 
        className="hover-gold-card rounded-2xl p-6 flex items-center gap-4" 
        style={{ background: "white" }}
      >
              <span className="flex items-center justify-center w-12 h-12 rounded-full shrink-0" style={{ background: "var(--paper-soft)" }}>
                <l.icon size={20} color="var(--teal)" />
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-sm">{isAr ? l.labelAr : l.labelEn}</h3>
              </div>
              <Arrow size={16} color="var(--gold)" />
            </Link>
          ))}
        </div>
      </section>


      {/* Contact form + social media — closes the page, mirrors the hero's dark band */}
      <section className="relative overflow-hidden" style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div className="max-w-6xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-12">
          <div>
            {/* Temporary placeholder logo — swap for your real logo image/component when ready */}
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-8" style={{ background: "rgba(255,255,255,.08)" }}>
              <GraduationCap size={24} color="var(--gold)" />
            </div>
            <span className="inline-block text-xs font-bold tracking-wide px-3 py-1 rounded-full mb-5" style={{ background: "rgba(200,147,43,.15)", color: "var(--gold)" }}>
              {isAr ? "تواصل معنا" : "Get in touch"}
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-4">
              {isAr ? "عندك سؤال عن منحة؟ ابعتلنا" : "Have a question about a scholarship? Reach out"}
            </h2>
            <p className="text-sm opacity-70 leading-relaxed mb-8 max-w-sm">
              {isAr ? "هنرد عليك في أقرب وقت، أو كلمنا على السوشيال ميديا مباشرة." : "We'll get back to you shortly — or message us directly on social media."}
            </p>

            <p className="text-xs font-bold tracking-wide mb-4 opacity-60">
              {isAr ? "تابعونا" : "Follow us"}
            </p>
            <div className="flex flex-wrap gap-3">
              {SOCIAL_LINKS.map(({ id, Icon, labelAr, labelEn, href }) => (
                <a
                  key={id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={isAr ? labelAr : labelEn}
                  className="flex items-center justify-center w-11 h-11 rounded-full transition-transform hover:-translate-y-0.5"
                  style={{ background: "rgba(255,255,255,.08)", color: "var(--gold)" }}
                >
                  <Icon size={19} />
                </a>
              ))}
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="rounded-2xl p-8 flex flex-col items-center text-center gap-3" style={{ background: "rgba(255,255,255,.06)" }}>
                <CheckCircle2 size={32} color="var(--gold)" />
                <h3 className="font-bold text-lg">{isAr ? "تم استلام رسالتك" : "Message received"}</h3>
                <p className="text-sm opacity-70 max-w-xs">
                  {isAr ? "هنتواصل معاك قريب جدًا." : "We'll be in touch with you very soon."}
                </p>
                <button onClick={() => setSubmitted(false)} className="btn-outline px-5 py-2 rounded-full text-sm font-semibold mt-2">
                  {isAr ? "إرسال رسالة تانية" : "Send another message"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-2xl p-7 flex flex-col gap-4" style={{ background: "rgba(255,255,255,.06)" }}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold mb-1.5 opacity-70">
                      {isAr ? "الاسم" : "Name"}
                    </label>
                    <input
                      id="name" name="name" type="text" required
                      value={form.name} onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                      style={{ background: "rgba(255,255,255,.08)", color: "var(--paper)", border: "1px solid rgba(255,255,255,.12)" }}
                      placeholder={isAr ? "اسمك بالكامل" : "Your full name"}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold mb-1.5 opacity-70">
                      {isAr ? "رقم الهاتف" : "Phone"}
                    </label>
                    <input
                      id="phone" name="phone" type="tel"
                      value={form.phone} onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                      style={{ background: "rgba(255,255,255,.08)", color: "var(--paper)", border: "1px solid rgba(255,255,255,.12)" }}
                      placeholder={isAr ? "01xxxxxxxxx" : "+20 1xxxxxxxxx"}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold mb-1.5 opacity-70">
                    {isAr ? "البريد الإلكتروني" : "Email"}
                  </label>
                  <input
                    id="email" name="email" type="email" required
                    value={form.email} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: "rgba(255,255,255,.08)", color: "var(--paper)", border: "1px solid rgba(255,255,255,.12)" }}
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="scholarship" className="block text-xs font-semibold mb-1.5 opacity-70">
                    {isAr ? "المنحة المطلوبة" : "Requested scholarship"}
                  </label>
                  <input
                    id="scholarship" name="scholarship" type="text"
                    value={form.scholarship} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: "rgba(255,255,255,.08)", color: "var(--paper)", border: "1px solid rgba(255,255,255,.12)" }}
                    placeholder={isAr ? "مثال: منحة الدراسات العليا - بريطانيا" : "e.g. Graduate Scholarship - UK"}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-semibold mb-1.5 opacity-70">
                    {isAr ? "رسالتك" : "Message"}
                  </label>
                  <textarea
                    id="message" name="message" rows={4} required
                    value={form.message} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none"
                    style={{ background: "rgba(255,255,255,.08)", color: "var(--paper)", border: "1px solid rgba(255,255,255,.12)" }}
                    placeholder={isAr ? "اكتب استفسارك هنا..." : "Write your question here..."}
                  />
                </div>

                <button type="submit" className="btn-gold px-6 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 mt-1">
                  {isAr ? "إرسال" : "Send message"} <Send size={15} />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
