import React, { useState } from 'react';
import { AdReplacementConfig } from '../types/index.ts';
import {
  Megaphone,
  ShieldAlert,
  Sparkles,
  Plus,
  X,
  Eye,
  Check,
  UserCheck,
  ArrowRightLeft,
} from 'lucide-react';

interface Props {
  adConfig: AdReplacementConfig;
  onChange: (updated: AdReplacementConfig) => void;
  adminUsername: string;
}

export const AdReplacementPanel: React.FC<Props> = ({
  adConfig,
  onChange,
  adminUsername,
}) => {
  const [keywordInput, setKeywordInput] = useState('');

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !adConfig.adDetectionKeywords.includes(trimmed)) {
      onChange({
        ...adConfig,
        adDetectionKeywords: [...adConfig.adDetectionKeywords, trimmed],
      });
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    onChange({
      ...adConfig,
      adDetectionKeywords: adConfig.adDetectionKeywords.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            <span>نظام الاستبدال الذكي لإعلانات المنافسين (Smart Ad Hijack)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            عند رصد إعلان ترويجي أو خدمات طلابية في القناة المصدر، يستبدله البوت تلقائياً بإعلان خدماتك الطلابية الخاصة بك!
          </p>
        </div>

        {/* Toggle switch */}
        <button
          onClick={() => onChange({ ...adConfig, enabled: !adConfig.enabled })}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            adConfig.enabled
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          {adConfig.enabled ? '🟢 ميزة الاستبدال مفعلة' : '⚪️ معطلة'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Keywords & Description */}
        <div className="space-y-4">
          <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-xs text-emerald-200 leading-relaxed">
            💡 <strong>كيف تعمل هذه الميزة؟</strong>
            <p className="text-slate-300 mt-1">
              إذا قامت القناة المراقبة بنشر إعلان تجاري أو ترويج لخدمات طلابية أو حل واجبات، فإن البوت لن ينشر إعلانهم، بل سينشر بدلاً منه إعلان خدماتك الطلابية المحددة أدناه لزيادة تفاعل قناتك وأرباحك!
            </p>
          </div>

          {/* Trigger Keywords */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>الكلمات التي يعتبرها البوت إعلاناً للمنافسين (كلمات الرصد):</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                placeholder="اكتب كلمة ترويجية (مثل: إعلان مدفوع، حل واجبات، ترويج)..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {adConfig.adDetectionKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs rounded-lg"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(i)}
                    className="text-rose-400 hover:text-white mr-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Custom Student Ad Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
              <span>نص إعلان خدماتك الطلابية الخاص بك (الذي سينشره البوت):</span>
            </label>
            <textarea
              rows={6}
              value={adConfig.customStudentAd}
              onChange={(e) => onChange({ ...adConfig, customStudentAd: e.target.value })}
              placeholder="اكتب هنا إعلان خدماتك الطلابية الخاص بك..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Right: Realistic Telegram Preview of the Custom Ad */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>معاينة إعلانك كما سيظهر للطلاب في القناة:</span>
            </label>
            <span className="text-[11px] text-emerald-400 font-mono">
              المشرف: {adminUsername}
            </span>
          </div>

          <div
            className="bg-[#0e1621] rounded-2xl p-4 border border-slate-800 min-h-[260px] flex flex-col justify-end relative shadow-inner"
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0)',
              backgroundSize: '16px 16px',
            }}
          >
            <div className="max-w-[92%] self-end bg-[#182533] rounded-2xl p-4 shadow-md border border-emerald-500/30 text-slate-100 text-xs sm:text-sm space-y-2 leading-relaxed">
              <div className="border-r-2 border-emerald-400 pr-2 pb-1 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>إعلان مميز لخدمات الطلاب</span>
              </div>

              <div className="whitespace-pre-wrap break-words">
                {adConfig.customStudentAd}
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 text-[10px] text-slate-400">
                <span>الآن</span>
                <Check className="w-3.5 h-3.5 text-sky-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
