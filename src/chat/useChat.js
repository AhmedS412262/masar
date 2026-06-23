/**
 * useChat.js — نسخة localStorage (بدون Firebase)
 * كل البيانات بتتخزن في المتصفح محلياً.
 * لما تجهّز Firebase بعدين، استبدل الملف ده بالنسخة الكاملة.
 */

import { useState, useEffect, useCallback } from "react";
import { buildSystemPrompt, KNOWLEDGE_BASE } from "./chatKnowledge";

// ── مفاتيح localStorage ──────────────────────────────────────────────────────
const LS_CHATS    = "masar_chats_v1";
const LS_AI       = "masar_ai_enabled";
const LS_VISITOR  = "masar_visitor_id";
const LS_LEADS    = "masar_leads";

// ═══════════════════════════════════════════════════════════════════════════════
// Leads — حفظ واسترجاع بيانات العملاء المحتملين
// ═══════════════════════════════════════════════════════════════════════════════
export function saveLead(lead) {
  const existing = JSON.parse(localStorage.getItem(LS_LEADS) || "[]");
  existing.push({
    id: Date.now(),
    name:        lead.name        || "",
    phone:       lead.phone       || "",
    email:       lead.email       || "",
    scholarship: lead.scholarship || "",
    message:     lead.message     || "",
    source:      lead.source      || "form",
    date:        new Date().toISOString(),
    status:      "جديد",
  });
  localStorage.setItem(LS_LEADS, JSON.stringify(existing));
}

export function getLeads() {
  return JSON.parse(localStorage.getItem(LS_LEADS) || "[]");
}

// ── helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

function getVisitorId() {
  let id = sessionStorage.getItem(LS_VISITOR);
  if (!id) { id = "visitor_" + uid(); sessionStorage.setItem(LS_VISITOR, id); }
  return id;
}

function loadChats() {
  try { return JSON.parse(localStorage.getItem(LS_CHATS) || "{}"); }
  catch { return {}; }
}

function saveChats(chats) {
  localStorage.setItem(LS_CHATS, JSON.stringify(chats));
}

// ── ساعات العمل ──────────────────────────────────────────────────────────────
export function isWorkingHours() {
  const { from, to } = KNOWLEDGE_BASE.contact.workingHours;
  const now = new Date();
  const day = now.getDay();                         // 0=Sun … 6=Sat
  const [fH, fM] = from.split(":").map(Number);
  const [tH, tM] = to.split(":").map(Number);
  const mins  = now.getHours() * 60 + now.getMinutes();
  const start = fH * 60 + fM;
  const end   = tH * 60 + tM;
  return day >= 0 && day <= 4 && mins >= start && mins < end;
}

// ── طلب الـ AI (Claude → Gemini → fallback) ─────────────────────────────────
async function getAiReply(userMessage, history = []) {
  const systemPrompt = buildSystemPrompt();

  // Claude
  try {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (apiKey) {
      const messages = [
        ...history.slice(-6).map(m => ({
          role:    m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: userMessage },
      ];
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 400, system: systemPrompt, messages }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.content?.find(b => b.type === "text")?.text;
        if (text) return text;
      }
    }
  } catch { /* fallthrough */ }

  // Gemini
  try {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userMessage }] }],
            generationConfig: { maxOutputTokens: 400, temperature: 0.4 },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    }
  } catch { /* fallthrough */ }

  // Fallback — ردود محلية من chatKnowledge
  return getLocalFallback(userMessage);
}

// ── ردود محلية بدون AI (من chatKnowledge فقط) ───────────────────────────────
function getLocalFallback(msg) {
  const m = msg.toLowerCase();
  const { scholarships, faq, contact } = KNOWLEDGE_BASE;

  // بحث في الأسئلة الشائعة
  const matchedFaq = faq.find(f =>
    f.q.toLowerCase().split(" ").some(w => w.length > 3 && m.includes(w))
  );
  if (matchedFaq) return matchedFaq.a;

  // بحث في المنح
  const matchedSchol = scholarships.find(s =>
    m.includes(s.country.toLowerCase()) ||
    m.includes(s.name.toLowerCase().split(" ")[1] || "")
  );
  if (matchedSchol) {
    return `${matchedSchol.name} (${matchedSchol.country})\n` +
           `المستوى: ${matchedSchol.level}\n` +
           `الموعد النهائي: ${matchedSchol.deadline}\n` +
           `الشروط: ${matchedSchol.requirements}\n` +
           `التغطية: ${matchedSchol.coverage}\n\n` +
           `هل تريد نساعدك في تجهيز ملفك؟`;
  }

  if (m.includes("خدم") || m.includes("تقديم") || m.includes("أبدأ"))
    return KNOWLEDGE_BASE.services + "\n\nاحجز استشارتك المجانية الآن عبر واتساب: " + contact.whatsapp;

  if (m.includes("سعر") || m.includes("تكلف") || m.includes("كم"))
    return KNOWLEDGE_BASE.pricing;

  if (m.includes("فيزا") || m.includes("سفر"))
    return "نعم، نساعدك في أوراق الفيزا بعد القبول. تواصل معنا للتفاصيل: " + contact.whatsapp;

  return `شكراً على تواصلك مع مسار!\nسنرد عليك قريباً. للرد الأسرع:\nواتساب: ${contact.whatsapp}\nإيميل: ${contact.email}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// useChat — hook للعميل في الموقع
// ═══════════════════════════════════════════════════════════════════════════════
export function useChat({ aiEnabled = true } = {}) {
  const visitorId = getVisitorId();
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [online,   setOnline]   = useState(isWorkingHours());

  // رسالة ترحيب أول مرة
  useEffect(() => {
    const chats = loadChats();
    if (chats[visitorId]?.messages?.length) {
      setMessages(chats[visitorId].messages);
    } else {
      const welcome = {
        id: "welcome", sender: "bot",
        text: "أهلاً! أنا مساعد مسار 👋\nكيف أقدر أساعدك في رحلتك نحو المنحة الدراسية؟",
        ts: Date.now(),
      };
      setMessages([welcome]);
    }
    const iv = setInterval(() => setOnline(isWorkingHours()), 60_000);
    return () => clearInterval(iv);
  }, []);

  // حفظ الرسائل في localStorage كلما تغيّرت
  useEffect(() => {
    if (!messages.length) return;
    const chats = loadChats();
    chats[visitorId] = {
      visitorId,
      lastMsg: messages[messages.length - 1]?.text?.slice(0, 80) || "",
      lastTs:  Date.now(),
      unread:  (chats[visitorId]?.unread || 0),
      messages,
    };
    saveChats(chats);
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMsg = { id: uid(), sender: "user", text: text.trim(), ts: Date.now() };
    setMessages(prev => {
      const next = [...prev, userMsg];
      // تحديث unread في localStorage
      const chats = loadChats();
      if (chats[visitorId]) {
        chats[visitorId].unread = (chats[visitorId].unread || 0) + 1;
        chats[visitorId].lastMsg = text.trim().slice(0, 80);
        chats[visitorId].lastTs  = Date.now();
        saveChats(chats);
      }
      return next;
    });

    // لو برّا أوقات العمل
    if (!isWorkingHours()) {
      const offMsg = {
        id: uid(), sender: "bot",
        text: KNOWLEDGE_BASE.outOfOfficeMessage,
        ts: Date.now(),
      };
      setTimeout(() => setMessages(prev => [...prev, offMsg]), 600);
      return;
    }

    // رد الـ AI
    if (aiEnabled) {
      setLoading(true);
      try {
        const currentMsgs = messages.filter(m => m.id !== "welcome");
        const reply = await getAiReply(text, currentMsgs);
        const botMsg = { id: uid(), sender: "bot", text: reply, ts: Date.now() };
        setMessages(prev => [...prev, botMsg]);
      } finally {
        setLoading(false);
      }
    }
  }, [messages, aiEnabled, visitorId]);

  return { messages, loading, online, sendMessage };
}

// ═══════════════════════════════════════════════════════════════════════════════
// useChatAdmin — hook للوحة التحكم
// ═══════════════════════════════════════════════════════════════════════════════
export function useChatAdmin() {
  const [conversations,  setConversations]  = useState([]);
  const [activeConvId,   setActiveConvId]   = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [aiEnabled,      setAiEnabledState] = useState(
    () => localStorage.getItem(LS_AI) !== "false"
  );

  // تحديث قائمة المحادثات كل 3 ثواني
  const refresh = useCallback(() => {
    const chats = loadChats();
    const list  = Object.values(chats).sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0));
    setConversations(list);
  }, []);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 3000);
    return () => clearInterval(iv);
  }, [refresh]);

  // تحميل رسائل المحادثة النشطة
  useEffect(() => {
    if (!activeConvId) { setActiveMessages([]); return; }
    const chats = loadChats();
    setActiveMessages(chats[activeConvId]?.messages || []);
    // مسح الـ unread
    if (chats[activeConvId]) {
      chats[activeConvId].unread = 0;
      saveChats(chats);
    }
  }, [activeConvId, conversations]);

  const toggleAi = useCallback((val) => {
    const next = val !== undefined ? val : !aiEnabled;
    setAiEnabledState(next);
    localStorage.setItem(LS_AI, String(next));
  }, [aiEnabled]);

  const sendAdminReply = useCallback((text) => {
    if (!text.trim() || !activeConvId) return;
    const chats = loadChats();
    if (!chats[activeConvId]) return;
    const msg = { id: uid(), sender: "admin", text: text.trim(), ts: Date.now() };
    chats[activeConvId].messages = [...(chats[activeConvId].messages || []), msg];
    chats[activeConvId].lastMsg  = text.trim().slice(0, 80);
    chats[activeConvId].lastTs   = Date.now();
    saveChats(chats);
    setActiveMessages(prev => [...prev, msg]);
  }, [activeConvId]);

  const getAiSuggestion = useCallback(async (lastUserMsg) => {
    if (!lastUserMsg) return "";
    return getAiReply(lastUserMsg, activeMessages);
  }, [activeMessages]);

  return {
    conversations,
    activeConvId, setActiveConvId,
    activeMessages,
    aiEnabled, toggleAi,
    sendAdminReply,
    getAiSuggestion,
  };
}
