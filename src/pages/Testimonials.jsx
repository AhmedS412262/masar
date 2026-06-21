import { Quote } from "lucide-react";
import { useSiteData } from "../context/SiteDataContext.jsx";
import { useLang } from "../components/Layout.jsx";

export default function Testimonials() {
  const { data } = useSiteData();
  const { ui, isAr } = useLang();

  return (
    <section className="max-w-6xl mx-auto px-5 py-20">
      <div className="text-center mb-12">
        <span className="text-xs font-bold tracking-wide" style={{ color: "var(--gold)" }}>{ui.testiEyebrow}</span>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-2">{ui.testiTitle}</h1>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.testimonials.map((t) => (
          <div key={t.id} className="card-rise rounded-2xl p-6" style={{ background: "white", border: "1px solid var(--paper-soft)" }}>
            <Quote size={20} color="var(--gold)" />
            <p className="text-sm leading-relaxed my-4" style={{ color: "var(--slate)" }}>{isAr ? t.textAr : t.textEn}</p>
            <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid var(--paper-soft)" }}>
              <img src={t.image} alt={isAr ? t.nameAr : t.nameEn} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="font-bold text-xs">{isAr ? t.nameAr : t.nameEn}</p>
                <p className="text-[11px]" style={{ color: "var(--slate)" }}>{isAr ? t.uniAr : t.uniEn}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}