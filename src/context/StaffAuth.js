// بيانات الموظفين — المدير يعدلها من هنا
// password مخزن كـ plain text (للـ demo) — في الإنتاج يُستبدل بـ hash
export const STAFF_ACCOUNTS = [
  { email: "omar@masar.com",  password: "omar1234",  name: "م. عمر فارس",  initials: "م.ع", role: "admin",      otpEnabled: true  },
  { email: "lian@masar.com",  password: "lian1234",  name: "أ. ليان حسن", initials: "أ.ل", role: "consultant",  otpEnabled: false },
];

export function verifyStaff(email, password) {
  return STAFF_ACCOUNTS.find(a => a.email === email && a.password === password) || null;
}
