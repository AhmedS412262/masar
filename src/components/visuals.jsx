import { useEffect, useState } from "react";

export function Stamp({ value, suffix, label, rotate = -6 }) {
  return (
    <div
      className="relative flex flex-col items-center justify-center text-center rounded-full border-2 border-dashed"
      style={{ width: 132, height: 132, borderColor: "var(--gold)", transform: `rotate(${rotate}deg)`, color: "var(--paper)" }}
    >
      <span className="text-3xl font-extrabold leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}<span style={{ color: "var(--gold)" }}>{suffix}</span>
      </span>
      <span className="text-[11px] mt-1 px-2 leading-tight font-semibold opacity-80">{label}</span>
    </div>
  );
}

export function useCountUp(target, start) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    const num = parseInt(target, 10) || 0;
    const duration = 1400;
    const startTime = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(num * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target]);
  return val;
}

export function CounterStamp({ value, suffix, label, start, rotate }) {
  const val = useCountUp(value, start);
  return <Stamp value={val} suffix={suffix} label={label} rotate={rotate} />;
}

export function HeroIllustration() {
  return (
    <svg viewBox="0 0 360 320" width="100%" height="320" style={{ maxWidth: 360 }} role="img" aria-label="رسم توضيحي لطالب يسافر للدراسة بالخارج">
      <circle cx="180" cy="160" r="140" fill="var(--paper)" opacity="0.06" />
      <circle cx="180" cy="160" r="100" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="3 6" opacity="0.5" />
      <circle cx="120" cy="190" r="46" fill="none" stroke="var(--teal)" strokeWidth="2.5" />
      <ellipse cx="120" cy="190" rx="46" ry="18" fill="none" stroke="var(--teal)" strokeWidth="1.5" opacity="0.7" />
      <ellipse cx="120" cy="190" rx="18" ry="46" fill="none" stroke="var(--teal)" strokeWidth="1.5" opacity="0.7" />
      <line x1="74" y1="190" x2="166" y2="190" stroke="var(--teal)" strokeWidth="1.5" opacity="0.7" />
      <path d="M150 150 Q 210 90 268 70" fill="none" stroke="var(--gold)" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
      <g transform="translate(268 70) rotate(-28)">
        <path d="M0 0 L20 -4 L26 0 L20 4 Z" fill="var(--gold)" />
        <path d="M6 -1 L0 -10 L4 -10 L11 -2 Z" fill="var(--gold)" />
        <path d="M6 1 L0 10 L4 10 L11 2 Z" fill="var(--gold)" />
      </g>
      <g transform="translate(195 150)">
        <circle cx="0" cy="0" r="20" fill="var(--gold)" />
        <path d="M-22 -4 L0 -16 L22 -4 L0 8 Z" fill="var(--ink)" />
        <line x1="22" y1="-4" x2="22" y2="14" stroke="var(--ink)" strokeWidth="2" />
        <circle cx="22" cy="16" r="2.5" fill="var(--ink)" />
        <rect x="-16" y="20" width="32" height="58" rx="10" fill="var(--ink)" />
        <rect x="-30" y="40" width="18" height="24" rx="4" fill="var(--teal)" />
      </g>
      <circle cx="70" cy="80" r="3" fill="var(--gold)" opacity="0.7" />
      <circle cx="300" cy="180" r="3" fill="var(--teal)" opacity="0.7" />
      <circle cx="250" cy="240" r="2.5" fill="var(--gold)" opacity="0.6" />
    </svg>
  );
}

export const BrandStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
    :root {
      --ink: #13213B; --ink-soft: #2A3A5C; --paper: #F7F4EC; --paper-soft: #EFEAE0;
      --gold: #C8932B; --teal: #2F7B6E; --slate: #4B5567;
    }
    * { box-sizing: border-box; }
    .dashed-divider { border-top: 1px dashed #C9C2B2; }
    .btn-gold { background: var(--gold); color: var(--ink); font-weight: 700; transition: transform .15s ease, box-shadow .15s ease; }
    .btn-gold:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(200,147,43,.35); }
    .btn-outline { border: 1.5px solid var(--paper); color: var(--paper); transition: background .15s ease, color .15s ease; }
    .btn-outline:hover { background: var(--paper); color: var(--ink); }
    .card-rise { transition: transform .2s ease, box-shadow .2s ease; }
    .card-rise:hover { transform: translateY(-4px); box-shadow: 0 14px 28px rgba(19,33,59,.10); }
    .accordion-icon { transition: transform .25s ease; }
    @media (prefers-reduced-motion: reduce) { .card-rise, .btn-gold, .accordion-icon { transition: none !important; } }
  `}</style>
);
