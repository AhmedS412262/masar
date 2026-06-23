import { useState, useEffect } from "react";
import { getAIReply } from "./chatKnowledge";

const STORAGE_KEY = "masar_chat_messages";
const WORK_START = 9;
const WORK_END = 18;
const WORK_DAYS = [0, 1, 2, 3, 4]; // الأحد = 0 ... الخميس = 4

function isOnline() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  return WORK_DAYS.includes(day) && hour >= WORK_START && hour < WORK_END;
}

const WELCOME = {
  id: "welcome",
  sender: "bot",
  text: "أهلاً بك في مسار 👋 أنا مساعدك الذكي للمنح الدراسية. كيف أقدر أساعدك؟",
  ts: Date.now(),
};

export function useChat({ aiEnabled = true } = {}) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [WELCOME];
    } catch {
      return [WELCOME];
    }
  });
  const [loading, setLoading] = useState(false);
  const [online] = useState(isOnline);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = { id: Date.now(), sender: "user", text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const reply = await getAIReply(text, aiEnabled);
      const botMsg = { id: Date.now() + 1, sender: "bot", text: reply, ts: Date.now() };
      setMessages((m) => [...m, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, online, sendMessage };
}