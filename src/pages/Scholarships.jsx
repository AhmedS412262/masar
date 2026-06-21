import { ArrowLeft, ArrowRight } from "lucide-react";
import { useSiteData } from "../context/SiteDataContext.jsx";
import { useLang } from "../components/Layout.jsx";
import ScholarshipCard from "../components/ScholarshipCard"; 

export default function Scholarships() {
  const { data } = useSiteData();
  const { ui, isAr } = useLang();

  return (
    <section className="max-w-6xl mx-auto px-5 py-20">
      <div className="text-center mb-12">
        <span className="text-xs font-bold tracking-wide" style={{ color: "var(--teal)" }}>
          {ui.schEyebrow}
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-2">
          {ui.schTitle}
        </h1>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.scholarships.map((s) => (
          <ScholarshipCard key={s.id} s={s} ui={ui} />
        ))}
      </div>
    </section>
  );
}