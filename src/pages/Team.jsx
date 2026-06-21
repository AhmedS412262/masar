import { User as UserIcon } from "lucide-react";
import { useSiteData } from "../context/SiteDataContext.jsx";
import { useLang } from "../components/Layout.jsx";

export default function Team() {
  const { data } = useSiteData();
  const { ui, isAr } = useLang();

  return (
    <section className="py-20" style={{ background: "var(--ink)", color: "var(--paper)" }}>
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-wide" style={{ color: "var(--gold)" }}>{ui.teamEyebrow}</span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-2">{ui.teamTitle}</h1>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {data.team.map((m) => (
            <div key={m.id} className="w-64 rounded-2xl p-6 text-center" style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)" }}>
              {m.image ? (
                <img src={m.image} alt={isAr ? m.nameAr : m.nameEn} className="w-20 h-20 mx-auto rounded-full object-cover mb-4" />
              ) : (
                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "var(--gold)" }}>
                  <UserIcon size={28} color="var(--ink)" />
                </div>
              )}
              <h3 className="font-bold text-sm mb-1">{isAr ? m.nameAr : m.nameEn}</h3>
              <p className="text-xs opacity-75">{isAr ? m.roleAr : m.roleEn}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}