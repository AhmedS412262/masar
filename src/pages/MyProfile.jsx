import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useStudent, STUDENT_STATUS } from "../context/StudentContext.jsx";

const SCHOLARSHIPS = ["DAAD", "تشيفنينج", "فولبرايت", "تركيا", "إيراسموس", "منحة أخرى"];

const SECTION_QUESTIONS = {
  motivationLetter: [
    "ما هي دوافعك الرئيسية للتقديم على هذه المنحة؟",
    "ما هي أهدافك الأكاديمية والمهنية؟",
    "كيف ستستفيد من هذه المنحة في خدمة مجتمعك؟",
    "ما هي إنجازاتك الأكاديمية البارزة؟",
    "لماذا اخترت هذا التخصص والبلد تحديداً؟",
  ],
  recommendation1: [
    "اسم المُزكي ودرجته العلمية ومؤسسته",
    "طبيعة علاقتك بالمُزكي وكم سنة تعرفه؟",
    "في أي مادة أو مشروع أشرف عليك؟",
    "ما هي أبرز صفاتك التي يمكنه التحدث عنها؟",
  ],
  recommendation2: [
    "اسم المُزكي الثاني ودرجته العلمية ومؤسسته",
    "طبيعة علاقتك بهذا المُزكي",
    "في أي مجال يعرفك هذا المُزكي؟",
    "ما هي أبرز صفاتك التي يمكنه التحدث عنها؟",
  ],
  cv: [
    "المؤهل الدراسي الأخير والمعدل التراكمي",
    "خبراتك العملية والتطوعية",
    "المهارات اللغوية (اللغات ومستوياتها)",
    "الجوائز والشهادات والإنجازات",
    "الأنشطة خارج المنهج والاهتمامات",
  ],
};

const SECTION_LABELS = {
  motivationLetter: "خطاب النية",
  recommendation1:  "خطاب توصية 1",
  recommendation2:  "خطاب توصية 2",
  cv:               "السيرة الذاتية",
};

const SECTION_ICONS = {
  motivationLetter: "✍️",
  recommendation1:  "📋",
  recommendation2:  "📋",
  cv:               "📄",
};

const DEFAULT_STATUS_STEPS = [
  { label:"تم التسجيل",                  icon:"📝" },
  { label:"تم الدفع",                    icon:"💳" },
  { label:"تم اكتمال تحميل الملفات",     icon:"📁" },
  { label:"تم استلام الملف",             icon:"📬" },
  { label:"جاري التحضير",               icon:"⚙️" },
  { label:"اكتمل الملف",                icon:"🎉" },
];

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  page:    { minHeight:"100vh", background:"#0B1220", color:"#E8E4DA", fontFamily:"'Cairo',sans-serif", direction:"rtl" },
  header:  { background:"#0D1626", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"0 24px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 },
  logo:    { display:"flex", alignItems:"center", gap:8, fontWeight:900, fontSize:16, color:"#E8E4DA" },
  logoIco: { width:32, height:32, borderRadius:8, background:"#C8932B", display:"flex", alignItems:"center", justifyContent:"center" },
  main:    { maxWidth:880, margin:"0 auto", padding:"24px 16px" },
  card:    { background:"#162035", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:18, marginBottom:14 },
  tabBar:  { display:"flex", gap:6, marginBottom:20, background:"rgba(255,255,255,0.04)", padding:5, borderRadius:10 },
  tab:     (active) => ({ flex:1, padding:"9px 6px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12.5, fontWeight:700, transition:".15s", background: active ? "#C8932B" : "none", color: active ? "#13213B" : "rgba(255,255,255,0.5)" }),
  btn:     { padding:"9px 18px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12.5, fontWeight:700, background:"#C8932B", color:"#13213B", display:"inline-flex", alignItems:"center", gap:6 },
  btnOut:  { padding:"9px 18px", borderRadius:8, border:"1px solid rgba(255,255,255,0.15)", cursor:"pointer", fontFamily:"inherit", fontSize:12.5, fontWeight:700, background:"none", color:"#E8E4DA", display:"inline-flex", alignItems:"center", gap:6 },
  input:   { width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", color:"#ffffff", fontFamily:"inherit", fontSize:13, outline:"none", boxSizing:"border-box", WebkitTextFillColor:"#ffffff" },
  textarea:{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", color:"#ffffff", fontFamily:"inherit", fontSize:13, outline:"none", resize:"vertical", minHeight:80, boxSizing:"border-box", WebkitTextFillColor:"#ffffff" },
  label:   { fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", marginBottom:5, display:"block" },
  badge:   (status) => ({ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:99, fontSize:11.5, fontWeight:700, background: STUDENT_STATUS[status]?.bg || "rgba(255,255,255,0.08)", color: STUDENT_STATUS[status]?.color || "#fff" }),
};

export default function MyProfile() {
  const { user, logout } = useAuth();
  const { getProfile, updateProfile, updateSection } = useStudent();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [secTab, setSecTab] = useState("motivationLetter");
  const [saved, setSaved] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingDone, setRatingDone] = useState(false);
  const fileRefs = { motivationLetter: useRef(), recommendation1: useRef(), recommendation2: useRef(), cv: useRef(), research: useRef(), payment: useRef() };

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const p = getProfile(user.email, user.name);
    setProfile(p);
    // polling كل 2 ثانية للتحقق من تحديثات الموظف (paymentConfirmed, staffReply)
    const interval = setInterval(() => {
      try {
        const students = JSON.parse(localStorage.getItem("masar_students") || "{}");
        const updated = students[user.email];
        if (updated) setProfile(prev => ({ ...prev, ...updated }));
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [user]);

  if (!profile) return <div style={{ ...S.page, display:"flex", alignItems:"center", justifyContent:"center" }}>جاري التحميل...</div>;

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const handleProfileSave = () => {
    updateProfile(user.email, { name: profile.name, phone: profile.phone, country: profile.country || "", scholarship: profile.scholarship, serviceType: profile.serviceType });
    // تحديث status بناءً على البيانات
    if (profile.scholarship && profile.status === "new") {
      updateProfile(user.email, { status: "potential" });
      setProfile(p => ({ ...p, status: "potential" }));
    }
    showSaved();
  };

  const handleAnswerChange = (section, idx, val) => {
    const answers = { ...profile[section].answers, [idx]: val };
    setProfile(p => ({ ...p, [section]: { ...p[section], answers } }));
  };

  const handleSectionSave = (section) => {
    updateSection(user.email, section, { answers: profile[section].answers });
    showSaved();
  };

  const handleUpload = (section, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result;
      updateSection(user.email, section, { uploadedDoc: data, uploadedDocName: file.name });
      setProfile(p => ({ ...p, [section]: { ...p[section], uploadedDoc: data, uploadedDocName: file.name } }));
      showSaved();
    };
    reader.readAsDataURL(file);
  };

  const handlePaymentUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateProfile(user.email, { paymentProof: ev.target.result, paymentProofName: file.name, paymentMethod: profile.paymentMethod || "" });
      setProfile(p => ({ ...p, paymentProof: ev.target.result, paymentProofName: file.name }));
      showSaved();
    };
    reader.readAsDataURL(file);
  };

  const handleResearchUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result;
      updateSection(user.email, "research", { uploadedDoc: data, uploadedDocName: file.name });
      setProfile(p => ({ ...p, research: { ...p.research, uploadedDoc: data, uploadedDocName: file.name } }));
      showSaved();
    };
    reader.readAsDataURL(file);
  };

  const downloadFile = (data, name) => {
    const a = document.createElement("a");
    a.href = data;
    a.download = name;
    a.click();
  };

  const statusInfo = STUDENT_STATUS[profile.status] || STUDENT_STATUS.new;
  const isCompleted =
    profile.statusHistory?.some(s => s.label === "اكتمل الملف" && s.done) ||
    Object.keys(SECTION_LABELS).some(id => profile[id]?.staffReply) ||
    !!profile.research?.staffReply;

  // DEFAULT_STATUS_STEPS للـ timeline
  const STATUS_STEPS_DISPLAY = DEFAULT_STATUS_STEPS;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.logo}>
          <div style={S.logoIco}><i className="ti ti-school" style={{ fontSize:17, color:"#13213B" }} /></div>
          مسار
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {saved && <span style={{ fontSize:12, color:"#2F7B6E", fontWeight:700 }}>✓ تم الحفظ</span>}
          {/* أيقونة الإشعارات */}
          <div style={{ position:"relative" }}>
            <button onClick={() => setNotifOpen(o => !o)} style={{ width:34, height:34, borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", cursor:"pointer", color:"#E8E4DA", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
              🔔
              {isCompleted && <span style={{ position:"absolute", top:-3, right:-3, width:14, height:14, borderRadius:"50%", background:"#e84545", fontSize:8, fontWeight:800, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>1</span>}
            </button>
            {notifOpen && (
              <div style={{ position:"absolute", top:40, left:0, width:270, background:"#162035", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:12, zIndex:99 }}>
                {isCompleted ? (
                  <div style={{ padding:"8px 10px", borderRadius:8, background:"rgba(47,123,110,0.12)", fontSize:12.5, fontWeight:600 }}>🎉 ملفك اكتمل! يمكنك تحميله الآن</div>
                ) : (
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", textAlign:"center", padding:10 }}>لا توجد إشعارات</div>
                )}
              </div>
            )}
          </div>
          {/* أيقونة الحساب */}
          <div style={{ width:34, height:34, borderRadius:"50%", background:"#C8932B", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#13213B", overflow:"hidden", cursor:"pointer" }} onClick={() => setActiveTab("profile")}>
            {profile.photo ? <img src={profile.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : (profile.name?.[0] || "؟")}
          </div>
          <button onClick={() => { logout(); navigate("/login"); }} style={{ ...S.btnOut, padding:"6px 12px", fontSize:11.5 }}>خروج</button>
        </div>
      </div>

      <div style={S.main}>
        {/* Profile Header */}
        <div style={{ ...S.card, display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
          <div style={{ width:54, height:54, borderRadius:"50%", background:"#C8932B", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#13213B", flexShrink:0, overflow:"hidden" }}>
            {profile.photo ? <img src={profile.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : (profile.name?.[0] || "؟")}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:18 }}>{profile.name}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginTop:2 }}>{user?.email}</div>
          </div>
          <span style={S.badge(profile.status)}>{statusInfo.dot} {statusInfo.label}</span>
        </div>

        {/* Main Tabs */}
        <div style={S.tabBar}>
          {[["profile","👤 بياناتي"],["payment","💳 الدفع"],["scholarship","🎓 ملف المنحة"],["translation","🌐 ترجمة"],["research","🔬 بحث علمي"],["editing","✏️ تدقيق لغوي"],["status","📊 حالة الطلب"]].map(([id, label]) => (
            <button key={id} style={S.tab(activeTab === id)} onClick={() => setActiveTab(id)}>{label}</button>
          ))}
        </div>

        {/* ── TAB: Profile ── */}
        {activeTab === "profile" && (
          <div style={S.card}>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:16 }}>بياناتي الشخصية</div>
            {/* صورة البروفايل */}
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18, paddingBottom:14, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ position:"relative" }}>
                <div style={{ width:72, height:72, borderRadius:"50%", background:"#C8932B", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:800, color:"#13213B", overflow:"hidden", flexShrink:0 }}>
                  {profile.photo ? <img src={profile.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : (profile.name?.[0] || "؟")}
                </div>
                <button onClick={() => document.getElementById("photoInput").click()} style={{ position:"absolute", bottom:0, left:0, width:22, height:22, borderRadius:"50%", background:"#C8932B", border:"2px solid #0B1220", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>✏️</button>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:13 }}>{profile.name}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2, marginBottom:8 }}>انقر على أيقونة القلم لتغيير الصورة</div>
                <button onClick={() => document.getElementById("photoInput").click()} style={{ ...S.btnOut, padding:"5px 12px", fontSize:11.5 }}>📷 تغيير الصورة</button>
              </div>
              <input id="photoInput" type="file" accept="image/*" style={{ display:"none" }} onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  updateProfile(user.email, { photo: ev.target.result });
                  setProfile(p => ({ ...p, photo: ev.target.result }));
                };
                reader.readAsDataURL(file);
              }} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={S.label}>الاسم الكامل</label>
                <input style={S.input} value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="اسمك بالكامل" />
              </div>
              <div>
                <label style={S.label}>رقم الهاتف</label>
                <input style={S.input} value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="01xxxxxxxxx" />
              </div>
              <div>
                <label style={S.label}>البريد الإلكتروني</label>
                <input style={{ ...S.input, opacity:.6 }} value={user?.email} readOnly />
              </div>
              <div>
                <label style={S.label}>البلد</label>
                <input style={S.input} value={profile.country || ""} onChange={e => setProfile(p => ({ ...p, country: e.target.value }))} placeholder="مثال: مصر، السعودية..." />
              </div>
            </div>
            {/* نوع الخدمة */}
            <div style={{ marginTop:12 }}>
              <label style={S.label}>الخدمة المطلوبة</label>
              <select style={{ ...S.input, cursor:"pointer", background:"#1C2A40" }} value={profile.serviceType || ""} onChange={e => setProfile(p => ({ ...p, serviceType: e.target.value }))}>
                <option value="">اختر الخدمة...</option>
                <option value="motivation">✍️ خطاب النية</option>
                <option value="recommendation">📋 خطاب التوصية</option>
                <option value="cv">📄 سيرة ذاتية</option>
                <option value="consulting">🎓 استشارة تعليمية</option>
                <option value="scholarship">🏆 التقديم على منحة كاملة</option>
                <option value="translation">🌐 ترجمة</option>
                <option value="research">🔬 بحث علمي</option>
                <option value="editing">✏️ تدقيق لغوي</option>
              </select>
            </div>
            {/* اختيار المنحة لو scholarship */}
            {profile.serviceType === "scholarship" && (
              <div style={{ marginTop:12 }}>
                <label style={S.label}>المنحة المطلوبة</label>
                <select style={{ ...S.input, cursor:"pointer", background:"#1C2A40" }} value={profile.scholarship || ""} onChange={e => setProfile(p => ({ ...p, scholarship: e.target.value }))}>
                  <option value="">اختر المنحة...</option>
                  {SCHOLARSHIPS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div style={{ marginTop:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <button style={S.btn} onClick={handleProfileSave}>💾 حفظ البيانات</button>
              {profile.serviceType && (
                <button style={{ ...S.btn, background:"#2F7B6E", color:"#fff" }} onClick={() => {
                  handleProfileSave();
                  // الترجمة والبحث والتدقيق → مباشرة لتابها (بدون دفع مسبق)
                  const noPaymentServices = ["translation", "research", "editing"];
                  if (noPaymentServices.includes(profile.serviceType)) {
                    setActiveTab(profile.serviceType);
                  } else {
                    // المنح والاستشارات → للدفع أولاً
                    setActiveTab("payment");
                    if (["motivation","recommendation","cv"].includes(profile.serviceType)) {
                      const secMap = { motivation:"motivationLetter", recommendation:"recommendation1", cv:"cv" };
                      setSecTab(secMap[profile.serviceType]);
                    }
                  }
                }}>
                  استمرار ←
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Scholarship ── */}
        {activeTab === "scholarship" && (
          <div>
            {/* مقفول تماماً قبل تأكيد الدفع */}
            {!profile.paymentConfirmed ? (
              <div style={{ ...S.card, textAlign:"center", padding:48 }}>
                <div style={{ fontSize:52, marginBottom:14 }}>🔒</div>
                <div style={{ fontWeight:800, fontSize:16, marginBottom:8 }}>هذا القسم مقفول</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", marginBottom:20, lineHeight:1.8 }}>
                  يتطلب الوصول لملف المنحة إتمام الدفع أولاً.<br/>
                  بعد رفع إيصال الدفع وتأكيده من الفريق سيُفتح هذا القسم تلقائياً.
                </div>
                <button style={{ ...S.btn, padding:"10px 24px" }} onClick={() => setActiveTab("payment")}>
                  💳 اذهب للدفع ←
                </button>
              </div>
            ) : !profile.scholarship ? (
              <div style={{ ...S.card, textAlign:"center", padding:40 }}>
                <div style={{ fontSize:36, marginBottom:12 }}>🎓</div>
                <div style={{ fontWeight:700, marginBottom:8 }}>لم تختر منحة بعد</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", marginBottom:16 }}>اختر المنحة أولاً من تبويب "بياناتي"</div>
                <button style={S.btn} onClick={() => setActiveTab("profile")}>اختر المنحة</button>
              </div>
            ) : (
              <>
                <div style={{ ...S.card, display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <span style={{ fontSize:24 }}>🎓</span>
                  <div>
                    <div style={{ fontWeight:800 }}>{profile.scholarship}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>أكمل الأقسام الأربعة أدناه</div>
                  </div>
                </div>

                {/* Section Tabs — حسب الخدمة المختارة */}
                {(() => {
                  const svc = profile.serviceType;
                  const visibleSections =
                    svc === "scholarship" ? Object.keys(SECTION_LABELS) :
                    svc === "motivation"  ? ["motivationLetter"] :
                    svc === "recommendation" ? ["recommendation1"] :
                    svc === "cv"          ? ["cv"] :
                    svc === "consulting"  ? [] :
                    Object.keys(SECTION_LABELS);
                  if (visibleSections.length === 0) return (
                    <div style={{ padding:16, borderRadius:8, background:"rgba(200,147,43,0.08)", border:"1px solid rgba(200,147,43,0.2)", fontSize:12.5, marginBottom:14 }}>
                      🎓 خدمة الاستشارة التعليمية — سيتواصل معك الفريق قريباً لتحديد موعد.
                    </div>
                  );
                  return (
                    <div style={{ display:"flex", gap:5, marginBottom:16, flexWrap:"wrap" }}>
                      {visibleSections.map(id => {
                        const done = profile[id]?.uploadedDoc || Object.keys(profile[id]?.answers || {}).length > 0;
                        return (
                          <button key={id} onClick={() => setSecTab(id)} style={{ padding:"8px 14px", borderRadius:8, border: secTab === id ? "none" : "1px solid rgba(255,255,255,0.12)", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700, background: secTab === id ? "#C8932B" : "rgba(255,255,255,0.04)", color: secTab === id ? "#13213B" : "rgba(255,255,255,0.7)", display:"flex", alignItems:"center", gap:5 }}>
                            {SECTION_ICONS[id]} {SECTION_LABELS[id]}
                            {done && <span style={{ width:7, height:7, borderRadius:"50%", background: secTab === id ? "#13213B" : "#2F7B6E" }} />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Section Content */}
                {Object.entries(SECTION_LABELS).map(([id, label]) => secTab === id && (
                  <div key={id} style={S.card}>
                    <div style={{ fontWeight:800, fontSize:14, marginBottom:4 }}>{SECTION_ICONS[id]} {label}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:16 }}>أجب على الأسئلة التالية بالتفصيل — سيستخدمها الموظف لإعداد مستندك</div>

                    {/* Questions */}
                    {SECTION_QUESTIONS[id].map((q, idx) => (
                      <div key={idx} style={{ marginBottom:12 }}>
                        <label style={{ ...S.label, color:"rgba(255,255,255,0.65)" }}>{idx + 1}. {q}</label>
                        <textarea
                          style={S.textarea}
                          value={profile[id]?.answers?.[idx] || ""}
                          onChange={e => handleAnswerChange(id, idx, e.target.value)}
                          placeholder="اكتب إجابتك هنا..."
                        />
                      </div>
                    ))}

                    {/* Upload - يظهر فقط بعد تأكيد الدفع */}
                    {profile.paymentConfirmed ? (
                      <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:14, marginTop:6 }}>
                        <label style={{ ...S.label, color:"rgba(255,255,255,0.65)" }}>رفع ورقة بيانات إضافية (اختياري)</label>
                        <input type="file" ref={fileRefs[id]} style={{ display:"none" }} accept=".pdf,.doc,.docx,.txt" onChange={e => handleUpload(id, e)} />
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <button style={S.btnOut} onClick={() => fileRefs[id].current?.click()}>📎 رفع ملف</button>
                          {profile[id]?.uploadedDocName && (
                            <span style={{ fontSize:12, color:"#2F7B6E", fontWeight:700 }}>✓ {profile[id].uploadedDocName}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:14, marginTop:6, padding:"12px", borderRadius:8, background:"rgba(255,255,255,0.03)", textAlign:"center" }}>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>🔒 رفع الملفات متاح بعد تأكيد الدفع</div>
                      </div>
                    )}

                    {/* Staff Reply */}
                    {profile[id]?.staffReply && (
                      <div style={{ marginTop:14, padding:12, borderRadius:8, background:"rgba(47,123,110,0.1)", border:"1px solid rgba(47,123,110,0.25)" }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"#2F7B6E", marginBottom:8 }}>✅ رد الموظف جاهز للتحميل</div>
                        <button style={{ ...S.btn, background:"#2F7B6E", color:"#fff" }} onClick={() => downloadFile(profile[id].staffReply, profile[id].staffReplyName)}>
                          ⬇️ تحميل {profile[id].staffReplyName}
                        </button>
                      </div>
                    )}

                    <div style={{ display:"flex", justifyContent:"flex-end", marginTop:14 }}>
                      <button style={S.btn} onClick={() => handleSectionSave(id)}>💾 حفظ الإجابات</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── TAB: Status ── */}
        {activeTab === "status" && (
          <div>
            {/* التايم لاين دايماً ظاهر */}
            <div style={S.card}>
              <div style={{ fontWeight:800, fontSize:14, marginBottom:20 }}>📊 حالة طلبك</div>
              <div style={{ position:"relative" }}>
                {DEFAULT_STATUS_STEPS.map((step, i) => {
                  const done = profile.statusHistory?.some(s => s.label === step.label && s.done) ||
                    (step.label === "تم التسجيل") ||
                    (step.label === "تم الدفع" && profile.paymentConfirmed);
                  const date = profile.statusHistory?.find(s => s.label === step.label)?.date ||
                    (step.label === "تم التسجيل" ? profile.createdAt : null) ||
                    (step.label === "تم الدفع" && profile.paymentConfirmed ? new Date().toISOString() : null);
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:i < DEFAULT_STATUS_STEPS.length - 1 ? 28 : 0, position:"relative" }}>
                      {i < DEFAULT_STATUS_STEPS.length - 1 && (
                        <div style={{ position:"absolute", right:13, top:28, width:2, height:28, background: done ? "#2F7B6E" : "rgba(255,255,255,0.08)" }} />
                      )}
                      <div style={{ width:26, height:26, borderRadius:"50%", background: done ? "#2F7B6E" : "#162035", border:`2px solid ${done ? "#2F7B6E" : "rgba(255,255,255,0.12)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:12, zIndex:1 }}>
                        {done ? "✓" : step.icon}
                      </div>
                      <div style={{ paddingTop:2 }}>
                        <div style={{ fontWeight:700, fontSize:13, color: done ? "#E8E4DA" : "rgba(255,255,255,0.3)" }}>{step.label}</div>
                        {date && <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:1 }}>{new Date(date).toLocaleDateString("ar-EG")}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {isCompleted ? (
              /* ── لما الملف يكتمل: صفحة التحميل ── */
              <div>
                <div style={{ ...S.card, textAlign:"center", padding:28, border:"1px solid rgba(47,123,110,0.4)", background:"rgba(47,123,110,0.07)", marginBottom:14 }}>
                  <div style={{ fontSize:48, marginBottom:8 }}>🎉</div>
                  <div style={{ fontWeight:800, fontSize:18, color:"#2F7B6E", marginBottom:4 }}>ملفك اكتمل!</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>يمكنك تحميل ملفاتك الآن بالصيغة التي تناسبك</div>
                </div>
                <div style={S.card}>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:14 }}>📁 ملفاتك الجاهزة</div>
                  {/* ملفات المنحة */}
                  {Object.entries(SECTION_LABELS).map(([id, label]) => profile[id]?.staffReply && (
                    <div key={id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:8, background:"rgba(47,123,110,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{SECTION_ICONS[id]}</div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>{label}</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:1 }}>{profile[id].staffReplyName}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button style={{ ...S.btn, background:"#2F7B6E", color:"#fff", padding:"7px 14px", fontSize:12 }}
                          onClick={() => downloadFile(profile[id].staffReply, profile[id].staffReplyName)}>
                          ⬇️ PDF
                        </button>
                        <button style={{ ...S.btnOut, padding:"7px 14px", fontSize:12 }}
                          onClick={() => downloadFile(profile[id].staffReply, profile[id].staffReplyName.replace(/\.[^.]+$/, ".docx"))}>
                          ⬇️ Word
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* ملف الترجمة/البحث */}
                  {profile.research?.staffReply && (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:8, background:"rgba(107,93,211,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>🔬</div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>بحث / ترجمة</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:1 }}>{profile.research.staffReplyName}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button style={{ ...S.btn, background:"#2F7B6E", color:"#fff", padding:"7px 14px", fontSize:12 }}
                          onClick={() => downloadFile(profile.research.staffReply, profile.research.staffReplyName)}>
                          ⬇️ تحميل
                        </button>
                        <button style={{ ...S.btnOut, padding:"7px 14px", fontSize:12 }}
                          onClick={() => downloadFile(profile.research.staffReply, profile.research.staffReplyName.replace(/\.[^.]+$/, ".docx"))}>
                          ⬇️ Word
                        </button>
                      </div>
                    </div>
                  )}
                  {/* لو مفيش ملفات بعد */}
                  {!Object.entries(SECTION_LABELS).some(([id]) => profile[id]?.staffReply) && !profile.research?.staffReply && (
                    <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"20px 0", fontSize:12 }}>
                      سيتم رفع ملفاتك هنا بعد مراجعة الفريق
                    </div>
                  )}
                </div>
                <div style={S.card}>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>⭐ قيّم خدمتنا</div>
                  {!ratingDone ? (
                    <>
                      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                        {[1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => setRating(n)} style={{ fontSize:28, background:"none", border:"none", cursor:"pointer", opacity: rating>=n ? 1 : .3, transition:".1s" }}>⭐</button>
                        ))}
                      </div>
                      {rating > 0 && <button style={S.btn} onClick={() => { updateProfile(user.email, { rating }); setRatingDone(true); }}>إرسال التقييم</button>}
                    </>
                  ) : <div style={{ fontSize:13, color:"#2F7B6E", fontWeight:700 }}>✅ شكراً على تقييمك!</div>}
                </div>
              </div>
            ) : (
              /* ── Timeline ── */
              <div style={S.card}>
                <div style={{ fontWeight:800, fontSize:14, marginBottom:20 }}>📊 حالة طلبك</div>
                <div style={{ position:"relative" }}>
                  {DEFAULT_STATUS_STEPS.map((step, i) => {
                    const done = profile.statusHistory?.some(s => s.label === step.label && s.done) ||
                      (step.label === "تم التسجيل") ||
                      (step.label === "تم الدفع" && profile.paymentConfirmed);
                    const date = profile.statusHistory?.find(s => s.label === step.label)?.date ||
                      (step.label === "تم التسجيل" ? profile.createdAt : null) ||
                      (step.label === "تم الدفع" && profile.paymentConfirmed ? new Date().toISOString() : null);
                    return (
                      <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:i < DEFAULT_STATUS_STEPS.length - 1 ? 28 : 0, position:"relative" }}>
                        {i < DEFAULT_STATUS_STEPS.length - 1 && (
                          <div style={{ position:"absolute", right:13, top:28, width:2, height:28, background: done ? "#2F7B6E" : "rgba(255,255,255,0.08)" }} />
                        )}
                        <div style={{ width:26, height:26, borderRadius:"50%", background: done ? "#2F7B6E" : "#162035", border:`2px solid ${done ? "#2F7B6E" : "rgba(255,255,255,0.12)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:12, zIndex:1 }}>
                          {done ? "✓" : step.icon}
                        </div>
                        <div style={{ paddingTop:2 }}>
                          <div style={{ fontWeight:700, fontSize:13, color: done ? "#E8E4DA" : "rgba(255,255,255,0.3)" }}>{step.label}</div>
                          {date && <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:1 }}>{new Date(date).toLocaleDateString("ar-EG")}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Payment ── */}
        {activeTab === "payment" && (
          <div>
            {profile.paymentConfirmed ? (
              <div style={{ ...S.card, textAlign:"center", padding:32, border:"1px solid rgba(47,123,110,0.35)", background:"rgba(47,123,110,0.07)" }}>
                <div style={{ fontSize:40, marginBottom:8 }}>✅</div>
                <div style={{ fontWeight:800, fontSize:16, color:"#2F7B6E", marginBottom:4 }}>تم تأكيد الدفع!</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", marginBottom:16 }}>يمكنك الآن رفع ملفاتك في تاب "ملف المنحة"</div>
                <button style={{ ...S.btn, background:"#2F7B6E", color:"#fff" }} onClick={() => {
                  setActiveTab("scholarship");
                }}>انتقل لملف المنحة ←</button>
              </div>
            ) : (
              <div>
                {/* طرق الدفع */}
                <div style={S.card}>
                  <div style={{ fontWeight:800, fontSize:14, marginBottom:16 }}>💳 اختر طريقة الدفع</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                    {[
                      { id:"instapay",        label:"InstaPay",         icon:"📱", desc:"ادفع عبر تطبيق InstaPay" },
                      { id:"vodafone",        label:"فودافون كاش",      icon:"📲", desc:"ادفع عبر فودافون كاش" },
                      { id:"bank",            label:"تحويل بنكي",       icon:"🏦", desc:"تحويل لحساب البنك" },
                      { id:"western_union",   label:"Western Union",    icon:"🌍", desc:"تحويل دولي عبر Western Union" },
                      { id:"cash",            label:"كاش",               icon:"💵", desc:"دفع نقدي في المكتب" },
                    ].map(method => (
                      <button key={method.id} onClick={() => { updateProfile(user.email, { paymentMethod: method.id }); setProfile(p => ({ ...p, paymentMethod: method.id })); }}
                        style={{ padding:16, borderRadius:10, border:`2px solid ${profile.paymentMethod === method.id ? "#C8932B" : "rgba(255,255,255,0.1)"}`, background: profile.paymentMethod === method.id ? "rgba(200,147,43,0.1)" : "rgba(255,255,255,0.03)", cursor:"pointer", fontFamily:"inherit", textAlign:"right" }}>
                        <div style={{ fontSize:24, marginBottom:6 }}>{method.icon}</div>
                        <div style={{ fontWeight:700, fontSize:13, color: profile.paymentMethod === method.id ? "#C8932B" : "#E8E4DA" }}>{method.label}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{method.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* بيانات الدفع */}
                  {profile.paymentMethod && (
                    <div style={{ padding:14, borderRadius:8, background:"rgba(200,147,43,0.08)", border:"1px solid rgba(200,147,43,0.2)", marginBottom:16 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:"#C8932B", marginBottom:8 }}>📋 بيانات الدفع</div>
                      {profile.paymentMethod === "instapay" && <div style={{ fontSize:12.5, lineHeight:2 }}>رقم InstaPay: <strong>01xxxxxxxxx</strong><br/>اسم الحساب: <strong>مسار للاستشارات</strong></div>}
                      {profile.paymentMethod === "vodafone" && <div style={{ fontSize:12.5, lineHeight:2 }}>رقم فودافون كاش: <strong>01xxxxxxxxx</strong><br/>اسم الحساب: <strong>مسار للاستشارات</strong></div>}
                      {profile.paymentMethod === "bank" && <div style={{ fontSize:12.5, lineHeight:2 }}>اسم البنك: <strong>بنك مصر</strong><br/>رقم الحساب: <strong>xxxxxxxxxxxx</strong><br/>اسم صاحب الحساب: <strong>مسار للاستشارات</strong></div>}
                      {profile.paymentMethod === "western_union" && <div style={{ fontSize:12.5, lineHeight:2 }}>الاسم: <strong>Mohamed Omar</strong><br/>البلد: <strong>Egypt</strong><br/>المدينة: <strong>Cairo</strong><br/>رقم الهاتف: <strong>+20 1xxxxxxxxx</strong><br/><span style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>بعد التحويل أرسل رقم MTCN مع الإيصال</span></div>}
                      {profile.paymentMethod === "cash" && <div style={{ fontSize:12.5, lineHeight:2 }}>يرجى التواصل معنا لتحديد موعد الدفع النقدي.<br/>واتساب: <strong>01xxxxxxxxx</strong></div>}
                    </div>
                  )}

                  {/* رفع إيصال الدفع */}
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>📸 ارفع إيصال الدفع</div>
                    <input type="file" ref={fileRefs.payment} style={{ display:"none" }} accept="image/*,.pdf" onChange={handlePaymentUpload} />
                    <div style={{ border:"2px dashed rgba(255,255,255,0.12)", borderRadius:10, padding:28, textAlign:"center", cursor:"pointer", marginBottom:12 }} onClick={() => fileRefs.payment.current?.click()}>
                      {profile.paymentProofName ? (
                        <>
                          <div style={{ fontSize:28, marginBottom:6 }}>🧾</div>
                          <div style={{ fontWeight:700, color:"#2F7B6E", fontSize:13 }}>✓ {profile.paymentProofName}</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:3 }}>انقر لاستبدال الإيصال</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize:28, marginBottom:6 }}>📎</div>
                          <div style={{ fontWeight:700, fontSize:13 }}>انقر لرفع الإيصال</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:3 }}>صورة أو PDF</div>
                        </>
                      )}
                    </div>
                    {profile.paymentProofName && !profile.paymentConfirmed && (
                      <div style={{ padding:12, borderRadius:8, background:"rgba(200,147,43,0.08)", border:"1px solid rgba(200,147,43,0.2)", fontSize:12.5, color:"rgba(255,255,255,0.6)" }}>
                        ⏳ تم رفع الإيصال — في انتظار تأكيد الفريق. سيتم إشعارك فور التأكيد.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Translation ── */}
        {activeTab === "translation" && (
          <div style={S.card}>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:6 }}>🌐 ترجمة</div>
            <div style={{ marginBottom:16, padding:12, borderRadius:8, background:"rgba(200,147,43,0.08)", border:"1px solid rgba(200,147,43,0.2)", fontSize:12.5, lineHeight:1.8 }}>
              <strong style={{ color:"#C8932B" }}>📌 ملاحظة:</strong> يتم احتساب تكلفة الترجمة حسب عدد الصفحات وعدد الكلمات. سيتم إرسال التكلفة التقديرية إليك قبل البدء في الملف.
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div>
                <label style={S.label}>اللغة المصدر (ترجمة من)</label>
                <input style={S.input} value={profile.research?.fromLang || ""} onChange={e => { updateSection(user.email, "research", { fromLang: e.target.value }); setProfile(p => ({ ...p, research: { ...p.research, fromLang: e.target.value } })); }} placeholder="مثال: العربية" />
              </div>
              <div>
                <label style={S.label}>اللغة الهدف (ترجمة إلى)</label>
                <input style={S.input} value={profile.research?.toLang || ""} onChange={e => { updateSection(user.email, "research", { toLang: e.target.value }); setProfile(p => ({ ...p, research: { ...p.research, toLang: e.target.value } })); }} placeholder="مثال: الإنجليزية" />
              </div>
            </div>
            <input type="file" ref={fileRefs.research} style={{ display:"none" }} accept=".pdf,.doc,.docx,.txt" onChange={handleResearchUpload} />
            <div style={{ border:"2px dashed rgba(255,255,255,0.12)", borderRadius:10, padding:32, textAlign:"center", cursor:"pointer" }} onClick={() => fileRefs.research.current?.click()}>
              {profile.research?.uploadedDocName ? (
                <><div style={{ fontSize:32, marginBottom:8 }}>📄</div><div style={{ fontWeight:700, color:"#2F7B6E" }}>✓ {profile.research.uploadedDocName}</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:4 }}>انقر لاستبدال الملف</div></>
              ) : (
                <><div style={{ fontSize:32, marginBottom:8 }}>📎</div><div style={{ fontWeight:700 }}>انقر لرفع الملف</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:4 }}>PDF, Word, TXT</div></>
              )}
            </div>
            {profile.research?.staffReply && (
              <div style={{ marginTop:16, padding:14, borderRadius:8, background:"rgba(47,123,110,0.1)", border:"1px solid rgba(47,123,110,0.25)" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#2F7B6E", marginBottom:10 }}>✅ الملف جاهز للتحميل</div>
                <button style={{ ...S.btn, background:"#2F7B6E", color:"#fff" }} onClick={() => downloadFile(profile.research.staffReply, profile.research.staffReplyName)}>⬇️ تحميل {profile.research.staffReplyName}</button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Research ── */}
        {activeTab === "research" && (
          <div style={S.card}>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:6 }}>🔬 بحث علمي</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:16 }}>ارفع ورقة البحث المطلوبة وسيتواصل معك الفريق</div>
            <input type="file" ref={fileRefs.research} style={{ display:"none" }} accept=".pdf,.doc,.docx,.txt" onChange={handleResearchUpload} />
            <div style={{ border:"2px dashed rgba(255,255,255,0.12)", borderRadius:10, padding:32, textAlign:"center", cursor:"pointer" }} onClick={() => fileRefs.research.current?.click()}>
              {profile.research?.uploadedDocName ? (
                <><div style={{ fontSize:32, marginBottom:8 }}>📄</div><div style={{ fontWeight:700, color:"#2F7B6E" }}>✓ {profile.research.uploadedDocName}</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:4 }}>انقر لاستبدال الملف</div></>
              ) : (
                <><div style={{ fontSize:32, marginBottom:8 }}>📎</div><div style={{ fontWeight:700 }}>انقر لرفع الملف</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:4 }}>PDF, Word, TXT</div></>
              )}
            </div>
            {profile.research?.staffReply && (
              <div style={{ marginTop:16, padding:14, borderRadius:8, background:"rgba(47,123,110,0.1)", border:"1px solid rgba(47,123,110,0.25)" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#2F7B6E", marginBottom:10 }}>✅ الملف جاهز للتحميل</div>
                <button style={{ ...S.btn, background:"#2F7B6E", color:"#fff" }} onClick={() => downloadFile(profile.research.staffReply, profile.research.staffReplyName)}>⬇️ تحميل {profile.research.staffReplyName}</button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Editing ── */}
        {activeTab === "editing" && (
          <div style={S.card}>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:6 }}>✏️ تدقيق لغوي</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:16 }}>ارفع الملف المطلوب تدقيقه لغوياً</div>
            <input type="file" ref={fileRefs.research} style={{ display:"none" }} accept=".pdf,.doc,.docx,.txt" onChange={handleResearchUpload} />
            <div style={{ border:"2px dashed rgba(255,255,255,0.12)", borderRadius:10, padding:32, textAlign:"center", cursor:"pointer" }} onClick={() => fileRefs.research.current?.click()}>
              {profile.research?.uploadedDocName ? (
                <><div style={{ fontSize:32, marginBottom:8 }}>📄</div><div style={{ fontWeight:700, color:"#2F7B6E" }}>✓ {profile.research.uploadedDocName}</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:4 }}>انقر لاستبدال الملف</div></>
              ) : (
                <><div style={{ fontSize:32, marginBottom:8 }}>📎</div><div style={{ fontWeight:700 }}>انقر لرفع الملف</div><div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:4 }}>PDF, Word, TXT</div></>
              )}
            </div>
            {profile.research?.staffReply && (
              <div style={{ marginTop:16, padding:14, borderRadius:8, background:"rgba(47,123,110,0.1)", border:"1px solid rgba(47,123,110,0.25)" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#2F7B6E", marginBottom:10 }}>✅ الملف جاهز للتحميل</div>
                <button style={{ ...S.btn, background:"#2F7B6E", color:"#fff" }} onClick={() => downloadFile(profile.research.staffReply, profile.research.staffReplyName)}>⬇️ تحميل {profile.research.staffReplyName}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
