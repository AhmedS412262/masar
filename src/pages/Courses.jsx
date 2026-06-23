import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { useSiteData } from "../context/SiteDataContext.jsx";
import { useLang } from "../components/Layout.jsx";

// Fallback courses shown until real data is wired into SiteDataContext.
// Shape mirrors the rest of the data file (id + *Ar/*En pairs) so it's a
// drop-in once a real `data.courses` array exists.
const FALLBACK_COURSES = [
  {
    id: 1,
    titleAr: "دورة التحضير المكثف للأيلتس والتوفل",
    titleEn: "IELTS & TOEFL Prep Course",
    descAr: "تأهيل أكاديمي متقدم لاجتياز اختبارات اللغة بنجاح وضمان معايير القبول الدولي.",
    descEn: "Advanced academic coaching to help you clear international language tests with confidence.",
    priceOriginal: "", priceDiscount: "",
  },
  {
    id: 2,
    titleAr: "ورشة عمل خطابات النية والـ CV الأكاديمي",
    titleEn: "Motivation Letter & Academic CV Workshop",
    descAr: "خطوة بخطوة لصياغة خطاب حافز متميز وملف شخصي يلفت انتباه لجان المنح.",
    descEn: "Craft a standout statement of purpose and academic CV that gets noticed by scholarship committees.",
    priceOriginal: "", priceDiscount: "",
  },
  {
    id: 3,
    titleAr: "توجيه القبول للمنح التركية والأوروبية",
    titleEn: "Turkish & European Scholarship Masterclass",
    descAr: "شرح شامل للنظم التعليمية وكيفية تجهيز مستنداتك وتفادي الأخطاء الشائعة.",
    descEn: "A comprehensive deep dive into requirements, document prep, and avoiding common mistakes.",
    priceOriginal: "", priceDiscount: "",
  },
];

export default function Courses() {
  const { data } = useSiteData();
  const { ui, isAr } = useLang();
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  // دمج بيانات الداش بورد مع الـ fallback (السعر بيجي من الداش)
  const coursesList = (data.courses?.length ? data.courses : FALLBACK_COURSES).map((c, i) => ({
    ...FALLBACK_COURSES[i] || {},
    ...c,
    titleAr: c.titleAr || c.tAr,
    titleEn: c.titleEn || c.tEn,
    descAr:  c.descAr  || c.dAr,
    descEn:  c.descEn  || c.dEn,
  }));

  return (
    <section className="py-20" style={{ background: "var(--paper-soft)" }}>
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-wide" style={{ color: "var(--teal)" }}>
            {isAr ? "برامجنا التدريبية" : "Our courses"}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-2">
            {isAr ? "تطوير مهاراتك الأكاديمية" : "Develop your academic skills"}
          </h1>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesList.map((c) => (
            <div key={c.id} className="card-rise rounded-2xl p-6 flex flex-col justify-between" style={{ background: "white", border: "1px solid var(--paper-soft)" }}>
              <div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--paper-soft)" }}>
                  <BookOpen size={20} color="var(--teal)" />
                </div>
                <h3 className="font-bold text-sm mb-2 leading-snug" style={{ color: "var(--ink)" }}>
                  {isAr ? c.titleAr : c.titleEn}
                </h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--slate, #4B5567)" }}>
                  {isAr ? c.descAr : c.descEn}
                </p>

                {/* السعر */}
                {c.priceOriginal && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                    {c.priceDiscount ? (
                      <>
                        <span style={{ fontSize:17, fontWeight:800, color:"var(--teal)" }}>
                          {Number(c.priceDiscount).toLocaleString()} {isAr ? "ج.م" : "EGP"}
                        </span>
                        <span style={{ fontSize:12, color:"#94a3b8", textDecoration:"line-through" }}>
                          {Number(c.priceOriginal).toLocaleString()} {isAr ? "ج.م" : "EGP"}
                        </span>
                        <span style={{ fontSize:10, fontWeight:700, background:"rgba(220,60,60,0.1)", color:"#dc2626", borderRadius:6, padding:"2px 7px" }}>
                          {Math.round((1 - c.priceDiscount / c.priceOriginal) * 100)}% {isAr ? "خصم" : "OFF"}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize:17, fontWeight:800, color:"var(--gold)" }}>
                        {Number(c.priceOriginal).toLocaleString()} {isAr ? "ج.م" : "EGP"}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Link to="/contact" className="text-xs font-bold flex items-center gap-1 mt-auto" style={{ color: "var(--gold)" }}>
                {isAr ? "سجل اهتمامك" : "Register interest"} <Arrow size={13} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
