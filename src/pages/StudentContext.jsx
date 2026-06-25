import { createContext, useContext, useState } from "react";

export const STUDENT_STATUS = {
  new:        { label: "عميل محتمل جديد", color: "#E8823A", bg: "rgba(232,130,58,0.12)",  dot: "🟠" },
  potential:  { label: "عميل محتمل",      color: "#C8932B", bg: "rgba(200,147,43,0.12)",  dot: "🟨" },
  registered: { label: "طالب مسجل",       color: "#2F7B6E", bg: "rgba(47,123,110,0.12)",  dot: "🔴" },
};

const makeProfile = (email, name) => ({
  id: Math.random().toString(36).slice(2, 9),
  email, name: name || email.split("@")[0],
  phone: "", photo: null,
  status: "new",
  scholarship: null,
  serviceType: "scholarship",
  createdAt: new Date().toISOString(),
  serviceIds: [],
  motivationLetter:  { answers: {}, uploadedDoc: null, uploadedDocName: null, staffReply: null, staffReplyName: null },
  consulting:        { answers: {}, uploadedDoc: null, uploadedDocName: null, staffReply: null, staffReplyName: null },
  recommendation1:   { answers: {}, uploadedDoc: null, uploadedDocName: null, staffReply: null, staffReplyName: null },
  recommendation2:   { answers: {}, uploadedDoc: null, uploadedDocName: null, staffReply: null, staffReplyName: null },
  cv:                { answers: {}, uploadedDoc: null, uploadedDocName: null, staffReply: null, staffReplyName: null },
  research:          { uploadedDoc: null, uploadedDocName: null, staffReply: null, staffReplyName: null, type: "translation" },
  statusHistory: [
    { id:"registered",    label: "تم التسجيل",                  icon:"✅", date: new Date().toISOString(), done: true  },
    { id:"filesComplete", label: "تم اكتمال تحميل الملفات",     icon:"📁", date: null, done: false },
    { id:"received",      label: "تم استلام الملف",              icon:"📬", date: null, done: false },
    { id:"paid",          label: "تم الدفع",                     icon:"💳", date: null, done: false },
    { id:"inProgress",    label: "جاري التحضير",                 icon:"⚙️", date: null, done: false },
    { id:"completed",     label: "اكتمل الملف",                  icon:"🎉", date: null, done: false },
  ],
  rating: null,
  notes: "",
  assignedTo: null,
});

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const [students, setStudents] = useState(() => {
    try { return JSON.parse(localStorage.getItem("masar_students") || "{}"); }
    catch { return {}; }
  });

  const save = (updated) => {
    setStudents(updated);
    localStorage.setItem("masar_students", JSON.stringify(updated));
  };

  const getProfile = (email, name) => {
    if (!students[email]) {
      const p = makeProfile(email, name);
      save({ ...students, [email]: p });
      return p;
    }
    return students[email];
  };

  const updateProfile = (email, updates) => {
    const cur = students[email] || makeProfile(email);
    save({ ...students, [email]: { ...cur, ...updates } });
  };

  const updateSection = (email, section, updates) => {
    const cur = students[email] || makeProfile(email);
    save({ ...students, [email]: { ...cur, [section]: { ...cur[section], ...updates } } });
  };

  const staffUploadReply = (email, section, fileData, fileName) => {
    updateSection(email, section, { staffReply: fileData, staffReplyName: fileName });
    const cur = students[email];
    if (cur) {
      const history = cur.statusHistory.map(h =>
        h.label === "جاري التحضير" ? { ...h, done: true, date: new Date().toISOString() } : h
      );
      updateProfile(email, { statusHistory: history, status: "registered" });
    }
  };

  const advanceStatus = (email, stepLabel) => {
    const cur = students[email];
    if (!cur) return;
    const history = cur.statusHistory.map(h =>
      h.label === stepLabel ? { ...h, done: true, date: new Date().toISOString() } : h
    );
    updateProfile(email, { statusHistory: history });
  };

  const allStudents = Object.values(students);

  return (
    <StudentContext.Provider value={{ students, allStudents, getProfile, updateProfile, updateSection, staffUploadReply, advanceStatus }}>
      {children}
    </StudentContext.Provider>
  );
}

export const useStudent = () => useContext(StudentContext);

// تأكد إن makeProfile بيدعم consulting
