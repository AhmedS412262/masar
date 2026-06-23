import { useState, useEffect, useRef } from "react";
import { useChat, saveLead } from "./useChat";
import "./ChatWidget.css";

// محاولة قراءة اللغة من الـ html dir أو prop
function useSiteLang(langProp) {
  const [isRtl, setIsRtl] = useState(() => {
    if (langProp) return langProp === "ar";
    return document.documentElement.dir !== "ltr";
  });
  useEffect(() => {
    if (langProp) { setIsRtl(langProp === "ar"); return; }
    const observer = new MutationObserver(() => {
      setIsRtl(document.documentElement.dir !== "ltr");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
    return () => observer.disconnect();
  }, [langProp]);
  return isRtl;
}

const QUICK = [
  "إيه شروط منحة DAAD؟",
  "ما أنسب منحة لتخصصي؟",
  "كيف أبدأ التقديم؟",
  "ما تكلفة الخدمة؟",
  "هل تساعدون في الفيزا؟",
];

const STORAGE_KEY_USER = "masar_chat_user";

// ─── رنة الترحيب عند فتح الموقع ────────────────────────────────────────────
function playWelcomeChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523, 659, 784, 1047]; // do – mi – sol – do علوي
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
      g.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.35);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.4);
    });
  } catch {}
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ChatWidget({ aiEnabled = true, lang = null }) {
  const isRtl = useSiteLang(lang);
  const [open,       setOpen]      = useState(false);
  const [input,      setInput]     = useState("");
  const [showQuick,  setShowQuick] = useState(true);
  const [unread,     setUnread]    = useState(0);
  const [chimeReady, setChimeReady] = useState(false);

  // بيانات المستخدم
  const [userData, setUserData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_USER)) || null; }
    catch { return null; }
  });

  // فورم التسجيل
  const [form, setForm]       = useState({ name: "", phone: "", email: "" });
  const [formErr, setFormErr] = useState("");

  const endRef = useRef(null);
  const { messages, loading, online, sendMessage } = useChat({ aiEnabled });

  // ── رنة الترحيب: تُشغَّل بعد أول تفاعل للمستخدم مع الصفحة ────────────────
  useEffect(() => {
    const fire = () => {
      if (!chimeReady) {
        setChimeReady(true);
        setTimeout(playWelcomeChime, 600); // تأخير بسيط بعد أول كليك
      }
    };
    window.addEventListener("pointerdown", fire, { once: true });
    return () => window.removeEventListener("pointerdown", fire);
  }, [chimeReady]);

  // ── unread badge ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open && messages.length > 1) setUnread(u => u + 1);
    if (open) setUnread(0);
  }, [messages.length]);

  // ── scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── إرسال رسالة ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const txt = input.trim();
    if (!txt || loading) return;
    setInput("");
    setShowQuick(false);
    await sendMessage(txt);
  };

  // ── حفظ بيانات المستخدم ─────────────────────────────────────────────────────
  const handleFormSubmit = () => {
    if (!form.name.trim()) { setFormErr("من فضلك أدخل اسمك."); return; }
    if (!/^[\d\s\+\-]{7,15}$/.test(form.phone.trim())) { setFormErr("أدخل رقم هاتف صحيح."); return; }
    const user = { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() };
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    setUserData(user);
    setFormErr("");
    // حفظ كـ lead في قاعدة العملاء
    saveLead({ ...user, source: "chat" });
  };

  // ── فتح / إغلاق الشات ───────────────────────────────────────────────────────
  const toggleOpen = () => setOpen(o => !o);

  return (
    <>
      {/* ── زرار الشات الطافي ── */}
      <div className={`mcw-fab-wrap${isRtl ? " mcw-fab-wrap--rtl" : " mcw-fab-wrap--ltr"}`}>
        {!open && <div className="mcw-label-bubble">تحدث مع فريق مسار 💬</div>}
        <button
          className={`mcw-fab${open ? " mcw-fab--open" : ""}`}
          onClick={toggleOpen}
          aria-label={open ? "إغلاق الشات" : "فتح الشات"}
        >
          <i className={`ti ${open ? "ti-x" : "ti-message-circle"}`} aria-hidden="true" />
          {!open && unread > 0 && <span className="mcw-badge">{unread}</span>}
        </button>
      </div>

      {/* ── نافذة الشات ── */}
      {open && (
        <div
          className={`mcw-window${isRtl ? " mcw-window--rtl" : " mcw-window--ltr"}`}
          dir={isRtl ? "rtl" : "ltr"}
          role="dialog"
          aria-label="شات مسار"
        >

          {/* Header */}
          <div className="mcw-header">
            <div className="mcw-av">م</div>
            <div className="mcw-hinfo">
              <div className="mcw-hname">مسار — استشارات المنح</div>
              <div className="mcw-hstatus">
                <span className={`mcw-dot ${online ? "mcw-dot--on" : "mcw-dot--off"}`} />
                <span>{online ? "متاح الآن · يرد خلال دقائق" : "خارج أوقات العمل"}</span>
              </div>
            </div>
            <button className="mcw-close-btn" onClick={() => setOpen(false)} aria-label="إغلاق">
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          </div>

          {/* ── فورم بيانات التواصل (يظهر لو مفيش بيانات محفوظة) ── */}
          {!userData ? (
            <div className="mcw-gate" dir="rtl">
              <div className="mcw-gate-icon">💬</div>
              <h3 className="mcw-gate-title">أهلاً بك في مسار!</h3>
              <p className="mcw-gate-sub">أدخل بياناتك لنتواصل معك بشكل أفضل</p>

              <div className="mcw-gate-fields">
                <div className="mcw-gate-field">
                  <label>الاسم <span className="mcw-required">*</span></label>
                  <input
                    type="text"
                    placeholder="اسمك الكريم"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleFormSubmit()}
                  />
                </div>
                <div className="mcw-gate-field">
                  <label>رقم الهاتف <span className="mcw-required">*</span></label>
                  <input
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleFormSubmit()}
                    dir="ltr"
                  />
                </div>
                <div className="mcw-gate-field">
                  <label>البريد الإلكتروني <span className="mcw-optional">(اختياري)</span></label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleFormSubmit()}
                    dir="ltr"
                  />
                </div>

                {formErr && <p className="mcw-gate-err">{formErr}</p>}

                <button className="mcw-gate-btn" onClick={handleFormSubmit}>
                  ابدأ المحادثة
                  <i className="ti ti-arrow-left" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            /* ── المحادثة الفعلية ── */
            <>
              {!online && (
                <div className="mcw-offline">
                  <i className="ti ti-clock" aria-hidden="true" />
                  <span>
                    أوقات العمل: الأحد–الخميس 9ص–6م.{" "}
                    <a href="https://wa.me/200000000000" target="_blank" rel="noopener noreferrer">
                      واتساب للرد الأسرع
                    </a>
                  </span>
                </div>
              )}

              {/* تحية شخصية */}
              <div className="mcw-greeting">
                مرحباً {userData.name} 👋
              </div>

              <div className="mcw-msgs" aria-live="polite">
                {messages.map(m => (
                  <div key={m.id} className={`mcw-msg mcw-msg--${m.sender}`}>
                    <div className="mcw-bubble">{m.text}</div>
                    <div className="mcw-time">
                      {new Date(m.ts).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="mcw-msg mcw-msg--bot">
                    <div className="mcw-typing"><span /><span /><span /></div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {showQuick && (
                <div className="mcw-quick">
                  {QUICK.map(q => (
                    <button key={q} className="mcw-qbtn" onClick={() => { setShowQuick(false); sendMessage(q); }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div className="mcw-input-row">
                <input
                  className="mcw-inp"
                  placeholder="اكتب رسالتك..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                  aria-label="رسالتك"
                />
                <button className="mcw-send" onClick={handleSend} disabled={!input.trim() || loading} aria-label="إرسال">
                  <i className="ti ti-send" aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
