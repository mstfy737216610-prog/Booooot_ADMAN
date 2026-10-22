import React from 'react';
import { BotInfo } from '../types/index.ts';
import { CheckCircle2, AlertTriangle, Bot, X, Shield, Users, Radio, MessageSquare } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  botInfo: BotInfo | null;
  error: string | null;
  tokenSnippet: string;
}

export const BotTesterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isLoading,
  botInfo,
  error,
  tokenSnippet,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              error 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                : botInfo 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
            }`}>
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">نتيجة فحص توكن تيليجرام</h3>
              <p className="text-xs text-slate-400 mt-0.5">التحقق المباشر من واجهة برمجة تطبيقات Telegram Bot API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium text-slate-200">جاري الاتصال بخوادم تيليجرام والتحقق من التوكن...</p>
              <p className="text-xs text-slate-400 mt-1">يتم تنفيذ استعلام getMe الفعلي</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm mb-1">فشل التحقق من التوكن</h4>
                  <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
                  <div className="mt-3 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-rose-900/30 font-mono text-slate-300">
                    نصيحة: تأكد من نسخ التوكن بالكامل من @BotFather دون مسافات إضافية.
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && botInfo && (
            <div className="space-y-4">
              {/* Success Banner */}
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">التوكن صالح ومتصل بنجاح!</h4>
                  <p className="text-xs text-emerald-400/80">تمت المصادقة مع سيرفرات تيليجرام بنجاح</p>
                </div>
              </div>

              {/* Bot Identity Card */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs text-slate-400">اسم البوت (Name):</span>
                  <span className="text-sm font-bold text-white">{botInfo.first_name}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs text-slate-400">المعرف (Username):</span>
                  <a
                    href={`https://t.me/${botInfo.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-mono text-sky-400 hover:underline flex items-center gap-1"
                  >
                    @{botInfo.username}
                  </a>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs text-slate-400">معرف البوت (Bot ID):</span>
                  <span className="text-sm font-mono text-slate-300">{botInfo.id}</span>
                </div>
              </div>

              {/* Bot Capabilities */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-700/50 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <span className="block text-slate-400 text-[10px]">إمكانية الانضمام للمجموعات</span>
                    <span className="font-semibold text-slate-200">
                      {botInfo.can_join_groups !== false ? 'مفعلة ✅' : 'معطلة ❌'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-700/50 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="block text-slate-400 text-[10px]">قراءة رسائل المجموعات</span>
                    <span className="font-semibold text-slate-200">
                      {botInfo.can_read_all_group_messages ? 'مباشرة (بدون تقييد) ✅' : 'وضع الخصوصية مفعل'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
