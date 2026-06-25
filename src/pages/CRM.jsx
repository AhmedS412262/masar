import { useState, useRef, useEffect } from "react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useStudent, STUDENT_STATUS } from "../context/StudentContext.jsx";

// ─── Staff Management ─────────────────────────────────────────────────────────
const DEFAULT_STAFF = [
  { id:"1", email:"omar@masar.com",   password:"omar1234",   name:"م. عمر فارس",    initials:"م.ع", role:"admin",      otpEnabled:true  },
  { id:"2", email:"lian@masar.com",   password:"lian1234",   name:"أ. ليان حسن",   initials:"أ.ل", role:"consultant", otpEnabled:false },
  { id:"3", email:"sara@masar.com",   password:"sara1234",   name:"أ. سارة أحمد",  initials:"س.أ", role:"consultant", otpEnabled:false },
  { id:"4", email:"karim@masar.com",  password:"karim1234",  name:"أ. كريم محمد",  initials:"ك.م", role:"sales",      otpEnabled:false },
  { id:"5", email:"nour@masar.com",   password:"nour1234",   name:"أ. نور علي",    initials:"ن.ع", role:"sales",      otpEnabled:false },
  { id:"6", email:"dina@masar.com",   password:"dina1234",   name:"أ. دينا حسام",  initials:"د.ح", role:"support",    otpEnabled:false },
];

// ─── Demo Chat Data ───────────────────────────────────────────────────────────
(function initDemoChat() {
  if (localStorage.getItem("masar_demo_done")) return;
  try {
    // Demo leads للشات
    const leads = JSON.parse(localStorage.getItem("masar_leads")||"[]");
    if (leads.length === 0) {
      localStorage.setItem("masar_leads", JSON.stringify([
        { id:"demo_1", name:"أحمد محمد", phone:"01012345678", email:"ahmed@demo.com", message:"أريد معلومات عن منحة فولبرايت", source:"chat", status:"جديد", createdAt:new Date().toISOString() },
        { id:"demo_2", name:"سارة علي",  phone:"01098765432", email:"sara@demo.com",  message:"كيف أبدأ في التقديم على منحة؟", source:"form", status:"جديد", createdAt:new Date().toISOString() },
      ]));
      localStorage.setItem("masar_chats_v1", JSON.stringify({
        "demo_1": { messages:[
          { id:"d1m1", sender:"user",  text:"أهلاً، أريد معلومات عن منحة فولبرايت", ts:Date.now()-3600000 },
          { id:"d1m2", sender:"bot",   text:"أهلاً أحمد! منحة فولبرايت من أميز المنح الأمريكية 🎓 هل تريد معرفة شروط التقديم؟", ts:Date.now()-3500000 },
          { id:"d1m3", sender:"user",  text:"نعم من فضلك، وما هي المستندات المطلوبة؟", ts:Date.now()-3400000 },
        ], lastMsg:"ما هي المستندات؟", lastTs:Date.now()-3400000, unread:1 },
        "demo_2": { messages:[
          { id:"d2m1", sender:"user",  text:"كيف أبدأ في التقديم على منحة دراسية؟", ts:Date.now()-7200000 },
          { id:"d2m2", sender:"bot",   text:"مرحباً سارة! الخطوة الأولى هي تحديد المنحة المناسبة لك 🌟 ما هو تخصصك؟", ts:Date.now()-7100000 },
        ], lastMsg:"ما هو تخصصك؟", lastTs:Date.now()-7100000, unread:0 },
      }));
    }
    // Demo محادثات واتساب الاستشاريين
    const waMsgs = JSON.parse(localStorage.getItem("masar_wa_messages")||"{}");
    if (Object.keys(waMsgs).length === 0) {
      localStorage.setItem("masar_wa_messages", JSON.stringify({
        "student@test.com": [
          { id:"w1", sender:"user",  text:"أهلاً، متى سيكون ملفي جاهزاً؟", timestamp:new Date(Date.now()-86400000).toISOString() },
          { id:"w2", sender:"staff", staffName:"أ. ليان حسن", text:"أهلاً! ملفك قيد المراجعة النهائية وسيكون جاهزاً خلال 48 ساعة إن شاء الله 🌟", timestamp:new Date(Date.now()-82800000).toISOString() },
          { id:"w3", sender:"user",  text:"شكراً جزيلاً، في انتظاره", timestamp:new Date(Date.now()-79200000).toISOString() },
        ],
        "ahmed@demo.com": [
          { id:"w4", sender:"user",  text:"مرحباً، أريد الاستفسار عن موعد الاستشارة", timestamp:new Date(Date.now()-43200000).toISOString() },
          { id:"w5", sender:"staff", staffName:"أ. سارة أحمد", text:"أهلاً أحمد! موعدك يوم الاثنين الساعة 10 صباحاً مع الأستاذة ليان 📅", timestamp:new Date(Date.now()-39600000).toISOString() },
        ],
      }));
    }
    localStorage.setItem("masar_demo_done", "1");
  } catch {}
})();

function getStaffList() {
  try { return JSON.parse(localStorage.getItem("masar_staff") || "null") || DEFAULT_STAFF; }
  catch { return DEFAULT_STAFF; }
}
function saveStaffList(list) { localStorage.setItem("masar_staff", JSON.stringify(list)); }
function verifyStaff(email, password) {
  return getStaffList().find(s => s.email === email && s.password === password) || null;
}

// ─── Roles & Permissions ──────────────────────────────────────────────────────
const SECTION_LABELS = {
  motivationLetter: "خطاب النية",
  recommendation1:  "خطاب توصية 1",
  recommendation2:  "خطاب توصية 2",
  cv:               "السيرة الذاتية",
};
const SECTION_ICONS = { motivationLetter:"✍️", recommendation1:"📋", recommendation2:"📋", cv:"📄" };

const ROLES = {
  admin:      { label:"مدير",          color:"#C8932B", bg:"rgba(200,147,43,0.15)"  },
  consultant: { label:"استشاري",       color:"#2F7B6E", bg:"rgba(47,123,110,0.15)"  },
  sales:      { label:"سيلز",          color:"#6B5DD3", bg:"rgba(107,93,211,0.15)"  },
  support:    { label:"خدمة عملاء",    color:"#3B9DD4", bg:"rgba(59,157,212,0.15)"  },
};

const ROLE_TABS = {
  admin:      ["overview","students","new","potential","registered","tasks","payments","schedule","quick-replies","whatsapp-sales","whatsapp-consulting","site-chat","followup","marketing","email","reports","finance","staff"],
  consultant: ["overview","students","registered","tasks","schedule","quick-replies","whatsapp-consulting","followup","email","search"],
  sales:      ["overview","new","potential","tasks","payments","quick-replies","whatsapp-sales","site-chat","followup","email","search"],
  support:    ["students","new","tasks","site-chat","quick-replies","whatsapp-sales","followup","search"],
};

// ─── Quick Replies Storage ───────────────────────────────────────────────────────
const DEFAULT_QUICK_REPLIES = [
  // ── عام ──
  { id:"1",  title:"ترحيب",              tag:"عام",     text:"أهلاً وسهلاً! 🌟 شكراً لتواصلك مع مسار للاستشارات التعليمية. كيف يمكنني مساعدتك اليوم؟" },
  { id:"2",  title:"مواعيد العمل",       tag:"عام",     text:"أوقات العمل لدينا:\nالأحد - الخميس: 9 صباحاً - 6 مساءً\nالجمعة والسبت: 10 صباحاً - 4 مساءً 🕘" },
  { id:"3",  title:"شكر على التواصل",    tag:"عام",     text:"شكراً جزيلاً على تواصلك معنا 🙏 سنقوم بالرد عليك في أقرب وقت ممكن." },
  // ── منح ──
  { id:"4",  title:"خدماتنا",            tag:"منح",     text:"🎓 خدمات مسار للاستشارات:\n✍️ خطاب النية\n📋 خطابات التوصية\n📄 السيرة الذاتية الأكاديمية\n🎯 التقديم الكامل على المنح\n📞 استشارة تعليمية متخصصة" },
  { id:"5",  title:"المستندات المطلوبة", tag:"منح",     text:"📁 المستندات المطلوبة لملف المنحة:\n✅ صورة جواز السفر (ساري المفعول)\n✅ كشف الدرجات الرسمي\n✅ صورة شهادة التخرج\n✅ صورة شخصية بخلفية بيضاء\n✅ خطاب النية (سنساعدك في كتابته)" },
  { id:"6",  title:"مدة التنفيذ",        tag:"منح",     text:"⏱ مدة تجهيز الملف:\n• خطاب النية: 5-7 أيام عمل\n• خطاب التوصية: 3-5 أيام عمل\n• السيرة الذاتية: 3-5 أيام عمل\n• التقديم الكامل: 10-14 يوم عمل" },
  { id:"7",  title:"قبول المنحة",        tag:"منح",     text:"🎉 تهانينا على قبولك! خطوتك القادمة هي إكمال أوراق القبول والتأشيرة. فريق مسار جاهز لمساعدتك في كل خطوة 🚀" },
  // ── دفع ──
  { id:"8",  title:"طرق الدفع",          tag:"دفع",     text:"💳 طرق الدفع المتاحة:\n📱 InstaPay\n📲 فودافون كاش\n🏦 تحويل بنكي\n🌍 Western Union\n💵 دفع نقدي في المكتب\n\nبعد الدفع أرسل صورة الإيصال وسنؤكد خلال 24 ساعة ✅" },
  { id:"9",  title:"تأكيد استلام الدفع", tag:"دفع",     text:"✅ تم استلام إيصال الدفع بنجاح!\nسيتم مراجعته وتأكيده خلال 24 ساعة وسيُفتح لك قسم رفع الملفات تلقائياً 🔓" },
  { id:"10", title:"دفع جزئي",           tag:"دفع",     text:"تم استلام الدفع الجزئي ✅ يرجى إتمام المبلغ المتبقي في موعد أقصاه أسبوع من تاريخ اليوم لضمان الاحتفاظ بموعدك 📅" },
  // ── متابعة ──
  { id:"11", title:"متابعة الملف",       tag:"متابعة",  text:"🔄 فريقنا يعمل على ملفك حالياً. سنُرسل لك تحديثاً خلال 48 ساعة. يمكنك متابعة حالة طلبك من خلال حسابك على موقعنا 📊" },
  { id:"12", title:"الملف جاهز",         tag:"متابعة",  text:"🎉 مبروك! ملفك اكتمل وجاهز للتحميل!\nادخل لحسابك الآن لتحميل ملفاتك بصيغة PDF أو Word ⬇️\nنتمنى لك التوفيق والنجاح 🌟" },
  { id:"13", title:"تذكير بالمستندات",   tag:"متابعة",  text:"📌 تذكير ودي: لم نستلم بعض المستندات الخاصة بك. لإتمام ملفك في الوقت المحدد، يرجى إرسالها في أقرب وقت 🙏" },
  // ── استشارة ──
  { id:"14", title:"حجز استشارة",        tag:"استشارة", text:"📅 لحجز استشارة تعليمية متخصصة:\n1️⃣ أخبرنا بالوقت المناسب لك\n2️⃣ سنؤكد الموعد خلال ساعتين\n⏱ مدة الاستشارة: 45-60 دقيقة" },
  { id:"15", title:"تأكيد الموعد",       tag:"استشارة", text:"✅ تم تأكيد موعد استشارتك!\n📅 التاريخ: [التاريخ]\n⏰ الوقت: [الوقت]\n📞 سنتصل بك على هذا الرقم في الموعد المحدد" },
];
function getQuickReplies() {
  try { return JSON.parse(localStorage.getItem("masar_quick_replies") || "null") || DEFAULT_QUICK_REPLIES; }
  catch { return DEFAULT_QUICK_REPLIES; }
}
function saveQuickReplies(list) { localStorage.setItem("masar_quick_replies", JSON.stringify(list)); }

// ─── Schedule Storage ─────────────────────────────────────────────────────────
function getSchedule() {
  try { return JSON.parse(localStorage.getItem("masar_schedule") || "[]"); }
  catch { return []; }
}
function saveSchedule(list) { localStorage.setItem("masar_schedule", JSON.stringify(list)); }

// ─── Tasks Storage ────────────────────────────────────────────────────────────
function getTasks() {
  try { return JSON.parse(localStorage.getItem("masar_tasks") || "[]"); }
  catch { return []; }
}
function saveTasks(t) { localStorage.setItem("masar_tasks", JSON.stringify(t)); }

// ─── Activity Log ─────────────────────────────────────────────────────────────
function getActivityLog() {
  try { return JSON.parse(localStorage.getItem("masar_activity") || "[]"); }
  catch { return []; }
}
function addActivity(msg, staffName) {
  const log = getActivityLog();
  log.unshift({ msg, staffName, date: new Date().toISOString(), id: Date.now().toString() });
  localStorage.setItem("masar_activity", JSON.stringify(log.slice(0, 50)));
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page:    { minHeight:"100vh", background:"#0B1220", color:"#E8E4DA", fontFamily:"'Cairo',sans-serif", direction:"rtl", display:"flex" },
  side:    { width:230, background:"#0D1626", borderLeft:"1px solid rgba(255,255,255,0.07)", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", overflowY:"auto" },
  main:    { flex:1, display:"flex", flexDirection:"column", minWidth:0 },
  topbar:  { height:54, background:"#0D1626", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", padding:"0 18px", gap:10, flexShrink:0 },
  content: { flex:1, overflowY:"auto", padding:20 },
  card:    { background:"#162035", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:16, marginBottom:12 },
  btn:     { padding:"8px 16px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700, background:"#C8932B", color:"#13213B", display:"inline-flex", alignItems:"center", gap:5 },
  btnOut:  { padding:"8px 16px", borderRadius:8, border:"1px solid rgba(255,255,255,0.15)", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700, background:"none", color:"#E8E4DA", display:"inline-flex", alignItems:"center", gap:5 },
  btnGreen:{ padding:"8px 16px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700, background:"#2F7B6E", color:"#fff", display:"inline-flex", alignItems:"center", gap:5 },
  btnRed:  { padding:"8px 16px", borderRadius:8, border:"1px solid rgba(220,60,60,0.3)", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700, background:"rgba(220,60,60,0.08)", color:"#e84545", display:"inline-flex", alignItems:"center", gap:5 },
  ni:      (a) => ({ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:8, cursor:"pointer", color: a?"#13213B":"rgba(255,255,255,0.55)", fontSize:12.5, fontWeight:600, border:"none", background: a?"#C8932B":"none", width:"100%", textAlign:"right", fontFamily:"inherit", marginBottom:1, transition:".12s" }),
  badge:   (st) => ({ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:99, fontSize:11, fontWeight:700, background: STUDENT_STATUS[st]?.bg||"rgba(255,255,255,0.08)", color: STUDENT_STATUS[st]?.color||"#fff" }),
  input:   { width:"100%", padding:"8px 11px", borderRadius:8, border:"1px solid rgba(255,255,255,0.12)", background:"#1C2A40", color:"#fff", fontFamily:"inherit", fontSize:12.5, outline:"none", boxSizing:"border-box", WebkitTextFillColor:"#fff" },
  textarea:{ width:"100%", padding:"8px 11px", borderRadius:8, border:"1px solid rgba(255,255,255,0.12)", background:"#1C2A40", color:"#fff", fontFamily:"inherit", fontSize:12.5, outline:"none", resize:"vertical", minHeight:70, boxSizing:"border-box", WebkitTextFillColor:"#fff" },
  label:   { fontSize:10.5, fontWeight:700, color:"rgba(255,255,255,0.4)", marginBottom:4, display:"block" },
  statCard:(color) => ({ background:"#162035", border:`1px solid ${color}22`, borderRadius:12, padding:16, flex:1 }),
};

// ─── Login ────────────────────────────────────────────────────────────────────
function CRMLogin({ onOtpSent, onDirectLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    const staff = verifyStaff(email, password);
    if (!staff) { setError("البريد الإلكتروني أو كلمة المرور غير صحيحة"); return; }
    setError("");
    if (staff.otpEnabled) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      alert(`كود التحقق: ${otp}`);
      onOtpSent({ ...staff, otp });
    } else {
      onDirectLogin(staff);
    }
  };

  const iStyle = { width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.07)", color:"#E8E4DA", fontFamily:"inherit", fontSize:13, outline:"none", boxSizing:"border-box", WebkitTextFillColor:"#E8E4DA" };

  return (
    <div style={{ minHeight:"100vh", background:"#0B1220", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Cairo,sans-serif", direction:"rtl" }}>
      <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:36, width:380 }}>
        <div style={{ width:52,height:52,borderRadius:12,background:"#C8932B",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
          <i className="ti ti-chart-bar" style={{ fontSize:24,color:"#13213B" }} />
        </div>
        <div style={{ fontWeight:800,fontSize:20,color:"#E8E4DA",marginBottom:4,textAlign:"center" }}>مسار CRM</div>
        <div style={{ fontSize:12,color:"rgba(255,255,255,0.35)",marginBottom:24,textAlign:"center" }}>نظام إدارة علاقات العملاء</div>
        <div style={{ marginBottom:10 }}>
          <label style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.45)",display:"block",marginBottom:5 }}>البريد الإلكتروني</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={iStyle} placeholder="name@masar.com" onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
        </div>
        <div style={{ marginBottom:16,position:"relative" }}>
          <label style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.45)",display:"block",marginBottom:5 }}>كلمة المرور</label>
          <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} style={{ ...iStyle,paddingLeft:40 }} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
          <button onClick={()=>setShowPass(s=>!s)} style={{ position:"absolute",bottom:10,left:12,background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:14 }}>{showPass?"🙈":"👁️"}</button>
        </div>
        {error && <div style={{ fontSize:12,color:"#e84545",marginBottom:12,textAlign:"center" }}>{error}</div>}
        <button onClick={handleLogin} style={{ width:"100%",padding:12,borderRadius:10,background:"#C8932B",color:"#13213B",fontSize:14,fontWeight:800,cursor:"pointer",border:"none",fontFamily:"inherit" }}>تسجيل الدخول</button>
      </div>
    </div>
  );
}

function CRMOtp({ otpData, onVerified, onBack }) {
  const [digits, setDigits] = useState(["","","","","",""]);
  const [error, setError] = useState(false);
  const r0=useRef(),r1=useRef(),r2=useRef(),r3=useRef(),r4=useRef(),r5=useRef();
  const refs=[r0,r1,r2,r3,r4,r5];
  const handleChange = (i,val) => {
    const v=val.replace(/\D/g,"").slice(-1);
    const next=[...digits]; next[i]=v; setDigits(next); setError(false);
    if(v&&i<5) refs[i+1].current?.focus();
    if(next.every(d=>d)&&next.join("")===otpData.otp) onVerified();
  };
  const handleKeyDown=(i,e)=>{ if(e.key==="Backspace"&&!digits[i]&&i>0) refs[i-1].current?.focus(); };
  return (
    <div style={{ minHeight:"100vh",background:"#0B1220",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Cairo,sans-serif" }}>
      <div style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,padding:36,width:360,textAlign:"center" }}>
        <div style={{ fontWeight:800,fontSize:18,color:"#E8E4DA",marginBottom:8 }}>تحقق من بريدك</div>
        <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:24 }}>الكود أُرسل إلى <strong style={{ color:"#C8932B" }}>{otpData.email}</strong></div>
        <div style={{ display:"flex",gap:8,justifyContent:"center",direction:"ltr",marginBottom:20 }}>
          {digits.map((d,i)=>(
            <input key={i} ref={refs[i]} maxLength={1} value={d} onChange={e=>handleChange(i,e.target.value)} onKeyDown={e=>handleKeyDown(i,e)}
              style={{ width:44,height:52,borderRadius:8,border:`2px solid ${error?"#e84545":d?"#C8932B":"rgba(255,255,255,0.15)"}`,background:"rgba(255,255,255,0.07)",color:"#E8E4DA",fontSize:20,fontWeight:800,textAlign:"center",outline:"none",fontFamily:"inherit" }} />
          ))}
        </div>
        {error && <div style={{ color:"#e84545",fontSize:12,marginBottom:12 }}>كود غير صحيح</div>}
        <button onClick={()=>{ if(digits.join("")===otpData.otp) onVerified(); else setError(true); }} style={{ width:"100%",padding:12,borderRadius:10,background:"#C8932B",color:"#13213B",fontSize:14,fontWeight:800,cursor:"pointer",border:"none",fontFamily:"inherit" }}>تأكيد</button>
        <button onClick={onBack} style={{ marginTop:12,background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:12,fontFamily:"inherit" }}>← رجوع</button>
      </div>
    </div>
  );
}

// ─── CRM App ──────────────────────────────────────────────────────────────────
function CRMApp({ staffInfo, onLogout }) {
  const { allStudents, updateProfile, updateSection, staffUploadReply, advanceStatus } = useStudent();
  // تحديد الـ tab الأول المسموح به للموظف
  const initialTab = (() => {
    const staff = getStaffList().find(s => s.email === staffInfo?.email);
    const role  = staff?.role || "consultant";
    const tabs  = ROLE_TABS[role] || ROLE_TABS.consultant;
    return tabs[0] || "students";
  })();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedEmail, setSelectedEmail] = useState(null);
  // polling كل 3 ثواني لتحديث إجابات الطلاب الجديدة
  useEffect(() => {
    const interval = setInterval(() => {
      // إعادة قراءة allStudents من localStorage
      try {
        const fresh = JSON.parse(localStorage.getItem("masar_students")||"{}");
        // تحديث الـ student الحالي لو مفتوح
        if (selectedEmail && fresh[selectedEmail]) {
          // React سيعيد render تلقائياً لأن allStudents من StudentContext
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedEmail]);
  const [statusFilter, setStatusFilter]   = useState("all");
  const [saved, setSaved]           = useState(false);
  const [notes, setNotes]           = useState("");
  const [search, setSearch]         = useState("");
  // fileReplyRefs moved to StudentDetailTab

  const currentStaff = getStaffList().find(s => s.email === staffInfo?.email);
  const myRole       = currentStaff?.role || "consultant";
  const isAdmin      = myRole === "admin";
  const allowedTabs  = ROLE_TABS[myRole] || ROLE_TABS.consultant;

  // حساب التنبيهات الخاصة بهذا الموظف
  const allAlerts = getAlerts(allStudents, getStaffList());
  const myAlerts  = isAdmin ? allAlerts : allAlerts.filter(a=>a.staffEmail===staffInfo?.email);

  const showSaved = () => { setSaved(true); setTimeout(()=>setSaved(false),2000); };
  const student   = selectedEmail ? allStudents.find(s=>s.email===selectedEmail) : null;

  // إضافة leads من فورم التواصل كـ محتملون
  const formLeads = (() => {
    try {
      const ls = JSON.parse(localStorage.getItem("masar_leads")||"[]");
      return ls.filter(l=>l.source==="form"||l.source==="chat").map(l=>({
        email: l.email||`lead_${l.id}@masar`, name:l.name||"زائر", phone:l.phone||"",
        status:"new", createdAt:l.date||l.createdAt||new Date().toISOString(),
        serviceType:"", scholarship:"", _isLead:true, message:l.message
      }));
    } catch { return []; }
  })();
  const combinedStudents = [...allStudents, ...formLeads.filter(l=>!allStudents.find(s=>s.email===l.email))];

  // فلترة الطلاب حسب الدور — الاستشاري والسيلز يشوفوا طلابهم بس
  const myStudents = combinedStudents.filter(s => {
    if (isAdmin) return true;
    if (myRole === "consultant") return s.assignedConsultant === staffInfo?.email || !s.assignedConsultant;
    if (myRole === "sales")      return s.assignedSales === staffInfo?.email || !s.assignedSales;
    return true;
  });

  const filteredStudents = myStudents.filter(s => {
    const matchStatus = statusFilter==="all" || s.status===statusFilter;
    const matchSearch = !search || s.name?.includes(search) || s.email?.includes(search) || s.phone?.includes(search) || s.scholarship?.includes(search) || s.serviceType?.includes(search) || s.country?.includes(search);
    return matchStatus && matchSearch;
  });

  const makeReplyUploadHandler = (section) => (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEmail) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      staffUploadReply(selectedEmail, section, ev.target.result, file.name);
      addActivity(`رفع رد على الطالب ${student?.name}`, staffInfo?.name);
      showSaved();
    };
    reader.readAsDataURL(file);
  };

  const handleStatusChange = (email, status) => {
    const st = allStudents.find(s=>s.email===email);
    updateProfile(email, { status });
    addActivity(`تغيير حالة ${st?.name} إلى ${STUDENT_STATUS[status]?.label}`, staffInfo?.name);
    showSaved();
  };

  const downloadFile = (data,name) => { const a=document.createElement("a"); a.href=data; a.download=name; a.click(); };

  const NAV_GROUPS = [
    { label:"الرئيسية", items:[
      { id:"overview",   label:"نظرة عامة",     icon:"ti-layout-dashboard", show: allowedTabs.includes("overview") },
      { id:"reports",    label:"التقارير",        icon:"ti-chart-bar",        show: allowedTabs.includes("reports") },
    ]},
    { label:"الطلاب", items:[
      { id:"students",   label:"كل الطلاب",      icon:"ti-users",            show: allowedTabs.includes("students"), count: allStudents.length },
      { id:"new",        label:"محتملون جدد",    icon:"ti-user-plus",        show: allowedTabs.includes("new"),      count: allStudents.filter(s=>s.status==="new").length },
      { id:"potential",  label:"محتملون",         icon:"ti-user-check",       show: allowedTabs.includes("potential"),count: allStudents.filter(s=>s.status==="potential").length },
      { id:"registered", label:"مسجلون",          icon:"ti-certificate",      show: allowedTabs.includes("registered"),count: allStudents.filter(s=>s.status==="registered").length },
    ]},
    { label:"الإدارة", items:[
      { id:"tasks",         label:"المهام",           icon:"ti-checklist",        show: allowedTabs.includes("tasks") },
      { id:"payments",      label:"المدفوعات",         icon:"ti-cash",             show: allowedTabs.includes("payments") },
      { id:"schedule",      label:"جدول المواعيد",    icon:"ti-calendar",         show: allowedTabs.includes("schedule") },
      { id:"quick-replies", label:"ردود جاهزة",       icon:"ti-message-bolt",     show: allowedTabs.includes("quick-replies") },
      { id:"whatsapp-sales",      label:"واتساب المبيعات",     icon:"ti-brand-whatsapp",   show: allowedTabs.includes("whatsapp-sales") },
      { id:"whatsapp-consulting", label:"واتساب الاستشاريين", icon:"ti-brand-whatsapp",   show: allowedTabs.includes("whatsapp-consulting") },
      { id:"site-chat",     label:"شات الموقع",       icon:"ti-message-circle",   show: allowedTabs.includes("site-chat") },
      { id:"followup",      label:"المتابعة",           icon:"ti-refresh",          show: allowedTabs.includes("followup") },
      { id:"marketing",     label:"الماركتينج",        icon:"ti-speakerphone",     show: allowedTabs.includes("marketing") },
      { id:"email",         label:"الإيميلات",          icon:"ti-mail",             show: allowedTabs.includes("email") },
      { id:"search",        label:"البحث",              icon:"ti-search",           show: allowedTabs.includes("search") },
      { id:"finance",       label:"المالية",            icon:"ti-coins",            show: allowedTabs.includes("finance") },
      { id:"staff",         label:"الموظفون",          icon:"ti-id-badge",         show: isAdmin },
    ]},
  ];

  // الـ tabs المسموح بها بيتحكم فيها NAV_GROUPS.show

  return (
    <div style={S.page}>
      {/* ── Sidebar ── */}
      <aside style={S.side}>
        <div style={{ padding:"14px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:32,height:32,borderRadius:8,background:"#C8932B",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <i className="ti ti-chart-bar" style={{ fontSize:16,color:"#13213B" }} />
            </div>
            <div>
              <div style={{ color:"#E8E4DA",fontWeight:800,fontSize:14,lineHeight:1 }}>مسار CRM</div>
              <div style={{ fontSize:9.5,color:"rgba(255,255,255,0.3)",marginTop:1 }}>نظام إدارة العملاء</div>
            </div>
          </div>
        </div>

        <nav style={{ flex:1,padding:"8px 6px",overflowY:"auto" }}>
          {NAV_GROUPS.map(group => {
            const visibleItems = group.items.filter(i=>i.show);
            if (!visibleItems.length) return null;
            return (
              <div key={group.label} style={{ marginBottom:6 }}>
                <div style={{ fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.25)",padding:"8px 8px 3px",letterSpacing:".08em",textTransform:"uppercase" }}>{group.label}</div>
                {visibleItems.map(item => (
                  <button key={item.id} style={S.ni(activeTab===item.id)} onClick={()=>{ setActiveTab(item.id); setSelectedEmail(null); setStatusFilter(item.id==="students"?"all":item.id); }}>
                    <i className={`ti ${item.icon}`} style={{ fontSize:14 }} />
                    <span style={{ flex:1 }}>{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span style={{ background:activeTab===item.id?"rgba(19,33,59,0.3)":"rgba(200,147,43,0.2)",color:activeTab===item.id?"#13213B":"#C8932B",borderRadius:99,padding:"1px 7px",fontSize:10,fontWeight:800 }}>{item.count}</span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <div style={{ padding:12,borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}>
            <div style={{ width:32,height:32,borderRadius:"50%",background:"#C8932B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#13213B",flexShrink:0 }}>{staffInfo?.initials}</div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:12,fontWeight:700,color:"#E8E4DA",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{staffInfo?.name}</div>
              <div style={{ fontSize:10,color:ROLES[myRole]?.color||"rgba(255,255,255,0.35)" }}>{ROLES[myRole]?.label}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ ...S.btnOut,width:"100%",justifyContent:"center",fontSize:11,padding:"6px" }}>
            <i className="ti ti-logout" style={{ fontSize:12 }} /> خروج
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={S.main}>
        {/* Topbar */}
        <div style={S.topbar}>
          {(student && selectedEmail) ? (
            <>
              <button style={{ ...S.btnOut,padding:"5px 10px",fontSize:11 }} onClick={()=>{ setSelectedEmail(null); }}>← رجوع</button>
              <span style={{ fontWeight:800,fontSize:14 }}>👤 {student?.name}</span>
            </>
          ) : (
            <span style={{ fontWeight:800,fontSize:15 }}>
              {activeTab==="overview"?"📊 نظرة عامة":activeTab==="reports"?"📈 التقارير":activeTab==="finance"?"💵 المالية":activeTab==="tasks"?"✅ المهام":activeTab==="staff"?"👥 الموظفون":activeTab==="payments"?"💰 المدفوعات":activeTab==="schedule"?"📅 جدول المواعيد":activeTab==="quick-replies"?"💬 ردود جاهزة":activeTab==="site-chat"?"🖥️ شات الموقع":activeTab==="whatsapp-sales"?"📱 واتساب المبيعات":activeTab==="whatsapp-consulting"?"📱 واتساب الاستشاريين":"قائمة الطلاب"}
            </span>
          )}
          <div style={{ flex:1 }} />
          {saved && <span style={{ fontSize:12,color:"#2F7B6E",fontWeight:700 }}>✓ تم الحفظ</span>}
          {/* Avatar + Bell + Logout */}
          <div style={{ display:"flex",alignItems:"center",gap:10,marginRight:4,borderRight:"1px solid rgba(255,255,255,0.07)",paddingRight:12 }}>
            {/* Avatar */}
            <div style={{ position:"relative",flexShrink:0 }}>
              <div style={{ width:34,height:34,borderRadius:"50%",background:ROLES[myRole]?.color||"#C8932B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#13213B",border:"2px solid rgba(255,255,255,0.15)" }}>
                {staffInfo?.initials||staffInfo?.name?.[0]||"?"}
              </div>
              <div style={{ position:"absolute",bottom:-2,right:-2,width:14,height:14,borderRadius:"50%",background:"#0D1626",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8 }}>
                {myRole==="admin"?"👑":myRole==="consultant"?"🎓":myRole==="sales"?"💼":"🎧"}
              </div>
            </div>
            {/* Name + Role */}
            <div style={{ fontSize:11,lineHeight:1.4,minWidth:60 }}>
              <div style={{ fontWeight:700,color:"#E8E4DA",whiteSpace:"nowrap" }}>{staffInfo?.name}</div>
              <div style={{ color:ROLES[myRole]?.color||"rgba(255,255,255,0.4)",fontSize:10 }}>{ROLES[myRole]?.label}</div>
            </div>
            {/* Bell */}
            <div style={{ position:"relative",cursor:"pointer",padding:"4px" }} title={myAlerts.length>0?`${myAlerts.length} تنبيه`:"لا توجد تنبيهات"}>
              <i className="ti ti-bell" style={{ fontSize:18,color:myAlerts.length>0?"#e84545":"rgba(255,255,255,0.4)" }} />
              {myAlerts.length > 0 && (
                <span style={{ position:"absolute",top:0,right:0,minWidth:15,height:15,borderRadius:99,background:"#e84545",fontSize:9,fontWeight:800,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 2px" }}>
                  {myAlerts.length}
                </span>
              )}
            </div>
            {/* Logout */}
            <button onClick={onLogout} style={{ background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:7,cursor:"pointer",color:"rgba(255,255,255,0.5)",fontSize:11,padding:"5px 10px",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4 }}>
              <i className="ti ti-logout" style={{ fontSize:13 }} />
              خروج
            </button>
          </div>

          {/* بحث سريع - دائم في الـ topbar */}
          {!student && (
            <div style={{ position:"relative" }}>
              <input value={search} onChange={e=>{
                setSearch(e.target.value);
                if (e.target.value && !["students","new","potential","registered"].includes(activeTab)) {
                  setActiveTab("students");
                  setStatusFilter("all");
                }
              }} placeholder="🔍 بحث سريع..." style={{ ...S.input,width:200,padding:"6px 11px 6px 32px",fontSize:12 }} />
              <i className="ti ti-search" style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"rgba(255,255,255,0.3)" }} />
              {search && <button onClick={()=>setSearch("")} style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:14,lineHeight:1 }}>✕</button>}
            </div>
          )}
        </div>

        {/* Alerts Banner */}
        {myAlerts.length > 0 && (
          <div style={{ padding:"0 20px",paddingTop:8 }}>
            {myAlerts.slice(0,3).map((alert,i)=>(
              <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 14px",borderRadius:8,marginBottom:6,
                background:alert.priority==="high"?"rgba(232,69,69,0.1)":"rgba(200,147,43,0.08)",
                border:`1px solid ${alert.priority==="high"?"rgba(232,69,69,0.3)":"rgba(200,147,43,0.2)"}` }}>
                <span style={{ fontSize:16 }}>{alert.priority==="high"?"🔴":"🟡"}</span>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:12.5,fontWeight:700,color:alert.priority==="high"?"#e84545":"#C8932B" }}>{alert.msg}</span>
                  {isAdmin && <span style={{ fontSize:11,color:"rgba(255,255,255,0.45)",marginRight:8 }}> — {alert.staffName}</span>}
                </div>
                <span style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>{alert.studentName}</span>
              </div>
            ))}
            {myAlerts.length > 3 && <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",textAlign:"center",marginBottom:6 }}>و{myAlerts.length-3} تنبيه آخر...</div>}
          </div>
        )}
        <div style={S.content}>

          {/* ══ Overview ══ */}
          {activeTab==="overview" && !student && <OverviewTab allStudents={allStudents} staffInfo={staffInfo} setActiveTab={setActiveTab} setStatusFilter={setStatusFilter} setSelectedEmail={setSelectedEmail} S={S} />}

          {/* ══ Students List ══ */}
          {["students","new","potential","registered"].includes(activeTab) && !student && (
            <StudentsListTab
              filtered={filteredStudents} allStudents={allStudents} activeTab={activeTab}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              setSelectedEmail={(e)=>{ setSelectedEmail(e); setNotes(allStudents.find(s=>s.email===e)?.notes||""); }}
              handleStatusChange={handleStatusChange} S={S} STUDENT_STATUS={STUDENT_STATUS}
            />
          )}

          {/* ══ Student Detail ══ */}
          {student && selectedEmail && (
            <StudentDetailTab
              student={student} staffInfo={staffInfo} notes={notes} setNotes={setNotes}
              myRole={myRole}
              handleReplyUpload={makeReplyUploadHandler}
              handleStatusChange={handleStatusChange} advanceStatus={advanceStatus}
              handleNotesSave={()=>{
                const newNote = { text:notes, staffName:staffInfo?.name||"موظف", role:myRole, date:new Date().toISOString() };
                const history = [...(allStudents.find(s=>s.email===selectedEmail)?.noteHistory||[]), newNote];
                updateProfile(selectedEmail, { notes, noteHistory:history });
                addActivity(`تعليق جديد على ${student?.name}`,staffInfo?.name);
                showSaved();
              }}
              downloadFile={downloadFile} updateProfile={updateProfile} showSaved={showSaved} S={S}
            />
          )}

          {/* ══ Tasks ══ */}
          {activeTab==="tasks" && !student && <TasksTab staffInfo={staffInfo} allStudents={allStudents} S={S} />}

          {/* ══ Follow Up ══ */}
          {activeTab==="followup" && !student && <FollowUpTab allStudents={allStudents} staffInfo={staffInfo} S={S} />}

          {/* ══ Marketing ══ */}
          {activeTab==="marketing" && !student && <MarketingTab allStudents={allStudents} S={S} />}

          {/* ══ Email ══ */}
          {activeTab==="email" && !student && <EmailTab allStudents={allStudents} staffInfo={staffInfo} S={S} />}

          {/* ══ Search ══ */}
          {activeTab==="search" && !student && <SearchTab allStudents={allStudents} staffInfo={staffInfo} setSelectedEmail={setSelectedEmail} setActiveTab={setActiveTab} S={S} />}

          {/* ══ Reports ══ */}
          {activeTab==="reports" && !student && <ReportsTab allStudents={allStudents} S={S} />}

          {/* ══ Finance ══ */}
          {activeTab==="finance" && !student && <FinanceTab allStudents={allStudents} S={S} />}

          {/* ══ Payments ══ */}
          {activeTab==="payments" && !student && <PaymentsTab allStudents={allStudents} staffInfo={staffInfo} S={S} />}

          {/* ══ Schedule ══ */}
          {activeTab==="schedule" && !student && <ScheduleTab staffInfo={staffInfo} allStudents={allStudents} S={S} />}

          {/* ══ Quick Replies ══ */}
          {activeTab==="quick-replies" && !student && <QuickRepliesTab S={S} />}

          {/* ══ WhatsApp Sales ══ */}
          {activeTab==="whatsapp-sales" && !student && <WhatsAppTab allStudents={allStudents} mode="sales" staffInfo={staffInfo} S={S} />}

          {/* ══ WhatsApp Consulting ══ */}
          {activeTab==="whatsapp-consulting" && !student && <WhatsAppTab allStudents={allStudents.filter(s=>s.paymentConfirmed)} mode="consulting" staffInfo={staffInfo} S={S} />}

          {/* ══ Site Chat ══ */}
          {activeTab==="site-chat" && !student && <SiteChatTab staffInfo={staffInfo} S={S} />}

          {/* ══ Staff ══ */}
          {activeTab==="staff" && isAdmin && !student && <StaffTab S={S} />}

        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ allStudents, staffInfo, setActiveTab, setStatusFilter, S }) {
  const staffList   = getStaffList();
  const myRole      = staffList.find(s=>s.email===staffInfo?.email)?.role || "consultant";
  const getFupStats = (emailOrName) => {
    try {
      const fups = JSON.parse(localStorage.getItem("masar_followups")||"[]");
      const now2 = new Date();
      const mine = fups.filter(f=>f.assignedTo===emailOrName||f.createdBy===emailOrName);
      return { overdue:mine.filter(f=>!f.done&&f.date&&new Date(f.date)<now2).length, today:mine.filter(f=>!f.done&&f.date&&f.date.split("T")[0]===now2.toISOString().split("T")[0]).length, pending:mine.filter(f=>!f.done&&(!f.date||new Date(f.date)>=now2)).length, done:mine.filter(f=>f.done).length };
    } catch { return {overdue:0,today:0,pending:0,done:0}; }
  };
  const myStudents  = myRole==="admin" ? allStudents :
                      myRole==="consultant" ? allStudents.filter(s=>s.assignedConsultant===staffInfo?.email) :
                      allStudents.filter(s=>s.assignedSales===staffInfo?.email);

  const [onlineStaff, setOnlineStaff] = useState(()=>{ try{return JSON.parse(localStorage.getItem("masar_online")||"{}");}catch{return {};} });
  const activity = getActivityLog();

  useEffect(()=>{
    const update=()=>{
      try{
        const cur=JSON.parse(localStorage.getItem("masar_online")||"{}");
        cur[staffInfo?.email]={name:staffInfo?.name,ts:Date.now()};
        localStorage.setItem("masar_online",JSON.stringify(cur));
        setOnlineStaff({...cur});
      }catch{}
    };
    update(); const iv=setInterval(update,15000); return()=>clearInterval(iv);
  },[staffInfo?.email]);

  const onlineNow = Object.entries(onlineStaff).filter(([,v])=>Date.now()-v.ts<30000);

  // ── نظرة السيلز ──────────────────────────────────────────────────────────
  if (myRole === "sales") {
    const myDeals        = myStudents.reduce((arr,s)=>[...arr,...(s.deals||[]).map(d=>({...d,studentName:s.name}))],[]);
    const wonDeals       = myDeals.filter(d=>d.status==="won");
    const openDeals      = myDeals.filter(d=>d.status==="open");
    const totalRevenue   = wonDeals.reduce((sum,d)=>sum+(parseFloat(d.amount)||0),0);
    const myRems = myStudents.flatMap(s=>{
      try{ return (JSON.parse(localStorage.getItem(`masar_rem_${s.email}`)||"[]")).map(r=>({...r,studentName:s.name,studentEmail:s.email})); }catch{return [];}
    }).filter(r=>!r.done&&r.date&&new Date(r.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date));

    return (
      <div>
        <div style={{ fontWeight:800,fontSize:16,marginBottom:16 }}>مرحباً {staffInfo?.name} 👋</div>
        {/* Stats */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16 }}>
          {[
            { label:"عملائي",          num:myStudents.length,            color:"#2F7B6E", icon:"ti-users"       },
            { label:"صفقات مفتوحة",    num:openDeals.length,             color:"#C8932B", icon:"ti-briefcase"   },
            { label:"صفقات مغلقة",     num:wonDeals.length,              color:"#6B5DD3", icon:"ti-check"       },
            { label:"إيراداتي",        num:totalRevenue.toLocaleString()+" ج", color:"#2F7B6E", icon:"ti-cash" },
          ].map((s,i)=>(
            <div key={i} style={{ ...S.card,marginBottom:0 }}>
              <div style={{ width:34,height:34,borderRadius:8,background:`${s.color}18`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8 }}>
                <i className={`ti ${s.icon}`} style={{ fontSize:17,color:s.color }} />
              </div>
              <div style={{ fontSize:24,fontWeight:800,color:s.color,lineHeight:1 }}>{s.num}</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
          {/* تنبيهات السيلز */}
          {(() => {
            const myAlerts2 = getAlerts(allStudents, staffList).filter(a=>a.staffEmail===staffInfo?.email);
            if (!myAlerts2.length) return null;
            return (
              <div style={{ ...S.card,gridColumn:"1/-1",border:"1px solid rgba(232,69,69,0.25)",background:"rgba(232,69,69,0.04)",marginBottom:0 }}>
                <div style={{ fontWeight:700,fontSize:13,color:"#e84545",marginBottom:10 }}>🔴 تنبيهاتك العاجلة ({myAlerts2.length})</div>
                {myAlerts2.slice(0,3).map((a,i)=>(
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize:16 }}>{a.priority==="high"?"🔴":"🟡"}</span>
                    <div style={{ flex:1,fontSize:12.5,fontWeight:700,color:a.priority==="high"?"#e84545":"#C8932B" }}>{a.msg}</div>
                    <span style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>{a.studentName}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* التذكيرات القادمة */}
          <div style={S.card}>
            <div style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>⏰ تذكيراتي القادمة</div>
            {myRems.length===0 ? <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",textAlign:"center",padding:"16px 0" }}>لا توجد تذكيرات</div>
            : myRems.slice(0,6).map((r,i)=>(
              <div key={i} style={{ display:"flex",gap:10,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize:18 }}>{r.type==="مكالمة"?"📞":r.type==="واتساب"?"📱":r.type==="اجتماع"?"🤝":"📋"}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12.5,fontWeight:700 }}>{r.title}</div>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>{r.studentName}</div>
                </div>
                <div style={{ fontSize:10.5,color:new Date(r.date)<new Date()?"#e84545":"rgba(255,255,255,0.35)",textAlign:"left" }}>
                  {new Date(r.date).toLocaleDateString("ar-EG")}<br/>{new Date(r.date).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}
                </div>
              </div>
            ))}
          </div>

          {/* آخر الصفقات */}
          <div style={S.card}>
            <div style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>💼 آخر الصفقات</div>
            {myDeals.length===0 ? <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",textAlign:"center",padding:"16px 0" }}>لا توجد صفقات بعد</div>
            : [...myDeals].reverse().slice(0,6).map((d,i)=>(
              <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12.5,fontWeight:700 }}>{d.title}</div>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>{d.studentName}</div>
                </div>
                {d.amount&&<span style={{ fontSize:12,color:"#2F7B6E",fontWeight:700 }}>{parseFloat(d.amount).toLocaleString()} ج</span>}
                <span style={{ fontSize:10.5,padding:"2px 7px",borderRadius:99,fontWeight:700,
                  background:d.status==="won"?"rgba(47,123,110,0.15)":d.status==="lost"?"rgba(232,69,69,0.12)":"rgba(200,147,43,0.12)",
                  color:d.status==="won"?"#2F7B6E":d.status==="lost"?"#e84545":"#C8932B" }}>
                  {d.status==="won"?"✅ ربح":d.status==="lost"?"❌ خسرت":"🔵 مفتوحة"}
                </span>
              </div>
            ))}
          </div>

          {/* عملائي */}
          <div style={{ ...S.card,gridColumn:"1/-1" }}>
            <div style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>👥 عملائي ({myStudents.length})</div>
            {myStudents.slice(0,5).map(s=>(
              <div key={s.email} style={{ display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width:28,height:28,borderRadius:"50%",background:"#C8932B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#13213B" }}>{s.name[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12.5,fontWeight:700 }}>{s.name}</div>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>{s.phone||s.email}</div>
                </div>
                <span style={{ fontSize:11,padding:"2px 7px",borderRadius:99,
                  background:s.status==="registered"?"rgba(107,93,211,0.15)":s.status==="potential"?"rgba(200,147,43,0.12)":"rgba(232,130,58,0.12)",
                  color:s.status==="registered"?"#6B5DD3":s.status==="potential"?"#C8932B":"#E8823A" }}>
                  {s.status==="registered"?"مسجل":s.status==="potential"?"محتمل":"جديد"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── نظرة الاستشاري ───────────────────────────────────────────────────────
  if (myRole === "consultant") {
    const myAppts = (() => {
      try{ return JSON.parse(localStorage.getItem("masar_schedule")||"[]").filter(a=>a.staffEmail===staffInfo?.email).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)); }catch{return [];}
    })();
    const upcoming    = myAppts.filter(a=>a.date>=new Date().toISOString().split("T")[0]);
    const doneFiles   = myStudents.filter(s=>["motivationLetter","cv"].some(k=>s[k]?.staffReply)).length;
    const inProgress  = myStudents.filter(s=>s.paymentConfirmed&&!["motivationLetter","recommendation1","cv"].every(k=>s[k]?.staffReply));
    const completionRate = myStudents.length ? Math.round(doneFiles/myStudents.length*100) : 0;

    return (
      <div>
        <div style={{ fontWeight:800,fontSize:16,marginBottom:16 }}>مرحباً {staffInfo?.name} 👋</div>
        {/* Stats */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16 }}>
          {[
            { label:"طلابي",            num:myStudents.length,    color:"#2F7B6E", icon:"ti-users"       },
            { label:"ملفات مكتملة",     num:doneFiles,            color:"#C8932B", icon:"ti-file-check"  },
            { label:"قيد التجهيز",      num:inProgress.length,    color:"#6B5DD3", icon:"ti-loader"      },
            { label:"مواعيد قادمة",     num:upcoming.length,      color:"#3B9DD4", icon:"ti-calendar"    },
          ].map((s,i)=>(
            <div key={i} style={{ ...S.card,marginBottom:0 }}>
              <div style={{ width:34,height:34,borderRadius:8,background:`${s.color}18`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8 }}>
                <i className={`ti ${s.icon}`} style={{ fontSize:17,color:s.color }} />
              </div>
              <div style={{ fontSize:24,fontWeight:800,color:s.color,lineHeight:1 }}>{s.num}</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* إحصائيات المتابعة */}
        {(() => {
          const fs = getFupStats(staffInfo?.email) || getFupStats(staffInfo?.name);
          if (!fs.overdue && !fs.today && !fs.pending) return null;
          return (
            <div style={{ ...S.card,marginBottom:14,border:fs.overdue>0?"1px solid rgba(232,69,69,0.25)":"1px solid rgba(47,123,110,0.2)",background:fs.overdue>0?"rgba(232,69,69,0.04)":"rgba(47,123,110,0.04)" }}>
              <div style={{ fontWeight:700,fontSize:13,marginBottom:10 }}>🔄 متابعاتي</div>
              <div style={{ display:"flex",gap:16 }}>
                {[
                  { label:"🔴 متأخرة", num:fs.overdue, color:"#e84545" },
                  { label:"📅 اليوم",  num:fs.today,   color:"#C8932B" },
                  { label:"🕐 قادمة",  num:fs.pending, color:"#2F7B6E" },
                  { label:"✅ منجزة",  num:fs.done,    color:"rgba(255,255,255,0.35)" },
                ].map((s,i)=>(
                  <div key={i} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:22,fontWeight:800,color:s.color }}>{s.num}</div>
                    <div style={{ fontSize:10.5,color:"rgba(255,255,255,0.45)",marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
          {/* مواعيد قادمة */}
          <div style={S.card}>
            <div style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>📅 مواعيدي القادمة</div>
            {upcoming.length===0 ? <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",textAlign:"center",padding:"16px 0" }}>لا مواعيد قادمة</div>
            : upcoming.slice(0,5).map((a,i)=>{
              const st=allStudents.find(s=>s.email===a.studentEmail);
              return (
                <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ textAlign:"center",minWidth:42 }}>
                    <div style={{ fontSize:16,fontWeight:800,color:"#C8932B" }}>{new Date(a.date).getDate()}</div>
                    <div style={{ fontSize:9.5,color:"rgba(255,255,255,0.35)" }}>{new Date(a.date).toLocaleDateString("ar-EG",{month:"short"})}</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12.5,fontWeight:700 }}>{st?.name||a.studentEmail}</div>
                    <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>{a.time} · {a.type} · {a.duration} د</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* الأداء */}
          <div style={S.card}>
            <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>📊 أدائي</div>
            {[
              { label:"معدل اكتمال الملفات", val:completionRate, color:"#2F7B6E" },
              { label:"طلاب دفعوا", val:myStudents.length?Math.round(myStudents.filter(s=>s.paymentConfirmed).length/myStudents.length*100):0, color:"#C8932B" },
              { label:"ملفات عليها رد", val:myStudents.length?Math.round(doneFiles/myStudents.length*100):0, color:"#6B5DD3" },
            ].map(item=>(
              <div key={item.label} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:11.5,color:"rgba(255,255,255,0.6)" }}>{item.label}</span>
                  <span style={{ fontSize:11.5,fontWeight:700,color:item.color }}>{item.val}%</span>
                </div>
                <div style={{ height:6,borderRadius:99,background:"rgba(255,255,255,0.07)",overflow:"hidden" }}>
                  <div style={{ height:"100%",background:item.color,width:`${item.val}%`,borderRadius:99,transition:".6s" }} />
                </div>
              </div>
            ))}
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:10,marginTop:4 }}>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:2 }}>إجمالي الاستشارات</div>
              <div style={{ fontSize:20,fontWeight:800,color:"#3B9DD4" }}>{myAppts.length}</div>
            </div>
          </div>

          {/* تنبيهات الاستشاري */}
          {(() => {
            const myAlerts2 = getAlerts(allStudents, staffList).filter(a=>a.staffEmail===staffInfo?.email);
            if (!myAlerts2.length) return null;
            return (
              <div style={{ ...S.card,gridColumn:"1/-1",border:"1px solid rgba(232,69,69,0.25)",background:"rgba(232,69,69,0.04)" }}>
                <div style={{ fontWeight:700,fontSize:13,color:"#e84545",marginBottom:10 }}>🔴 تنبيهاتك ({myAlerts2.length})</div>
                {myAlerts2.map((a,i)=>(
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize:16 }}>{a.priority==="high"?"🔴":"🟡"}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12.5,fontWeight:700,color:a.priority==="high"?"#e84545":"#C8932B" }}>{a.msg}</div>
                      <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>{a.studentName}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ملفات قيد التجهيز */}
          <div style={{ ...S.card,gridColumn:"1/-1" }}>
            <div style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>⚙️ ملفات قيد التجهيز ({inProgress.length})</div>
            {inProgress.length===0 ? <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",textAlign:"center",padding:"12px 0" }}>كل الملفات مكتملة 🎉</div>
            : inProgress.map(s=>(
              <div key={s.email} style={{ display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontWeight:700,fontSize:12.5,flex:1 }}>{s.name}</div>
                <div style={{ display:"flex",gap:5,alignItems:"center" }}>
                  {[["motivationLetter","✍️"],["recommendation1","📋"],["recommendation2","📋"],["cv","📄"]].map(([k,icon])=>(
                    <span key={k} title={SECTION_LABELS[k]} style={{ fontSize:14,opacity:s[k]?.staffReply?1:0.2 }}>{icon}</span>
                  ))}
                </div>
                <span style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>{Math.round(["motivationLetter","recommendation1","recommendation2","cv"].filter(k=>s[k]?.staffReply).length/4*100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── نظرة المدير (Admin Overview) ─────────────────────────────────────────
  const salesStats = staffList.filter(s=>s.role==="sales").map(s => ({
    name:s.name, email:s.email,
    deals:allStudents.reduce((sum,st)=>(st.deals||[]).filter(d=>d.status==="won"&&d.staffName===s.name).length+sum,0),
    revenue:allStudents.reduce((sum,st)=>(st.deals||[]).filter(d=>d.status==="won"&&d.staffName===s.name).reduce((a,d)=>a+(parseFloat(d.amount)||0),0)+sum,0),
    students:allStudents.filter(st=>st.assignedSales===s.email).length,
  }));

  const scholarshipCounts = {};
  allStudents.forEach(s=>{ if(s.scholarship) scholarshipCounts[s.scholarship]=(scholarshipCounts[s.scholarship]||0)+1; });
  const topScholarships = Object.entries(scholarshipCounts).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const completedFiles  = allStudents.filter(s=>["motivationLetter","cv"].some(k=>s[k]?.staffReply)).length;
  const completionRate  = allStudents.length?Math.round(completedFiles/allStudents.length*100):0;

  const adminStats = [
    { label:"إجمالي الطلاب", num:allStudents.length,                                     color:"#2F7B6E", icon:"ti-users",       tab:"students", filter:"all"        },
    { label:"محتملون جدد",   num:allStudents.filter(s=>s.status==="new").length,          color:"#E8823A", icon:"ti-user-plus",   tab:"new",      filter:"new"        },
    { label:"محتملون",        num:allStudents.filter(s=>s.status==="potential").length,    color:"#C8932B", icon:"ti-user-check",  tab:"potential",filter:"potential"  },
    { label:"مسجلون",         num:allStudents.filter(s=>s.status==="registered").length,   color:"#6B5DD3", icon:"ti-certificate", tab:"registered",filter:"registered"},
  ];

  return (
    <div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18 }}>
        {adminStats.map((s,i)=>(
          <div key={i} style={{ ...S.card,cursor:"pointer",marginBottom:0 }} onClick={()=>{ setActiveTab(s.tab); setStatusFilter(s.filter); }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
              <div style={{ width:36,height:36,borderRadius:9,background:`${s.color}18`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                <i className={`ti ${s.icon}`} style={{ fontSize:18,color:s.color }} />
              </div>
              <i className="ti ti-arrow-up-left" style={{ fontSize:13,color:"rgba(255,255,255,0.2)" }} />
            </div>
            <div style={{ fontSize:28,fontWeight:800,color:s.color,lineHeight:1 }}>{s.num}</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:3,fontWeight:600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Online */}
      <div style={{ ...S.card,marginBottom:14 }}>
        <div style={{ fontWeight:700,fontSize:13,marginBottom:10,display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ width:8,height:8,borderRadius:"50%",background:"#25D366" }} />
          متصلون الآن ({onlineNow.length})
        </div>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
          {onlineNow.length===0?<div style={{ fontSize:12,color:"rgba(255,255,255,0.3)" }}>لا أحد متصل</div>
          :onlineNow.map(([email,v])=>(
            <div key={email} style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:99,background:"rgba(37,211,102,0.1)",border:"1px solid rgba(37,211,102,0.2)" }}>
              <span style={{ width:7,height:7,borderRadius:"50%",background:"#25D366" }} />
              <span style={{ fontSize:12,fontWeight:600 }}>{v.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* أداء السيلز */}
      {salesStats.length>0 && (
        <div style={{ ...S.card,marginBottom:14 }}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>💼 أداء فريق المبيعات</div>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12.5 }}>
            <thead>
              <tr>{["السيلز","العملاء","صفقات مغلقة","الإيراد"].map(h=>(
                <th key={h} style={{ padding:"6px 10px",textAlign:"right",fontSize:10.5,fontWeight:700,color:"rgba(255,255,255,0.35)",borderBottom:"1px solid rgba(255,255,255,0.07)" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {salesStats.map(s=>(
                <tr key={s.email}>
                  <td style={{ padding:"9px 10px",fontWeight:700 }}>{s.name}</td>
                  <td style={{ padding:"9px 10px",color:"rgba(255,255,255,0.6)" }}>{s.students}</td>
                  <td style={{ padding:"9px 10px" }}><span style={{ color:"#2F7B6E",fontWeight:700 }}>{s.deals}</span></td>
                  <td style={{ padding:"9px 10px" }}><span style={{ color:"#C8932B",fontWeight:700 }}>{s.revenue.toLocaleString()} ج</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
        <div style={S.card}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>🎓 أكثر المنح طلباً</div>
          {topScholarships.length===0?<div style={{ color:"rgba(255,255,255,0.3)",fontSize:12,textAlign:"center",padding:16 }}>لا توجد بيانات</div>
          :topScholarships.map(([name,count])=>(
            <div key={name} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize:12.5,fontWeight:600 }}>{name}</span>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <div style={{ width:80,height:5,borderRadius:99,background:"rgba(255,255,255,0.08)",overflow:"hidden" }}>
                  <div style={{ height:"100%",background:"#C8932B",width:`${(count/allStudents.length)*100}%`,borderRadius:99 }} />
                </div>
                <span style={{ fontSize:11,color:"rgba(255,255,255,0.45)" }}>{count}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>📊 معدل الأداء العام</div>
          {[
            { label:"اكتمال الملفات",  val:completionRate, color:"#2F7B6E" },
            { label:"طلاب مسجلون",     val:allStudents.length?Math.round(allStudents.filter(s=>s.status==="registered").length/allStudents.length*100):0, color:"#6B5DD3" },
          ].map(item=>(
            <div key={item.label} style={{ marginBottom:12 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                <span style={{ fontSize:11.5,color:"rgba(255,255,255,0.6)" }}>{item.label}</span>
                <span style={{ fontSize:11.5,fontWeight:700,color:item.color }}>{item.val}%</span>
              </div>
              <div style={{ height:6,borderRadius:99,background:"rgba(255,255,255,0.07)",overflow:"hidden" }}>
                <div style={{ height:"100%",background:item.color,width:`${item.val}%`,borderRadius:99 }} />
              </div>
            </div>
          ))}
        </div>
        {/* متابعات الفريق للمدير */}
        {(() => {
          const fups = (() => { try{return JSON.parse(localStorage.getItem("masar_followups")||"[]");}catch{return [];} })();
          const now2 = new Date();
          const staffFup = staffList.filter(s=>s.role!=="admin").map(s => {
            const myFups = fups.filter(f=>f.assignedTo===s.email||f.createdBy===s.name);
            const overdue = myFups.filter(f=>!f.done&&f.date&&new Date(f.date)<now2);
            const today   = myFups.filter(f=>!f.done&&f.date&&f.date.split("T")[0]===now2.toISOString().split("T")[0]);
            const pending = myFups.filter(f=>!f.done&&f.date&&new Date(f.date)>=now2);
            return { ...s, overdue:overdue.length, today:today.length, pending:pending.length, total:myFups.length };
          }).filter(s=>s.total>0);
          if (!staffFup.length) return null;
          return (
            <div style={{ ...S.card,gridColumn:"1/-1",marginBottom:0 }}>
              <div style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>🔄 متابعات الفريق</div>
              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12.5 }}>
                <thead>
                  <tr>{["الموظف","الدور","اليوم","قادمة","🔴 متأخرة"].map(h=>(
                    <th key={h} style={{ padding:"6px 10px",textAlign:"right",fontSize:10.5,fontWeight:700,color:"rgba(255,255,255,0.35)",borderBottom:"1px solid rgba(255,255,255,0.07)" }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {staffFup.map(s=>(
                    <tr key={s.email} style={{ background:s.overdue>0?"rgba(232,69,69,0.04)":"none" }}>
                      <td style={{ padding:"8px 10px",fontWeight:700 }}>{s.name}</td>
                      <td style={{ padding:"8px 10px",fontSize:11,color:"rgba(255,255,255,0.45)" }}>{ROLES[s.role]?.label||s.role}</td>
                      <td style={{ padding:"8px 10px",color:s.today>0?"#C8932B":"rgba(255,255,255,0.4)",fontWeight:s.today>0?700:400 }}>{s.today}</td>
                      <td style={{ padding:"8px 10px",color:"rgba(255,255,255,0.5)" }}>{s.pending}</td>
                      <td style={{ padding:"8px 10px" }}>
                        {s.overdue>0 ? <span style={{ fontSize:12,padding:"2px 8px",borderRadius:99,background:"rgba(232,69,69,0.15)",color:"#e84545",fontWeight:700 }}>🔴 {s.overdue}</span>
                        : <span style={{ fontSize:12,color:"#2F7B6E" }}>✅ لا تأخير</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        <div style={{ ...S.card,gridColumn:"1/-1" }}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>📋 سجل النشاط</div>
          {activity.length===0?<div style={{ color:"rgba(255,255,255,0.3)",fontSize:12,textAlign:"center",padding:16 }}>لا توجد نشاطات</div>
          :activity.slice(0,6).map(a=>(
            <div key={a.id} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ width:7,height:7,borderRadius:"50%",background:"#2F7B6E",marginTop:5,flexShrink:0 }} />
              <div style={{ flex:1 }}><span style={{ fontSize:12.5,fontWeight:600 }}>{a.msg}</span>{a.staffName&&<span style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginRight:6 }}> — {a.staffName}</span>}</div>
              <span style={{ fontSize:10.5,color:"rgba(255,255,255,0.3)",whiteSpace:"nowrap" }}>{new Date(a.date).toLocaleDateString("ar-EG")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function StudentsListTab({ filtered, allStudents, activeTab, statusFilter, setStatusFilter, setSelectedEmail, handleStatusChange, S, STUDENT_STATUS }) {
  return (
    <div>
      {/* Export + Filters */}
      <div style={{ display:"flex",gap:8,marginBottom:10,alignItems:"center" }}>
        <button style={{ ...S.btnOut,padding:"6px 12px",fontSize:11 }} onClick={() => {
          const rows = filtered.map(s=>({ "الاسم":s.name,"البريد":s.email,"الهاتف":s.phone||"","البلد":s.country||"","الخدمة":s.serviceType||"","المنحة":s.scholarship||"","الحالة":STUDENT_STATUS[s.status]?.label||s.status,"تاريخ التسجيل":new Date(s.createdAt).toLocaleDateString("ar-EG") }));
          const headers=Object.keys(rows[0]||{});
          const csv=[headers.join(","),...rows.map(r=>headers.map(h=>`"${r[h]}"`).join(","))].join("\n");
          const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"})); a.download=`عملاء_مسار.csv`; a.click();
        }}>📥 تصدير CSV</button>
      </div>
      {/* Filters */}
      <div style={{ display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" }}>
        {[["all","الكل"],["new","🟠 جديد"],["potential","🟨 محتمل"],["registered","🔴 مسجل"]].map(([v,l])=>(
          <button key={v} onClick={()=>setStatusFilter(v)} style={{ padding:"6px 12px",borderRadius:7,border:statusFilter===v?"none":"1px solid rgba(255,255,255,0.1)",background:statusFilter===v?"#C8932B":"none",color:statusFilter===v?"#13213B":"rgba(255,255,255,0.6)",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>
            {l} <span style={{ opacity:.7 }}>({v==="all"?allStudents.length:allStudents.filter(s=>s.status===v).length})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...S.card,textAlign:"center",padding:48,color:"rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize:32,marginBottom:8 }}>👥</div>
          <div style={{ fontWeight:700 }}>لا يوجد طلاب</div>
          <div style={{ fontSize:12,marginTop:4 }}>سيظهرون هنا بعد تسجيلهم</div>
        </div>
      ) : (
        <div style={S.card}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12.5 }}>
            <thead>
              <tr>{["الاسم","البريد","الهاتف","المنحة","الخدمة","الحالة","التاريخ",""].map(h=>(
                <th key={h} style={{ padding:"8px 10px",textAlign:"right",fontSize:10.5,fontWeight:700,color:"rgba(255,255,255,0.3)",borderBottom:"1px solid rgba(255,255,255,0.07)" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.email} style={{ cursor:"pointer" }} onClick={()=>setSelectedEmail(s.email)}>
                  <td style={{ padding:"10px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ width:30,height:30,borderRadius:"50%",background:"#C8932B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#13213B",flexShrink:0,overflow:"hidden" }}>
                        {s.photo ? <img src={s.photo} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="" /> : s.name?.[0]||"؟"}
                      </div>
                      <span style={{ fontWeight:700 }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:"10px",color:"rgba(255,255,255,0.45)",fontSize:12 }}>{s.email}</td>
                  <td style={{ padding:"10px",fontSize:12 }}>{s.phone||"—"}</td>
                  <td style={{ padding:"10px",fontSize:12 }}>{s.scholarship||"—"}</td>
                  <td style={{ padding:"10px",fontSize:11,color:"rgba(255,255,255,0.5)" }}>{s.serviceType||"—"}</td>
                  <td style={{ padding:"10px" }}>
                    <select style={{ fontSize:11,padding:"3px 7px",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"#1C2A40",color:"#fff",cursor:"pointer",fontFamily:"inherit" }}
                      value={s.status} onChange={e=>{ e.stopPropagation(); handleStatusChange(s.email,e.target.value); }} onClick={e=>e.stopPropagation()}>
                      <option value="new">🟠 جديد</option>
                      <option value="potential">🟨 محتمل</option>
                      <option value="registered">🔴 مسجل</option>
                    </select>
                  </td>
                  <td style={{ padding:"10px",fontSize:11,color:"rgba(255,255,255,0.3)" }}>{new Date(s.createdAt).toLocaleDateString("ar-EG")}</td>
                  <td style={{ padding:"10px" }}>
                    <button style={{ ...S.btnOut,padding:"4px 10px",fontSize:11 }} onClick={e=>{e.stopPropagation();setSelectedEmail(s.email);}}>فتح</button>
                  <button style={{ ...S.btn,padding:"4px 10px",fontSize:11 }} onClick={e=>{
                    e.stopPropagation();
                    const salesStaff=getStaffList().filter(st=>["sales","admin"].includes(st.role));
                    const tasks=getTasks();
                    tasks.push({ id:Date.now().toString(), title:`متابعة ${s.name}`, studentEmail:s.email, assignedTo:salesStaff[0]?.email||"", priority:"high", dueDate:"", done:false, createdAt:new Date().toISOString() });
                    saveTasks(tasks);
                    alert(`✅ تم إضافة مهمة متابعة لـ ${salesStaff[0]?.name||"السيلز"}`);
                  }}>📋 مهمة</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Student Detail Tab ───────────────────────────────────────────────────────
function StudentDetailTab({ student: initStudent, staffInfo, myRole, notes, setNotes, handleReplyUpload, handleStatusChange, advanceStatus, handleNotesSave, downloadFile, updateProfile, showSaved, S }) {
  const isSales = myRole === "sales";
  const STATUS_STEPS = ["تم التسجيل","تم الدفع","تم استلام الملف","جاري التحضير","اكتمل الملف"];
  const [student, setStudent] = useState(initStudent);
  const [editAnswers, setEditAnswers] = useState({}); // { sectionId: { qIdx: text } }
  useEffect(() => { setStudent(initStudent); }, [initStudent?.email]);

  const mlRef = useRef(); const r1Ref = useRef(); const r2Ref = useRef();
  const cvRef = useRef(); const resRef = useRef();
  const fileReplyRefs = { motivationLetter:mlRef, recommendation1:r1Ref, recommendation2:r2Ref, cv:cvRef, research:resRef };

  if (!student) return null;

  // رفع رد الموظف مع تحديث local state فوراً
  const handleLocalReplyUpload = (section) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      handleReplyUpload(section)(e);
      setStudent(prev => ({
        ...prev,
        [section]: { ...prev[section], staffReply: ev.target.result, staffReplyName: file.name }
      }));
    };
    reader.readAsDataURL(file);
  };

  // تأكيد الدفع مع تحديث local state
  const handleConfirmPayment = () => {
    updateProfile(student.email, { paymentConfirmed: true });
    advanceStatus(student.email, "تم الدفع");
    setStudent(prev => ({ ...prev, paymentConfirmed: true }));
    showSaved();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ ...S.card,display:"flex",alignItems:"center",gap:14,marginBottom:14 }}>
        <div style={{ width:50,height:50,borderRadius:"50%",background:"#C8932B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#13213B",flexShrink:0,overflow:"hidden" }}>
          {student.photo ? <img src={student.photo} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="" /> : student.name?.[0]||"؟"}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800,fontSize:16 }}>{student.name}</div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:1 }}>{student.email}{student.phone&&` · ${student.phone}`}{student.country&&` · ${student.country}`}</div>
          {student.scholarship && <div style={{ fontSize:12,color:"#C8932B",marginTop:2 }}>🎓 {student.scholarship}</div>}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div>
            <label style={S.label}>الحالة</label>
            <select style={{ ...S.input,width:"auto",cursor:"pointer" }} value={student.status} onChange={e=>handleStatusChange(student.email,e.target.value)}>
              <option value="new">🟠 محتمل جديد</option>
              <option value="potential">🟨 محتمل</option>
              <option value="registered">🔴 مسجل</option>
            </select>
          </div>
          <div>
            <label style={S.label}>السيلز المسؤول</label>
            <select style={{ ...S.input,width:"auto",cursor:"pointer" }} value={student.assignedSales||""} onChange={e=>{ updateProfile(student.email,{assignedSales:e.target.value}); setStudent(p=>({...p,assignedSales:e.target.value})); showSaved(); }}>
              <option value="">— غير محدد —</option>
              {getStaffList().filter(s=>s.role==="sales"||s.role==="admin").map(s=><option key={s.id} value={s.email}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ══ Sales View — فقط للسيلز ══ */}
      {isSales && (
        <SalesClientView student={student} staffInfo={staffInfo} updateProfile={updateProfile} showSaved={showSaved} S={S} />
      )}

      {/* ══ Full View — للمدير والاستشاري ══ */}
      {!isSales && <>

      {/* Payment Confirmation */}
      {student.paymentProof && !student.paymentConfirmed && (
        <div style={{ ...S.card, marginBottom:14, border:"1px solid rgba(200,147,43,0.35)", background:"rgba(200,147,43,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:"#C8932B" }}>💳 إيصال دفع جديد</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginTop:2 }}>
                الطريقة: {student.paymentMethod || "—"} · {student.paymentProofName}
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button style={S.btnOut} onClick={() => downloadFile(student.paymentProof, student.paymentProofName)}>⬇️ عرض الإيصال</button>
              <button style={{ ...S.btn, background:"#2F7B6E", color:"#fff" }} onClick={handleConfirmPayment}>✅ تأكيد الدفع</button>
            </div>
          </div>
          {/* قسم المبلغ */}
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:8 }}>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>💰 المبلغ المدفوع:</span>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <input type="number" placeholder="المبلغ المدفوع" style={{ ...S.input, width:110, padding:"5px 10px", fontSize:12 }}
                  value={student.paidAmount || ""}
                  onChange={e => { updateProfile(student.email, { paidAmount: e.target.value }); setStudent(prev => ({ ...prev, paidAmount: e.target.value })); }} />
                <select style={{ ...S.input, width:80, padding:"5px 8px", fontSize:12, cursor:"pointer" }}
                  value={student.paidCurrency || "EGP"}
                  onChange={e => { updateProfile(student.email, { paidCurrency: e.target.value }); setStudent(prev => ({ ...prev, paidCurrency: e.target.value })); }}>
                  <option value="EGP">ج.م</option>
                  <option value="USD">$</option>
                  <option value="EUR">€</option>
                  <option value="GBP">£</option>
                </select>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>/</span>
                <input type="number" placeholder="المبلغ الكلي" style={{ ...S.input, width:110, padding:"5px 10px", fontSize:12 }}
                  value={student.totalAmount || ""}
                  onChange={e => { updateProfile(student.email, { totalAmount: e.target.value }); setStudent(prev => ({ ...prev, totalAmount: e.target.value })); }} />
                <select style={{ ...S.input, width:80, padding:"5px 8px", fontSize:12, cursor:"pointer" }}
                  value={student.totalCurrency || "EGP"}
                  onChange={e => { updateProfile(student.email, { totalCurrency: e.target.value }); setStudent(prev => ({ ...prev, totalCurrency: e.target.value })); }}>
                  <option value="EGP">ج.م</option>
                  <option value="USD">$</option>
                  <option value="EUR">€</option>
                  <option value="GBP">£</option>
                </select>
                <select style={{ ...S.input, width:"auto", padding:"5px 10px", fontSize:12, cursor:"pointer" }}
                  value={student.paymentStatus || "partial"}
                  onChange={e => { updateProfile(student.email, { paymentStatus: e.target.value }); setStudent(prev => ({ ...prev, paymentStatus: e.target.value })); }}>
                  <option value="partial">دفع جزئي</option>
                  <option value="full">دفع مكتمل ✅</option>
                </select>
              </div>
            </div>
            {/* عرض ملخص الدفع */}
            {student.paidAmount && (
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <span style={{ fontSize:11, color:"#2F7B6E", fontWeight:700 }}>
                  💰 المدفوع: {student.paidAmount} {student.paidCurrency==="USD"?"$":student.paidCurrency==="EUR"?"€":student.paidCurrency==="GBP"?"£":"ج.م"}
                </span>
                {student.totalAmount && (
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>
                    / الكلي: {student.totalAmount} {student.totalCurrency==="USD"?"$":student.totalCurrency==="EUR"?"€":student.totalCurrency==="GBP"?"£":"ج.م"}
                  </span>
                )}
                <span style={{ fontSize:11, padding:"1px 7px", borderRadius:99, fontWeight:700,
                  background:student.paymentStatus==="full"?"rgba(47,123,110,0.15)":"rgba(200,147,43,0.15)",
                  color:student.paymentStatus==="full"?"#2F7B6E":"#C8932B" }}>
                  {student.paymentStatus==="full"?"✅ مكتمل":"⚠️ جزئي"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {student.paymentConfirmed && (
        <div style={{ ...S.card, marginBottom:14, border:"1px solid rgba(47,123,110,0.2)", background:"rgba(47,123,110,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: student.paidAmount ? 10 : 0 }}>
            <span style={{ fontSize:18 }}>✅</span>
            <span style={{ fontSize:12.5, color:"#2F7B6E", fontWeight:700 }}>تم تأكيد الدفع</span>
            {student.paymentMethod && <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>عبر {student.paymentMethod}</span>}
            {student.paymentProof && (
              <button style={{ ...S.btnOut, fontSize:11, padding:"4px 10px", marginRight:"auto" }}
                onClick={() => downloadFile(student.paymentProof, student.paymentProofName)}>
                ⬇️ تحميل الإيصال
              </button>
            )}
          </div>
          {/* تفاصيل المبلغ بعد التأكيد */}
          {(student.paidAmount || student.totalAmount) && (
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:10, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>💰 المدفوع:</span>
              <span style={{ fontSize:13, fontWeight:700, color: student.paymentStatus==="full" ? "#2F7B6E" : "#C8932B" }}>
                {student.paidAmount || "—"} {student.paidCurrency==="USD"?"$":student.paidCurrency==="EUR"?"€":student.paidCurrency==="GBP"?"£":"ج.م"}
              </span>
              {student.totalAmount && (
                <>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>/</span>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>الكلي: <strong style={{ color:"#E8E4DA" }}>{student.totalAmount} {student.totalCurrency==="USD"?"$":student.totalCurrency==="EUR"?"€":student.totalCurrency==="GBP"?"£":"ج.م"}</strong></span>
                </>
              )}
              <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, fontWeight:700,
                background: student.paymentStatus==="full" ? "rgba(47,123,110,0.15)" : "rgba(200,147,43,0.15)",
                color: student.paymentStatus==="full" ? "#2F7B6E" : "#C8932B" }}>
                {student.paymentStatus === "full" ? "✅ مكتمل" : "⚠️ جزئي"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div style={{ ...S.card,marginBottom:14 }}>
        <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>📊 تقدم الطلب <span style={{ fontSize:11,fontWeight:400,color:"rgba(255,255,255,0.4)",marginRight:6 }}>انقر لتفعيل مرحلة</span></div>
        <div style={{ display:"flex",alignItems:"flex-start" }}>
          {STATUS_STEPS.map((step,i)=>{
            const done =
              (step==="تم التسجيل") ||
              (step==="تم الدفع" && student.paymentConfirmed) ||
              (student.statusHistory||[]).some(s=>s.label===step&&s.done);
            const handleStep = () => {
              advanceStatus(student.email, step);
              // تحديث local state فوراً
              const newHistory = [...(student.statusHistory||[])];
              const existing = newHistory.findIndex(s=>s.label===step);
              if (existing >= 0) newHistory[existing] = { ...newHistory[existing], done:true, date:new Date().toISOString() };
              else newHistory.push({ label:step, done:true, date:new Date().toISOString() });
              setStudent(prev => ({ ...prev, statusHistory: newHistory }));
            };
            return (
              <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative" }}>
                {i<STATUS_STEPS.length-1 && (
                  <div style={{ position:"absolute",top:11,right:"50%",width:"100%",height:2,background:done?"#2F7B6E":"rgba(255,255,255,0.08)",zIndex:0 }} />
                )}
                <div onClick={handleStep} style={{ width:26,height:26,borderRadius:"50%",background:done?"#2F7B6E":"#162035",border:`2px solid ${done?"#2F7B6E":"rgba(255,255,255,0.15)"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:1,position:"relative",flexShrink:0,transition:".2s" }}>
                  {done && <span style={{ fontSize:13,color:"#fff" }}>✓</span>}
                </div>
                <div style={{ fontSize:9,marginTop:5,textAlign:"center",color:done?"#E8E4DA":"rgba(255,255,255,0.25)",fontWeight:600,maxWidth:65,lineHeight:1.4 }}>{step}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scholarship Files */}
      {true && (
        <div style={{ ...S.card,marginBottom:14 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
            <div style={{ fontWeight:700,fontSize:13 }}>📁 ملفات المنحة — {student.scholarship}</div>
            <div style={{ display:"flex",gap:6 }}>
              {/* زر تحميل كل الإجابات في ملف Word واحد */}
              {Object.values(SECTION_LABELS).length > 0 && (() => {
                const QUESTIONS = {
                  motivationLetter: ["ما هي دوافعك الرئيسية للتقديم على هذه المنحة؟","ما هي أهدافك الأكاديمية والمهنية؟","كيف ستستفيد من هذه المنحة في خدمة مجتمعك؟","ما هي إنجازاتك الأكاديمية البارزة؟","لماذا اخترت هذا التخصص والبلد تحديداً؟"],
                  recommendation1:  ["اسم المُزكي ودرجته العلمية ومؤسسته","طبيعة علاقتك بالمُزكي وكم سنة تعرفه؟","في أي مادة أو مشروع أشرف عليك؟","ما هي أبرز صفاتك التي يمكنه التحدث عنها؟"],
                  recommendation2:  ["اسم المُزكي الثاني ودرجته العلمية ومؤسسته","طبيعة علاقتك بهذا المُزكي","في أي مجال يعرفك هذا المُزكي؟","ما هي أبرز صفاتك التي يمكنه التحدث عنها؟"],
                  cv:               ["المؤهل الدراسي الأخير والمعدل التراكمي","خبراتك العملية والتطوعية","المهارات اللغوية (اللغات ومستوياتها)","الجوائز والشهادات والإنجازات","الأنشطة خارج المنهج والاهتمامات"],
                };
                const exportAll = async () => {
                  const paras = [
                    new Paragraph({ children:[new TextRun({ text:`ملف ${student.name} الكامل`, bold:true, size:32, rightToLeft:true })], alignment:AlignmentType.RIGHT }),
                    new Paragraph({ children:[new TextRun({ text:`المنحة: ${student.scholarship||"—"}`, rightToLeft:true })], alignment:AlignmentType.RIGHT }),
                    new Paragraph({ text:"" }),
                  ];
                  Object.entries(SECTION_LABELS).forEach(([id,label]) => {
                    const sec = student[id];
                    const answers = editAnswers[id] ? { ...sec?.answers, ...editAnswers[id] } : sec?.answers;
                    if (!answers || Object.keys(answers).filter(k=>answers[k]).length === 0) return;
                    const qs = QUESTIONS[id]||[];
                    paras.push(new Paragraph({ children:[new TextRun({ text:`── ${label} ──`, bold:true, size:28, rightToLeft:true })], alignment:AlignmentType.RIGHT }));
                    paras.push(new Paragraph({ text:"" }));
                    Object.entries(answers).filter(([,v])=>v).forEach(([idx,ans]) => {
                      paras.push(new Paragraph({ children:[new TextRun({ text:`س${+idx+1}: ${qs[+idx]||""}`, bold:true, rightToLeft:true })], alignment:AlignmentType.RIGHT }));
                      paras.push(new Paragraph({ children:[new TextRun({ text:`ج: ${ans}`, rightToLeft:true })], alignment:AlignmentType.RIGHT }));
                      paras.push(new Paragraph({ text:"" }));
                    });
                    paras.push(new Paragraph({ text:"" }));
                  });
                  const doc = new Document({ sections:[{ properties:{}, children:paras }] });
                  const blob = await Packer.toBlob(doc);
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `${student.name}_كل_الإجابات.docx`;
                  a.click();
                };
                return (
                  <button style={{ ...S.btnGreen,fontSize:11,padding:"6px 12px" }} onClick={exportAll}>
                    📄 تحميل كل الإجابات (Word)
                  </button>
                );
              })()}
              {/* زر حفظ التعديلات على الإجابات */}
              {Object.keys(editAnswers).length > 0 && (
                <button style={{ ...S.btn,fontSize:11,padding:"6px 12px" }} onClick={() => {
                  // حفظ الإجابات المعدلة في localStorage
                  Object.entries(editAnswers).forEach(([sectionId, answers]) => {
                    const cur = JSON.parse(localStorage.getItem("masar_students")||"{}");
                    if (cur[student.email]?.[sectionId]) {
                      cur[student.email][sectionId].answers = { ...cur[student.email][sectionId].answers, ...answers };
                      localStorage.setItem("masar_students", JSON.stringify(cur));
                    }
                  });
                  setStudent(prev => {
                    const updated = { ...prev };
                    Object.entries(editAnswers).forEach(([sectionId, answers]) => {
                      updated[sectionId] = { ...updated[sectionId], answers: { ...updated[sectionId]?.answers, ...answers } };
                    });
                    return updated;
                  });
                  setEditAnswers({});
                  showSaved();
                }}>
                  💾 حفظ التعديلات
                </button>
              )}
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {Object.entries(SECTION_LABELS).map(([id,label])=>{
              const sec = student[id];
              const hasAnswers = Object.keys(sec?.answers||{}).filter(k=>sec.answers[k]).length > 0;
              const hasUpload  = !!sec?.uploadedDoc;
              const hasReply   = !!sec?.staffReply;
              return (
                <div key={id} style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:12 }}>
                  <div style={{ fontWeight:700,fontSize:12.5,marginBottom:8 }}>{SECTION_ICONS[id]} {label}</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:4,marginBottom:10 }}>
                    <div style={{ fontSize:11,color:hasAnswers?"#2F7B6E":"rgba(255,255,255,0.25)" }}>{hasAnswers?"✓":"○"} إجابات ({Object.keys(sec?.answers||{}).filter(k=>sec?.answers[k]).length} سؤال)</div>
                    <div style={{ fontSize:11,color:hasUpload?"#2F7B6E":"rgba(255,255,255,0.25)" }}>{hasUpload?"✓":"○"} ملف مرفوع {hasUpload&&`(${sec.uploadedDocName})`}</div>
                    <div style={{ fontSize:11,color:hasReply?"#C8932B":"rgba(255,255,255,0.25)" }}>{hasReply?"✓":"○"} رد الموظف {hasReply&&`(${sec.staffReplyName})`}</div>
                  </div>
                  {hasAnswers && (
                    <details style={{ marginBottom:8 }} open>
                      <summary style={{ fontSize:11,color:"rgba(255,255,255,0.4)",cursor:"pointer",marginBottom:6 }}>📝 إجابات الطالب (قابلة للتعديل)</summary>
                      <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                        {Object.entries(sec.answers).filter(([,v])=>v).map(([idx,ans])=>(
                          <div key={idx}>
                            <div style={{ fontSize:10.5,color:"rgba(255,255,255,0.4)",marginBottom:2 }}>س{+idx+1}</div>
                            <textarea
                              style={{ ...S.textarea, fontSize:11.5, minHeight:50 }}
                              value={editAnswers[id]?.[idx] ?? ans}
                              onChange={e => setEditAnswers(prev => ({
                                ...prev,
                                [id]: { ...prev[id], [idx]: e.target.value }
                              }))}
                            />
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {/* زر تحميل الإجابات كـ Word */}
                  {hasAnswers && (() => {
                    const QUESTIONS = {
                      motivationLetter: ["ما هي دوافعك الرئيسية للتقديم على هذه المنحة؟","ما هي أهدافك الأكاديمية والمهنية؟","كيف ستستفيد من هذه المنحة في خدمة مجتمعك؟","ما هي إنجازاتك الأكاديمية البارزة؟","لماذا اخترت هذا التخصص والبلد تحديداً؟"],
                      recommendation1:  ["اسم المُزكي ودرجته العلمية ومؤسسته","طبيعة علاقتك بالمُزكي وكم سنة تعرفه؟","في أي مادة أو مشروع أشرف عليك؟","ما هي أبرز صفاتك التي يمكنه التحدث عنها؟"],
                      recommendation2:  ["اسم المُزكي الثاني ودرجته العلمية ومؤسسته","طبيعة علاقتك بهذا المُزكي","في أي مجال يعرفك هذا المُزكي؟","ما هي أبرز صفاتك التي يمكنه التحدث عنها؟"],
                      cv:               ["المؤهل الدراسي الأخير والمعدل التراكمي","خبراتك العملية والتطوعية","المهارات اللغوية (اللغات ومستوياتها)","الجوائز والشهادات والإنجازات","الأنشطة خارج المنهج والاهتمامات"],
                    };
                    const exportWord = async () => {
                      const qs = QUESTIONS[id] || [];
                      // استخدام الإجابات المعدلة لو موجودة
                      const finalAnswers = editAnswers[id] ? { ...sec.answers, ...editAnswers[id] } : sec.answers;
                      const paras = [
                        new Paragraph({ text: `${label} - ${student.name}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.RIGHT }),
                        new Paragraph({ text: `المنحة: ${student.scholarship || "—"}`, alignment: AlignmentType.RIGHT }),
                        new Paragraph({ text: "" }),
                      ];
                      Object.entries(finalAnswers||{}).filter(([,v])=>v).forEach(([idx,ans]) => {
                        paras.push(new Paragraph({ children:[new TextRun({ text: `س${+idx+1}: ${qs[+idx]||""}`, bold:true, rightToLeft:true })], alignment: AlignmentType.RIGHT }));
                        paras.push(new Paragraph({ children:[new TextRun({ text: `ج: ${ans}`, rightToLeft:true })], alignment: AlignmentType.RIGHT }));
                        paras.push(new Paragraph({ text: "" }));
                      });
                      const doc = new Document({ sections:[{ properties:{}, children: paras }] });
                      const blob = await Packer.toBlob(doc);
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = `${student.name}_${label}.docx`;
                      a.click();
                    };
                    return (
                      <button style={{ ...S.btnOut,fontSize:11,padding:"5px 10px",marginBottom:6,width:"100%",justifyContent:"center" }} onClick={exportWord}>
                        📝 تحميل كـ Word (.docx)
                      </button>
                    );
                  })()}
                  {hasUpload && <button style={{ ...S.btnOut,fontSize:11,padding:"4px 10px",marginBottom:6,width:"100%" }} onClick={()=>downloadFile(sec.uploadedDoc,sec.uploadedDocName)}>⬇️ ورقة الطالب</button>}
                  <input type="file" ref={fileReplyRefs[id]} style={{ display:"none" }} accept=".pdf,.doc,.docx" onChange={handleLocalReplyUpload(id)} />
                  <button style={{ ...S.btn,width:"100%",justifyContent:"center",fontSize:11,padding:"6px" }} onClick={()=>fileReplyRefs[id].current?.click()}>
                    {hasReply?"🔄 تحديث الرد":"📤 رفع الرد"}
                  </button>
                  {hasReply && <button style={{ ...S.btnGreen,width:"100%",justifyContent:"center",fontSize:11,padding:"5px",marginTop:4 }} onClick={()=>downloadFile(sec.staffReply,sec.staffReplyName)}>⬇️ {sec.staffReplyName}</button>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Research */}
      {student.research?.uploadedDoc && (
        <div style={{ ...S.card,marginBottom:14 }}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>🔬 بحث / ترجمة</div>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            <button style={S.btnOut} onClick={()=>downloadFile(student.research.uploadedDoc,student.research.uploadedDocName)}>⬇️ {student.research.uploadedDocName}</button>
            <input type="file" ref={fileReplyRefs.research} style={{ display:"none" }} accept=".pdf,.doc,.docx" onChange={handleLocalReplyUpload("research")} />
            <button style={S.btn} onClick={()=>fileReplyRefs.research.current?.click()}>{student.research.staffReply?"🔄 تحديث":"📤 رفع الرد"}</button>
            {student.research.staffReply && <button style={S.btnGreen} onClick={()=>downloadFile(student.research.staffReply,student.research.staffReplyName)}>⬇️ {student.research.staffReplyName}</button>}
          </div>
        </div>
      )}

      {/* تاريخ العميل */}
      {!isSales && <div style={{ ...S.card, marginBottom:14 }}>
        <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>📋 تاريخ العميل</div>
        {/* إضافة تعليق جديد */}
        <div style={{ marginBottom:12 }}>
          <textarea style={{ ...S.textarea, minHeight:60 }} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="أضف ملاحظة أو تعليق على العميل..." rows={2} />
          <div style={{ display:"flex",justifyContent:"flex-end",marginTop:6 }}>
            <button style={S.btn} onClick={() => {
              if (!notes.trim()) return;
              handleNotesSave();
            }}>💾 حفظ التعليق</button>
          </div>
        </div>
        {/* سجل التعليقات */}
        {(student.noteHistory||[]).length > 0 ? (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {[...( student.noteHistory||[])].reverse().map((note,i) => (
              <div key={i} style={{ padding:"10px 12px",borderRadius:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:11,fontWeight:700,color: ROLES[note.role]?.color||"#C8932B" }}>{note.staffName}</span>
                  <span style={{ fontSize:10.5,color:"rgba(255,255,255,0.35)" }}>{new Date(note.date).toLocaleDateString("ar-EG")} {new Date(note.date).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}</span>
                </div>
                <div style={{ fontSize:12.5,color:"#E8E4DA",lineHeight:1.6 }}>{note.text}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign:"center",color:"rgba(255,255,255,0.3)",fontSize:12,padding:"12px 0" }}>لا توجد تعليقات بعد</div>
        )}
      </div>}
      </>}
    </div>
  );
}

// ─── Sales Client View ────────────────────────────────────────────────────────
function SalesClientView({ student, staffInfo, updateProfile, showSaved, S }) {
  const [newNote, setNewNote]     = useState("");
  const [remForm, setRemForm]     = useState({ title:"", date:"", type:"مكالمة" });
  const [reminders, setReminders] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`masar_rem_${student.email}`)||"[]"); }
    catch { return []; }
  });

  const saveRem = (list) => { setReminders(list); localStorage.setItem(`masar_rem_${student.email}`, JSON.stringify(list)); };

  const addNote = () => {
    if (!newNote.trim()) return;
    const note = { text:newNote, staffName:staffInfo?.name||"سيلز", role:"sales", date:new Date().toISOString() };
    const history = [...(student.noteHistory||[]), note];
    updateProfile(student.email, { noteHistory:history });
    setNewNote(""); showSaved();
  };

  const addRem = () => {
    if (!remForm.title||!remForm.date) { alert("يرجى تحديد العنوان والتاريخ"); return; }
    saveRem([...reminders, { ...remForm, id:Date.now().toString(), done:false }]);
    setRemForm({ title:"", date:"", type:"مكالمة" });
  };

  return (
    <div>
      {/* معلومات العميل */}
      <div style={{ ...S.card, marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:46,height:46,borderRadius:"50%",background:"#C8932B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#13213B",flexShrink:0,overflow:"hidden" }}>
            {student.photo?<img src={student.photo} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="" />:student.name?.[0]||"؟"}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800,fontSize:15 }}>{student.name}</div>
            <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:2 }}>{student.email} · {student.phone||"لا يوجد رقم"}</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:1 }}>{student.country||""} {student.serviceType?`· ${student.serviceType}`:""}</div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            <select style={{ ...S.input,width:"auto",padding:"5px 10px",fontSize:11.5,cursor:"pointer" }} value={student.status} onChange={e=>{ updateProfile(student.email,{status:e.target.value}); showSaved(); }}>
              <option value="new">🟠 محتمل جديد</option>
              <option value="potential">🟨 محتمل</option>
              <option value="registered">🔴 مسجل</option>
            </select>
            {student.phone&&<a href={`https://wa.me/${student.phone.replace(/[^0-9+]/g,"")}`} target="_blank" rel="noreferrer" style={{ ...S.btnGreen,padding:"5px 12px",fontSize:11,textDecoration:"none",textAlign:"center" }}>📱 واتساب</a>}
          </div>
        </div>
      </div>

      {/* التذكيرات */}
      <div style={{ ...S.card, marginBottom:12 }}>
        <div style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>⏰ التذكيرات والمتابعة</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr auto auto",gap:8,marginBottom:10,alignItems:"end" }}>
          <div>
            <label style={S.label}>العنوان</label>
            <input style={S.input} value={remForm.title} onChange={e=>setRemForm(f=>({...f,title:e.target.value}))} placeholder="مثال: مكالمة متابعة" />
          </div>
          <div>
            <label style={S.label}>التاريخ والوقت</label>
            <input type="datetime-local" style={S.input} value={remForm.date} onChange={e=>setRemForm(f=>({...f,date:e.target.value}))} />
          </div>
          <div>
            <label style={S.label}>النوع</label>
            <select style={{ ...S.input,cursor:"pointer" }} value={remForm.type} onChange={e=>setRemForm(f=>({...f,type:e.target.value}))}>
              {["مكالمة","واتساب","متابعة","اجتماع"].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ paddingTop:18 }}><button style={S.btn} onClick={addRem}>+ إضافة</button></div>
        </div>
        {reminders.length===0 ? (
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",textAlign:"center",padding:"10px 0" }}>لا توجد تذكيرات — أضف تذكيراً للمتابعة مع العميل</div>
        ) : reminders.map(r=>(
          <div key={r.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <input type="checkbox" checked={r.done} onChange={()=>saveRem(reminders.map(x=>x.id===r.id?{...x,done:!x.done}:x))} style={{ cursor:"pointer" }} />
            <div style={{ flex:1,opacity:r.done?0.5:1 }}>
              <span style={{ fontSize:12.5,fontWeight:700,textDecoration:r.done?"line-through":"none" }}>{r.title}</span>
              <span style={{ fontSize:11,color:"rgba(255,255,255,0.4)",marginRight:8 }}>· {r.type}</span>
              {r.date&&<span style={{ fontSize:11,color:new Date(r.date)<new Date()&&!r.done?"#e84545":"rgba(255,255,255,0.35)" }}>📅 {new Date(r.date).toLocaleDateString("ar-EG")} {new Date(r.date).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}</span>}
            </div>
            <button onClick={()=>saveRem(reminders.filter(x=>x.id!==r.id))} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",fontSize:13 }}>🗑️</button>
          </div>
        ))}
      </div>

      {/* الصفقات المغلقة */}
      <DealsSection student={student} staffInfo={staffInfo} updateProfile={updateProfile} showSaved={showSaved} S={S} />

      {/* ملاحظات المتابعة */}
      <div style={S.card}>
        <div style={{ fontWeight:700,fontSize:13,marginBottom:10 }}>📝 ملاحظات المتابعة</div>
        <textarea style={{ ...S.textarea,minHeight:70 }} value={newNote} onChange={e=>setNewNote(e.target.value)} placeholder="أضف ملاحظة عن هذا العميل..." rows={3} />
        <div style={{ display:"flex",justifyContent:"flex-end",marginTop:8 }}>
          <button style={S.btn} onClick={addNote}>💾 حفظ</button>
        </div>
        {(student.noteHistory||[]).filter(n=>n.role==="sales").length > 0 && (
          <div style={{ marginTop:12,borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:12 }}>
            {[...(student.noteHistory||[])].filter(n=>n.role==="sales").reverse().slice(0,5).map((note,i)=>(
              <div key={i} style={{ padding:"8px 10px",borderRadius:7,background:"rgba(255,255,255,0.03)",marginBottom:5 }}>
                <div style={{ fontSize:12.5,lineHeight:1.6 }}>{note.text}</div>
                <div style={{ fontSize:10.5,color:"rgba(255,255,255,0.35)",marginTop:3 }}>{note.staffName} · {new Date(note.date).toLocaleDateString("ar-EG")}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Deals Section ───────────────────────────────────────────────────────────
function DealsSection({ student, staffInfo, updateProfile, showSaved, S }) {
  const [form, setForm]   = useState({ title:"", amount:"", status:"open", note:"" });
  const [show, setShow]   = useState(false);
  const deals             = student.deals || [];

  const addDeal = () => {
    if (!form.title) return;
    const deal = { ...form, id:Date.now().toString(), date:new Date().toISOString(), staffName:staffInfo?.name||"سيلز" };
    updateProfile(student.email, { deals:[...deals, deal] });
    setForm({ title:"", amount:"", status:"open", note:"" });
    showSaved();
  };

  const STATUS = { open:{ label:"مفتوحة", color:"#C8932B" }, won:{ label:"✅ مغلقة - ربح", color:"#2F7B6E" }, lost:{ label:"❌ خسرت", color:"#e84545" } };

  return (
    <div style={{ ...S.card, marginBottom:12 }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
        <div style={{ fontWeight:700,fontSize:13 }}>💼 الصفقات</div>
        <button style={{ ...S.btnOut,padding:"4px 10px",fontSize:11 }} onClick={()=>setShow(s=>!s)}>+ صفقة جديدة</button>
      </div>
      {show && (
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:8,marginBottom:12,alignItems:"end" }}>
          <div>
            <label style={S.label}>عنوان الصفقة</label>
            <input style={S.input} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="مثال: تقديم على منحة فولبرايت" />
          </div>
          <div>
            <label style={S.label}>المبلغ (اختياري)</label>
            <input type="number" style={S.input} value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0" />
          </div>
          <div>
            <label style={S.label}>الحالة</label>
            <select style={{ ...S.input,cursor:"pointer" }} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              <option value="open">مفتوحة</option>
              <option value="won">✅ ربح</option>
              <option value="lost">❌ خسرت</option>
            </select>
          </div>
          <div style={{ gridColumn:"1/-1",display:"flex",gap:8,alignItems:"end" }}>
            <div style={{ flex:1 }}>
              <label style={S.label}>ملاحظة</label>
              <input style={S.input} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="ملاحظة اختيارية..." />
            </div>
            <button style={S.btn} onClick={addDeal}>💾 حفظ</button>
          </div>
        </div>
      )}
      {deals.length===0 ? (
        <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",textAlign:"center",padding:"8px 0" }}>لا توجد صفقات بعد</div>
      ) : deals.map(d=>(
        <div key={d.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ flex:1 }}>
            <span style={{ fontSize:12.5,fontWeight:700 }}>{d.title}</span>
            {d.amount&&<span style={{ fontSize:11.5,color:"#2F7B6E",fontWeight:700,marginRight:8 }}>{parseFloat(d.amount).toLocaleString()} ج</span>}
            {d.note&&<div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>{d.note}</div>}
          </div>
          <span style={{ fontSize:11,padding:"2px 8px",borderRadius:99,background:`${STATUS[d.status]?.color}20`,color:STATUS[d.status]?.color,fontWeight:700 }}>{STATUS[d.status]?.label}</span>
          <span style={{ fontSize:10.5,color:"rgba(255,255,255,0.3)" }}>{new Date(d.date).toLocaleDateString("ar-EG")}</span>
          <button onClick={()=>{ const updated=deals.map(x=>x.id===d.id?{...x,status:x.status==="won"?"open":"won"}:x); updateProfile(student.email,{deals:updated}); showSaved(); }} style={{ background:"none",border:"none",cursor:"pointer",fontSize:13 }}>
            {d.status==="won"?"↩️":"✅"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────
function TasksTab({ staffInfo, allStudents, S }) {
  const [tasks, setTasks]   = useState(() => getTasks());
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ title:"", studentEmail:"", assignedTo:"", priority:"medium", dueDate:"", done:false });
  const staff = getStaffList();

  const saveAndUpdate = (list) => { saveTasks(list); setTasks(list); };

  const handleAdd = () => {
    if (!form.title) { alert("عنوان المهمة مطلوب"); return; }
    saveAndUpdate([...tasks, { ...form, id:Date.now().toString(), createdAt:new Date().toISOString() }]);
    setModal(false); setForm({ title:"",studentEmail:"",assignedTo:"",priority:"medium",dueDate:"",done:false });
    addActivity(`مهمة جديدة: "${form.title}"`, staffInfo?.name);
  };

  const toggleDone = (id) => {
    saveAndUpdate(tasks.map(t => t.id===id ? { ...t,done:!t.done } : t));
  };

  const deleteTask = (id) => saveAndUpdate(tasks.filter(t=>t.id!==id));

  const PRIORITY = { high:{ label:"عالية",color:"#e84545" }, medium:{ label:"متوسطة",color:"#C8932B" }, low:{ label:"منخفضة",color:"#2F7B6E" } };

  const myTasks    = tasks.filter(t => !t.done && (!t.assignedTo || t.assignedTo===staffInfo?.email));
  const doneTasks  = tasks.filter(t => t.done);
  const overdue    = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());

  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
        <span style={{ fontWeight:800,fontSize:14 }}>✅ المهام ({myTasks.length} نشطة{overdue.length>0?`, ${overdue.length} متأخرة`:""})</span>
        <button style={S.btn} onClick={()=>setModal(true)}><i className="ti ti-plus" style={{ fontSize:13 }} /> مهمة جديدة</button>
      </div>

      {/* Active Tasks */}
      {myTasks.length === 0 ? (
        <div style={{ ...S.card,textAlign:"center",padding:32,color:"rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize:28,marginBottom:6 }}>✅</div>
          <div>لا توجد مهام معلقة</div>
        </div>
      ) : myTasks.map(t => {
        const isOverdue = t.dueDate && new Date(t.dueDate) < new Date();
        const student = allStudents.find(s=>s.email===t.studentEmail);
        return (
          <div key={t.id} style={{ ...S.card,borderColor:isOverdue?"rgba(232,69,69,0.3)":undefined,background:isOverdue?"rgba(232,69,69,0.04)":undefined }}>
            <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
              <input type="checkbox" checked={t.done} onChange={()=>toggleDone(t.id)} style={{ marginTop:3,cursor:"pointer",width:15,height:15 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:13 }}>{t.title}</div>
                <div style={{ display:"flex",gap:8,marginTop:4,flexWrap:"wrap" }}>
                  <span style={{ fontSize:10.5,padding:"2px 7px",borderRadius:99,background:PRIORITY[t.priority]?.color+"22",color:PRIORITY[t.priority]?.color,fontWeight:700 }}>{PRIORITY[t.priority]?.label}</span>
                  {student && <span style={{ fontSize:10.5,color:"rgba(255,255,255,0.4)" }}>👤 {student.name}</span>}
                  {t.dueDate && <span style={{ fontSize:10.5,color:isOverdue?"#e84545":"rgba(255,255,255,0.4)" }}>📅 {new Date(t.dueDate).toLocaleDateString("ar-EG")}{isOverdue?" (متأخرة)":""}</span>}
                  {t.assignedTo && <span style={{ fontSize:10.5,color:"rgba(255,255,255,0.4)" }}>👤 {staff.find(s=>s.email===t.assignedTo)?.name||t.assignedTo}</span>}
                </div>
              </div>
              <button onClick={()=>deleteTask(t.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.25)",fontSize:14 }}>🗑️</button>
            </div>
          </div>
        );
      })}

      {/* Done */}
      {doneTasks.length > 0 && (
        <details style={{ marginTop:8 }}>
          <summary style={{ cursor:"pointer",fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:8 }}>✅ المهام المنجزة ({doneTasks.length})</summary>
          {doneTasks.map(t=>(
            <div key={t.id} style={{ ...S.card,opacity:.5,display:"flex",alignItems:"center",gap:10 }}>
              <input type="checkbox" checked onChange={()=>toggleDone(t.id)} style={{ cursor:"pointer" }} />
              <span style={{ fontSize:12.5,textDecoration:"line-through",flex:1 }}>{t.title}</span>
              <button onClick={()=>deleteTask(t.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.25)",fontSize:13 }}>🗑️</button>
            </div>
          ))}
        </details>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99 }} onClick={()=>setModal(false)}>
          <div style={{ background:"#162035",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:22,width:400,maxWidth:"92%" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:800,fontSize:15,marginBottom:14 }}>مهمة جديدة</div>
            {[["عنوان المهمة *","title","text"],["تاريخ الاستحقاق","dueDate","date"]].map(([label,field,type])=>(
              <div key={field} style={{ marginBottom:10 }}>
                <label style={S.label}>{label}</label>
                <input type={type} style={S.input} value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} />
              </div>
            ))}
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>الطالب (اختياري)</label>
              <select style={{ ...S.input,cursor:"pointer" }} value={form.studentEmail} onChange={e=>setForm(f=>({...f,studentEmail:e.target.value}))}>
                <option value="">— بدون طالب —</option>
                {allStudents.map(s=><option key={s.email} value={s.email}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>تعيين لـ</label>
              <select style={{ ...S.input,cursor:"pointer" }} value={form.assignedTo} onChange={e=>setForm(f=>({...f,assignedTo:e.target.value}))}>
                <option value="">— نفسي —</option>
                {staff.map(s=><option key={s.id} value={s.email}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={S.label}>الأولوية</label>
              <select style={{ ...S.input,cursor:"pointer" }} value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                <option value="high">🔴 عالية</option>
                <option value="medium">🟡 متوسطة</option>
                <option value="low">🟢 منخفضة</option>
              </select>
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button style={S.btnOut} onClick={()=>setModal(false)}>إلغاء</button>
              <button style={S.btn} onClick={handleAdd}>إضافة المهمة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab({ allStudents, S }) {
  const byMonth = {};
  allStudents.forEach(s => {
    const m = new Date(s.createdAt).toLocaleDateString("ar-EG",{month:"short",year:"numeric"});
    byMonth[m] = (byMonth[m]||0)+1;
  });
  const months = Object.entries(byMonth).slice(-6);
  const maxVal = Math.max(...months.map(([,v])=>v),1);

  const byScholarship = {};
  allStudents.forEach(s=>{ if(s.scholarship) byScholarship[s.scholarship]=(byScholarship[s.scholarship]||0)+1; });
  const scholarships = Object.entries(byScholarship).sort((a,b)=>b[1]-a[1]);

  const ratings = allStudents.filter(s=>s.rating).map(s=>s.rating);
  const avgRating = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1) : "—";

  return (
    <div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:16 }}>
        {[
          { label:"إجمالي الطلاب",    num:allStudents.length,                                                    color:"#2F7B6E" },
          { label:"ملفات مكتملة",      num:allStudents.filter(s=>["motivationLetter","cv"].some(k=>s[k]?.staffReply)).length, color:"#C8932B" },
          { label:"تقييمات",           num:ratings.length,                                                        color:"#6B5DD3" },
          { label:"متوسط التقييم",     num:avgRating,                                                             color:"#E8823A" },
        ].map((s,i)=>(
          <div key={i} style={S.card}>
            <div style={{ fontSize:24,fontWeight:800,color:s.color,lineHeight:1 }}>{s.num}</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
        {/* Chart */}
        <div style={S.card}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:16 }}>📈 التسجيلات الشهرية</div>
          {months.length === 0 ? (
            <div style={{ textAlign:"center",color:"rgba(255,255,255,0.3)",padding:24,fontSize:12 }}>لا توجد بيانات</div>
          ) : (
            <div style={{ display:"flex",alignItems:"flex-end",gap:6,height:120 }}>
              {months.map(([month,count])=>(
                <div key={month} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                  <span style={{ fontSize:9.5,color:"rgba(255,255,255,0.4)" }}>{count}</span>
                  <div style={{ width:"100%",background:"#C8932B",borderRadius:"4px 4px 0 0",height:`${(count/maxVal)*100}px`,minHeight:4,transition:".4s" }} />
                  <span style={{ fontSize:9,color:"rgba(255,255,255,0.3)",textAlign:"center" }}>{month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scholarships */}
        <div style={S.card}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>🎓 توزيع المنح</div>
          {scholarships.length === 0 ? (
            <div style={{ textAlign:"center",color:"rgba(255,255,255,0.3)",padding:24,fontSize:12 }}>لا توجد بيانات</div>
          ) : scholarships.map(([name,count],i)=>(
            <div key={name} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}>
              <span style={{ fontSize:12,fontWeight:600,flex:1 }}>{name}</span>
              <div style={{ width:100,height:6,borderRadius:99,background:"rgba(255,255,255,0.07)",overflow:"hidden" }}>
                <div style={{ height:"100%",background:["#C8932B","#2F7B6E","#6B5DD3","#E8823A"][i%4],width:`${(count/allStudents.length)*100}%`,borderRadius:99 }} />
              </div>
              <span style={{ fontSize:11,color:"rgba(255,255,255,0.4)",minWidth:20 }}>{count}</span>
            </div>
          ))}
        </div>

        {/* تقرير المدفوعات */}
        <div style={{ ...S.card,gridColumn:"1/-1" }}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>💰 نظرة سريعة على المدفوعات</div>
          {(() => {
            const paid = allStudents.filter(s=>s.paidAmount);
            const total = paid.reduce((sum,s)=>sum+(parseFloat(s.paidAmount)||0),0);
            const expected = paid.reduce((sum,s)=>sum+(parseFloat(s.totalAmount)||0),0);
            const full = paid.filter(s=>s.paymentStatus==="full").length;
            const partial = paid.filter(s=>s.paymentStatus!=="full").length;
            return (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
                  {[
                    { label:"إجمالي الدخل", val: total.toLocaleString()+" ج", color:"#2F7B6E" },
                    { label:"المتوقع", val: expected.toLocaleString()+" ج", color:"#C8932B" },
                    { label:"مدفوع كامل", val: full+" عميل", color:"#2F7B6E" },
                    { label:"دفع جزئي", val: partial+" عميل", color:"#e84545" },
                  ].map((s,i)=>(
                    <div key={i} style={{ background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px 12px" }}>
                      <div style={{ fontSize:16,fontWeight:800,color:s.color }}>{s.val}</div>
                      <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {paid.slice(0,5).map(s=>(
                  <div key={s.email} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize:12 }}>{s.name}</span>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ fontSize:12,fontWeight:700,color:"#2F7B6E" }}>{s.paidAmount} ج</span>
                      <span style={{ fontSize:10.5,padding:"2px 7px",borderRadius:99,background:s.paymentStatus==="full"?"rgba(47,123,110,0.15)":"rgba(200,147,43,0.15)",color:s.paymentStatus==="full"?"#2F7B6E":"#C8932B" }}>
                        {s.paymentStatus==="full"?"✅ مكتمل":"⚠️ جزئي"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Ratings */}
        <div style={{ ...S.card,gridColumn:"1/-1" }}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>⭐ تقييمات العملاء</div>
          {ratings.length === 0 ? (
            <div style={{ textAlign:"center",color:"rgba(255,255,255,0.3)",padding:16,fontSize:12 }}>لا توجد تقييمات بعد</div>
          ) : (
            <div style={{ display:"flex",gap:16,alignItems:"center",flexWrap:"wrap" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:40,fontWeight:800,color:"#C8932B",lineHeight:1 }}>{avgRating}</div>
                <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:4 }}>من 5</div>
              </div>
              <div style={{ flex:1 }}>
                {[5,4,3,2,1].map(n=>{
                  const count = ratings.filter(r=>r===n).length;
                  return (
                    <div key={n} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}>
                      <span style={{ fontSize:11,color:"rgba(255,255,255,0.5)",minWidth:12 }}>{n}</span>
                      <span style={{ fontSize:12 }}>⭐</span>
                      <div style={{ flex:1,height:6,borderRadius:99,background:"rgba(255,255,255,0.07)",overflow:"hidden" }}>
                        <div style={{ height:"100%",background:"#C8932B",width:ratings.length?`${(count/ratings.length)*100}%`:"0%",borderRadius:99 }} />
                      </div>
                      <span style={{ fontSize:11,color:"rgba(255,255,255,0.4)",minWidth:16 }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Payments Tab ────────────────────────────────────────────────────────────────
// ─── Currency helpers ─────────────────────────────────────────────────────────
const CURRENCIES = [
  { code:"EGP", symbol:"ج.م",  label:"جنيه مصري"      },
  { code:"USD", symbol:"$",    label:"دولار أمريكي"    },
  { code:"EUR", symbol:"€",    label:"يورو"            },
  { code:"GBP", symbol:"£",    label:"جنيه إسترليني"  },
  { code:"SAR", symbol:"ر.س",  label:"ريال سعودي"     },
  { code:"AED", symbol:"د.إ",  label:"درهم إماراتي"   },
  { code:"TRY", symbol:"₺",    label:"ليرة تركية"     },
];
function currSymbol(code) { return CURRENCIES.find(c=>c.code===code)?.symbol || code; }

function PaymentsTab({ allStudents, staffInfo, S }) {
  const { updateProfile } = useStudent();
  const staffList = getStaffList();
  const myRole    = staffList.find(s=>s.email===staffInfo?.email)?.role;

  // السيلز يشوف عملاؤه بس، الأدمن يشوف الكل
  const visibleStudents = myRole==="admin"
    ? allStudents
    : allStudents.filter(s => s.assignedSales===staffInfo?.email || !s.assignedSales);

  const paid = visibleStudents.filter(s => s.paidAmount);

  // ── فلاتر ──
  const consultants = [...new Set(allStudents.map(s=>s.assignedConsultant).filter(Boolean))];
  const [filterConsultant, setFilterConsultant] = useState("all");
  const [filterCurrency,   setFilterCurrency]   = useState("all");
  const [filterStatus,     setFilterStatus]     = useState("all");
  const [search,           setSearch]           = useState("");

  const filtered = paid.filter(s => {
    if (filterConsultant!=="all" && s.assignedConsultant!==filterConsultant) return false;
    if (filterCurrency!=="all"   && (s.paidCurrency||"EGP")!==filterCurrency) return false;
    if (filterStatus!=="all"     && (s.paymentStatus||"partial")!==filterStatus) return false;
    if (search && !s.name?.includes(search) && !s.email?.includes(search)) return false;
    return true;
  });

  // ── modal إضافة دفعة ──
  const [showModal, setShowModal] = useState(false);
  const [payForm,   setPayForm]   = useState({ studentEmail:"", amount:"", currency:"EGP", method:"إيصال", status:"partial", note:"" });
  const [saved,     setSaved]     = useState(false);

  const handleAddPayment = () => {
    if (!payForm.studentEmail || !payForm.amount) { alert("اختر العميل وأدخل المبلغ"); return; }
    const st = allStudents.find(s=>s.email===payForm.studentEmail);
    if (!st) return;
    updateProfile(payForm.studentEmail, {
      paidAmount:          payForm.amount,
      paidCurrency:        payForm.currency,
      paymentMethod:       payForm.method,
      paymentStatus:       payForm.status,
      paymentConfirmed:    true,
      paymentNote:         payForm.note,
      paymentRecordedBy:   staffInfo?.name || staffInfo?.email,
      paymentDate:         new Date().toISOString(),
    });
    addActivity(`تم تسجيل دفعة ${payForm.amount} ${currSymbol(payForm.currency)} للعميل ${st.name}`, staffInfo?.name);
    setSaved(true);
    setTimeout(()=>{ setSaved(false); setShowModal(false); setPayForm({ studentEmail:"", amount:"", currency:"EGP", method:"إيصال", status:"partial", note:"" }); }, 1200);
  };

  // ── إحصائيات حسب عملة ──
  const statsByCurrency = CURRENCIES.map(cur=>({
    ...cur,
    total: paid.filter(s=>(s.paidCurrency||"EGP")===cur.code).reduce((sum,s)=>sum+(parseFloat(s.paidAmount)||0),0),
    count: paid.filter(s=>(s.paidCurrency||"EGP")===cur.code).length,
  })).filter(c=>c.count>0);

  // ── تصدير CSV ──
  const exportCSV = () => {
    const rows = filtered.map(s=>({
      "العميل":           s.name,
      "البريد":           s.email,
      "الاستشاري":       s.assignedConsultant ? staffList.find(st=>st.email===s.assignedConsultant)?.name||s.assignedConsultant : "—",
      "السيلز":          s.assignedSales ? staffList.find(st=>st.email===s.assignedSales)?.name||s.assignedSales : "—",
      "المبلغ المدفوع":  s.paidAmount||"—",
      "العملة":          currSymbol(s.paidCurrency||"EGP")+" "+( s.paidCurrency||"EGP"),
      "المبلغ الكلي":    s.totalAmount||"—",
      "المتبقي":         s.totalAmount?(parseFloat(s.totalAmount)-parseFloat(s.paidAmount||0)):"—",
      "حالة الدفع":      s.paymentStatus==="full"?"مكتمل":"جزئي",
      "طريقة الدفع":     s.paymentMethod||"—",
      "سجّله":           s.paymentRecordedBy||"—",
      "تاريخ الدفع":     s.paymentDate?new Date(s.paymentDate).toLocaleDateString("ar-EG"):new Date(s.createdAt).toLocaleDateString("ar-EG"),
    }));
    const headers = Object.keys(rows[0]||{});
    const csv = [headers.join(","), ...rows.map(r=>headers.map(h=>`"${r[h]}"`).join(","))].join("\n");
    const blob = new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `مدفوعات_مسار_${new Date().toLocaleDateString("ar-EG").replace(/\//g,"-")}.csv`;
    a.click();
  };

  return (
    <div>
      {/* ── إحصائيات حسب عملة ── */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
        {statsByCurrency.length===0 ? (
          <div style={{ ...S.card, flex:1, textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:12, padding:24 }}>لا توجد مدفوعات بعد 💰</div>
        ) : statsByCurrency.map(cur=>(
          <div key={cur.code} style={{ ...S.card, minWidth:130, flex:1 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>{cur.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#C8932B", lineHeight:1 }}>{cur.symbol} {cur.total.toLocaleString()}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:3 }}>{cur.count} عميل</div>
          </div>
        ))}
        <div style={{ ...S.card, minWidth:130, flex:1 }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>إجمالي العملاء</div>
          <div style={{ fontSize:22, fontWeight:800, color:"#6B5DD3", lineHeight:1 }}>{paid.length}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:3 }}>دفعوا</div>
        </div>
      </div>

      {/* ── فلاتر + زرار إضافة ── */}
      <div style={{ ...S.card, display:"flex", flexWrap:"wrap", gap:8, alignItems:"center", marginBottom:12 }}>
        <input style={{ ...S.input, width:160, padding:"6px 10px", fontSize:12 }} placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} />
        {myRole==="admin" && (
          <select style={{ ...S.input, width:"auto", padding:"6px 10px", fontSize:12 }} value={filterConsultant} onChange={e=>setFilterConsultant(e.target.value)}>
            <option value="all">كل الاستشاريين</option>
            {consultants.map(c=><option key={c} value={c}>{staffList.find(s=>s.email===c)?.name||c}</option>)}
          </select>
        )}
        <select style={{ ...S.input, width:"auto", padding:"6px 10px", fontSize:12 }} value={filterCurrency} onChange={e=>setFilterCurrency(e.target.value)}>
          <option value="all">كل العملات</option>
          {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.symbol} {c.label}</option>)}
        </select>
        <select style={{ ...S.input, width:"auto", padding:"6px 10px", fontSize:12 }} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="full">✅ مكتمل</option>
          <option value="partial">⚠️ جزئي</option>
        </select>
        <div style={{ marginRight:"auto", display:"flex", gap:8 }}>
          <button style={S.btnOut} onClick={exportCSV}><i className="ti ti-file-spreadsheet" style={{ fontSize:13 }} /> تصدير CSV</button>
          <button style={S.btn}    onClick={()=>setShowModal(true)}><i className="ti ti-plus" style={{ fontSize:13 }} /> تسجيل دفعة</button>
        </div>
      </div>

      {/* ── جدول ── */}
      <div style={S.card}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <span style={{ fontWeight:700, fontSize:13 }}>💳 سجل المدفوعات</span>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{filtered.length} سجل</span>
        </div>
        {filtered.length===0 ? (
          <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"32px 0", fontSize:12 }}>
            <div style={{ fontSize:28, marginBottom:8 }}>💰</div>لا توجد نتائج
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr>
                  {["العميل","الاستشاري","السيلز","المدفوع","العملة","المتبقي","حالة الدفع","الطريقة","سجّله","التاريخ"].map(h=>(
                    <th key={h} style={{ padding:"8px 10px", textAlign:"right", fontSize:10.5, fontWeight:700, color:"rgba(255,255,255,0.35)", borderBottom:"1px solid rgba(255,255,255,0.07)", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s=>{
                  const rem = s.totalAmount ? parseFloat(s.totalAmount)-parseFloat(s.paidAmount||0) : null;
                  const cur = s.paidCurrency||"EGP";
                  return (
                    <tr key={s.email} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding:"10px" }}>
                        <div style={{ fontWeight:700 }}>{s.name}</div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{s.email}</div>
                      </td>
                      <td style={{ padding:"10px", fontSize:11.5, color:"#2F7B6E", fontWeight:600 }}>
                        {s.assignedConsultant ? staffList.find(st=>st.email===s.assignedConsultant)?.name||s.assignedConsultant : "—"}
                      </td>
                      <td style={{ padding:"10px", fontSize:11.5, color:"#6B5DD3", fontWeight:600 }}>
                        {s.assignedSales ? staffList.find(st=>st.email===s.assignedSales)?.name||s.assignedSales : "—"}
                      </td>
                      <td style={{ padding:"10px", fontWeight:800, color:"#C8932B", fontSize:13 }}>
                        {parseFloat(s.paidAmount||0).toLocaleString()}
                      </td>
                      <td style={{ padding:"10px" }}>
                        <span style={{ padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:700, background:"rgba(200,147,43,0.15)", color:"#C8932B", whiteSpace:"nowrap" }}>
                          {currSymbol(cur)} {cur}
                        </span>
                      </td>
                      <td style={{ padding:"10px", fontWeight:700, color:rem>0?"#e84545":"#2F7B6E", fontSize:12 }}>
                        {rem!==null ? `${rem.toLocaleString()} ${currSymbol(s.totalCurrency||cur)}` : "—"}
                      </td>
                      <td style={{ padding:"10px" }}>
                        <span style={{ padding:"3px 8px", borderRadius:99, fontSize:11, fontWeight:700,
                          background:s.paymentStatus==="full"?"rgba(47,123,110,0.15)":"rgba(200,147,43,0.15)",
                          color:s.paymentStatus==="full"?"#2F7B6E":"#C8932B" }}>
                          {s.paymentStatus==="full"?"✅ مكتمل":"⚠️ جزئي"}
                        </span>
                      </td>
                      <td style={{ padding:"10px", fontSize:11, color:"rgba(255,255,255,0.4)" }}>{s.paymentMethod||"—"}</td>
                      <td style={{ padding:"10px", fontSize:11, color:"rgba(255,255,255,0.4)" }}>{s.paymentRecordedBy||"—"}</td>
                      <td style={{ padding:"10px", fontSize:11, color:"rgba(255,255,255,0.3)", whiteSpace:"nowrap" }}>
                        {s.paymentDate ? new Date(s.paymentDate).toLocaleDateString("ar-EG") : new Date(s.createdAt).toLocaleDateString("ar-EG")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal تسجيل دفعة ── */}
      {showModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999 }}>
          <div style={{ background:"#162035",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,padding:24,width:440,maxWidth:"95vw",direction:"rtl" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
              <span style={{ fontWeight:800,fontSize:15 }}>💳 تسجيل دفعة جديدة</span>
              <button style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:18 }} onClick={()=>setShowModal(false)}>✕</button>
            </div>

            {/* العميل */}
            <div style={{ marginBottom:12 }}>
              <label style={S.label}>العميل *</label>
              <select style={S.input} value={payForm.studentEmail} onChange={e=>setPayForm(p=>({...p,studentEmail:e.target.value}))}>
                <option value="">— اختر العميل —</option>
                {visibleStudents.map(s=><option key={s.email} value={s.email}>{s.name} ({s.email})</option>)}
              </select>
              {payForm.studentEmail && (()=>{
                const st = allStudents.find(s=>s.email===payForm.studentEmail);
                const cons = st?.assignedConsultant ? staffList.find(x=>x.email===st.assignedConsultant)?.name : null;
                return cons ? <div style={{ marginTop:5,fontSize:11,color:"#2F7B6E" }}>👤 الاستشاري: {cons}</div> : null;
              })()}
            </div>

            {/* المبلغ + العملة */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
              <div>
                <label style={S.label}>المبلغ المدفوع *</label>
                <input type="number" style={S.input} placeholder="0" value={payForm.amount} onChange={e=>setPayForm(p=>({...p,amount:e.target.value}))} />
              </div>
              <div>
                <label style={S.label}>العملة</label>
                <select style={S.input} value={payForm.currency} onChange={e=>setPayForm(p=>({...p,currency:e.target.value}))}>
                  {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.symbol} — {c.label}</option>)}
                </select>
              </div>
            </div>

            {/* طريقة + حالة */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
              <div>
                <label style={S.label}>طريقة الدفع</label>
                <select style={S.input} value={payForm.method} onChange={e=>setPayForm(p=>({...p,method:e.target.value}))}>
                  {["إيصال","InstaPay","فودافون كاش","تحويل بنكي","Western Union","نقدي","بطاقة ائتمان"].map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>حالة الدفع</label>
                <select style={S.input} value={payForm.status} onChange={e=>setPayForm(p=>({...p,status:e.target.value}))}>
                  <option value="partial">⚠️ جزئي</option>
                  <option value="full">✅ مكتمل</option>
                </select>
              </div>
            </div>

            {/* ملاحظة */}
            <div style={{ marginBottom:18 }}>
              <label style={S.label}>ملاحظة (اختياري)</label>
              <textarea style={{ ...S.textarea,minHeight:50 }} placeholder="أي تفاصيل إضافية..." value={payForm.note} onChange={e=>setPayForm(p=>({...p,note:e.target.value}))} />
            </div>

            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button style={S.btnOut} onClick={()=>setShowModal(false)}>إلغاء</button>
              <button style={{ ...S.btn,background:saved?"#2F7B6E":"#C8932B",color:saved?"#fff":"#13213B",transition:".2s" }} onClick={handleAddPayment}>
                {saved ? "✅ تم الحفظ!" : "💾 تسجيل الدفعة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Staff Tab ────────────────────────────────────────────────────────────────
function StaffTab({ S }) {
  const [staffList, setStaffList] = useState(()=>getStaffList());
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState({ email:"",password:"",name:"",initials:"",role:"consultant",otpEnabled:false });
  const [showPass, setShowPass]   = useState({});

  const saveAndUpdate = (list) => { saveStaffList(list); setStaffList(list); };

  const openAdd  = () => { setForm({ email:"",password:"",name:"",initials:"",role:"consultant",otpEnabled:false }); setEditing(null); setModal(true); };
  const openEdit = (s) => { setForm({...s}); setEditing(s.id); setModal(true); };

  const handleSave = () => {
    if (!form.email||!form.password||!form.name) { alert("يرجى ملء الحقول المطلوبة"); return; }
    if (editing) saveAndUpdate(staffList.map(s=>s.id===editing?{...form,id:editing}:s));
    else         saveAndUpdate([...staffList,{...form,id:Date.now().toString()}]);
    setModal(false);
  };

  const handleDelete = (id) => { if(!confirm("حذف هذا الموظف؟")) return; saveAndUpdate(staffList.filter(s=>s.id!==id)); };

  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
        <span style={{ fontWeight:800,fontSize:14 }}>👥 إدارة الموظفين</span>
        <button style={S.btn} onClick={openAdd}><i className="ti ti-user-plus" style={{ fontSize:13 }} /> إضافة موظف</button>
      </div>
      <div style={S.card}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12.5 }}>
          <thead>
            <tr>{["الاسم","البريد","الدور","OTP","كلمة المرور",""].map(h=>(
              <th key={h} style={{ padding:"8px 10px",textAlign:"right",fontSize:10.5,fontWeight:700,color:"rgba(255,255,255,0.3)",borderBottom:"1px solid rgba(255,255,255,0.07)" }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {staffList.map(s=>(
              <tr key={s.id}>
                <td style={{ padding:"10px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <div style={{ width:28,height:28,borderRadius:"50%",background:"#C8932B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#13213B",flexShrink:0 }}>{s.initials||s.name[0]}</div>
                    <div>
                      <div style={{ fontWeight:700 }}>{s.name}</div>
                      <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)" }}>{s.initials}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding:"10px",color:"rgba(255,255,255,0.45)",fontSize:12 }}>{s.email}</td>
                <td style={{ padding:"10px" }}>
                  <span style={{ padding:"3px 8px",borderRadius:99,fontSize:11,fontWeight:700,background:ROLES[s.role]?.bg,color:ROLES[s.role]?.color }}>
                    {ROLES[s.role]?.label||s.role}
                  </span>
                </td>
                <td style={{ padding:"10px" }}>
                  <span style={{ padding:"3px 8px",borderRadius:99,fontSize:11,fontWeight:700,background:s.otpEnabled?"rgba(47,123,110,0.15)":"rgba(255,255,255,0.05)",color:s.otpEnabled?"#2F7B6E":"rgba(255,255,255,0.3)" }}>
                    {s.otpEnabled?"✓ مفعّل":"معطّل"}
                  </span>
                </td>
                <td style={{ padding:"10px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                    <span style={{ fontSize:12,color:"rgba(255,255,255,0.45)",letterSpacing:2 }}>{showPass[s.id]?s.password:"••••••"}</span>
                    <button onClick={()=>setShowPass(p=>({...p,[s.id]:!p[s.id]}))} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",fontSize:12 }}>{showPass[s.id]?"🙈":"👁️"}</button>
                  </div>
                </td>
                <td style={{ padding:"10px" }}>
                  <div style={{ display:"flex",gap:5 }}>
                    <button style={{ ...S.btnOut,padding:"4px 9px",fontSize:11 }} onClick={()=>openEdit(s)}>✏️</button>
                    <button style={{ ...S.btnRed,padding:"4px 9px",fontSize:11,border:"1px solid rgba(220,60,60,0.3)" }} onClick={()=>handleDelete(s.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99 }} onClick={()=>setModal(false)}>
          <div style={{ background:"#162035",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:22,width:420,maxWidth:"92%" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:800,fontSize:15,marginBottom:16 }}>{editing?"تعديل موظف":"إضافة موظف جديد"}</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
              {[["الاسم الكامل *","name","text"],["الاختصار","initials","text"]].map(([label,field,type])=>(
                <div key={field}>
                  <label style={S.label}>{label}</label>
                  <input type={type} style={S.input} value={form[field]||""} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} />
                </div>
              ))}
            </div>
            {[["البريد الإلكتروني *","email","email"],["كلمة المرور *","password","text"]].map(([label,field,type])=>(
              <div key={field} style={{ marginBottom:10 }}>
                <label style={S.label}>{label}</label>
                <input type={type} style={S.input} value={form[field]||""} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} />
              </div>
            ))}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
              <div>
                <label style={S.label}>الدور</label>
                <select style={{ ...S.input,cursor:"pointer" }} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                  {Object.entries(ROLES).map(([id,r])=><option key={id} value={id}>{r.label}</option>)}
                </select>
              </div>
              <div style={{ display:"flex",flexDirection:"column",justifyContent:"flex-end" }}>
                <label style={{ ...S.label,marginBottom:8 }}>تفعيل OTP</label>
                <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer" }}>
                  <input type="checkbox" checked={form.otpEnabled} onChange={e=>setForm(f=>({...f,otpEnabled:e.target.checked}))} />
                  <span style={{ fontSize:12 }}>{form.otpEnabled?"مفعّل":"معطّل"}</span>
                </label>
              </div>
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button style={S.btnOut} onClick={()=>setModal(false)}>إلغاء</button>
              <button style={S.btn} onClick={handleSave}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────
export default function CRM() {
  const { login, logout } = useAuth();
  const [screen, setScreen]       = useState("login");
  const [otpData, setOtpData]     = useState(null);
  const [staffInfo, setStaffInfo] = useState(null);

  const handleVerified = () => {
    login(otpData.email, { name:otpData.name, initials:otpData.initials, role:otpData.role });
    setStaffInfo({ name:otpData.name, email:otpData.email, initials:otpData.initials, role:otpData.role });
    addActivity(`تسجيل دخول`, otpData.name);
    setScreen("app");
  };

  const handleDirectLogin = (data) => {
    login(data.email, { name:data.name, initials:data.initials, role:data.role });
    setStaffInfo({ name:data.name, email:data.email, initials:data.initials, role:data.role });
    addActivity(`تسجيل دخول`, data.name);
    setScreen("app");
  };

  const handleLogout = () => {
    logout();
    setScreen("login");
    setOtpData(null);
    setStaffInfo(null);
  };

  if (screen==="login") return <CRMLogin onOtpSent={d=>{ setOtpData(d); setScreen("otp"); }} onDirectLogin={handleDirectLogin} />;
  if (screen==="otp")   return <CRMOtp otpData={otpData} onVerified={handleVerified} onBack={()=>setScreen("login")} />;
  return <CRMApp staffInfo={staffInfo} onLogout={handleLogout} />;
}

// ─── Quick Replies Tab ────────────────────────────────────────────────────────
function QuickRepliesTab({ S }) {
  const [replies, setReplies] = useState(() => getQuickReplies());
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title:"", text:"", tag:"عام" });
  const [editing, setEditing] = useState(null);
  const [copied, setCopied] = useState(null);
  const [filterTag, setFilterTag] = useState("الكل");
  const tags = ["الكل", ...new Set(replies.map(r=>r.tag))];

  const save = (list) => { saveQuickReplies(list); setReplies(list); };
  const openAdd  = () => { setForm({ title:"", text:"", tag:"عام" }); setEditing(null); setModal(true); };
  const openEdit = (r) => { setForm({...r}); setEditing(r.id); setModal(true); };
  const handleSave = () => {
    if (!form.title||!form.text) return;
    if (editing) save(replies.map(r=>r.id===editing?{...form,id:editing}:r));
    else save([...replies, {...form, id:Date.now().toString()}]);
    setModal(false);
  };
  const copyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopied(id); setTimeout(()=>setCopied(null),2000);
  };
  const [waModal, setWaModal] = useState(false);
  const [waMsgText, setWaMsgText] = useState("");
  const openWhatsApp = (text) => { setWaMsgText(text); setWaModal(true); };

  const filtered = filterTag==="الكل" ? replies : replies.filter(r=>r.tag===filterTag);

  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
        <span style={{ fontWeight:800,fontSize:14 }}>💬 الردود الجاهزة والقوالب</span>
        <button style={S.btn} onClick={openAdd}><i className="ti ti-plus" style={{ fontSize:13 }} /> إضافة رد</button>
      </div>

      {/* فلتر التاجات */}
      <div style={{ display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" }}>
        {tags.map(t => (
          <button key={t} onClick={()=>setFilterTag(t)} style={{ padding:"5px 12px",borderRadius:99,border:filterTag===t?"none":"1px solid rgba(255,255,255,0.12)",background:filterTag===t?"#C8932B":"none",color:filterTag===t?"#13213B":"rgba(255,255,255,0.6)",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>{t}</button>
        ))}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10 }}>
        {filtered.map(r => (
          <div key={r.id} style={{ ...S.card, display:"flex",flexDirection:"column",gap:8 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div style={{ fontWeight:700,fontSize:13 }}>{r.title}</div>
              <span style={{ fontSize:10.5,padding:"2px 8px",borderRadius:99,background:"rgba(200,147,43,0.15)",color:"#C8932B",fontWeight:700 }}>{r.tag}</span>
            </div>
            <div style={{ fontSize:12.5,color:"rgba(255,255,255,0.6)",lineHeight:1.7,flex:1,background:"rgba(255,255,255,0.03)",padding:"8px 10px",borderRadius:7 }}>{r.text}</div>
            <div style={{ display:"flex",gap:6 }}>
              <button style={{ ...S.btn,flex:1,justifyContent:"center",fontSize:11,padding:"6px" }} onClick={()=>copyText(r.id,r.text)}>
                {copied===r.id?"✅ تم النسخ":"📋 نسخ"}
              </button>
              <button style={{ ...S.btnGreen,flex:1,justifyContent:"center",fontSize:11,padding:"6px" }} onClick={()=>openWhatsApp(r.text)}>
                📱 واتساب
              </button>
              <button style={{ ...S.btnOut,padding:"6px 10px",fontSize:11 }} onClick={()=>openEdit(r)}>✏️</button>
              <button style={{ ...S.btnRed,padding:"6px 10px",fontSize:11 }} onClick={()=>save(replies.filter(x=>x.id!==r.id))}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal إرسال واتساب الداخلي */}
      {waModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99 }} onClick={()=>setWaModal(false)}>
          <div style={{ background:"#162035",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:22,width:460,maxWidth:"92%" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:800,fontSize:15,marginBottom:14 }}>📱 إرسال عبر واتساب</div>
            <div style={{ padding:12,borderRadius:8,background:"rgba(255,255,255,0.03)",marginBottom:14,fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap" }}>{waMsgText}</div>
            <div style={{ marginBottom:14 }}>
              <label style={S.label}>اختر العميل</label>
              <select id="wa-client-select" style={{ ...S.input,cursor:"pointer" }}>
                <option value="">— اختر عميلاً —</option>
              </select>
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button style={S.btnOut} onClick={()=>setWaModal(false)}>إلغاء</button>
              <button style={{ ...S.btn,background:"#25D366",color:"#fff" }} onClick={()=>{
                const sel = document.getElementById("wa-client-select");
                if (!sel?.value) { alert("يرجى اختيار عميل"); return; }
                sendInternalWaMsg(sel.value, waMsgText, "موظف");
                setWaModal(false);
                alert("✅ تم الإرسال في واتساب الداخلي");
              }}>📱 إرسال داخلياً</button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99 }} onClick={()=>setModal(false)}>
          <div style={{ background:"#162035",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:22,width:460,maxWidth:"92%" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:800,fontSize:15,marginBottom:14 }}>{editing?"تعديل رد":"إضافة رد جاهز"}</div>
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>العنوان</label>
              <input style={S.input} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="مثال: ترحيب، طلب مستندات..." />
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>نص الرسالة</label>
              <textarea style={{ ...S.textarea,minHeight:100 }} value={form.text} onChange={e=>setForm(f=>({...f,text:e.target.value}))} placeholder="نص الرد الجاهز..." />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={S.label}>التصنيف</label>
              <input style={S.input} value={form.tag} onChange={e=>setForm(f=>({...f,tag:e.target.value}))} placeholder="مثال: عام، منح، دفع..." />
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button style={S.btnOut} onClick={()=>setModal(false)}>إلغاء</button>
              <button style={S.btn} onClick={handleSave}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────
function ScheduleTab({ staffInfo, allStudents, S }) {
  const [appointments, setAppointments] = useState(() => getSchedule());
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ studentEmail:"", staffEmail:"", date:"", time:"", duration:60, type:"استشارة", notes:"" });
  const staff = getStaffList();

  const save = (list) => { saveSchedule(list); setAppointments(list); };

  const handleAdd = () => {
    if (!form.date||!form.time) { alert("يرجى تحديد التاريخ والوقت"); return; }
    const student = allStudents.find(s=>s.email===form.studentEmail);
    const staffMember = staff.find(s=>s.email===form.staffEmail);
    const newAppt = { ...form, id:Date.now().toString(), createdAt:new Date().toISOString() };
    save([...appointments, newAppt]);
    // إضافة تلقائية في قائمة المتابعات
    try {
      const fups = JSON.parse(localStorage.getItem("masar_followups")||"[]");
      fups.push({ id:"appt_"+newAppt.id, studentEmail:form.studentEmail, type:form.type||"اجتماع", date:`${form.date}T${form.time}`, note:`موعد ${form.type} - ${form.notes||""}`, assignedTo:form.staffEmail, done:false, fromSchedule:true, createdBy:staffMember?.name||"موظف", createdAt:new Date().toISOString() });
      localStorage.setItem("masar_followups", JSON.stringify(fups));
    } catch {}

    // إرسال رسالة واتساب للطالب
    if (student?.phone) {
      const dateFormatted = new Date(form.date).toLocaleDateString("ar-EG", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
      const msg = `أهلاً ${student.name} 👋

` +
        `تم تحديد موعد ${form.type} خاص بك مع مسار للاستشارات التعليمية:

` +
        `📅 التاريخ: ${dateFormatted}
` +
        `⏰ الوقت: ${form.time}
` +
        `⏱ المدة: ${form.duration} دقيقة
` +
        `👨‍💼 الاستشاري: ${staffMember?.name || "سيتم التحديد"}
` +
        (form.notes ? `
📝 ملاحظات: ${form.notes}
` : "") +
        `
نتمنى لك جلسة مثمرة 🌟
فريق مسار`;

      const phone = student.phone.replace(/[^0-9+]/g,"");
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

      // فتح واتساب في نافذة جديدة
      // إرسال للواتساب الداخلي بدل فتح نافذة خارجية
      sendInternalWaMsg(student.email, msg, staffMember?.name||"موظف");
      // وفتح واتساب الخارجي لو في رقم
      if (phone) window.open(waUrl, "_blank");
    }

    setModal(false);
    setForm({ studentEmail:"", staffEmail:"", date:"", time:"", duration:60, type:"استشارة", notes:"" });
  };

  // ترتيب المواعيد
  const today = new Date().toISOString().split("T")[0];
  const upcoming = appointments.filter(a=>a.date>=today).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  const past = appointments.filter(a=>a.date<today).sort((a,b)=>b.date.localeCompare(a.date));

  const getStudentName = (email) => allStudents.find(s=>s.email===email)?.name || email;
  const getStaffName = (email) => staff.find(s=>s.email===email)?.name || email;
  const TYPE_COLORS = { "استشارة":"#2F7B6E", "متابعة":"#C8932B", "مراجعة ملف":"#6B5DD3", "أخرى":"#3B9DD4" };

  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
        <span style={{ fontWeight:800,fontSize:14 }}>📅 جدول المواعيد والاستشارات</span>
        <button style={S.btn} onClick={()=>setModal(true)}><i className="ti ti-plus" style={{ fontSize:13 }} /> موعد جديد</button>
      </div>

      {/* المواعيد القادمة */}
      <div style={{ fontWeight:700,fontSize:13,marginBottom:10,color:"#2F7B6E" }}>📌 المواعيد القادمة ({upcoming.length})</div>
      {upcoming.length === 0 ? (
        <div style={{ ...S.card,textAlign:"center",padding:32,color:"rgba(255,255,255,0.3)",marginBottom:14 }}>
          <div style={{ fontSize:28,marginBottom:6 }}>📅</div>
          <div>لا توجد مواعيد قادمة</div>
        </div>
      ) : upcoming.map(a => (
        <div key={a.id} style={{ ...S.card, display:"flex",alignItems:"center",gap:14,marginBottom:8 }}>
          <div style={{ width:48,flexShrink:0,textAlign:"center" }}>
            <div style={{ fontSize:18,fontWeight:800,color:"#C8932B" }}>{new Date(a.date).getDate()}</div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)" }}>{new Date(a.date).toLocaleDateString("ar-EG",{month:"short"})}</div>
          </div>
          <div style={{ width:1,height:40,background:"rgba(255,255,255,0.07)" }} />
          <div style={{ flex:1 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3 }}>
              <span style={{ fontSize:12,fontWeight:700,padding:"2px 8px",borderRadius:99,background:`${TYPE_COLORS[a.type]||"#6B5DD3"}22`,color:TYPE_COLORS[a.type]||"#6B5DD3" }}>{a.type}</span>
              <span style={{ fontSize:12,fontWeight:700 }}>{a.time} ({a.duration} دقيقة)</span>
            </div>
            <div style={{ fontSize:12,color:"rgba(255,255,255,0.6)" }}>👤 {getStudentName(a.studentEmail)} · 👨‍💼 {getStaffName(a.staffEmail)}</div>
            {a.notes && <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2 }}>{a.notes}</div>}
          </div>
          <button style={{ ...S.btnRed,padding:"5px 10px",fontSize:11 }} onClick={()=>save(appointments.filter(x=>x.id!==a.id))}>🗑️</button>
          {(() => {
            const st = allStudents.find(s=>s.email===a.studentEmail);
            if (!st) return null;
            const dateFormatted = new Date(a.date).toLocaleDateString("ar-EG",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
            const msg = `تذكير بموعدك 📅

📅 التاريخ: ${dateFormatted}
⏰ الوقت: ${a.time}
⏱ المدة: ${a.duration} دقيقة
${a.notes?`📝 ملاحظات: ${a.notes}
`:""}
نتمنى لك جلسة مثمرة 🌟
فريق مسار`;
            return (
              <button style={{ ...S.btnGreen,padding:"5px 10px",fontSize:11 }} onClick={()=>{
                // إرسال للواتساب الداخلي
                sendInternalWaMsg(st.email, msg, "موظف");
                alert(`✅ تم إرسال التذكير لـ ${st.name} في واتساب الاستشاريين`);
              }}>
                📱 تذكير داخلي
              </button>
            );
          })()}
        </div>
      ))}

      {/* المواعيد السابقة */}
      {past.length > 0 && (
        <details style={{ marginTop:8 }}>
          <summary style={{ cursor:"pointer",fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:8 }}>📁 المواعيد السابقة ({past.length})</summary>
          {past.map(a => (
            <div key={a.id} style={{ ...S.card,opacity:.55,display:"flex",alignItems:"center",gap:12,marginBottom:6 }}>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.5)",minWidth:70 }}>{new Date(a.date).toLocaleDateString("ar-EG")}</div>
              <div style={{ fontSize:12 }}>{a.type} · {getStudentName(a.studentEmail)}</div>
            </div>
          ))}
        </details>
      )}

      {modal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99 }} onClick={()=>setModal(false)}>
          <div style={{ background:"#162035",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:22,width:420,maxWidth:"92%" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:800,fontSize:15,marginBottom:14 }}>موعد جديد</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
              <div>
                <label style={S.label}>التاريخ</label>
                <input type="date" style={S.input} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
              </div>
              <div>
                <label style={S.label}>الوقت</label>
                <input type="time" style={S.input} value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} />
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>العميل</label>
              <select style={{ ...S.input,cursor:"pointer" }} value={form.studentEmail} onChange={e=>setForm(f=>({...f,studentEmail:e.target.value}))}>
                <option value="">اختر العميل...</option>
                {allStudents.map(s=><option key={s.email} value={s.email}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
              <div>
                <label style={S.label}>الاستشاري</label>
                <select style={{ ...S.input,cursor:"pointer" }} value={form.staffEmail} onChange={e=>setForm(f=>({...f,staffEmail:e.target.value}))}>
                  <option value="">اختر الاستشاري...</option>
                  {getStaffList().map(s=><option key={s.id} value={s.email}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>نوع الموعد</label>
                <select style={{ ...S.input,cursor:"pointer" }} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  {["استشارة","متابعة","مراجعة ملف","أخرى"].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>المدة (دقيقة)</label>
              <select style={{ ...S.input,cursor:"pointer" }} value={form.duration} onChange={e=>setForm(f=>({...f,duration:+e.target.value}))}>
                {[30,45,60,90,120].map(d=><option key={d} value={d}>{d} دقيقة</option>)}
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={S.label}>ملاحظات (اختياري)</label>
              <textarea style={{ ...S.textarea,minHeight:60 }} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button style={S.btnOut} onClick={()=>setModal(false)}>إلغاء</button>
              <button style={S.btn} onClick={handleAdd}>💾 حفظ الموعد</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Site Chat Tab ────────────────────────────────────────────────────────────
const LEADS_KEY = "masar_leads";
const CHATS_KEY = "masar_chats_v1";

function SiteChatTab({ staffInfo, S }) {
  const [leads, setLeads]           = useState([]);
  const [chats, setChats]           = useState({});
  const [selectedLead, setSelectedLead] = useState(null);
  const [reply, setReply]           = useState("");
  const [search, setSearch]         = useState("");
  const [showQR, setShowQR]         = useState(false);
  const quickReplies                = getQuickReplies();
  const messagesEndRef              = useRef();

  const refresh = () => {
    try { setLeads(JSON.parse(localStorage.getItem("masar_leads")||"[]")); } catch {}
    try { setChats(JSON.parse(localStorage.getItem("masar_chats_v1")||"{}")); } catch {}
  };

  useEffect(() => { refresh(); const iv=setInterval(refresh,2000); return ()=>clearInterval(iv); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [selectedLead, chats]);

  const getMsgs = (lead) => {
    if (!lead) return [];
    for (const k of [lead.id, String(lead.id), lead.visitorId, lead.sessionId, lead.email]) {
      if (k && chats[k]?.messages?.length) return chats[k].messages;
    }
    return [];
  };

  const sendReply = (text = reply) => {
    if (!text.trim() || !selectedLead) return;
    const key = selectedLead._key || selectedLead.id || selectedLead.email;
    if (!key) return;
    const cur = chats[key] || {};
    const newMsg = { id:Date.now().toString(), sender:"admin", text, staffName:staffInfo?.name||"موظف", ts:Date.now() };
    const updated = { ...chats, [key]: { ...cur, messages:[...(cur.messages||[]),newMsg], lastMsg:text.slice(0,80), lastTs:Date.now() }};
    setChats(updated);
    localStorage.setItem("masar_chats_v1", JSON.stringify(updated));
    setReply(""); setShowQR(false);
  };

  const allConvs = (() => {
    const map = {};
    leads.forEach(l => { const k=l.id||l.email||l.phone; map[k]={...l,_key:k}; });
    Object.entries(chats).forEach(([k,conv]) => { if(!map[k]) map[k]={id:k,name:conv.name||k.slice(0,12),phone:conv.phone||"",email:conv.email||"",_key:k}; });
    return Object.values(map);
  })();

  const filtered = allConvs.filter(l=>!search||l.name?.includes(search)||l.phone?.includes(search)||l.email?.includes(search));
  const leadMsgs = getMsgs(selectedLead);

  return (
    <div style={{ display:"flex",gap:12,height:"calc(100vh - 130px)" }}>
      <div style={{ width:260,flexShrink:0,background:"#162035",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)",display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ padding:"12px 12px 8px",borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:8,display:"flex",alignItems:"center",gap:6 }}>
            🖥️ شات الموقع
            <span style={{ fontSize:10,padding:"2px 7px",borderRadius:99,background:"rgba(200,147,43,0.15)",color:"#C8932B",fontWeight:700 }}>{filtered.length}</span>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." style={{ ...S.input,padding:"6px 10px",fontSize:12 }} />
        </div>
        <div style={{ flex:1,overflowY:"auto" }}>
          {filtered.length===0 ? (
            <div style={{ textAlign:"center",color:"rgba(255,255,255,0.3)",padding:24,fontSize:12 }}>
              <div style={{ fontSize:24,marginBottom:6 }}>💬</div>لا توجد محادثات بعد
            </div>
          ) : filtered.map(lead=>{
            const msgs=getMsgs(lead);
            const lastMsg=msgs.slice(-1)[0]||{text:chats[lead._key]?.lastMsg||lead.message||""};
            const unread=chats[lead._key]?.unread||0;
            const isSel=selectedLead?._key===lead._key;
            return (
              <div key={lead._key} onClick={()=>setSelectedLead(lead)} style={{ padding:"10px 12px",cursor:"pointer",background:isSel?"rgba(200,147,43,0.08)":"none",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2 }}>
                  <span style={{ fontWeight:700,fontSize:12.5 }}>{lead.name||lead.email||"زائر"}</span>
                  {unread>0&&<span style={{ minWidth:18,height:18,borderRadius:99,padding:"0 5px",background:"#C8932B",fontSize:10,fontWeight:800,color:"#13213B",display:"flex",alignItems:"center",justifyContent:"center" }}>{unread}</span>}
                </div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{lastMsg?.text?.slice(0,40)||"..."}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ flex:1,background:"#162035",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)",display:"flex",flexDirection:"column",overflow:"hidden" }}>
        {!selectedLead ? (
          <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,color:"rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize:40 }}>💬</div><div>اختر محادثة للرد</div>
          </div>
        ) : (
          <>
            <div style={{ padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ width:34,height:34,borderRadius:"50%",background:"#C8932B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#13213B",flexShrink:0 }}>{(selectedLead.name||"؟")[0]}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:13 }}>{selectedLead.name||selectedLead.email||"زائر"}</div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>{selectedLead.phone||selectedLead.email||""}</div>
              </div>
              {selectedLead.phone&&<a href={`https://wa.me/${selectedLead.phone.replace(/[^0-9+]/g,"")}`} target="_blank" rel="noreferrer" style={{ ...S.btnGreen,padding:"5px 12px",fontSize:11,textDecoration:"none" }}>📱 واتساب</a>}
            </div>
            <div style={{ flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:8 }}>
              {leadMsgs.length===0 ? (
                <div style={{ textAlign:"center",color:"rgba(255,255,255,0.3)",fontSize:12,marginTop:32 }}><div style={{ fontSize:24,marginBottom:6 }}>💬</div>لا توجد رسائل</div>
              ) : leadMsgs.map((msg,i)=>{
                const isStaff=["admin","staff","agent"].includes(msg.sender);
                return (
                  <div key={msg.id||i} style={{ display:"flex",justifyContent:isStaff?"flex-start":"flex-end" }}>
                    <div style={{ maxWidth:"72%",padding:"8px 12px",borderRadius:10,background:isStaff?"rgba(47,123,110,0.12)":"rgba(200,147,43,0.1)",border:`1px solid ${isStaff?"rgba(47,123,110,0.2)":"rgba(200,147,43,0.2)"}` }}>
                      {isStaff&&msg.staffName&&<div style={{ fontSize:10,color:"#2F7B6E",fontWeight:700,marginBottom:3 }}>{msg.staffName}</div>}
                      <div style={{ fontSize:13,lineHeight:1.7 }}>{msg.text}</div>
                      <div style={{ fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:3 }}>{msg.ts?new Date(msg.ts).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}):""}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            {showQR&&(
              <div style={{ padding:"8px 16px",borderTop:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.02)",maxHeight:180,overflowY:"auto" }}>
                {quickReplies.map(qr=>(
                  <button key={qr.id} onClick={()=>sendReply(qr.text)} style={{ display:"block",width:"100%",textAlign:"right",padding:"5px 10px",borderRadius:6,border:"1px solid rgba(255,255,255,0.07)",background:"none",cursor:"pointer",fontFamily:"inherit",fontSize:11.5,color:"#E8E4DA",marginBottom:3 }}>
                    <strong style={{ color:"#C8932B" }}>{qr.title}</strong> — {qr.text.slice(0,50)}
                  </button>
                ))}
              </div>
            )}
            <div style={{ padding:"10px 16px",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",gap:8 }}>
              <button onClick={()=>setShowQR(s=>!s)} style={{ ...S.btnOut,padding:"8px 10px",flexShrink:0 }}>⚡</button>
              <input value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendReply()} placeholder="اكتب ردك..." style={{ ...S.input,flex:1,padding:"8px 12px" }} />
              <button style={S.btn} onClick={()=>sendReply()}>إرسال</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── WhatsApp Tab ─────────────────────────────────────────────────────────────
const WA_LABEL_COLORS = ["#25D366","#C8932B","#6B5DD3","#e84545","#3B9DD4","#2F7B6E","#E8823A"];

// ─── حساب التنبيهات والتأخيرات ───────────────────────────────────────────────
function getAlerts(allStudents, staffList) {
  const alerts = [];
  const now    = new Date();

  // 1. تذكيرات متأخرة (السيلز)
  allStudents.forEach(s => {
    const salesEmail = s.assignedSales;
    const salesName  = staffList.find(st=>st.email===salesEmail)?.name;
    try {
      const rems = JSON.parse(localStorage.getItem(`masar_rem_${s.email}`)||"[]");
      rems.filter(r=>!r.done&&r.date&&new Date(r.date)<now).forEach(r=>{
        const hoursLate = Math.round((now-new Date(r.date))/3600000);
        alerts.push({ type:"overdue_reminder", priority:hoursLate>24?"high":"medium", studentName:s.name, studentEmail:s.email, staffName:salesName||"غير محدد", staffEmail:salesEmail, msg:`تذكير متأخر: ${r.title} (${hoursLate} ساعة)`, role:"sales" });
      });
    } catch {}
  });

  // 2. طالب دفع ومفيش رد من استشاري +48 ساعة
  allStudents.filter(s=>s.paymentConfirmed&&s.assignedConsultant).forEach(s=>{
    const consultEmail = s.assignedConsultant;
    const consultName  = staffList.find(st=>st.email===consultEmail)?.name;
    const hasAnyReply  = ["motivationLetter","recommendation1","cv"].some(k=>s[k]?.staffReply);
    if (!hasAnyReply && s.paymentConfirmedAt) {
      const hoursElapsed = Math.round((now-new Date(s.paymentConfirmedAt))/3600000);
      if (hoursElapsed > 48) {
        alerts.push({ type:"no_reply", priority:"high", studentName:s.name, studentEmail:s.email, staffName:consultName||"غير محدد", staffEmail:consultEmail, msg:`لم يُرفع أي رد منذ ${hoursElapsed} ساعة من تأكيد الدفع`, role:"consultant" });
      }
    }
  });

  // 3. موعد قادم خلال 30 دقيقة - تنبيه عاجل
  try {
    const schedule = JSON.parse(localStorage.getItem("masar_schedule")||"[]");
    schedule.forEach(a => {
      const apptTime = new Date(`${a.date}T${a.time}`);
      const diff = (apptTime-now)/60000;
      if (diff > 0 && diff <= 30) {
        const st = allStudents.find(s=>s.email===a.studentEmail);
        const staffMember = staffList.find(s=>s.email===a.staffEmail);
        alerts.push({ type:"upcoming_appt", priority:"high", studentName:st?.name||a.studentEmail, studentEmail:a.studentEmail, staffName:staffMember?.name||"غير محدد", staffEmail:a.staffEmail, msg:`⚡ موعد عاجل خلال ${Math.round(diff)} دقيقة مع ${st?.name}`, role:staffMember?.role||"consultant" });
      } else if (diff > 30 && diff <= 60) {
        const st = allStudents.find(s=>s.email===a.studentEmail);
        const staffMember = staffList.find(s=>s.email===a.staffEmail);
        alerts.push({ type:"upcoming_appt", priority:"medium", studentName:st?.name||a.studentEmail, studentEmail:a.studentEmail, staffName:staffMember?.name||"غير محدد", staffEmail:a.staffEmail, msg:`موعد قادم خلال ${Math.round(diff)} دقيقة مع ${st?.name}`, role:staffMember?.role||"consultant" });
      }
    });
  } catch {}

  // 4. follow-ups فاتت ولم تُنجز (من الماركتينج)
  try {
    const fups = JSON.parse(localStorage.getItem("masar_followups")||"[]");
    fups.filter(f=>!f.done&&f.date&&new Date(f.date)<now).forEach(f=>{
      const st = allStudents.find(s=>s.email===f.studentEmail);
      const hoursLate = Math.round((now-new Date(f.date))/3600000);
      alerts.push({ type:"overdue_followup", priority:hoursLate>24?"high":"medium", studentName:st?.name||f.studentEmail, studentEmail:f.studentEmail, staffName:"غير محدد", staffEmail:"", msg:`متابعة فائتة: ${f.note||f.type} (${hoursLate} ساعة)`, role:"sales" });
    });
  } catch {}

  return alerts.sort((a,b)=>a.priority==="high"&&b.priority!=="high"?-1:1);
}

// ─── إرسال رسالة للواتساب الداخلي (masar_wa_messages) ────────────────────────
function sendInternalWaMsg(studentEmail, text, staffName) {
  try {
    const cur = JSON.parse(localStorage.getItem("masar_wa_messages")||"{}");
    const msgs = cur[studentEmail]||[];
    msgs.push({ id:Date.now().toString(), sender:"staff", text, staffName:staffName||"موظف", timestamp:new Date().toISOString() });
    cur[studentEmail] = msgs;
    localStorage.setItem("masar_wa_messages", JSON.stringify(cur));
  } catch {}
}

function WhatsAppTab({ allStudents, mode, staffInfo, S }) {
  const isSales      = mode === "sales";
  const title        = isSales ? "📱 واتساب المبيعات وخدمة العملاء" : "📱 واتساب الاستشاريين";
  const subtitle     = isSales ? "العملاء المحتملون قبل الدفع" : "العملاء بعد تأكيد الدفع";

  const [view, setView]                   = useState("chats");
  const [labels, setLabels]               = useState(() => { try { return JSON.parse(localStorage.getItem("masar_wa_labels")||"[]"); } catch { return []; } });
  const [studentLabels, setStudentLabels] = useState(() => { try { return JSON.parse(localStorage.getItem("masar_student_labels")||"{}"); } catch { return {}; } });
  const [studentAgents, setStudentAgents] = useState(() => { try { return JSON.parse(localStorage.getItem("masar_student_agents")||"{}"); } catch { return {}; } });
  const [newLabel, setNewLabel]           = useState("");
  const [labelColor, setLabelColor]       = useState(WA_LABEL_COLORS[0]);
  const [search, setSearch]               = useState("");
  const [selectedConv, setSelectedConv]   = useState(null);
  const [reply, setReply]                 = useState("");
  const [convMessages, setConvMessages]   = useState(() => { try { return JSON.parse(localStorage.getItem("masar_wa_messages")||"{}"); } catch { return {}; } });
  const [showQR, setShowQR]               = useState(false);
  const [filterLabel, setFilterLabel]     = useState("الكل");
  const [filterAgent, setFilterAgent]     = useState("الكل");
  const messagesEndRef                    = useRef();
  const quickReplies                      = getQuickReplies();
  const staffList                         = getStaffList();
  const agents                            = staffList.filter(s => isSales ? ["sales","support","admin"].includes(s.role) : ["consultant","admin"].includes(s.role));

  const saveLabels = (l) => { setLabels(l); localStorage.setItem("masar_wa_labels", JSON.stringify(l)); };
  const saveStudentLabels = (sl) => { setStudentLabels(sl); localStorage.setItem("masar_student_labels", JSON.stringify(sl)); };
  const saveStudentAgents = (sa) => { setStudentAgents(sa); localStorage.setItem("masar_student_agents", JSON.stringify(sa)); };
  const saveConvMessages  = (cm) => { setConvMessages(cm); localStorage.setItem("masar_wa_messages", JSON.stringify(cm)); };

  const toggleLabel = (email, labelId) => {
    const cur = studentLabels[email]||[];
    saveStudentLabels({ ...studentLabels, [email]: cur.includes(labelId) ? cur.filter(l=>l!==labelId) : [...cur,labelId] });
  };

  const assignAgent = (email, agentEmail) => {
    saveStudentAgents({ ...studentAgents, [email]: agentEmail });
  };

  const addLabel = () => {
    if (!newLabel.trim()) return;
    saveLabels([...labels, { id:Date.now().toString(), name:newLabel, color:labelColor }]);
    setNewLabel("");
  };

  // لما الوكيل يختار نفسه يتعين تلقائياً على المحادثة
  const handleSelfAssign = (email) => {
    if (staffInfo?.email) assignAgent(email, staffInfo.email);
  };

  // فلترة العملاء - الاستشاريين يشوفوا اللي دفعوا بس
  let conversations = allStudents.filter(s => s.phone && (mode === "sales" || s.paymentConfirmed));
  if (filterLabel !== "الكل") conversations = conversations.filter(s => (studentLabels[s.email]||[]).includes(filterLabel));
  if (filterAgent !== "الكل") conversations = conversations.filter(s => studentAgents[s.email] === filterAgent);
  if (search) conversations = conversations.filter(s => s.name?.includes(search) || s.phone?.includes(search));

  const sendReply = (text = reply) => {
    if (!text.trim() || !selectedConv) return;
    const newMsg = { id:Date.now().toString(), text, sender:"staff", staffName:staffInfo?.name||"موظف", timestamp:new Date().toISOString() };
    const cur = convMessages[selectedConv.email]||[];
    saveConvMessages({ ...convMessages, [selectedConv.email]: [...cur, newMsg] });
    // Auto-assign لما الوكيل يبعت رسالة
    if (!studentAgents[selectedConv.email]) handleSelfAssign(selectedConv.email);
    setReply(""); setShowQR(false);
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [selectedConv?.email, convMessages]);

  const msgs = selectedConv ? (convMessages[selectedConv.email]||[]) : [];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontWeight:800,fontSize:15,marginBottom:2 }}>{title}</div>
        <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)" }}>{subtitle} · {conversations.length} عميل</div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" }}>
        {[["chats","💬 المحادثات"],["contacts","👥 جهات الاتصال"],["labels","🏷️ التصنيفات"]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{ padding:"7px 16px",borderRadius:8,border:view===v?"none":"1px solid rgba(255,255,255,0.12)",background:view===v?"#C8932B":"none",color:view===v?"#13213B":"rgba(255,255,255,0.6)",cursor:"pointer",fontFamily:"inherit",fontSize:12.5,fontWeight:700 }}>{l}</button>
        ))}
        {/* فلترة */}
        <select style={{ ...S.input,width:"auto",padding:"6px 10px",fontSize:12,cursor:"pointer",marginRight:"auto" }} value={filterAgent} onChange={e=>setFilterAgent(e.target.value)}>
          <option value="الكل">كل الوكلاء</option>
          {agents.map(a=><option key={a.id} value={a.email}>{a.name}</option>)}
        </select>
        <select style={{ ...S.input,width:"auto",padding:"6px 10px",fontSize:12,cursor:"pointer" }} value={filterLabel} onChange={e=>setFilterLabel(e.target.value)}>
          <option value="الكل">كل التصنيفات</option>
          {labels.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {/* ── المحادثات ── */}
      {view==="chats" && (
        <div style={{ display:"flex",gap:12,height:"calc(100vh - 210px)" }}>
          {/* قائمة */}
          <div style={{ width:270,flexShrink:0,background:"#162035",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)",display:"flex",flexDirection:"column",overflow:"hidden" }}>
            <div style={{ padding:"10px 12px",borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." style={{ ...S.input,padding:"6px 10px",fontSize:12 }} />
            </div>
            <div style={{ flex:1,overflowY:"auto" }}>
              {conversations.length === 0 ? (
                <div style={{ textAlign:"center",color:"rgba(255,255,255,0.3)",padding:24,fontSize:12 }}>
                  <div style={{ fontSize:28,marginBottom:6 }}>📱</div>
                  {isSales ? "لا يوجد عملاء بعد" : "لا يوجد عملاء مدفوعة بعد"}
                </div>
              ) : conversations.map(c => {
                const agentEmail = studentAgents[c.email];
                const agent = staffList.find(s=>s.email===agentEmail);
                const cLabels = (studentLabels[c.email]||[]).map(lid=>labels.find(l=>l.id===lid)).filter(Boolean);
                const lastMsg = (convMessages[c.email]||[]).slice(-1)[0];
                return (
                  <div key={c.email} onClick={()=>setSelectedConv(c)}
                    style={{ padding:"10px 12px",cursor:"pointer",background:selectedConv?.email===c.email?"rgba(37,211,102,0.06)":"none",borderBottom:"1px solid rgba(255,255,255,0.04)",borderRight:selectedConv?.email===c.email?"3px solid #25D366":"3px solid transparent" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ width:36,height:36,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff",flexShrink:0 }}>{c.name[0]}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontWeight:700,fontSize:12.5,display:"flex",alignItems:"center",gap:4 }}>
                          {c.name}
                          {cLabels.map(l=><span key={l.id} style={{ width:7,height:7,borderRadius:"50%",background:l.color,flexShrink:0 }} />)}
                        </div>
                        <div style={{ fontSize:10.5,color:"rgba(255,255,255,0.35)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{lastMsg?.text||c.phone||"..."}</div>
                        {agent && <div style={{ fontSize:10,color:"#C8932B",marginTop:1 }}>👤 {agent.name}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* الشات */}
          <div style={{ flex:1,background:"#162035",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)",display:"flex",flexDirection:"column",overflow:"hidden" }}>
            {!selectedConv ? (
              <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,color:"rgba(255,255,255,0.3)" }}>
                <div style={{ fontSize:40 }}>📱</div>
                <div>اختر محادثة</div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
                  <div style={{ width:36,height:36,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"#fff",flexShrink:0 }}>{selectedConv.name[0]}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700,fontSize:13 }}>{selectedConv.name}</div>
                    <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",direction:"ltr" }}>{selectedConv.phone}</div>
                  </div>
                  {/* تعيين الوكيل */}
                  <div>
                    <select style={{ ...S.input,width:"auto",padding:"5px 10px",fontSize:11.5,cursor:"pointer" }}
                      value={studentAgents[selectedConv.email]||""}
                      onChange={e=>assignAgent(selectedConv.email, e.target.value)}>
                      <option value="">— تعيين وكيل —</option>
                      {agents.map(a=><option key={a.id} value={a.email}>{a.name}</option>)}
                    </select>
                  </div>
                  {!studentAgents[selectedConv.email] && (
                    <button style={{ ...S.btnOut,padding:"5px 10px",fontSize:11 }} onClick={()=>handleSelfAssign(selectedConv.email)}>
                      👤 تعيين لي
                    </button>
                  )}
                  {/* التصنيفات */}
                  <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
                    {labels.map(l=>{
                      const has=(studentLabels[selectedConv.email]||[]).includes(l.id);
                      return <button key={l.id} onClick={()=>toggleLabel(selectedConv.email,l.id)} style={{ fontSize:10.5,padding:"2px 8px",borderRadius:99,border:`1px solid ${has?l.color:"rgba(255,255,255,0.1)"}`,background:has?`${l.color}20`:"none",color:has?l.color:"rgba(255,255,255,0.3)",cursor:"pointer",fontFamily:"inherit",fontWeight:700 }}>{l.name}</button>;
                    })}
                  </div>
                  <a href={`https://wa.me/${selectedConv.phone?.replace(/[^0-9+]/g,"")}`} target="_blank" rel="noreferrer"
                    style={{ padding:"5px 12px",borderRadius:8,background:"#25D366",color:"#fff",textDecoration:"none",fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",gap:4 }}>
                    📱 فتح
                  </a>
                </div>

                {/* الرسائل */}
                <div style={{ flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:8 }}>
                  {msgs.length === 0 ? (
                    <div style={{ textAlign:"center",color:"rgba(255,255,255,0.3)",fontSize:12,marginTop:32 }}>
                      <div style={{ fontSize:28,marginBottom:6 }}>💬</div>
                      ابدأ المحادثة مع {selectedConv.name}
                    </div>
                  ) : msgs.map((msg,i)=>(
                    <div key={msg.id||i} style={{ display:"flex",justifyContent:msg.sender==="staff"?"flex-start":"flex-end" }}>
                      <div style={{ maxWidth:"70%",padding:"8px 12px",borderRadius:10,background:msg.sender==="staff"?"rgba(47,123,110,0.12)":"rgba(37,211,102,0.1)",border:`1px solid ${msg.sender==="staff"?"rgba(47,123,110,0.2)":"rgba(37,211,102,0.2)"}` }}>
                        {msg.sender==="staff"&&msg.staffName&&<div style={{ fontSize:10,color:"#2F7B6E",fontWeight:700,marginBottom:3 }}>{msg.staffName}</div>}
                        <div style={{ fontSize:13,lineHeight:1.7 }}>{msg.text}</div>
                        <div style={{ fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:3 }}>{new Date(msg.timestamp).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* ردود جاهزة */}
                {showQR && (
                  <div style={{ padding:"8px 16px",borderTop:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.02)",maxHeight:200,overflowY:"auto" }}>
                    {["عام","منح","دفع","متابعة","استشارة"].map(tag=>{
                      const tagReplies = quickReplies.filter(r=>r.tag===tag);
                      if (!tagReplies.length) return null;
                      return (
                        <div key={tag} style={{ marginBottom:8 }}>
                          <div style={{ fontSize:10.5,fontWeight:700,color:"#C8932B",marginBottom:4 }}>{tag}</div>
                          {tagReplies.map(qr=>(
                            <button key={qr.id} onClick={()=>sendReply(qr.text)} style={{ display:"block",width:"100%",textAlign:"right",padding:"6px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,0.08)",background:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,color:"#E8E4DA",marginBottom:3 }}>
                              <strong style={{ color:"#C8932B" }}>{qr.title}</strong> — {qr.text.slice(0,50)}...
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* إرسال */}
                <div style={{ padding:"10px 16px",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",gap:8 }}>
                  <button onClick={()=>setShowQR(s=>!s)} style={{ ...S.btnOut,padding:"8px 10px",flexShrink:0 }} title="ردود جاهزة">⚡</button>
                  <input value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendReply()}
                    placeholder="اكتب رسالة... (Enter للإرسال)" style={{ ...S.input,flex:1,padding:"8px 12px" }} />
                  <button style={{ ...S.btn,background:"#25D366",color:"#fff",flexShrink:0 }} onClick={()=>sendReply()}>إرسال</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── جهات الاتصال ── */}
      {view==="contacts" && (
        <div style={S.card}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12.5 }}>
            <thead>
              <tr>{["العميل","الهاتف","الوكيل المسؤول","التصنيفات","فتح"].map(h=>(
                <th key={h} style={{ padding:"8px 10px",textAlign:"right",fontSize:10.5,fontWeight:700,color:"rgba(255,255,255,0.35)",borderBottom:"1px solid rgba(255,255,255,0.07)" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {conversations.map(s=>(
                <tr key={s.email}>
                  <td style={{ padding:"10px" }}>
                    <div style={{ fontWeight:700 }}>{s.name}</div>
                    <div style={{ fontSize:10.5,color:"rgba(255,255,255,0.35)" }}>{s.email}</div>
                  </td>
                  <td style={{ padding:"10px",direction:"ltr",fontSize:12,color:"rgba(255,255,255,0.6)" }}>{s.phone||"—"}</td>
                  <td style={{ padding:"10px" }}>
                    <select style={{ ...S.input,width:"auto",padding:"4px 8px",fontSize:11.5,cursor:"pointer" }}
                      value={studentAgents[s.email]||""}
                      onChange={e=>assignAgent(s.email, e.target.value)}>
                      <option value="">— غير محدد —</option>
                      {agents.map(a=><option key={a.id} value={a.email}>{a.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding:"10px" }}>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
                      {labels.map(l=>{
                        const has=(studentLabels[s.email]||[]).includes(l.id);
                        return <button key={l.id} onClick={()=>toggleLabel(s.email,l.id)} style={{ fontSize:10.5,padding:"2px 8px",borderRadius:99,border:`1px solid ${has?l.color:"rgba(255,255,255,0.1)"}`,background:has?`${l.color}20`:"none",color:has?l.color:"rgba(255,255,255,0.3)",cursor:"pointer",fontFamily:"inherit",fontWeight:700 }}>{l.name}</button>;
                      })}
                    </div>
                  </td>
                  <td style={{ padding:"10px" }}>
                    {s.phone?<a href={`https://wa.me/${s.phone.replace(/[^0-9+]/g,"")}`} target="_blank" rel="noreferrer" style={{ ...S.btnGreen,padding:"5px 12px",fontSize:11,textDecoration:"none" }}>📱</a>:<span style={{ color:"rgba(255,255,255,0.25)" }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── التصنيفات ── */}
      {view==="labels" && (
        <div>
          <div style={S.card}>
            <div style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>🏷️ إضافة تصنيف جديد</div>
            <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:12 }}>
              <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="اسم التصنيف..." style={{ ...S.input,flex:1 }} onKeyDown={e=>e.key==="Enter"&&addLabel()} />
              <div style={{ display:"flex",gap:4 }}>
                {WA_LABEL_COLORS.map(c=>(
                  <button key={c} onClick={()=>setLabelColor(c)} style={{ width:22,height:22,borderRadius:"50%",background:c,border:labelColor===c?"3px solid #fff":"2px solid transparent",cursor:"pointer",flexShrink:0 }} />
                ))}
              </div>
              <button style={S.btn} onClick={addLabel}>إضافة</button>
            </div>
            {labels.length === 0 ? (
              <div style={{ color:"rgba(255,255,255,0.3)",fontSize:12,textAlign:"center",padding:"12px 0" }}>لا توجد تصنيفات بعد — أضف تصنيفاً جديداً</div>
            ) : (
              <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                {labels.map(l=>(
                  <div key={l.id} style={{ display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:99,border:`1px solid ${l.color}44`,background:`${l.color}15` }}>
                    <span style={{ width:8,height:8,borderRadius:"50%",background:l.color }} />
                    <span style={{ fontSize:12.5,fontWeight:700,color:l.color }}>{l.name}</span>
                    <span style={{ fontSize:11,color:"rgba(255,255,255,0.3)" }}>({allStudents.filter(s=>(studentLabels[s.email]||[]).includes(l.id)).length} عميل)</span>
                    <button onClick={()=>saveLabels(labels.filter(x=>x.id!==l.id))} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.35)",fontSize:12,padding:0 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



// ─── Marketing Tab ────────────────────────────────────────────────────────────
function MarketingTab({ allStudents, S }) {
  const [tab, setTab]       = useState("overview");
  const [campaigns, setCampaigns] = useState(()=>{ try{return JSON.parse(localStorage.getItem("masar_campaigns")||"[]");}catch{return [];} });
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ title:"", channel:"واتساب", target:"all", message:"", status:"draft", budget:"", startDate:"", endDate:"" });
  const [followUps, setFollowUps] = useState(()=>{ try{return JSON.parse(localStorage.getItem("masar_followups")||"[]");}catch{return [];} });
  const [fuModal, setFuModal] = useState(false);
  const [fuForm, setFuForm] = useState({ studentEmail:"", type:"واتساب", date:"", note:"", done:false });

  const saveCampaigns = (l)=>{ setCampaigns(l); localStorage.setItem("masar_campaigns",JSON.stringify(l)); };
  const saveFollowUps = (l)=>{ setFollowUps(l); localStorage.setItem("masar_followups",JSON.stringify(l)); };

  // إحصائيات
  const totalLeads   = allStudents.length;
  const registered   = allStudents.filter(s=>s.status==="registered").length;
  const potential    = allStudents.filter(s=>s.status==="potential").length;
  const newLeads     = allStudents.filter(s=>s.status==="new").length;
  const convRate     = totalLeads ? Math.round(registered/totalLeads*100) : 0;
  const activeCamps  = campaigns.filter(c=>c.status==="active").length;

  // مصادر العملاء
  const bySource = {};
  try { JSON.parse(localStorage.getItem("masar_leads")||"[]").forEach(l=>{ bySource[l.source||"غير محدد"]=(bySource[l.source||"غير محدد"]||0)+1; }); } catch {}
  bySource["تسجيل مباشر"] = totalLeads;

  // follow-ups متأخرة
  const overdueFollowUps = followUps.filter(f=>!f.done&&f.date&&new Date(f.date)<new Date());
  const todayFollowUps   = followUps.filter(f=>!f.done&&f.date&&f.date.split("T")[0]===new Date().toISOString().split("T")[0]);

  const CHANNELS = ["واتساب","إيميل","انستجرام","فيسبوك","تيك توك","يوتيوب","جوجل","SMS"];
  const CH_ICON  = {"واتساب":"📱","إيميل":"📧","انستجرام":"📸","فيسبوك":"👥","تيك توك":"🎵","يوتيوب":"▶️","جوجل":"🔍","SMS":"💬"};
  const ST_STYLE = { draft:{l:"مسودة",c:"rgba(255,255,255,0.4)"}, active:{l:"✅ نشطة",c:"#2F7B6E"}, paused:{l:"⏸ متوقفة",c:"#C8932B"}, done:{l:"✓ منتهية",c:"rgba(255,255,255,0.3)"} };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:"flex",gap:6,marginBottom:16,flexWrap:"wrap" }}>
        {[["overview","📊 نظرة عامة"],["campaigns","📣 الحملات"],["social","🌐 السوشيال ميديا"],["tools","⚡ أدوات"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{ padding:"7px 16px",borderRadius:8,border:tab===v?"none":"1px solid rgba(255,255,255,0.12)",background:tab===v?"#C8932B":"none",color:tab===v?"#13213B":"rgba(255,255,255,0.6)",cursor:"pointer",fontFamily:"inherit",fontSize:12.5,fontWeight:700 }}>{l}</button>
        ))}
        {overdueFollowUps.length>0 && <span style={{ marginRight:"auto",padding:"6px 12px",borderRadius:8,background:"rgba(232,69,69,0.12)",border:"1px solid rgba(232,69,69,0.25)",fontSize:11,color:"#e84545",fontWeight:700 }}>🔴 {overdueFollowUps.length} متابعة متأخرة</span>}
      </div>

      {/* ── نظرة عامة ── */}
      {tab==="overview" && (
        <div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16 }}>
            {[
              { label:"إجمالي العملاء",   num:totalLeads,   color:"#2F7B6E", icon:"👥" },
              { label:"محتملون",           num:potential,    color:"#C8932B", icon:"🎯" },
              { label:"مسجلون",            num:registered,   color:"#6B5DD3", icon:"✅" },
              { label:"جدد",              num:newLeads,     color:"#E8823A", icon:"🆕" },
              { label:"معدل التحويل",     num:`${convRate}%`,color:"#3B9DD4", icon:"📈" },
              { label:"حملات نشطة",       num:activeCamps,  color:"#25D366", icon:"📣" },
            ].map((s,i)=>(
              <div key={i} style={{ ...S.card,marginBottom:0,display:"flex",alignItems:"center",gap:10 }}>
                <span style={{ fontSize:22 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize:22,fontWeight:800,color:s.color,lineHeight:1 }}>{s.num}</div>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <div style={{ ...S.card,marginBottom:14 }}>
            <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>🏆 مسار التحويل</div>
            {[
              { label:"عملاء جدد",      num:newLeads,   total:totalLeads, color:"#E8823A" },
              { label:"محتملون",         num:potential,  total:totalLeads, color:"#C8932B" },
              { label:"مسجلون",          num:registered, total:totalLeads, color:"#2F7B6E" },
            ].map((s,i)=>(
              <div key={i} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:12 }}>{s.label}</span>
                  <span style={{ fontSize:12,fontWeight:700,color:s.color }}>{s.num} ({totalLeads?Math.round(s.num/totalLeads*100):0}%)</span>
                </div>
                <div style={{ height:10,borderRadius:99,background:"rgba(255,255,255,0.06)",overflow:"hidden" }}>
                  <div style={{ height:"100%",background:s.color,width:totalLeads?`${s.num/totalLeads*100}%`:"0%",borderRadius:99,transition:".5s" }} />
                </div>
              </div>
            ))}
          </div>

          {/* مصادر */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <div style={S.card}>
              <div style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>📊 مصادر العملاء</div>
              {Object.entries(bySource).filter(([,v])=>v>0).map(([src,count])=>(
                <div key={src} style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize:12.5,flex:1 }}>{src}</span>
                  <div style={{ width:80,height:5,borderRadius:99,background:"rgba(255,255,255,0.07)",overflow:"hidden" }}>
                    <div style={{ height:"100%",background:"#C8932B",width:`${totalLeads?count/totalLeads*100:0}%`,borderRadius:99 }} />
                  </div>
                  <span style={{ fontSize:11,color:"rgba(255,255,255,0.45)",minWidth:20 }}>{count}</span>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>📅 المتابعات اليوم ({todayFollowUps.length})</div>
              {todayFollowUps.length===0 ? <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",textAlign:"center",padding:"12px 0" }}>لا متابعات اليوم</div>
              : todayFollowUps.slice(0,5).map(f=>{
                const st=allStudents.find(s=>s.email===f.studentEmail);
                return (
                  <div key={f.id} style={{ display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize:14 }}>{f.type==="واتساب"?"📱":f.type==="مكالمة"?"📞":"📧"}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12.5,fontWeight:600 }}>{st?.name||f.studentEmail}</div>
                      <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>{f.note||f.type}</div>
                    </div>
                    <button onClick={()=>saveFollowUps(followUps.map(x=>x.id===f.id?{...x,done:true}:x))} style={{ background:"none",border:"none",cursor:"pointer",fontSize:16 }}>✅</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── الحملات ── */}
      {tab==="campaigns" && (
        <div>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
            <span style={{ fontWeight:700,fontSize:13 }}>📣 الحملات الإعلانية ({campaigns.length})</span>
            <button style={S.btn} onClick={()=>setModal(true)}><i className="ti ti-plus" style={{ fontSize:13 }} /> حملة جديدة</button>
          </div>
          {campaigns.length===0 ? (
            <div style={{ ...S.card,textAlign:"center",padding:"32px 0",color:"rgba(255,255,255,0.3)" }}>
              <div style={{ fontSize:32,marginBottom:8 }}>📣</div>
              <div>لا توجد حملات بعد — أضف حملتك الأولى</div>
            </div>
          ) : campaigns.map(c=>(
            <div key={c.id} style={{ ...S.card,marginBottom:8 }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:12 }}>
                <span style={{ fontSize:24,flexShrink:0 }}>{CH_ICON[c.channel]||"📢"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                    <span style={{ fontWeight:700,fontSize:13 }}>{c.title}</span>
                    <select style={{ ...S.input,width:"auto",padding:"2px 8px",fontSize:11,cursor:"pointer" }} value={c.status}
                      onChange={e=>saveCampaigns(campaigns.map(x=>x.id===c.id?{...x,status:e.target.value}:x))}>
                      {Object.entries(ST_STYLE).map(([v,s])=><option key={v} value={v}>{s.l}</option>)}
                    </select>
                  </div>
                  <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                    <span style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>📱 {c.channel}</span>
                    <span style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>🎯 {c.target==="all"?"الكل":c.target==="new"?"جدد":"مسجلون"}</span>
                    {c.budget && <span style={{ fontSize:11,color:"#C8932B" }}>💰 {c.budget} ج</span>}
                    {c.startDate && <span style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>📅 {new Date(c.startDate).toLocaleDateString("ar-EG")}</span>}
                  </div>
                  {c.message && <div style={{ fontSize:11.5,color:"rgba(255,255,255,0.55)",marginTop:6,background:"rgba(255,255,255,0.03)",padding:"6px 10px",borderRadius:6 }}>{c.message.slice(0,100)}{c.message.length>100?"...":""}</div>}
                </div>
                <button style={{ ...S.btnRed,padding:"5px 9px",fontSize:11,flexShrink:0 }} onClick={()=>saveCampaigns(campaigns.filter(x=>x.id!==c.id))}>🗑️</button>
              </div>
            </div>
          ))}

          {modal && (
            <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99 }} onClick={()=>setModal(false)}>
              <div style={{ background:"#162035",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:22,width:500,maxWidth:"92%",maxHeight:"90vh",overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
                <div style={{ fontWeight:800,fontSize:15,marginBottom:14 }}>حملة إعلانية جديدة</div>
                <div style={{ marginBottom:10 }}>
                  <label style={S.label}>عنوان الحملة *</label>
                  <input style={S.input} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="مثال: حملة منح تركيا 2026" />
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
                  <div><label style={S.label}>القناة</label>
                    <select style={{ ...S.input,cursor:"pointer" }} value={form.channel} onChange={e=>setForm(f=>({...f,channel:e.target.value}))}>
                      {CHANNELS.map(c=><option key={c}>{c}</option>)}
                    </select></div>
                  <div><label style={S.label}>الجمهور المستهدف</label>
                    <select style={{ ...S.input,cursor:"pointer" }} value={form.target} onChange={e=>setForm(f=>({...f,target:e.target.value}))}>
                      <option value="all">الكل ({totalLeads})</option>
                      <option value="new">محتملون جدد ({newLeads})</option>
                      <option value="potential">محتملون ({potential})</option>
                      <option value="registered">مسجلون ({registered})</option>
                    </select></div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10 }}>
                  <div><label style={S.label}>الميزانية (ج)</label>
                    <input type="number" style={S.input} value={form.budget} onChange={e=>setForm(f=>({...f,budget:e.target.value}))} placeholder="0" /></div>
                  <div><label style={S.label}>تاريخ البدء</label>
                    <input type="date" style={S.input} value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} /></div>
                  <div><label style={S.label}>تاريخ الانتهاء</label>
                    <input type="date" style={S.input} value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))} /></div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={S.label}>رسالة/وصف الحملة</label>
                  <textarea style={{ ...S.textarea,minHeight:80 }} value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} placeholder="نص الرسالة أو وصف الحملة..." />
                </div>
                <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                  <button style={S.btnOut} onClick={()=>setModal(false)}>إلغاء</button>
                  <button style={S.btn} onClick={()=>{ if(!form.title)return; saveCampaigns([...campaigns,{...form,id:Date.now().toString(),date:new Date().toISOString()}]); setModal(false); setForm({title:"",channel:"واتساب",target:"all",message:"",status:"draft",budget:"",startDate:"",endDate:""}); }}>💾 حفظ</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ── أدوات ── */}
      {tab==="tools" && (
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
          <div style={S.card}>
            <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>📤 تصدير البيانات</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {[
                { label:"كل العملاء CSV", icon:"📥", fn:()=>{ const rows=allStudents.map(s=>({ "الاسم":s.name,"الإيميل":s.email,"الهاتف":s.phone||"","الخدمة":s.serviceType||"","الحالة":s.status })); const h=Object.keys(rows[0]||{}); const csv=[h.join(","),...rows.map(r=>h.map(k=>`"${r[k]}"`).join(","))].join("\n"); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv"})); a.download="كل_العملاء.csv"; a.click(); } },
                { label:"المسجلون فقط CSV", icon:"📥", fn:()=>{ const rows=allStudents.filter(s=>s.status==="registered").map(s=>({ "الاسم":s.name,"الإيميل":s.email,"الهاتف":s.phone||"","المنحة":s.scholarship||"" })); const h=Object.keys(rows[0]||{}); const csv=[h.join(","),...rows.map(r=>h.map(k=>`"${r[k]}"`).join(","))].join("\n"); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv"})); a.download="المسجلون.csv"; a.click(); } },
              ].map(t=>(
                <button key={t.label} style={{ ...S.btnOut,justifyContent:"flex-start",padding:"10px 14px" }} onClick={t.fn}>{t.icon} {t.label}</button>
              ))}
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>📋 نسخ البيانات</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {[
                { label:`نسخ أرقام واتساب (${allStudents.filter(s=>s.phone).length})`, icon:"📱", fn:()=>{ navigator.clipboard.writeText(allStudents.filter(s=>s.phone).map(s=>s.phone).join("\n")); alert("✅ تم النسخ"); } },
                { label:"نسخ قائمة الإيميلات", icon:"📧", fn:()=>{ navigator.clipboard.writeText(allStudents.filter(s=>s.email&&!s.email.includes("@masar")).map(s=>s.email).join(", ")); alert("✅ تم النسخ"); } },
                { label:"نسخ المحتملين الجدد", icon:"🆕", fn:()=>{ const txt=allStudents.filter(s=>s.status==="new").map(s=>`${s.name} - ${s.phone||s.email}`).join("\n"); navigator.clipboard.writeText(txt); alert("✅ تم النسخ"); } },
              ].map(t=>(
                <button key={t.label} style={{ ...S.btnOut,justifyContent:"flex-start",padding:"10px 14px" }} onClick={t.fn}>{t.icon} {t.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Email Tab ────────────────────────────────────────────────────────────────
function EmailTab({ allStudents, staffInfo, S }) {
  const [tab, setTab]       = useState("compose");
  const [signature, setSignature] = useState(()=>{ try{return localStorage.getItem(`masar_sig_${staffInfo?.email}`)||"";}catch{return "";} });
  const [editSig, setEditSig] = useState(false);
  const [tempSig, setTempSig] = useState(signature);

  const [compose, setCompose] = useState({ to:"", subject:"", body:"", template:"" });
  const [bulk, setBulk]       = useState({ target:"all", subject:"", body:"" });
  const [sentEmails, setSentEmails] = useState(()=>{ try{return JSON.parse(localStorage.getItem("masar_sent_emails")||"[]");}catch{return [];} });
  const [templates, setTemplates] = useState(()=>{ try{return JSON.parse(localStorage.getItem("masar_email_templates")||"[]");}catch{return DEFAULT_EMAIL_TEMPLATES;} });
  const [tplModal, setTplModal] = useState(false);
  const [tplForm, setTplForm] = useState({ name:"", subject:"", body:"" });

  const saveSig = () => { localStorage.setItem(`masar_sig_${staffInfo?.email}`, tempSig); setSignature(tempSig); setEditSig(false); };
  const saveTemplates = (l)=>{ setTemplates(l); localStorage.setItem("masar_email_templates",JSON.stringify(l)); };
  const logSent = (email)=>{ const list=[{...email,sentBy:staffInfo?.name,date:new Date().toISOString(),id:Date.now().toString()},...sentEmails].slice(0,50); setSentEmails(list); localStorage.setItem("masar_sent_emails",JSON.stringify(list)); };

  const DEFAULT_EMAIL_TEMPLATES = [
    { id:"t1", name:"ترحيب",        subject:"أهلاً بك في مسار للاستشارات",  body:"عزيزي {اسم الطالب}،\n\nأهلاً وسهلاً بك في مسار للاستشارات التعليمية! 🌟\n\nيسعدنا انضمامك إلينا. فريقنا جاهز لمساعدتك في رحلتك نحو المنحة المثالية.\n\nللتواصل المباشر، يمكنك التواصل معنا على واتساب أو من خلال موقعنا.\n\nمع أطيب التحيات،" },
    { id:"t2", name:"تأكيد الموعد", subject:"تأكيد موعد استشارتك مع مسار", body:"عزيزي {اسم الطالب}،\n\nنؤكد لك موعد استشارتك:\n\n📅 التاريخ: {التاريخ}\n⏰ الوقت: {الوقت}\n👨‍💼 الاستشاري: {الاستشاري}\n\nنتمنى لك جلسة مثمرة! 🌟\n\nمع أطيب التحيات،" },
    { id:"t3", name:"اكتمال الملف", subject:"🎉 ملفك جاهز للتحميل",          body:"عزيزي {اسم الطالب}،\n\nيسعدنا إخبارك أن ملفك قد اكتمل وأصبح جاهزاً للتحميل! 🎉\n\nيمكنك الدخول لحسابك الآن وتحميل الملفات بالصيغة التي تناسبك.\n\nنتمنى لك التوفيق في التقديم على منحتك! 🌟\n\nمع أطيب التحيات،" },
    { id:"t4", name:"طلب المستندات",subject:"المستندات المطلوبة لملفك",    body:"عزيزي {اسم الطالب}،\n\nلإكمال ملفك نحتاج المستندات التالية:\n\n✅ صورة جواز السفر (ساري المفعول)\n✅ كشف الدرجات الرسمي\n✅ صورة شهادة التخرج\n✅ صورة شخصية بخلفية بيضاء\n\nيرجى رفعها في أقرب وقت من خلال حسابك.\n\nمع أطيب التحيات،" },
  ];

  // فتح Gmail بالرسالة جاهزة
  const openGmail = (to, subject, body) => {
    const fullBody = body + (signature ? "\n\n--\n" + signature : "");
    const url = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;
    window.open(url, "_blank");
    logSent({ to, subject, body });
  };

  // فتح Outlook
  const openOutlook = (to, subject, body) => {
    const fullBody = body + (signature ? "\n\n--\n" + signature : "");
    const url = `https://outlook.live.com/owa/?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;
    window.open(url, "_blank");
    logSent({ to, subject, body });
  };

  // mailto fallback
  const openMailto = (to, subject, body) => {
    const fullBody = body + (signature ? "\n\n--\n" + signature : "");
    window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`);
    logSent({ to, subject, body });
  };

  // Bulk email
  const getTargetStudents = () => {
    if (bulk.target === "all") return allStudents.filter(s=>s.email&&!s.email.includes("@masar"));
    return allStudents.filter(s=>s.email&&!s.email.includes("@masar")&&s.status===bulk.target);
  };

  const sendBulk = (method) => {
    const targets = getTargetStudents();
    if (!targets.length) { alert("لا يوجد عملاء لهذا الفلتر"); return; }
    if (!bulk.subject || !bulk.body) { alert("يرجى كتابة الموضوع والرسالة"); return; }
    const emails = targets.map(s=>s.email).join(",");
    const fullBody = bulk.body + (signature ? "\n\n--\n" + signature : "");
    if (method === "gmail")   window.open(`https://mail.google.com/mail/?view=cm&bcc=${encodeURIComponent(emails)}&su=${encodeURIComponent(bulk.subject)}&body=${encodeURIComponent(fullBody)}`, "_blank");
    else window.open(`mailto:${emails}?subject=${encodeURIComponent(bulk.subject)}&body=${encodeURIComponent(fullBody)}`);
    logSent({ to:`${targets.length} عميل`, subject:bulk.subject, body:bulk.body });
    alert(`✅ تم فتح ${method === "gmail" ? "Gmail" : "برنامج الإيميل"} بـ ${targets.length} عميل`);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
        <div>
          <div style={{ fontWeight:800,fontSize:15 }}>📧 مركز الإيميلات</div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:2 }}>أرسل إيميلات فردية أو جماعية للطلاب</div>
        </div>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          <div style={{ fontSize:11,padding:"5px 12px",borderRadius:8,background:"rgba(234,67,53,0.1)",border:"1px solid rgba(234,67,53,0.2)",color:"#EA4335",fontWeight:700 }}>
            📧 يعمل عبر Gmail / Outlook
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {[["compose","✍️ إنشاء إيميل"],["bulk","📤 إرسال جماعي"],["templates","📋 القوالب"],["signature","✒️ التوقيع"],["sent","📬 المرسلة"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{ padding:"6px 14px",borderRadius:8,border:tab===v?"none":"1px solid rgba(255,255,255,0.12)",background:tab===v?"#C8932B":"none",color:tab===v?"#13213B":"rgba(255,255,255,0.6)",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>{l}</button>
        ))}
      </div>

      {/* ── إنشاء إيميل ── */}
      {tab==="compose" && (
        <div style={S.card}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>✍️ إنشاء إيميل جديد</div>
          <div style={{ marginBottom:10 }}>
            <label style={S.label}>المستلم</label>
            <div style={{ display:"flex",gap:8 }}>
              <input style={{ ...S.input,flex:1 }} value={compose.to} onChange={e=>setCompose(c=>({...c,to:e.target.value}))} placeholder="email@example.com" />
              <select style={{ ...S.input,width:200,cursor:"pointer" }} onChange={e=>{ if(e.target.value) setCompose(c=>({...c,to:e.target.value})); }}>
                <option value="">اختر من الطلاب...</option>
                {allStudents.filter(s=>s.email&&!s.email.includes("@masar")).map(s=><option key={s.email} value={s.email}>{s.name} — {s.email}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={S.label}>القالب (اختياري)</label>
            <select style={{ ...S.input,cursor:"pointer" }} onChange={e=>{
              const t = [...templates, ...DEFAULT_EMAIL_TEMPLATES].find(x=>x.id===e.target.value);
              if (t) setCompose(c=>({...c, subject:t.subject, body:t.body}));
            }}>
              <option value="">— اختر قالباً —</option>
              {[...DEFAULT_EMAIL_TEMPLATES,...templates].map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={S.label}>الموضوع</label>
            <input style={S.input} value={compose.subject} onChange={e=>setCompose(c=>({...c,subject:e.target.value}))} placeholder="موضوع الإيميل" />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={S.label}>نص الرسالة</label>
            <textarea style={{ ...S.textarea,minHeight:160 }} value={compose.body} onChange={e=>setCompose(c=>({...c,body:e.target.value}))} placeholder="اكتب رسالتك هنا..." />
            {signature && <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:4 }}>✒️ سيُضاف توقيعك تلقائياً</div>}
          </div>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            <button style={{ ...S.btn,background:"#EA4335",color:"#fff" }} onClick={()=>{ if(!compose.to||!compose.subject){alert("يرجى تحديد المستلم والموضوع");return;} openGmail(compose.to,compose.subject,compose.body); }}>
              📧 فتح في Gmail
            </button>
            <button style={{ ...S.btnOut }} onClick={()=>{ if(!compose.to||!compose.subject){alert("يرجى تحديد المستلم والموضوع");return;} openOutlook(compose.to,compose.subject,compose.body); }}>
              📧 فتح في Outlook
            </button>
            <button style={{ ...S.btnOut }} onClick={()=>{ if(!compose.to||!compose.subject){alert("يرجى تحديد المستلم والموضوع");return;} openMailto(compose.to,compose.subject,compose.body); }}>
              📧 برنامج الإيميل
            </button>
          </div>
        </div>
      )}

      {/* ── إرسال جماعي ── */}
      {tab==="bulk" && (
        <div>
          <div style={{ ...S.card,marginBottom:12,padding:14,background:"rgba(200,147,43,0.06)",border:"1px solid rgba(200,147,43,0.2)" }}>
            <div style={{ fontSize:12.5,lineHeight:1.8 }}>
              <strong style={{ color:"#C8932B" }}>📌 كيف يعمل الإرسال الجماعي؟</strong><br/>
              بيفتح Gmail/Outlook مع كل الإيميلات في حقل BCC — الطلاب مش بيشوفوا بعض. لإرسال حقيقي من الـ CRM محتاج SMTP API (SendGrid أو Mailgun).
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>📤 إرسال جماعي</div>
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>الجمهور المستهدف</label>
              <select style={{ ...S.input,cursor:"pointer",maxWidth:300 }} value={bulk.target} onChange={e=>setBulk(b=>({...b,target:e.target.value}))}>
                <option value="all">كل الطلاب ({allStudents.filter(s=>s.email&&!s.email.includes("@masar")).length} إيميل)</option>
                <option value="new">محتملون جدد ({allStudents.filter(s=>s.status==="new").length})</option>
                <option value="potential">محتملون ({allStudents.filter(s=>s.status==="potential").length})</option>
                <option value="registered">مسجلون ({allStudents.filter(s=>s.status==="registered").length})</option>
              </select>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>الموضوع</label>
              <input style={S.input} value={bulk.subject} onChange={e=>setBulk(b=>({...b,subject:e.target.value}))} placeholder="موضوع الإيميل الجماعي" />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={S.label}>نص الرسالة</label>
              <textarea style={{ ...S.textarea,minHeight:140 }} value={bulk.body} onChange={e=>setBulk(b=>({...b,body:e.target.value}))} placeholder="اكتب رسالتك هنا..." />
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button style={{ ...S.btn,background:"#EA4335",color:"#fff" }} onClick={()=>sendBulk("gmail")}>
                📧 إرسال عبر Gmail ({getTargetStudents().length})
              </button>
              <button style={S.btnOut} onClick={()=>sendBulk("mailto")}>
                📧 برنامج الإيميل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── القوالب ── */}
      {tab==="templates" && (
        <div>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
            <span style={{ fontWeight:700,fontSize:13 }}>📋 قوالب الإيميل</span>
            <button style={S.btn} onClick={()=>setTplModal(true)}><i className="ti ti-plus" style={{ fontSize:13 }} /> قالب جديد</button>
          </div>
          {[...DEFAULT_EMAIL_TEMPLATES,...templates].map(t=>(
            <div key={t.id} style={{ ...S.card,marginBottom:8 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
                <div style={{ fontWeight:700,fontSize:13 }}>{t.name}</div>
                <div style={{ display:"flex",gap:6 }}>
                  <button style={{ ...S.btn,padding:"4px 10px",fontSize:11 }} onClick={()=>{ setCompose(c=>({...c,subject:t.subject,body:t.body})); setTab("compose"); }}>استخدام</button>
                  {!t.id.startsWith("t") && <button style={{ ...S.btnRed,padding:"4px 9px",fontSize:11 }} onClick={()=>saveTemplates(templates.filter(x=>x.id!==t.id))}>🗑️</button>}
                </div>
              </div>
              <div style={{ fontSize:12,color:"#C8932B",marginBottom:4 }}>📧 {t.subject}</div>
              <div style={{ fontSize:11.5,color:"rgba(255,255,255,0.5)",lineHeight:1.6,background:"rgba(255,255,255,0.03)",padding:"8px 10px",borderRadius:6,whiteSpace:"pre-line" }}>{t.body.slice(0,120)}...</div>
            </div>
          ))}
          {tplModal && (
            <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99 }} onClick={()=>setTplModal(false)}>
              <div style={{ background:"#162035",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:22,width:480,maxWidth:"92%" }} onClick={e=>e.stopPropagation()}>
                <div style={{ fontWeight:800,fontSize:15,marginBottom:14 }}>قالب جديد</div>
                <div style={{ marginBottom:10 }}><label style={S.label}>اسم القالب</label><input style={S.input} value={tplForm.name} onChange={e=>setTplForm(f=>({...f,name:e.target.value}))} /></div>
                <div style={{ marginBottom:10 }}><label style={S.label}>الموضوع</label><input style={S.input} value={tplForm.subject} onChange={e=>setTplForm(f=>({...f,subject:e.target.value}))} /></div>
                <div style={{ marginBottom:14 }}><label style={S.label}>نص الرسالة</label><textarea style={{ ...S.textarea,minHeight:120 }} value={tplForm.body} onChange={e=>setTplForm(f=>({...f,body:e.target.value}))} /></div>
                <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                  <button style={S.btnOut} onClick={()=>setTplModal(false)}>إلغاء</button>
                  <button style={S.btn} onClick={()=>{ if(!tplForm.name)return; saveTemplates([...templates,{...tplForm,id:Date.now().toString()}]); setTplModal(false); setTplForm({name:"",subject:"",body:""}); }}>💾 حفظ</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── التوقيع ── */}
      {tab==="signature" && (
        <div style={S.card}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>✒️ توقيع البريد الإلكتروني</div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.45)",marginBottom:14,lineHeight:1.7 }}>
            التوقيع يُضاف تلقائياً في نهاية كل إيميل ترسله. يمكنك استخدام النص العادي.
          </div>
          {!editSig ? (
            <div>
              {signature ? (
                <div style={{ padding:"14px",borderRadius:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",marginBottom:12,whiteSpace:"pre-line",fontSize:13,lineHeight:1.7 }}>{signature}</div>
              ) : (
                <div style={{ padding:"14px",borderRadius:8,background:"rgba(255,255,255,0.03)",fontSize:12,color:"rgba(255,255,255,0.3)",marginBottom:12,textAlign:"center" }}>لا يوجد توقيع بعد</div>
              )}
              <button style={S.btn} onClick={()=>{ setTempSig(signature); setEditSig(true); }}>✏️ {signature?"تعديل التوقيع":"إضافة توقيع"}</button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom:8 }}>
                <label style={S.label}>مثال على التوقيع:</label>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:8,whiteSpace:"pre-line" }}>
                  {`${staffInfo?.name || "اسمك"}\nاستشاري تعليمي — مسار للاستشارات\nواتساب: 01xxxxxxxxx\nالموقع: www.masar.com`}
                </div>
              </div>
              <textarea style={{ ...S.textarea,minHeight:120,marginBottom:12 }} value={tempSig} onChange={e=>setTempSig(e.target.value)} placeholder={`${staffInfo?.name || "اسمك"}\nاستشاري تعليمي — مسار للاستشارات\nواتساب: 01xxxxxxxxx`} />
              <div style={{ display:"flex",gap:8 }}>
                <button style={S.btn} onClick={saveSig}>💾 حفظ التوقيع</button>
                <button style={S.btnOut} onClick={()=>setEditSig(false)}>إلغاء</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── المرسلة ── */}
      {tab==="sent" && (
        <div style={S.card}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>📬 سجل الإيميلات المرسلة</div>
          {sentEmails.length===0 ? (
            <div style={{ textAlign:"center",color:"rgba(255,255,255,0.3)",padding:"24px 0",fontSize:12 }}>
              <div style={{ fontSize:28,marginBottom:6 }}>📬</div>لا توجد إيميلات مرسلة بعد
            </div>
          ) : sentEmails.map(e=>(
            <div key={e.id} style={{ padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3 }}>
                <span style={{ fontSize:12.5,fontWeight:700 }}>{e.subject}</span>
                <span style={{ fontSize:10.5,color:"rgba(255,255,255,0.3)" }}>{new Date(e.date).toLocaleDateString("ar-EG")} {new Date(e.date).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}</span>
              </div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>إلى: {e.to} {e.sentBy&&`· بواسطة: ${e.sentBy}`}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Follow Up Tab ────────────────────────────────────────────────────────────
function FollowUpTab({ allStudents, staffInfo, S }) {
  const staffList = getStaffList();
  const myRole    = staffList.find(s=>s.email===staffInfo?.email)?.role || "consultant";
  const isAdmin   = myRole === "admin";

  const [followUps, setFollowUps] = useState(()=>{ try{return JSON.parse(localStorage.getItem("masar_followups")||"[]");}catch{return [];} });
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({ studentEmail:"", type:"مكالمة", date:"", note:"", assignedTo:"", done:false });
  const [filter, setFilter]       = useState("pending"); // pending | overdue | done | all
  const [search, setSearch]       = useState("");

  const save = (list) => { setFollowUps(list); localStorage.setItem("masar_followups", JSON.stringify(list)); };
  const now  = new Date();

  const addFollowUp = () => {
    if (!form.studentEmail || !form.date) { alert("يرجى اختيار العميل والتاريخ"); return; }
    const newFU = { ...form, id:Date.now().toString(), createdAt:new Date().toISOString(), createdBy:staffInfo?.name||"موظف" };
    save([...followUps, newFU]);
    setModal(false);
    setForm({ studentEmail:"", type:"مكالمة", date:"", note:"", assignedTo:"", done:false });
  };

  // فلترة حسب الدور
  const myFollowUps = isAdmin ? followUps :
    followUps.filter(f => f.assignedTo===staffInfo?.email || f.createdBy===staffInfo?.name || !f.assignedTo);

  const filtered = myFollowUps.filter(f => {
    const isOverdue = !f.done && f.date && new Date(f.date) < now;
    const isPending = !f.done && !isOverdue;
    const matchSearch = !search || allStudents.find(s=>s.email===f.studentEmail)?.name?.includes(search);
    if (!matchSearch) return false;
    if (filter === "overdue") return isOverdue;
    if (filter === "pending") return isPending;
    if (filter === "done")    return f.done;
    return true;
  }).sort((a,b) => new Date(a.date) - new Date(b.date));

  const overdueCount  = myFollowUps.filter(f=>!f.done&&f.date&&new Date(f.date)<now).length;
  const pendingCount  = myFollowUps.filter(f=>!f.done&&(!f.date||new Date(f.date)>=now)).length;
  const todayCount    = myFollowUps.filter(f=>!f.done&&f.date&&f.date.split("T")[0]===now.toISOString().split("T")[0]).length;

  const TYPE_ICON = { "مكالمة":"📞", "واتساب":"📱", "إيميل":"📧", "اجتماع":"🤝", "متابعة":"🔄" };

  // إحصائيات المدير — من الأكثر تأخيراً
  const staffOverdue = isAdmin ? staffList.map(s => ({
    name: s.name,
    email: s.email,
    role: s.role,
    overdue: followUps.filter(f=>!f.done&&f.date&&new Date(f.date)<now&&(f.assignedTo===s.email||f.createdBy===s.name)).length,
  })).filter(s=>s.overdue>0).sort((a,b)=>b.overdue-a.overdue) : [];

  return (
    <div>
      {/* Header Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16 }}>
        {[
          { label:"كل المتابعات",  num:myFollowUps.length,                                     color:"#2F7B6E" },
          { label:"اليوم",         num:todayCount,                                               color:"#3B9DD4" },
          { label:"قادمة",         num:pendingCount,                                             color:"#C8932B" },
          { label:"🔴 متأخرة",    num:overdueCount, bg:overdueCount>0?"rgba(232,69,69,0.1)":undefined, color:"#e84545" },
        ].map((s,i)=>(
          <div key={i} style={{ ...S.card,marginBottom:0,background:s.bg||"#162035",cursor:"pointer" }}
            onClick={()=>setFilter(i===3?"overdue":i===2?"pending":i===1?"pending":"all")}>
            <div style={{ fontSize:24,fontWeight:800,color:s.color,lineHeight:1 }}>{s.num}</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* تنبيه للمدير: مين متأخر */}
      {isAdmin && staffOverdue.length > 0 && (
        <div style={{ ...S.card,marginBottom:14,border:"1px solid rgba(232,69,69,0.25)",background:"rgba(232,69,69,0.05)" }}>
          <div style={{ fontWeight:700,fontSize:13,color:"#e84545",marginBottom:10 }}>🔴 موظفون متأخرون في المتابعة</div>
          <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
            {staffOverdue.map(s=>(
              <div key={s.email} style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 12px",borderRadius:8,background:"rgba(232,69,69,0.08)",border:"1px solid rgba(232,69,69,0.2)" }}>
                <span style={{ fontSize:14 }}>👤</span>
                <span style={{ fontSize:12.5,fontWeight:700 }}>{s.name}</span>
                <span style={{ fontSize:11,padding:"1px 7px",borderRadius:99,background:"rgba(232,69,69,0.2)",color:"#e84545",fontWeight:700 }}>{s.overdue} متأخرة</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters + Add */}
      <div style={{ display:"flex",gap:8,marginBottom:12,alignItems:"center",flexWrap:"wrap" }}>
        <div style={{ display:"flex",gap:6 }}>
          {[["all","الكل"],["pending","🟡 قادمة"],["overdue","🔴 متأخرة"],["done","✅ منجزة"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{ padding:"6px 12px",borderRadius:7,border:filter===v?"none":"1px solid rgba(255,255,255,0.1)",background:filter===v?"#C8932B":"none",color:filter===v?"#13213B":"rgba(255,255,255,0.6)",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>{l}</button>
          ))}
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم..." style={{ ...S.input,width:180,padding:"6px 10px",fontSize:12 }} />
        <button style={{ ...S.btn,marginRight:"auto" }} onClick={()=>setModal(true)}>
          <i className="ti ti-plus" style={{ fontSize:13 }} /> متابعة جديدة
        </button>
      </div>

      {/* القائمة */}
      {filtered.length === 0 ? (
        <div style={{ ...S.card,textAlign:"center",padding:"32px 0",color:"rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize:32,marginBottom:8 }}>🔄</div>
          <div>{filter==="overdue"?"لا توجد متابعات متأخرة ✅":"لا توجد متابعات"}</div>
        </div>
      ) : filtered.map(f => {
        const student    = allStudents.find(s=>s.email===f.studentEmail);
        const isOverdue  = !f.done && f.date && new Date(f.date) < now;
        const isToday    = !f.done && f.date && f.date.split("T")[0] === now.toISOString().split("T")[0];
        const hoursLate  = isOverdue ? Math.round((now-new Date(f.date))/3600000) : 0;
        const assignee   = staffList.find(s=>s.email===f.assignedTo);
        return (
          <div key={f.id} style={{ ...S.card,marginBottom:8,
            borderColor:isOverdue?"rgba(232,69,69,0.35)":isToday?"rgba(200,147,43,0.3)":undefined,
            background:isOverdue?"rgba(232,69,69,0.05)":isToday?"rgba(200,147,43,0.04)":undefined,
            opacity:f.done?0.5:1 }}>
            <div style={{ display:"flex",alignItems:"flex-start",gap:12 }}>
              <div style={{ fontSize:24,flexShrink:0 }}>{TYPE_ICON[f.type]||"🔄"}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700,fontSize:13 }}>{student?.name||f.studentEmail}</span>
                  <span style={{ fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:700,
                    background:isOverdue?"rgba(232,69,69,0.15)":isToday?"rgba(200,147,43,0.15)":"rgba(255,255,255,0.07)",
                    color:isOverdue?"#e84545":isToday?"#C8932B":"rgba(255,255,255,0.5)" }}>
                    {isOverdue?`متأخر ${hoursLate} ساعة`:isToday?"اليوم":f.type}
                  </span>
                  {f.type && !isOverdue && !isToday && <span style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>{f.type}</span>}
                  {assignee && <span style={{ fontSize:10.5,color:"rgba(255,255,255,0.35)" }}>👤 {assignee.name}</span>}
                  {f.done && <span style={{ fontSize:11,color:"#2F7B6E" }}>✅ منجزة</span>}
                </div>
                {f.note && <div style={{ fontSize:12,color:"rgba(255,255,255,0.55)",marginBottom:4 }}>{f.note}</div>}
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>
                  📅 {f.date ? `${new Date(f.date).toLocaleDateString("ar-EG")} ${new Date(f.date).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}` : "بدون موعد"}
                  {student?.phone && <span style={{ marginRight:8 }}>· 📱 {student.phone}</span>}
                </div>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:5,flexShrink:0 }}>
                {!f.done && (
                  <>
                    {student?.phone && (
                      <a href={`https://wa.me/${student.phone.replace(/[^0-9+]/g,"")}`} target="_blank" rel="noreferrer"
                        style={{ ...S.btnGreen,padding:"5px 10px",fontSize:11,textDecoration:"none" }}>📱</a>
                    )}
                    <button style={{ ...S.btn,padding:"5px 10px",fontSize:11 }}
                      onClick={()=>save(followUps.map(x=>x.id===f.id?{...x,done:true,doneAt:new Date().toISOString()}:x))}>
                      ✅ تم
                    </button>
                  </>
                )}
                <button style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",fontSize:14 }}
                  onClick={()=>save(followUps.filter(x=>x.id!==f.id))}>🗑️</button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Modal */}
      {modal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99 }} onClick={()=>setModal(false)}>
          <div style={{ background:"#162035",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:22,width:440,maxWidth:"92%" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:800,fontSize:15,marginBottom:14 }}>🔄 متابعة جديدة</div>
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>العميل *</label>
              <select style={{ ...S.input,cursor:"pointer" }} value={form.studentEmail} onChange={e=>setForm(f=>({...f,studentEmail:e.target.value}))}>
                <option value="">— اختر عميلاً —</option>
                {allStudents.map(s=><option key={s.email} value={s.email}>{s.name}{s.phone?` · ${s.phone}`:""}</option>)}
              </select>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
              <div>
                <label style={S.label}>نوع المتابعة</label>
                <select style={{ ...S.input,cursor:"pointer" }} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  {["مكالمة","واتساب","إيميل","اجتماع","متابعة"].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>تعيين لـ</label>
                <select style={{ ...S.input,cursor:"pointer" }} value={form.assignedTo} onChange={e=>setForm(f=>({...f,assignedTo:e.target.value}))}>
                  <option value="">— لي —</option>
                  {staffList.map(s=><option key={s.id} value={s.email}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>التاريخ والوقت *</label>
              <input type="datetime-local" style={S.input} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={S.label}>ملاحظة</label>
              <textarea style={{ ...S.textarea,minHeight:60 }} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="وصف المتابعة..." />
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button style={S.btnOut} onClick={()=>setModal(false)}>إلغاء</button>
              <button style={S.btn} onClick={addFollowUp}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Search Tab ───────────────────────────────────────────────────────────────
function SearchTab({ allStudents, staffInfo, setSelectedEmail, setActiveTab, S }) {
  const [query, setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = (q) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    const lower = q.toLowerCase();
    const found = allStudents.filter(s =>
      s.name?.toLowerCase().includes(lower) ||
      s.email?.toLowerCase().includes(lower) ||
      s.phone?.includes(q) ||
      s.scholarship?.toLowerCase().includes(lower) ||
      s.serviceType?.toLowerCase().includes(lower) ||
      s.country?.toLowerCase().includes(lower) ||
      s.status?.includes(lower)
    );
    // بحث في المهام
    const tasks = (() => { try { return JSON.parse(localStorage.getItem("masar_tasks")||"[]"); } catch { return []; } })();
    const foundTasks = tasks.filter(t => t.title?.toLowerCase().includes(lower));
    // بحث في المتابعات
    const followUps = (() => { try { return JSON.parse(localStorage.getItem("masar_followups")||"[]"); } catch { return []; } })();
    const foundFups = followUps.filter(f => f.note?.toLowerCase().includes(lower) || allStudents.find(s=>s.email===f.studentEmail)?.name?.toLowerCase().includes(lower));
    setResults({ students: found, tasks: foundTasks, followUps: foundFups });
    setSearched(true);
  };

  const totalResults = searched ? (results.students?.length||0) + (results.tasks?.length||0) + (results.followUps?.length||0) : 0;

  return (
    <div>
      {/* Search Box */}
      <div style={{ ...S.card,marginBottom:16 }}>
        <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>🔍 البحث الشامل</div>
        <div style={{ position:"relative" }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); doSearch(e.target.value); }}
            placeholder="ابحث بالاسم، الإيميل، الهاتف، المنحة، الخدمة، البلد..."
            style={{ ...S.input, padding:"12px 44px 12px 14px", fontSize:14 }}
            onKeyDown={e => e.key==="Enter" && doSearch(query)}
          />
          <i className="ti ti-search" style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:18,color:"rgba(255,255,255,0.3)" }} />
          {query && <button onClick={()=>{ setQuery(""); setResults([]); setSearched(false); }} style={{ position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:18 }}>✕</button>}
        </div>
        {searched && <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:8 }}>نتائج البحث عن "{query}": {totalResults} نتيجة</div>}
      </div>

      {/* No results */}
      {searched && totalResults === 0 && (
        <div style={{ ...S.card,textAlign:"center",padding:"32px 0",color:"rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize:32,marginBottom:8 }}>🔍</div>
          <div>لا توجد نتائج لـ "{query}"</div>
        </div>
      )}

      {/* نتائج الطلاب */}
      {(results.students?.length||0) > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:8,padding:"0 4px" }}>👥 طلاب ({results.students.length})</div>
          {results.students.map(s => (
            <div key={s.email} style={{ ...S.card,marginBottom:6,cursor:"pointer",display:"flex",alignItems:"center",gap:12 }}
              onClick={()=>{ setSelectedEmail(s.email); setActiveTab("students"); }}>
              <div style={{ width:36,height:36,borderRadius:"50%",background:"#C8932B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#13213B",flexShrink:0,overflow:"hidden" }}>
                {s.photo?<img src={s.photo} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="" />:s.name?.[0]||"؟"}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:13 }}>{s.name}</div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1 }}>
                  {s.email}{s.phone&&` · ${s.phone}`}{s.scholarship&&` · ${s.scholarship}`}
                </div>
              </div>
              <span style={{ fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:700,
                background:s.status==="registered"?"rgba(107,93,211,0.15)":s.status==="potential"?"rgba(200,147,43,0.12)":"rgba(232,130,58,0.12)",
                color:s.status==="registered"?"#6B5DD3":s.status==="potential"?"#C8932B":"#E8823A" }}>
                {s.status==="registered"?"مسجل":s.status==="potential"?"محتمل":"جديد"}
              </span>
              <i className="ti ti-arrow-left" style={{ fontSize:13,color:"rgba(255,255,255,0.2)" }} />
            </div>
          ))}
        </div>
      )}

      {/* نتائج المهام */}
      {(results.tasks?.length||0) > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:8,padding:"0 4px" }}>✅ مهام ({results.tasks.length})</div>
          {results.tasks.map(t => (
            <div key={t.id} style={{ ...S.card,marginBottom:6,display:"flex",alignItems:"center",gap:12 }}>
              <span style={{ fontSize:20 }}>{t.done?"✅":"🔲"}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:13,textDecoration:t.done?"line-through":"none",opacity:t.done?.6:1 }}>{t.title}</div>
                {t.dueDate && <div style={{ fontSize:11,color:new Date(t.dueDate)<new Date()&&!t.done?"#e84545":"rgba(255,255,255,0.4)" }}>📅 {new Date(t.dueDate).toLocaleDateString("ar-EG")}</div>}
              </div>
              <span style={{ fontSize:10.5,padding:"2px 8px",borderRadius:99,background:t.priority==="high"?"rgba(232,69,69,0.12)":t.priority==="low"?"rgba(47,123,110,0.12)":"rgba(200,147,43,0.12)",color:t.priority==="high"?"#e84545":t.priority==="low"?"#2F7B6E":"#C8932B",fontWeight:700 }}>
                {t.priority==="high"?"عالية":t.priority==="low"?"منخفضة":"متوسطة"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* نتائج المتابعات */}
      {(results.followUps?.length||0) > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:8,padding:"0 4px" }}>🔄 متابعات ({results.followUps.length})</div>
          {results.followUps.map(f => {
            const st = allStudents.find(s=>s.email===f.studentEmail);
            const isOverdue = !f.done && f.date && new Date(f.date) < new Date();
            return (
              <div key={f.id} style={{ ...S.card,marginBottom:6,display:"flex",alignItems:"center",gap:12,
                borderColor:isOverdue?"rgba(232,69,69,0.3)":undefined,background:isOverdue?"rgba(232,69,69,0.04)":undefined }}>
                <span style={{ fontSize:20 }}>{f.type==="مكالمة"?"📞":f.type==="واتساب"?"📱":"🔄"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700,fontSize:13 }}>{st?.name||f.studentEmail}</div>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>{f.note||f.type}{f.date&&` · ${new Date(f.date).toLocaleDateString("ar-EG")}`}</div>
                </div>
                {isOverdue && <span style={{ fontSize:11,color:"#e84545",fontWeight:700 }}>متأخرة</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* قبل البحث */}
      {!searched && (
        <div style={{ ...S.card,textAlign:"center",padding:"32px 0",color:"rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize:40,marginBottom:10 }}>🔍</div>
          <div style={{ fontSize:13,marginBottom:6 }}>ابحث في كل شيء</div>
          <div style={{ fontSize:11,lineHeight:1.8 }}>الطلاب · المهام · المتابعات · المنح · الخدمات</div>
        </div>
      )}
    </div>
  );
}

// ─── Finance Tab ──────────────────────────────────────────────────────────────
function FinanceTab({ allStudents, S }) {
  const [expenses, setExpenses] = useState(()=>{ try{return JSON.parse(localStorage.getItem("masar_expenses")||"[]");}catch{return [];} });
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ title:"", amount:"", category:"تسويق", date:new Date().toISOString().split("T")[0], note:"" });
  const [period, setPeriod] = useState("all");
  const [activeTab, setTab] = useState("overview");

  const CATEGORIES = ["تسويق","إعلانات","موظفون","صيانة","مستلزمات مكتبية","برامج وتقنية","إيجار","أخرى"];
  const CAT_ICON   = { "تسويق":"📣","إعلانات":"📢","موظفون":"👥","صيانة":"🔧","مستلزمات مكتبية":"📎","برامج وتقنية":"💻","إيجار":"🏢","أخرى":"📦" };

  const saveExpenses = (list) => { setExpenses(list); localStorage.setItem("masar_expenses", JSON.stringify(list)); };

  // حساب الإيرادات من مدفوعات العملاء
  const revenue     = allStudents.reduce((sum,s)=>sum+(parseFloat(s.paidAmount)||0), 0);
  const totalExpect = allStudents.reduce((sum,s)=>sum+(parseFloat(s.totalAmount)||0), 0);
  const remaining   = totalExpect - revenue;

  // فلترة حسب الفترة
  const filterByPeriod = (items) => {
    if (period==="all") return items;
    const now = new Date();
    const start = period==="month" ? new Date(now.getFullYear(),now.getMonth(),1) :
                  period==="quarter" ? new Date(now.getFullYear(),Math.floor(now.getMonth()/3)*3,1) :
                  new Date(now.getFullYear(),0,1);
    return items.filter(i=>new Date(i.date)>=start);
  };

  const filteredExpenses = filterByPeriod(expenses);
  const totalExpenses    = filteredExpenses.reduce((sum,e)=>sum+(parseFloat(e.amount)||0), 0);
  const filteredRevenue  = filterByPeriod(allStudents.filter(s=>s.paidAmount).map(s=>({ date:s.createdAt, amount:s.paidAmount }))).reduce((sum,r)=>sum+(parseFloat(r.amount)||0), 0);
  const netProfit        = filteredRevenue - totalExpenses;

  // مصاريف حسب الفئة
  const expByCategory = {};
  filteredExpenses.forEach(e=>{ expByCategory[e.category]=(expByCategory[e.category]||0)+(parseFloat(e.amount)||0); });

  return (
    <div>
      {/* Period Filter */}
      <div style={{ display:"flex",gap:8,marginBottom:16,alignItems:"center" }}>
        {[["all","كل الوقت"],["month","هذا الشهر"],["quarter","هذا الربع"],["year","هذه السنة"]].map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)} style={{ padding:"6px 14px",borderRadius:8,border:period===v?"none":"1px solid rgba(255,255,255,0.12)",background:period===v?"#C8932B":"none",color:period===v?"#13213B":"rgba(255,255,255,0.6)",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>{l}</button>
        ))}
        <div style={{ marginRight:"auto",display:"flex",gap:6 }}>
          {[["overview","📊 نظرة"],["expenses","💸 المصاريف"],["income","💰 الإيرادات"]].map(([v,l])=>(
            <button key={v} onClick={()=>setTab(v)} style={{ padding:"6px 14px",borderRadius:8,border:activeTab===v?"none":"1px solid rgba(255,255,255,0.12)",background:activeTab===v?"#2F7B6E":"none",color:activeTab===v?"#fff":"rgba(255,255,255,0.6)",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {(() => {
        const egpRevenue = allStudents.filter(s=>s.paidAmount&&(!s.paidCurrency||s.paidCurrency==="EGP")).reduce((sum,s)=>sum+(parseFloat(s.paidAmount)||0),0);
        const usdRevenue = allStudents.filter(s=>s.paidAmount&&s.paidCurrency==="USD").reduce((sum,s)=>sum+(parseFloat(s.paidAmount)||0),0);
        const eurRevenue = allStudents.filter(s=>s.paidAmount&&s.paidCurrency==="EUR").reduce((sum,s)=>sum+(parseFloat(s.paidAmount)||0),0);
        return (
          <div style={{ ...S.card,marginBottom:12,padding:"12px 16px" }}>
            <div style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:10 }}>💱 توزيع الإيرادات حسب العملة</div>
            <div style={{ display:"flex",gap:20,flexWrap:"wrap" }}>
              {egpRevenue>0 && <div><div style={{ fontSize:20,fontWeight:800,color:"#2F7B6E" }}>{egpRevenue.toLocaleString()}</div><div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>جنيه مصري 🇪🇬</div></div>}
              {usdRevenue>0 && <div><div style={{ fontSize:20,fontWeight:800,color:"#C8932B" }}>${usdRevenue.toLocaleString()}</div><div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>دولار أمريكي 🇺🇸</div></div>}
              {eurRevenue>0 && <div><div style={{ fontSize:20,fontWeight:800,color:"#6B5DD3" }}>€{eurRevenue.toLocaleString()}</div><div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>يورو 🇪🇺</div></div>}
            </div>
          </div>
        );
      })()}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16 }}>
        {[
          { label:"إجمالي الإيرادات",  num:filteredRevenue.toLocaleString()+" ج", color:"#2F7B6E", icon:"📈" },
          { label:"إجمالي المصاريف",   num:totalExpenses.toLocaleString()+" ج",  color:"#e84545",  icon:"📉" },
          { label:"صافي الربح",        num:netProfit.toLocaleString()+" ج",      color:netProfit>=0?"#2F7B6E":"#e84545", icon:"💰" },
          { label:"إيرادات متوقعة",    num:totalExpect.toLocaleString()+" ج",    color:"#C8932B",  icon:"🎯" },
        ].map((s,i)=>(
          <div key={i} style={{ ...S.card,marginBottom:0 }}>
            <div style={{ fontSize:18,marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:20,fontWeight:800,color:s.color,lineHeight:1 }}>{s.num}</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── نظرة عامة ── */}
      {activeTab==="overview" && (
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
          {/* توزيع المصاريف */}
          <div style={S.card}>
            <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>💸 توزيع المصاريف حسب الفئة</div>
            {Object.keys(expByCategory).length===0 ? (
              <div style={{ textAlign:"center",color:"rgba(255,255,255,0.3)",padding:"16px 0",fontSize:12 }}>لا توجد مصاريف مسجلة</div>
            ) : Object.entries(expByCategory).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
              <div key={cat} style={{ display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize:16 }}>{CAT_ICON[cat]||"📦"}</span>
                <span style={{ flex:1,fontSize:12.5 }}>{cat}</span>
                <div style={{ width:80,height:5,borderRadius:99,background:"rgba(255,255,255,0.07)",overflow:"hidden" }}>
                  <div style={{ height:"100%",background:"#e84545",width:`${totalExpenses?amt/totalExpenses*100:0}%`,borderRadius:99 }} />
                </div>
                <span style={{ fontSize:12,fontWeight:700,color:"#e84545",minWidth:70,textAlign:"left" }}>{amt.toLocaleString()} ج</span>
              </div>
            ))}
          </div>

          {/* ملخص مالي */}
          <div style={S.card}>
            <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>📊 الملخص المالي</div>
            {[
              { label:"إيرادات محصلة",    val:filteredRevenue, color:"#2F7B6E", bar:true },
              { label:"إيرادات متوقعة",   val:totalExpect,     color:"#C8932B", bar:false },
              { label:"إجمالي مصاريف",    val:totalExpenses,   color:"#e84545", bar:true },
              { label:"صافي الربح",       val:netProfit,       color:netProfit>=0?"#2F7B6E":"#e84545", bar:false },
              { label:"متبقي من العملاء", val:remaining,       color:"#6B5DD3", bar:false },
            ].map(item=>(
              <div key={item.label} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize:12,color:"rgba(255,255,255,0.6)" }}>{item.label}</span>
                <span style={{ fontSize:13,fontWeight:800,color:item.color }}>{item.val.toLocaleString()} ج</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── المصاريف ── */}
      {activeTab==="expenses" && (
        <div>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
            <span style={{ fontWeight:700,fontSize:13 }}>💸 سجل المصاريف ({filteredExpenses.length})</span>
            <button style={S.btn} onClick={()=>setModal(true)}><i className="ti ti-plus" style={{ fontSize:13 }} /> مصروف جديد</button>
          </div>
          {filteredExpenses.length===0 ? (
            <div style={{ ...S.card,textAlign:"center",padding:"32px 0",color:"rgba(255,255,255,0.3)" }}>
              <div style={{ fontSize:32,marginBottom:8 }}>💸</div>لا توجد مصاريف مسجلة
            </div>
          ) : (
            <div style={S.card}>
              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12.5 }}>
                <thead>
                  <tr>{["الوصف","الفئة","المبلغ","التاريخ","ملاحظة",""].map(h=>(
                    <th key={h} style={{ padding:"7px 10px",textAlign:"right",fontSize:10.5,fontWeight:700,color:"rgba(255,255,255,0.35)",borderBottom:"1px solid rgba(255,255,255,0.07)" }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {[...filteredExpenses].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(e=>(
                    <tr key={e.id}>
                      <td style={{ padding:"9px 10px",fontWeight:700 }}>{e.title}</td>
                      <td style={{ padding:"9px 10px" }}>
                        <span style={{ fontSize:11,padding:"2px 8px",borderRadius:99,background:"rgba(232,69,69,0.12)",color:"#e84545",fontWeight:700 }}>
                          {CAT_ICON[e.category]||"📦"} {e.category}
                        </span>
                      </td>
                      <td style={{ padding:"9px 10px",fontWeight:700,color:"#e84545" }}>{parseFloat(e.amount).toLocaleString()} ج</td>
                      <td style={{ padding:"9px 10px",fontSize:11,color:"rgba(255,255,255,0.45)" }}>{new Date(e.date).toLocaleDateString("ar-EG")}</td>
                      <td style={{ padding:"9px 10px",fontSize:11,color:"rgba(255,255,255,0.4)" }}>{e.note||"—"}</td>
                      <td style={{ padding:"9px 10px" }}>
                        <button onClick={()=>saveExpenses(expenses.filter(x=>x.id!==e.id))} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",fontSize:14 }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} style={{ padding:"10px",fontWeight:700,color:"rgba(255,255,255,0.6)",fontSize:12 }}>الإجمالي</td>
                    <td style={{ padding:"10px",fontWeight:800,color:"#e84545",fontSize:14 }}>{totalExpenses.toLocaleString()} ج</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── الإيرادات ── */}
      {activeTab==="income" && (
        <div>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>💰 إيرادات العملاء</div>
          <div style={S.card}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12.5 }}>
              <thead>
                <tr>{["العميل","الخدمة","المدفوع","الكلي","المتبقي","الحالة"].map(h=>(
                  <th key={h} style={{ padding:"7px 10px",textAlign:"right",fontSize:10.5,fontWeight:700,color:"rgba(255,255,255,0.35)",borderBottom:"1px solid rgba(255,255,255,0.07)" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {allStudents.filter(s=>s.paidAmount).sort((a,b)=>(parseFloat(b.paidAmount)||0)-(parseFloat(a.paidAmount)||0)).map(s=>{
                  const rem = s.totalAmount ? parseFloat(s.totalAmount)-parseFloat(s.paidAmount||0) : null;
                  return (
                    <tr key={s.email}>
                      <td style={{ padding:"9px 10px",fontWeight:700 }}>{s.name}</td>
                      <td style={{ padding:"9px 10px",fontSize:11,color:"rgba(255,255,255,0.5)" }}>{s.serviceType||s.scholarship||"—"}</td>
                      <td style={{ padding:"9px 10px",fontWeight:700,color:"#2F7B6E" }}>
                        {parseFloat(s.paidAmount).toLocaleString()} {s.paidCurrency==="USD"?"$":s.paidCurrency==="EUR"?"€":s.paidCurrency==="GBP"?"£":"ج"}
                      </td>
                      <td style={{ padding:"9px 10px",color:"rgba(255,255,255,0.5)" }}>
                        {s.totalAmount?`${parseFloat(s.totalAmount).toLocaleString()} ${s.totalCurrency==="USD"?"$":s.totalCurrency==="EUR"?"€":"ج"}`:"—"}
                      </td>
                      <td style={{ padding:"9px 10px",color:rem>0?"#e84545":"#2F7B6E",fontWeight:700 }}>{rem!==null?rem.toLocaleString()+" ج":"—"}</td>
                      <td style={{ padding:"9px 10px" }}>
                        <span style={{ fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:700,background:s.paymentStatus==="full"?"rgba(47,123,110,0.15)":"rgba(200,147,43,0.15)",color:s.paymentStatus==="full"?"#2F7B6E":"#C8932B" }}>
                          {s.paymentStatus==="full"?"✅ مكتمل":"⚠️ جزئي"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ padding:"10px",fontWeight:700,color:"rgba(255,255,255,0.6)",fontSize:12 }}>الإجمالي</td>
                  <td style={{ padding:"10px",fontWeight:800,color:"#2F7B6E",fontSize:14 }}>{revenue.toLocaleString()} ج</td>
                  <td style={{ padding:"10px",fontWeight:800,color:"#C8932B",fontSize:13 }}>{totalExpect.toLocaleString()} ج</td>
                  <td style={{ padding:"10px",fontWeight:800,color:remaining>0?"#e84545":"#2F7B6E",fontSize:13 }}>{remaining.toLocaleString()} ج</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* زر تصدير */}
          <div style={{ marginTop:12,display:"flex",justifyContent:"flex-end" }}>
            <button style={S.btn} onClick={()=>{
              const rows = allStudents.filter(s=>s.paidAmount).map(s=>({ "الاسم":s.name,"الخدمة":s.serviceType||s.scholarship||"","المدفوع":s.paidAmount,"الكلي":s.totalAmount||"","الحالة":s.paymentStatus==="full"?"مكتمل":"جزئي" }));
              const h=Object.keys(rows[0]||{}); const csv=[h.join(","),...rows.map(r=>h.map(k=>`"${r[k]}"`).join(","))].join("\n");
              const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv"})); a.download="الإيرادات.csv"; a.click();
            }}>📥 تصدير CSV</button>
          </div>
        </div>
      )}

      {/* Modal إضافة مصروف */}
      {modal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99 }} onClick={()=>setModal(false)}>
          <div style={{ background:"#162035",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:22,width:420,maxWidth:"92%" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:800,fontSize:15,marginBottom:14 }}>💸 تسجيل مصروف جديد</div>
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>الوصف *</label>
              <input style={S.input} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="مثال: تكلفة حملة فيسبوك" />
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
              <div>
                <label style={S.label}>المبلغ (ج) *</label>
                <input type="number" style={S.input} value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0" />
              </div>
              <div>
                <label style={S.label}>التاريخ</label>
                <input type="date" style={S.input} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>الفئة</label>
              <select style={{ ...S.input,cursor:"pointer" }} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={S.label}>ملاحظة (اختياري)</label>
              <input style={S.input} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="تفاصيل إضافية..." />
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button style={S.btnOut} onClick={()=>setModal(false)}>إلغاء</button>
              <button style={S.btn} onClick={()=>{
                if (!form.title||!form.amount){alert("يرجى ملء الحقول المطلوبة");return;}
                saveExpenses([...expenses,{...form,id:Date.now().toString()}]);
                setModal(false); setForm({title:"",amount:"",category:"تسويق",date:new Date().toISOString().split("T")[0],note:""});
              }}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
