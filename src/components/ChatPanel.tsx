import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Eraser, MessageSquare } from 'lucide-react';
import { BotConfig } from '../types/index.ts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mediaUrl?: string | null;
  mediaType?: 'photo' | 'video' | null;
  photos?: string[];
}

interface ChatPanelProps {
  aiConfig: BotConfig['ai'];
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ aiConfig }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          model: aiConfig.primaryModel,
          apiKey: aiConfig.apiKey,
          apiBase: aiConfig.apiBase,
          systemPrompt: aiConfig.systemPrompt,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const botMsg: Message = {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
          mediaUrl: data.mediaUrl || null,
          mediaType: data.mediaType || null,
          photos: data.photos || []
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(data.error || 'فشل الاتصال بالذكاء الاصطناعي');
      }
    } catch (err: any) {
      const errorMsg: Message = {
        role: 'assistant',
        content: `⚠️ خطأ: ${err.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col h-[600px] overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">المستشار الأكاديمي الذكي</h3>
            <p className="text-[11px] text-slate-400">تحدث مع البوت مباشرة لتحسين أدائه أو طرح الأسئلة</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
          title="مسح المحادثة"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
            <Bot className="w-12 h-12 text-indigo-400" />
            <div>
              <p className="text-sm font-medium text-slate-300">أهلاً بك يا مشرف! كيف يمكنني مساعدتك اليوم؟</p>
              <p className="text-xs text-slate-500 mt-1">يمكنك سؤالي عن إعدادات البوت، صياغة الأخبار، أو أي شيء أكاديمي.</p>
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end animate-in fade-in slide-in-from-bottom-2'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
                m.role === 'user' 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-indigo-500/20 border-indigo-500/30'
              }`}>
                {m.role === 'user' ? <User className="w-4 h-4 text-slate-400" /> : <Bot className="w-4 h-4 text-indigo-400" />}
              </div>
              <div className={`space-y-1 ${m.role === 'user' ? 'text-right' : 'text-right'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-slate-800 text-slate-200 rounded-tr-none'
                    : 'bg-indigo-600/90 text-white rounded-tl-none shadow-lg shadow-indigo-500/10'
                }`}>
                  {m.mediaUrl && (
                    <div className="mb-3 overflow-hidden rounded-xl border border-indigo-400/30 bg-black/40">
                      {m.mediaType === 'video' ? (
                        <video
                          src={m.mediaUrl}
                          controls
                          className="max-h-64 w-full object-contain rounded-lg"
                        />
                      ) : (
                        <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer" className="block group">
                          <img
                            src={m.mediaUrl}
                            alt="صورة المنشور المسحوبة"
                            className="max-h-64 w-full object-cover rounded-lg group-hover:opacity-95 transition-all"
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                          />
                        </a>
                      )}
                      <div className="px-2 py-1 bg-slate-950/70 text-[10px] text-indigo-300 flex items-center justify-between">
                        <span>📸 وسائط مرفقة مسحوبة تلقائياً من المصدر</span>
                        <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">عرض الحجم الكامل</a>
                      </div>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
                <span className="text-[10px] text-slate-500 block px-1">
                  {m.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-end animate-pulse">
            <div className="flex gap-3 flex-row-reverse">
              <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              </div>
              <div className="bg-slate-800/50 px-4 py-2.5 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اكتب رسالتك هنا..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pl-12 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute left-2 p-2 rounded-lg transition-all ${
              !input.trim() || isLoading
                ? 'text-slate-600'
                : 'text-indigo-400 hover:bg-indigo-500/10'
            }`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -rotate-90" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
          سيتم استخدام {aiConfig.primaryModel} للرد. استهلاك الرموز (Tokens) يعتمد على طول المحادثة.
        </p>
      </div>
    </div>
  );
};
