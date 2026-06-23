/**
 * ChatTab.jsx — تاب الشات في لوحة التحكم
 * مُضاف بالفعل في Dashboard.jsx
 */
import { useState, useEffect, useRef } from "react";
import { useChatAdmin } from "./useChat";
import { KNOWLEDGE_BASE } from "./chatKnowledge";

export default function ChatTab() {
  const {
    conversations, activeConvId, setActiveConvId,
    activeMessages, aiEnabled, toggleAi,
    sendAdminReply, getAiSuggestion,
  } = useChatAdmin();

  const [reply,      setReply]      = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loadingSug, setLoadingSug] = useState(false);
  const endRef = useRef(null);
  const wh = KNOWLEDGE_BASE.contact.workingHours;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  useEffect(() => {
    if (!activeConvId || !aiEnabled) { setSuggestion(""); return; }
    const lastUser = [...activeMessages].reverse().find(m => m.sender === "user");
    if (!lastUser) { setSuggestion(""); return; }
    setLoadingSug(true);
    getAiSuggestion(lastUser.text)
      .then(s => setSuggestion(s))
      .finally(() => setLoadingSug(false));
  }, [activeConvId, activeMessages.length, aiEnabled]);

  const handleSend = () => {
    if (!reply.trim()) return;
    sendAdminReply(reply);
    setReply("");
    setSuggestion("");
  };

  const totalUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:12, height:"calc(100vh - 100px)", minHeight:480 }}>

      {/* ── القائمة الجانبية ── */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, overflow:"hidden" }}>

        {/* AI Toggle */}
        <div className="dash-card" style={{ padding:"12px 14px", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <i className="ti ti-sparkles" style={{ fontSize:16, color:"#6B5DD3" }} aria-hidden="true" />
              <span style={{ fontWeight:700, fontSize:13 }}>الرد الذكي (AI)</span>
            </div>
            <label className="dash-tog" aria-label="تفعيل الرد الذكي">
              <input type="checkbox" checked={aiEnabled} onChange={e => toggleAi(e.target.checked)} />
              <span className="dash-tog-sl" />
            </label>
          </div>
          <p style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5, margin:0 }}>
            {aiEnabled
              ? "AI يرد تلقائياً من قاعدة بياناتك فقط."
              : "الرد الذكي متوقف — الرسائل تصلك مباشرة."}
          </p>
        </div>

        {/* مواعيد العمل */}
        <div className="dash-card" style={{ padding:"11px 14px", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
            <i className="ti ti-clock" style={{ fontSize:15, color:"var(--gold)" }} aria-hidden="true" />
            <span style={{ fontWeight:700, fontSize:12.5 }}>مواعيد الشات</span>
          </div>
          <div style={{ fontSize:11.5, color:"var(--muted)", lineHeight:1.7 }}>
            <div>{wh.days}</div>
            <div>{wh.from} — {wh.to}</div>
          </div>
          <div style={{ marginTop:7, paddingTop:7, borderTop:"1px solid var(--border)", fontSize:11, color:"var(--muted)" }}>
            خارج الأوقات → العميل يُوجَّه لواتساب تلقائياً
          </div>
        </div>

        {/* قائمة المحادثات */}
        <div className="dash-card" style={{ flex:1, padding:0, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"11px 14px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <span style={{ fontWeight:800, fontSize:13, flex:1 }}>المحادثات</span>
            {totalUnread > 0 && (
              <span style={{ background:"rgba(232,69,69,0.15)", color:"#c03030", fontSize:10.5, padding:"2px 8px", borderRadius:99, fontWeight:700 }}>
                {totalUnread} جديد
              </span>
            )}
          </div>
          <div style={{ flex:1, overflowY:"auto" }}>
            {conversations.length === 0 && (
              <div style={{ textAlign:"center", padding:"24px 14px", color:"var(--muted)", fontSize:12 }}>
                لا توجد محادثات بعد
              </div>
            )}
            {conversations.map(conv => {
              const isActive = conv.visitorId === activeConvId;
              const short    = conv.visitorId?.slice(-6) || "زائر";
              return (
                <div key={conv.visitorId}
                  onClick={() => setActiveConvId(conv.visitorId)}
                  style={{
                    padding:"10px 14px", borderBottom:"1px solid var(--border)",
                    cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start",
                    background: isActive ? "rgba(200,147,43,0.09)" : conv.unread ? "rgba(200,147,43,0.04)" : "transparent",
                    transition:".15s",
                  }}
                >
                  <div style={{ width:34, height:34, borderRadius:"50%", background: isActive ? "#C8932B" : "var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color: isActive ? "#13213B" : "var(--muted)", flexShrink:0 }}>
                    {short.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:12.5 }}>زائر ···{short}</div>
                    <div style={{ fontSize:11, color:"var(--muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginTop:2 }}>
                      {conv.lastMsg || "محادثة جديدة"}
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                    <span style={{ fontSize:10, color:"var(--muted)" }}>
                      {conv.lastTs ? new Date(conv.lastTs).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}) : ""}
                    </span>
                    {conv.unread > 0 && (
                      <span style={{ width:18, height:18, borderRadius:"50%", background:"#e84545", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9.5, fontWeight:800, color:"#fff" }}>
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── نافذة المحادثة ── */}
      {!activeConvId ? (
        <div className="dash-card" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, color:"var(--muted)" }}>
          <i className="ti ti-messages" style={{ fontSize:44, opacity:.25 }} aria-hidden="true" />
          <div style={{ fontSize:13, fontWeight:600 }}>اختر محادثة للبدء</div>
        </div>
      ) : (
        <div className="dash-card" style={{ display:"flex", flexDirection:"column", padding:0, overflow:"hidden" }}>

          {/* header */}
          <div style={{ padding:"10px 14px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10, flexShrink:0, background:"var(--surface2)" }}>
            <i className="ti ti-user-circle" style={{ fontSize:20, color:"var(--muted)" }} aria-hidden="true" />
            <span style={{ fontWeight:700, fontSize:13, flex:1 }}>زائر ···{activeConvId.slice(-6)}</span>
            <span style={{ fontSize:11, color:"var(--muted)" }}>{activeMessages.length} رسالة</span>
          </div>

          {/* رسائل */}
          <div style={{ flex:1, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:10 }}>
            {activeMessages.map(m => (
              <div key={m.id} style={{ maxWidth:"80%", alignSelf: m.sender==="user" ? "flex-start" : "flex-end", display:"flex", flexDirection:"column", gap:3 }}>
                <div style={{
                  padding:"9px 13px", borderRadius:12, fontSize:12.5, lineHeight:1.65,
                  whiteSpace:"pre-wrap", wordBreak:"break-word",
                  background: m.sender==="user" ? "var(--surface2)" : m.sender==="admin" ? "#13213B" : "rgba(47,123,110,0.1)",
                  color: m.sender==="admin" ? "#F0EDE4" : "var(--tx)",
                  borderBottomRightRadius: m.sender==="user" ? 4 : 12,
                  borderBottomLeftRadius:  m.sender!=="user" ? 4 : 12,
                }}>
                  {m.text}
                </div>
                <div style={{ fontSize:10, color:"var(--muted)", padding:"0 4px", textAlign: m.sender!=="user" ? "left" : "right", direction:"ltr" }}>
                  {m.sender==="bot" ? "🤖 AI" : m.sender==="admin" ? "👤 أنت" : "💬 زائر"}
                  {" · "}
                  {m.ts ? new Date(m.ts).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}) : ""}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* اقتراح AI */}
          {(suggestion || loadingSug) && (
            <div style={{ padding:"10px 14px", borderTop:"1px solid var(--border)", background:"rgba(47,123,110,0.05)", flexShrink:0 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#2F7B6E", marginBottom:6, display:"flex", alignItems:"center", gap:5 }}>
                <i className="ti ti-sparkles" style={{ fontSize:13 }} aria-hidden="true" />
                رد مقترح — انقر للاستخدام
              </div>
              {loadingSug ? (
                <div style={{ fontSize:11.5, color:"var(--muted)" }}>جاري التوليد...</div>
              ) : (
                <div onClick={() => { setReply(suggestion); setSuggestion(""); }}
                  style={{ fontSize:12, color:"var(--tx)", cursor:"pointer", background:"rgba(47,123,110,0.08)", border:"1px solid rgba(47,123,110,0.2)", borderRadius:8, padding:"8px 11px", lineHeight:1.6, whiteSpace:"pre-wrap" }}>
                  {suggestion}
                </div>
              )}
            </div>
          )}

          {/* خانة الرد */}
          <div style={{ padding:"12px 14px", borderTop:"1px solid var(--border)", display:"flex", gap:8, alignItems:"flex-end", flexShrink:0 }}>
            <textarea
              className="dash-input"
              style={{ flex:1, resize:"none", borderRadius:8, minHeight:56 }}
              placeholder="اكتب ردك هنا... (Enter للإرسال)"
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              rows={2}
            />
            <button className="dash-btn gold"
              onClick={handleSend} disabled={!reply.trim()}
              style={{ height:56, paddingInline:16, flexShrink:0 }}>
              <i className="ti ti-send" style={{ fontSize:16 }} aria-hidden="true" />
              إرسال
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
