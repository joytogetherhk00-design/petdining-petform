import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, X, Send, MessageCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

const WHATSAPP_URL = 'https://wa.me/85298673497';
const AGENT_NAME = 'petdining_cs';

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setLoading(false);
    });
    return unsub;
  }, [conversation?.id]);

  const startConversation = async () => {
    const convo = await base44.agents.createConversation({ agent_name: AGENT_NAME });
    setConversation(convo);
    setMessages([{
      role: 'assistant',
      content: '你好！我係 PetDining 嘅 AI 助手 🐾\n\n我可以幫你解答：\n- 🛍️ 產品介紹\n- 📦 如何下單\n- 💳 Credits 查詢\n- 🚚 送貨安排\n- 📋 訂單狀態\n- 🔧 售後服務\n\n有咩可以幫到你？',
    }]);
  };

  const handleOpen = async () => {
    setOpen(true);
    if (!conversation) await startConversation();
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || !conversation) return;
    setInput('');
    setLoading(true);
    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    // Save to ChatMessage entity
    const user = await base44.auth.me().catch(() => null);
    await base44.entities.ChatMessage.create({
      conversation_id: conversation.id,
      user_email: user?.email || 'guest',
      role: 'user',
      content: text,
    });

    await base44.agents.addMessage(conversation, { role: 'user', content: text });
  };

  const handleEscalate = async () => {
    setEscalated(true);
    // Save escalation marker
    const user = await base44.auth.me().catch(() => null);
    if (conversation?.id) {
      await base44.entities.ChatMessage.create({
        conversation_id: conversation.id,
        user_email: user?.email || 'guest',
        role: 'assistant',
        content: '[用戶已請求人工客服]',
        escalated_to_human: true,
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const visibleMessages = messages.filter(m => m.content && m.role !== 'system');

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="AI助手"
        >
          <Bot className="h-6 w-6 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl shadow-2xl border border-border bg-card flex flex-col overflow-hidden"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">AI 助手</p>
                <p className="text-white/70 text-xs">PetDining PetForm</p>
              </div>
              <span className="ml-1 flex items-center gap-1 text-xs text-green-200">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />在線
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {visibleMessages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>AI 助手正在輸入...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Actions */}
          {!escalated && visibleMessages.length <= 2 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {['如何下單？', 'Credits 查詢', '送貨時間', '售後服務'].map(q => (
                <button key={q} onClick={() => { setInput(q); }}
                  className="text-xs bg-muted hover:bg-primary/10 hover:text-primary border border-border rounded-full px-2.5 py-1 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* WhatsApp Escalation Banner */}
          {escalated ? (
            <div className="m-3 p-3 bg-green-50 border border-green-200 rounded-xl text-center shrink-0">
              <p className="text-sm font-medium text-green-800 mb-1">已記錄對話，客服即將聯絡您 👋</p>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                <MessageCircle className="h-4 w-4" /> WhatsApp 9867 3497
              </a>
            </div>
          ) : (
            <>
              {/* Escalate hint */}
              {visibleMessages.length > 3 && (
                <div className="px-3 pb-1 shrink-0">
                  <button onClick={handleEscalate}
                    className="w-full text-xs text-muted-foreground hover:text-primary border border-dashed border-border rounded-lg py-1.5 transition-colors">
                    💬 轉接人工客服 · WhatsApp 9867 3497
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-border flex gap-2 shrink-0">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="輸入問題..."
                  className="text-sm h-9"
                  disabled={loading}
                />
                <Button size="icon" className="h-9 w-9 shrink-0 bg-primary" onClick={sendMessage} disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-1.5 mt-0.5 shrink-0">
          <Bot className="h-3 w-3 text-primary" />
        </div>
      )}
      <div className={cn(
        'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
        isUser
          ? 'bg-primary text-primary-foreground rounded-br-sm'
          : 'bg-muted text-foreground rounded-bl-sm'
      )}>
        {isUser ? (
          <p>{msg.content}</p>
        ) : (
          <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-0.5 [&_ul]:my-1 [&_li]:my-0">
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}