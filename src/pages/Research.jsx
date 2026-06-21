import {
  GraduationCap,
  SpellCheck2,
  ClipboardEdit,
  BookOpen,
  FileText,
  PenTool,
  ListChecks,
  Newspaper,
  Languages,
} from "lucide-react";
import { useLang } from "../components/Layout.jsx";
import Contact from "./Contact.jsx";

const SERVICES = [
  { Icon: SpellCheck2, ar: "التدقيق اللغوي والتنسيق العام", en: "Language editing & formatting" },
  { Icon: ClipboardEdit, ar: "إعداد المقترح البحثي", en: "Research proposal preparation" },
  { Icon: BookOpen, ar: "توفير مصادر علمية", en: "Providing academic sources" },
  { Icon: FileText, ar: "إعداد الملخصات", en: "Preparing summaries" },
  { Icon: PenTool, ar: "المساهمة في إعداد جزء من الدراسة", en: "Contributing to part of the study" },
  { Icon: ListChecks, ar: "متابعة شاملة", en: "Comprehensive follow-up" },
  { Icon: Newspaper, ar: "عمل تقارير إخبارية", en: "Writing news reports" },
  {
    Icon: Languages,
    ar: "الترجمة من وإلى: العربية، الإنجليزية، الفرنسية، الألمانية، التركية، الفارسية، الإندونيسية، الأوردو",
    en: "Translation to/from: Arabic, English, French, German, Turkish, Persian, Indonesian, Urdu",
  },
];

const SPECIALIZATIONS = {
  ar: [
    "العلوم السياسية والعلاقات الدولية",
    "القانون",
    "الإدارة العامة",
    "إدارة الأعمال",
    "الاقتصاد",
    "علم الاجتماع",
    "علم النفس",
  ],
  en: [
    "Political Science & International Relations",
    "Law",
    "Public Administration",
    "Business Administration",
    "Economics",
    "Sociology",
    "Psychology",
  ],
};

export default function Research() {
  const { isAr } = useLang();

  return (
    <>
      {/* Hero */}
      <section className="py-20 text-center" style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div className="max-w-3xl mx-auto px-12">
        
         
          <h1 className="text-3xl md:text-4xl font-extrabold mt-2 mb-6">
            {isAr ? "نحن مركز بحثي متخصص لخدمة الدارسين " : "A Research Center Dedicated to Students"}
          </h1>
          <p className="opacity-80 leading-relaxed">
            {isAr
              ? " يقدم المركز خدمات مساعدة الدارسين في المراحل التعليمية المختلفة، ويضم نخبة من أبرز الباحثين المصريين الذين لا يألون جهدًا في تقديم المشورة والتوجيه العلمي، رغبة منهم في إثراء الحقول الأكاديمية."
              : "An Egyptian research center specialized in helping students at different educational levels, bringing together a select group of leading Egyptian researchers committed to providing guidance and academic mentorship, with the aim of enriching academic fields."}
          </p>
        </div>
      </section>

      {/* Specializations */}
      <section className="py-12" style={{ background: "var(--paper)" }}>
        <div className="max-w-5xl mx-auto px-5 text-center">
          <h2 className="text-xl font-extrabold mb-6">{isAr ? "أبرز التخصصات" : "Key Specializations"}</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {(isAr ? SPECIALIZATIONS.ar : SPECIALIZATIONS.en).map((spec) => (
              <span
                key={spec}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ background: "var(--paper-soft)", color: "var(--ink)" }}
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16" style={{ background: "var(--paper-soft)" }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-wide" style={{ color: "var(--gold)" }}>
              {isAr ? "كيف يمكننا مساعدتك" : "How We Can Help"}
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold mt-2">
              {isAr ? "خدمات المركز البحثية" : "Our Research Services"}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map(({ Icon, ar, en }, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 flex flex-col gap-3 shadow-sm"
                style={{ background: "white", border: "1px solid var(--paper-soft)" }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
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

      {/* Contact form — exactly the same section used on the main Contact page */}
      <Contact />
    </>
  );
}
