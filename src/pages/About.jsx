import { FileCheck, GraduationCap, Users } from "lucide-react";
import { useSiteData } from "../context/SiteDataContext.jsx";
import { useLang } from "../components/Layout.jsx";

export default function About() {
  const { data } = useSiteData();
  const { ui, isAr } = useLang();
  const icons = [FileCheck, GraduationCap, Users];

  return (
    <section className="max-w-6xl mx-auto px-5 py-20">
      <div className="text-center mb-12">
        <span className="text-xs font-bold tracking-wide" style={{ color: "var(--teal)" }}>{ui.aboutEyebrow}</span>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-2">{isAr ? data.about.titleAr : data.about.titleEn}</h1>
        <p className="text-sm leading-relaxed max-w-2xl mx-auto mt-4" style={{ color: "var(--slate)" }}>
          {isAr ? data.about.textAr : data.about.textEn}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.about.points.map((p, i) => {
          const Icon = icons[i % icons.length];
          return (
            <div key={p.id} className="card-rise rounded-2xl p-6" style={{ background: "white", border: "1px solid var(--paper-soft)" }}>
              <span className="flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ background: "var(--paper-soft)" }}>
                <Icon size={20} color="var(--teal)" />
              </span>
              <h3 className="font-bold text-sm mb-2">{isAr ? p.tAr : p.tEn}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--slate)" }}>{isAr ? p.dAr : p.dEn}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
