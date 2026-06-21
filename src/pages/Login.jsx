import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Mail, Lock, User, Phone, Eye, EyeOff,
  LogIn, UserPlus, KeyRound, CheckCircle2, X,
} from "lucide-react";
import { useLang } from "../components/Layout.jsx";

const TABS = [
  { id: "login", labelAr: "تسجيل الدخول", labelEn: "Sign in", Icon: LogIn },
  { id: "register", labelAr: "حساب جديد", labelEn: "Create account", Icon: UserPlus },
  { id: "forgot", labelAr: "نسيت الباسورد", labelEn: "Forgot password", Icon: KeyRound },
];

const inputStyle = { background: "rgba(255,255,255,.08)", color: "var(--paper)", border: "1px solid rgba(255,255,255,.12)" };

function Field({ id, label, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold mb-1.5 opacity-70">{label}</label>
      {children}
    </div>
  );
}

function PasswordInput({ id, name, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id} name={name} type={show ? "text" : "password"} required
        value={value} onChange={onChange} autoComplete={autoComplete}
        className="w-full px-4 py-2.5 pe-11 rounded-lg text-sm outline-none"
        style={inputStyle}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
        style={{ insetInlineEnd: 12 }}
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function Login({ onClose }) {
  const { isAr, ui } = useLang();
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const BackArrow = isAr ? ArrowRight : ArrowLeft;
  const [activeTab, setActiveTab] = useState("login");

  // --- Sign in: UI only for now. Wire handleLogin up to your real
  // auth backend (Firebase/API) later. ---
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const handleLoginChange = (e) => setLoginForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: replace with real sign-in call (Firebase/API).
    console.log("Login submitted (UI only):", loginForm);
  };

  // --- Register: UI only for now. ---
  const [registerForm, setRegisterForm] = useState({ name: "", phone: "", email: "", password: "", confirm: "" });
  const handleRegisterChange = (e) => setRegisterForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const [registerError, setRegisterError] = useState("");
  const handleRegister = (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirm) {
      setRegisterError(isAr ? "كلمتا المرور غير متطابقتين" : "Passwords don't match");
      return;
    }
    setRegisterError("");
    // TODO: replace with real account-creation call (Firebase/API).
    console.log("Register submitted (UI only):", registerForm);
  };

  // --- Forgot password: UI only for now. ---
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const handleForgot = (e) => {
    e.preventDefault();
    // TODO: replace with a real reset-email call (Firebase/API).
    console.log("Password reset requested (UI only):", forgotEmail);
    setForgotSent(true);
  };

  const innerContent = (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-1 rounded-full" style={{ background: "rgba(255,255,255,.06)" }}>
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-full transition-colors"
              style={active ? { background: "var(--gold)", color: "var(--ink)" } : { color: "var(--paper)", opacity: 0.6 }}
            >
              <t.Icon size={14} /> {isAr ? t.labelAr : t.labelEn}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl p-7" style={{ background: "rgba(255,255,255,.06)" }}>

        {/* --- Sign in --- */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-extrabold mb-1">{isAr ? "أهلاً بعودتك" : "Welcome back"}</h2>
              <p className="text-sm opacity-60">{isAr ? "سجّل دخولك للمتابعة" : "Sign in to continue"}</p>
            </div>

            <Field id="login-email" label={isAr ? "البريد الإلكتروني" : "Email"}>
              <input
                id="login-email" name="email" type="email" required autoComplete="email"
                value={loginForm.email} onChange={handleLoginChange}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
                placeholder="name@example.com"
              />
            </Field>

            <Field id="login-password" label={isAr ? "كلمة المرور" : "Password"}>
              <PasswordInput
                id="login-password" name="password" autoComplete="current-password"
                value={loginForm.password} onChange={handleLoginChange}
                placeholder={isAr ? "كلمة المرور" : "Your password"}
              />
            </Field>

            <button
              type="button"
              onClick={() => setActiveTab("forgot")}
              className="text-xs font-semibold self-end -mt-1"
              style={{ color: "var(--gold)" }}
            >
              {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
            </button>

            <button type="submit" className="btn-gold px-6 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 mt-1">
              {isAr ? "تسجيل الدخول" : "Sign in"} <Arrow size={15} />
            </button>

            <p className="text-xs text-center opacity-60 mt-1">
              {isAr ? "مالكش حساب؟" : "Don't have an account?"}{" "}
              <button type="button" onClick={() => setActiveTab("register")} className="font-bold" style={{ color: "var(--gold)" }}>
                {isAr ? "اعمل حساب جديد" : "Create one"}
              </button>
            </p>
          </form>
        )}

        {/* --- Register --- */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-extrabold mb-1">{isAr ? "إنشاء حساب جديد" : "Create your account"}</h2>
              <p className="text-sm opacity-60">{isAr ? "هياخد منك دقيقة بس" : "It only takes a minute"}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="reg-name" label={isAr ? "الاسم" : "Name"}>
                <input
                  id="reg-name" name="name" type="text" required autoComplete="name"
                  value={registerForm.name} onChange={handleRegisterChange}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                  placeholder={isAr ? "اسمك بالكامل" : "Your full name"}
                />
              </Field>
              <Field id="reg-phone" label={isAr ? "رقم الهاتف" : "Phone"}>
                <input
                  id="reg-phone" name="phone" type="tel" autoComplete="tel"
                  value={registerForm.phone} onChange={handleRegisterChange}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                  placeholder={isAr ? "01xxxxxxxxx" : "+20 1xxxxxxxxx"}
                />
              </Field>
            </div>

            <Field id="reg-email" label={isAr ? "البريد الإلكتروني" : "Email"}>
              <input
                id="reg-email" name="email" type="email" required autoComplete="email"
                value={registerForm.email} onChange={handleRegisterChange}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
                placeholder="name@example.com"
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="reg-password" label={isAr ? "كلمة المرور" : "Password"}>
                <PasswordInput
                  id="reg-password" name="password" autoComplete="new-password"
                  value={registerForm.password} onChange={handleRegisterChange}
                  placeholder={isAr ? "اختر كلمة مرور" : "Choose a password"}
                />
              </Field>
              <Field id="reg-confirm" label={isAr ? "تأكيد كلمة المرور" : "Confirm password"}>
                <PasswordInput
                  id="reg-confirm" name="confirm" autoComplete="new-password"
                  value={registerForm.confirm} onChange={handleRegisterChange}
                  placeholder={isAr ? "أعد كتابة كلمة المرور" : "Re-enter password"}
                />
              </Field>
            </div>

            {registerError && (
              <p className="text-xs font-semibold" style={{ color: "#e8807a" }}>{registerError}</p>
            )}

            <button type="submit" className="btn-gold px-6 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 mt-1">
              {isAr ? "إنشاء الحساب" : "Create account"} <Arrow size={15} />
            </button>

            <p className="text-xs text-center opacity-60 mt-1">
              {isAr ? "عندك حساب بالفعل؟" : "Already have an account?"}{" "}
              <button type="button" onClick={() => setActiveTab("login")} className="font-bold" style={{ color: "var(--gold)" }}>
                {isAr ? "سجّل دخولك" : "Sign in"}
              </button>
            </p>
          </form>
        )}

        {/* --- Forgot password --- */}
        {activeTab === "forgot" && (
          forgotSent ? (
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <CheckCircle2 size={32} color="var(--gold)" />
              <h3 className="font-bold text-lg">{isAr ? "اتبعت لينك الاستعادة" : "Reset link sent"}</h3>
              <p className="text-sm opacity-70 max-w-xs">
                {isAr ? `لو الإيميل ${forgotEmail} مسجل عندنا، هتلاقي لينك استعادة كلمة المرور في بريدك.` : `If ${forgotEmail} is registered with us, you'll find a reset link in your inbox.`}
              </p>
              <button
                onClick={() => { setForgotSent(false); setActiveTab("login"); }}
                className="btn-outline px-5 py-2 rounded-full text-sm font-semibold mt-2"
              >
                {isAr ? "رجوع لتسجيل الدخول" : "Back to sign in"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-extrabold mb-1">{isAr ? "استعادة كلمة المرور" : "Reset your password"}</h2>
                <p className="text-sm opacity-60">
                  {isAr ? "هنبعتلك لينك على إيميلك لإعادة تعيين كلمة المرور." : "We'll email you a link to reset your password."}
                </p>
              </div>

              <Field id="forgot-email" label={isAr ? "البريد الإلكتروني" : "Email"}>
                <input
                  id="forgot-email" name="email" type="email" required autoComplete="email"
                  value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                  placeholder="name@example.com"
                />
              </Field>

              <button type="submit" className="btn-gold px-6 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 mt-1">
                {isAr ? "إرسال لينك الاستعادة" : "Send reset link"} <Mail size={15} />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className="text-xs font-semibold text-center opacity-60 hover:opacity-100"
              >
                {isAr ? "رجوع لتسجيل الدخول" : "Back to sign in"}
              </button>
            </form>
          )
        )}
      </div>
    </>
  );

  // --- Popup mode: triggered from the nav "Sign in" button, overlays the current page ---
  if (onClose) {
    return (
      <div
        dir={ui.dir}
        className="fixed inset-0 z-50 flex items-center justify-center p-5"
        style={{ background: "rgba(19,33,59,.6)" }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl px-7 pb-7 pt-12 relative max-h-[90vh] overflow-y-auto"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 end-4 opacity-70 hover:opacity-100"
            style={{ color: "var(--paper)" }}
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X size={18} />
          </button>
          {innerContent}
        </div>
      </div>
    );
  }

  // --- Standalone mode: full page at /login ---
  return (
    <div dir={ui.dir} className="min-h-screen flex items-center justify-center px-5 py-16" style={{ background: "var(--ink)", color: "var(--paper)" }}>
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold opacity-60 hover:opacity-100 mb-8">
          <BackArrow size={14} /> {isAr ? "العودة للرئيسية" : "Back to home"}
        </Link>
        {innerContent}
      </div>
    </div>
  );
}
