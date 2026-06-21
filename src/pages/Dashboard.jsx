import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, ArrowRight, Upload, RotateCcw, Lock } from "lucide-react";
import { useSiteData } from "../context/SiteDataContext.jsx";

const DASHBOARD_PASSWORD = "masar2026"; // demo-only, not real security

const TABS = [
  { id: "hero", label: "الرئيسية" },
  { id: "about", label: "من نحن" },
  { id: "stats", label: "إحصائيات" },
  { id: "scholarships", label: "المنح" },
  { id: "testimonials", label: "قصص نجاح" },
  { id: "team", label: "فريق العمل" },
  { id: "faq", label: "الأسئلة الشائعة" },
  { id: "contact", label: "تواصل معنا" },
];

function Field({ label, value, onChange, textarea }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold text-xs text-slate-600">{label}</span>
      {textarea ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500" />
      )}
    </label>
  );
}

function ImageField({ label, value, onChange }) {
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-semibold text-xs text-slate-600">{label}</span>
      <div className="flex items-center gap-3">
        {value && <img src={value} alt="" className="w-14 h-14 rounded-lg object-cover border" />}
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="رابط صورة (URL)" className="border rounded-lg px-3 py-2 text-sm flex-1 outline-none focus:border-amber-500" />
        <label className="shrink-0 flex items-center gap-1 text-xs font-semibold border rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50">
          <Upload size={14} /> رفع
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, updateField, updateListItem, addListItem, removeListItem, resetToDefaults } = useSiteData();
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState("hero");

  if (!authed) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-100" style={{ fontFamily: "'Cairo', sans-serif" }}>
        <form
          onSubmit={(e) => { e.preventDefault(); if (pwInput === DASHBOARD_PASSWORD) setAuthed(true); else setPwError(true); }}
          className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-sm"
        >
          <div className="flex items-center gap-2 mb-1 font-extrabold text-lg"><Lock size={18} /> دخول لوحة التحكم</div>
          <p className="text-xs text-slate-500 mb-5">كلمة المرور الافتراضية: <code className="bg-slate-100 px-1 rounded">masar2026</code> — غيّرها من ملف Dashboard.jsx</p>
          <input
            type="password"
            value={pwInput}
            onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
            placeholder="كلمة المرور"
            className="border rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-amber-500 mb-2"
          />
          {pwError && <p className="text-xs text-red-600 mb-2">كلمة المرور غير صحيحة</p>}
          <button className="w-full bg-amber-500 text-white font-bold text-sm rounded-lg py-2.5 mt-2">دخول</button>
          <Link to="/" className="block text-center text-xs text-slate-500 mt-4">الرجوع للموقع</Link>
        </form>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <aside className="w-56 shrink-0 bg-white border-l h-screen sticky top-0 flex flex-col">
        <div className="p-5 font-extrabold text-lg border-b">لوحة التحكم</div>
        <nav className="flex-1 overflow-y-auto p-2">
          {TABS.map((tDef) => (
            <button
              key={tDef.id}
              onClick={() => setTab(tDef.id)}
              className={`w-full text-right text-sm rounded-lg px-3 py-2.5 mb-1 font-semibold ${tab === tDef.id ? "bg-amber-500 text-white" : "hover:bg-slate-100 text-slate-700"}`}
            >
              {tDef.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t flex flex-col gap-2">
          <button onClick={() => { if (confirm("هل تريد إرجاع كل المحتوى للوضع الافتراضي؟")) resetToDefaults(); }} className="flex items-center gap-2 text-xs font-semibold text-slate-600 px-3 py-2 hover:bg-slate-100 rounded-lg">
            <RotateCcw size={14} /> استرجاع الإعدادات الافتراضية
          </button>
          <Link to="/" className="flex items-center gap-2 text-xs font-semibold text-slate-600 px-3 py-2 hover:bg-slate-100 rounded-lg">
            <ArrowRight size={14} /> عرض الموقع
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-8 max-w-3xl">
        {tab === "hero" && (
          <Section title="قسم الرئيسية (Hero)">
            <Field label="نص علوي (عربي)" value={data.hero.eyebrowAr} onChange={(v) => updateField(["hero", "eyebrowAr"], v)} />
            <Field label="نص علوي (إنجليزي)" value={data.hero.eyebrowEn} onChange={(v) => updateField(["hero", "eyebrowEn"], v)} />
            <Field label="العنوان (عربي)" value={data.hero.titleAr} onChange={(v) => updateField(["hero", "titleAr"], v)} />
            <Field label="العنوان (إنجليزي)" value={data.hero.titleEn} onChange={(v) => updateField(["hero", "titleEn"], v)} />
            <Field label="الوصف (عربي)" value={data.hero.subAr} onChange={(v) => updateField(["hero", "subAr"], v)} textarea />
            <Field label="الوصف (إنجليزي)" value={data.hero.subEn} onChange={(v) => updateField(["hero", "subEn"], v)} textarea />
            <Field label="زر 1 (عربي)" value={data.hero.cta1Ar} onChange={(v) => updateField(["hero", "cta1Ar"], v)} />
            <Field label="زر 2 (عربي)" value={data.hero.cta2Ar} onChange={(v) => updateField(["hero", "cta2Ar"], v)} />
          </Section>
        )}

        {tab === "about" && (
          <Section title="قسم من نحن">
            <Field label="العنوان (عربي)" value={data.about.titleAr} onChange={(v) => updateField(["about", "titleAr"], v)} />
            <Field label="العنوان (إنجليزي)" value={data.about.titleEn} onChange={(v) => updateField(["about", "titleEn"], v)} />
            <Field label="النص (عربي)" value={data.about.textAr} onChange={(v) => updateField(["about", "textAr"], v)} textarea />
            <Field label="النص (إنجليزي)" value={data.about.textEn} onChange={(v) => updateField(["about", "textEn"], v)} textarea />
          </Section>
        )}

        {tab === "stats" && (
          <Section title="الإحصائيات المتحركة">
            {data.stats.map((s) => (
              <div key={s.id} className="border rounded-xl p-4 mb-3 grid grid-cols-2 gap-3 bg-white">
                <Field label="الرقم" value={s.n} onChange={(v) => updateListItem("stats", s.id, "n", v)} />
                <Field label="الرمز (+ / %)" value={s.suffix} onChange={(v) => updateListItem("stats", s.id, "suffix", v)} />
                <Field label="التسمية (عربي)" value={s.lAr} onChange={(v) => updateListItem("stats", s.id, "lAr", v)} />
                <Field label="التسمية (إنجليزي)" value={s.lEn} onChange={(v) => updateListItem("stats", s.id, "lEn", v)} />
              </div>
            ))}
          </Section>
        )}

        {tab === "scholarships" && (
          <Section
            title="المنح الدراسية"
            onAdd={() => addListItem("scholarships", { flag: "🌍", countryAr: "بلد", countryEn: "Country", titleAr: "اسم المنحة", titleEn: "Scholarship name", deadlineAr: "موعد التقديم", deadlineEn: "Deadline", levelAr: "المستوى", levelEn: "Level", image: "" })}
          >
            {data.scholarships.map((s) => (
              <ListCard key={s.id} onRemove={() => removeListItem("scholarships", s.id)}>
                <ImageField label="صورة المنحة" value={s.image} onChange={(v) => updateListItem("scholarships", s.id, "image", v)} />
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Field label="رمز العلم (إيموجي)" value={s.flag} onChange={(v) => updateListItem("scholarships", s.id, "flag", v)} />
                  <Field label="الدولة" value={s.countryAr} onChange={(v) => updateListItem("scholarships", s.id, "countryAr", v)} />
                  <Field label="اسم المنحة (عربي)" value={s.titleAr} onChange={(v) => updateListItem("scholarships", s.id, "titleAr", v)} />
                  <Field label="اسم المنحة (إنجليزي)" value={s.titleEn} onChange={(v) => updateListItem("scholarships", s.id, "titleEn", v)} />
                  <Field label="موعد التقديم (عربي)" value={s.deadlineAr} onChange={(v) => updateListItem("scholarships", s.id, "deadlineAr", v)} />
                  <Field label="المستوى (عربي)" value={s.levelAr} onChange={(v) => updateListItem("scholarships", s.id, "levelAr", v)} />
                </div>
              </ListCard>
            ))}
          </Section>
        )}

        {tab === "testimonials" && (
          <Section
            title="قصص النجاح"
            onAdd={() => addListItem("testimonials", { nameAr: "اسم الطالب", nameEn: "Student name", uniAr: "الجامعة", uniEn: "University", textAr: "نص الرأي", textEn: "Testimonial text", image: "" })}
          >
            {data.testimonials.map((t) => (
              <ListCard key={t.id} onRemove={() => removeListItem("testimonials", t.id)}>
                <ImageField label="صورة الطالب" value={t.image} onChange={(v) => updateListItem("testimonials", t.id, "image", v)} />
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Field label="الاسم (عربي)" value={t.nameAr} onChange={(v) => updateListItem("testimonials", t.id, "nameAr", v)} />
                  <Field label="الجامعة (عربي)" value={t.uniAr} onChange={(v) => updateListItem("testimonials", t.id, "uniAr", v)} />
                </div>
                <Field label="نص الرأي (عربي)" value={t.textAr} onChange={(v) => updateListItem("testimonials", t.id, "textAr", v)} textarea />
              </ListCard>
            ))}
          </Section>
        )}

        {tab === "team" && (
          <Section title="فريق العمل" onAdd={() => addListItem("team", { nameAr: "اسم العضو", nameEn: "Member name", roleAr: "الدور", roleEn: "Role", image: "" })}>
            {data.team.map((m) => (
              <ListCard key={m.id} onRemove={() => removeListItem("team", m.id)}>
                <ImageField label="صورة العضو" value={m.image} onChange={(v) => updateListItem("team", m.id, "image", v)} />
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Field label="الاسم (عربي)" value={m.nameAr} onChange={(v) => updateListItem("team", m.id, "nameAr", v)} />
                  <Field label="الدور (عربي)" value={m.roleAr} onChange={(v) => updateListItem("team", m.id, "roleAr", v)} />
                </div>
              </ListCard>
            ))}
          </Section>
        )}

        {tab === "faq" && (
          <Section title="الأسئلة الشائعة" onAdd={() => addListItem("faq", { qAr: "سؤال جديد", qEn: "New question", aAr: "الإجابة", aEn: "Answer" })}>
            {data.faq.map((f) => (
              <ListCard key={f.id} onRemove={() => removeListItem("faq", f.id)}>
                <Field label="السؤال (عربي)" value={f.qAr} onChange={(v) => updateListItem("faq", f.id, "qAr", v)} />
                <Field label="الإجابة (عربي)" value={f.aAr} onChange={(v) => updateListItem("faq", f.id, "aAr", v)} textarea />
              </ListCard>
            ))}
          </Section>
        )}

        {tab === "contact" && (
          <Section title="معلومات التواصل">
            <Field label="البريد الإلكتروني" value={data.contact.email} onChange={(v) => updateField(["contact", "email"], v)} />
            <Field label="رقم الهاتف" value={data.contact.phone} onChange={(v) => updateField(["contact", "phone"], v)} />
            <Field label="العنوان (عربي)" value={data.contact.addressAr} onChange={(v) => updateField(["contact", "addressAr"], v)} />
            <Field label="العنوان (إنجليزي)" value={data.contact.addressEn} onChange={(v) => updateField(["contact", "addressEn"], v)} />
          </Section>
        )}
      </main>
    </div>
  );
}

function Section({ title, children, onAdd }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-extrabold text-xl">{title}</h2>
        {onAdd && (
          <button onClick={onAdd} className="flex items-center gap-1 text-xs font-bold bg-amber-500 text-white px-3 py-2 rounded-lg">
            <Plus size={14} /> إضافة
          </button>
        )}
      </div>
      <div className="flex flex-col gap-4 bg-white rounded-2xl p-5 border">{children}</div>
    </div>
  );
}

function ListCard({ children, onRemove }) {
  return (
    <div className="border rounded-xl p-4 relative bg-slate-50">
      <button onClick={onRemove} className="absolute top-3 left-3 text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
      {children}
    </div>
  );
}