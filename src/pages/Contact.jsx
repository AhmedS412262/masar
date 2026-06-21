import { useState } from "react";
import { Mail, Phone, MapPin, Send, Facebook, Instagram, Youtube, CheckCircle2, GraduationCap } from "lucide-react";
import { useSiteData } from "../context/SiteDataContext.jsx";
import { useLang } from "../components/Layout.jsx";

// Simple inline WhatsApp glyph — lucide doesn't ship a WhatsApp icon
function WhatsAppIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 1.67c2.19 0 4.25.85 5.8 2.41a8.23 8.23 0 012.4 5.83c0 4.55-3.7 8.24-8.24 8.24a8.2 8.2 0 01-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 01-1.26-4.38c0-4.54 3.7-8.24 8.29-8.24zm-4.52 4.84c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.67 2.67 4.11 3.64.57.24 1.02.39 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.43-.58 1.63-1.15.2-.56.2-1.05.14-1.15-.06-.1-.22-.16-.46-.28-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.55.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.95-1.22-.72-.64-1.21-1.43-1.35-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.36-.77-1.86-.2-.49-.4-.42-.55-.43h-.47z" />
    </svg>
  );
}

// Update these with the real account links.
const SOCIAL_LINKS = [
  { id: "facebook", Icon: Facebook, labelAr: "فيسبوك", labelEn: "Facebook", href: "https://facebook.com/yourpage" },
  { id: "whatsapp", Icon: WhatsAppIcon, labelAr: "واتساب", labelEn: "WhatsApp", href: "https://wa.me/200000000000" },
  { id: "instagram", Icon: Instagram, labelAr: "انستجرام", labelEn: "Instagram", href: "https://instagram.com/yourpage" },
  { id: "youtube", Icon: Youtube, labelAr: "يوتيوب", labelEn: "YouTube", href: "https://youtube.com/@yourchannel" },
];

export default function Contact() {
  const { data } = useSiteData();
  const { ui, isAr } = useLang();

  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", scholarship: "", message: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: replace with a real submission (Formspree/EmailJS/API call).
    console.log("Contact form submitted (UI only):", form);
    setSent(true);
    setForm({ name: "", phone: "", email: "", scholarship: "", message: "" });
  };

  // This section sits on a light "paper-soft" background, so inputs need
  // dark text on a white field — not the white-on-translucent-white style
  // used for dark "ink" sections elsewhere on the site.
  const inputStyle = { background: "white", color: "var(--ink)", border: "1px solid var(--paper-soft)" };

  return (
    <section className="py-20" style={{ background: "var(--paper-soft)" }}>
      <div className="max-w-5xl mx-auto px-5 grid md:grid-cols-2 gap-12">
        <div>
          {/* Temporary placeholder logo — swap for your real logo image/component when ready */}
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-8" style={{ background: "var(--ink)" }}>
            <GraduationCap size={24} color="var(--gold)" />
          </div>
          <span className="text-xs font-bold tracking-wide" style={{ color: "var(--gold)" }}>{ui.contactEyebrow}</span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-2 mb-6">{ui.contactTitle}</h1>
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex items-center gap-3"><Mail size={16} color="var(--teal)" /> {data.contact.email}</div>
            <div className="flex items-center gap-3"><Phone size={16} color="var(--teal)" /> {data.contact.phone}</div>
            <div className="flex items-center gap-3"><MapPin size={16} color="var(--teal)" /> {isAr ? data.contact.addressAr : data.contact.addressEn}</div>
          </div>
          <div className="flex gap-3 mt-6">
            {SOCIAL_LINKS.map(({ id, Icon, labelAr, labelEn, href }) => (
              <a
                key={id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={isAr ? labelAr : labelEn}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:-translate-y-0.5"
                style={{ background: "var(--ink)" }}
              >
                <Icon size={15} color="var(--paper)" />
              </a>
            ))}
          </div>
        </div>

        {sent ? (
          <div className="rounded-2xl p-8 flex flex-col items-center text-center gap-3 self-start shadow-sm" style={{ background: "white", border: "1px solid var(--paper-soft)" }}>
            <CheckCircle2 size={32} color="var(--gold)" />
            <h3 className="font-bold text-lg">{isAr ? "تم استلام رسالتك" : "Message received"}</h3>
            <p className="text-sm opacity-70 max-w-xs">
              {isAr ? "هنتواصل معاك قريب جدًا." : "We'll be in touch with you very soon."}
            </p>
            <button onClick={() => setSent(false)} className="btn-outline px-5 py-2 rounded-full text-sm font-semibold mt-2">
              {isAr ? "إرسال رسالة تانية" : "Send another message"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl p-7 flex flex-col gap-4 shadow-sm" style={{ background: "white", border: "1px solid var(--paper-soft)" }}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold mb-1.5 opacity-70">
                  {isAr ? "الاسم" : "Name"}
                </label>
                <input
                  id="name" name="name" type="text" required
                  value={form.name} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                  placeholder={isAr ? "اسمك بالكامل" : "Your full name"}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold mb-1.5 opacity-70">
                  {isAr ? "رقم الهاتف" : "Phone"}
                </label>
                <input
                  id="phone" name="phone" type="tel"
                  value={form.phone} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                  placeholder={isAr ? "01xxxxxxxxx" : "+20 1xxxxxxxxx"}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold mb-1.5 opacity-70">
                {isAr ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                id="email" name="email" type="email" required
                value={form.email} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label htmlFor="scholarship" className="block text-xs font-semibold mb-1.5 opacity-70">
                {isAr ? "المنحة المطلوبة" : "Requested scholarship"}
              </label>
              <input
                id="scholarship" name="scholarship" type="text"
                value={form.scholarship} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
                placeholder={isAr ? "مثال: منحة الدراسات العليا - بريطانيا" : "e.g. Graduate Scholarship - UK"}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-xs font-semibold mb-1.5 opacity-70">
                {isAr ? "رسالتك" : "Message"}
              </label>
              <textarea
                id="message" name="message" rows={4} 
                value={form.message} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none"
                style={inputStyle}
                placeholder={isAr ? "اكتب استفسارك هنا..." : "Write your question here..."}
              />
            </div>

            <button type="submit" className="btn-gold px-6 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 mt-1">
              {isAr ? "إرسال" : "Send message"} <Send size={15} />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
