// components/ScholarshipCard.jsx
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "./Layout.jsx";

export default function ScholarshipCard({ s, ui }) {
  const { isAr } = useLang();
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="card-rise rounded-2xl overflow-hidden flex flex-col" style={{ background: "white", border: "1px solid var(--paper-soft)" }}>
      <div className="w-full h-40 overflow-hidden" style={{ background: "var(--paper-soft)" }}>
        {s.image && <img src={s.image} alt={isAr ? s.titleAr : s.titleEn} className="w-full h-full object-cover" />}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <span className="text-2xl mb-2">{s.flag}</span>
        <span className="text-[11px] font-bold mb-1" style={{ color: "var(--gold)" }}>{isAr ? s.deadlineAr : s.deadlineEn}</span>
        <h3 className="font-bold text-sm mb-2 leading-snug">{isAr ? s.titleAr : s.titleEn}</h3>
        <p className="text-xs mb-4" style={{ color: "var(--slate)" }}>{isAr ? s.levelAr : s.levelEn}</p>
        <Link to="/contact" className="mt-auto text-xs font-bold flex items-center gap-1" style={{ color: "var(--ink)" }}>
          {ui.schCta} <Arrow size={13} />
        </Link>
      </div>
    </div>
  );
}