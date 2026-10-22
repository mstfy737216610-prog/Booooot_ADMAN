import React, { useRef } from 'react';
import { Send, Shield, Download, Upload, RotateCcw, Sparkles } from 'lucide-react';

interface Props {
  onOpenLicense: () => void;
  onExportConfig: () => void;
  onImportConfig: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetDefaults: () => void;
  rulesCount: number;
  hasCredentials: boolean;
}

export const Header: React.FC<Props> = ({
  onOpenLicense,
  onExportConfig,
  onImportConfig,
  onResetDefaults,
  rulesCount,
  hasCredentials,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="relative p-2.5 bg-gradient-to-tr from-sky-600 to-indigo-500 rounded-2xl shadow-lg shadow-sky-600/25 ring-1 ring-white/20">
            <Send className="w-6 h-6 text-white transform -rotate-45" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-extrabold text-white tracking-tight">
                مُعيد توجيه وبوت النشر الذكي تيليجرام
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30 rounded-md">
                UserBot Pro v2.5
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-[11px] sm:text-xs text-slate-400 mt-0.5">
              <span>إدارة الآدمن والتوكن واليوزربوت</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <button
                onClick={onOpenLicense}
                className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 text-[11px] sm:text-xs text-right"
              >
                <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>حقوق المطور الأصلي (MIT)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 w-full md:w-auto">
          {/* Quick status pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs shrink-0">
            <span className={`w-2 h-2 rounded-full ${hasCredentials ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400'}`}></span>
            <span className="text-slate-300 whitespace-nowrap">
              {hasCredentials ? 'الاعتمادات مهيأة' : 'بانتظار التوكن/الآدمن'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 whitespace-nowrap">{rulesCount} مصادر</span>
          </div>

          {/* Export JSON */}
          <button
            onClick={onExportConfig}
            title="تصدير ملف الإعدادات كـ JSON"
            aria-label="تصدير ملف الإعدادات"
            className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="whitespace-nowrap">تصدير JSON</span>
          </button>

          {/* Import JSON */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={onImportConfig}
            accept=".json"
            className="hidden"
            aria-label="استيراد ملف JSON"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="استيراد إعدادات سابقة"
            aria-label="استيراد ملف الإعدادات"
            className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span className="whitespace-nowrap">استيراد</span>
          </button>

          {/* Reset */}
          <button
            onClick={onResetDefaults}
            title="إعادة التعيين للوضع الافتراضي"
            aria-label="إعادة التعيين للوضع الافتراضي"
            className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/50 text-slate-400 text-xs rounded-xl border border-slate-700/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">افتراضي</span>
          </button>

          {/* Rights button */}
          <button
            onClick={onOpenLicense}
            className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/30 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">وثيقة الحقوق</span>
          </button>
        </div>
      </div>
    </header>
  );
};
