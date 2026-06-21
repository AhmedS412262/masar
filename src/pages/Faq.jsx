import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSiteData } from "../context/SiteDataContext.jsx";
import { useLang } from "../components/Layout.jsx";

export default function Faq() {
  const { data } = useSiteData();
  const { ui, isAr } = useLang();
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section className="max-w-3xl mx-auto px-5 py-20">
      <div className="text-center mb-10">
        <span className="text-xs font-bold tracking-wide" style={{ color: "var(--teal)" }}>{ui.faqEyebrow}</span>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-2">{ui.faqTitle}</h1>
      </div>
      <div className="flex flex-col">
        {data.faq.map((f, i) => (
          <div key={f.id} className="dashed-divider py-4">
            <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full flex items-center justify-between text-start gap-4">
              <span className="font-bold text-sm">{isAr ? f.qAr : f.qEn}</span>
              <ChevronDown size={18} className="accordion-icon shrink-0" style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0)", color: "var(--gold)" }} />
            </button>
            {openFaq === i && <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--slate)" }}>{isAr ? f.aAr : f.aEn}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}