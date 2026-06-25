import { createContext, useContext, useState } from "react";

// ─── Role Map ─────────────────────────────────────────────────────────────────
// أضف هنا أي إيميل جديد وحدد دوره
const ROLE_MAP = {
  "omar@masar.com": "admin",
  "lian@masar.com": "consultant",
};

// ─── Routes لكل Role ──────────────────────────────────────────────────────────
export const ROLE_ROUTES = {
  admin:      "/admin",
  consultant: "/admin",
  student:    "/my-profile",
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("masar_user") || "null");
    } catch {
      return null;
    }
  });

  // استدعيه بعد نجاح تسجيل الدخول
  const login = (email, extraData = {}) => {
    const role = ROLE_MAP[email] || "student";
    const userData = { email, role, ...extraData };
    localStorage.setItem("masar_user", JSON.stringify(userData));
    setUser(userData);
    return role; // يرجع الـ role عشان تعمل redirect فوري
  };

  const logout = () => {
    localStorage.removeItem("masar_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, ROLE_ROUTES }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
