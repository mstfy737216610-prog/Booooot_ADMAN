import React, { useState, useMemo } from 'react';
import { ForwardRule, MessageSimulationResult } from '../types/index.ts';
import { simulateMessageForward } from '../utils/rulesEngine.ts';
import {
  Play,
  Send,
  Sparkles,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Eye,
  Check,
  FileText,
} from 'lucide-react';

interface Props {
  rules: ForwardRule[];
  selectedRuleId: string;
  onSelectRuleId: (id: string) => void;
  onLogResult: (result: MessageSimulationResult, rule: ForwardRule) => void;
}

export const MessageSimulator: React.FC<Props> = ({
  rules,
  selectedRuleId,
  onSelectRuleId,
  onLogResult,
}) => {
  const [inputText, setInputText] = useState(
    'عاجل: تم إطلاق تحديث تيليجرام الجديد بمزايا خرافية! تابعونا للمزيد عبر https://t.me/example'
  );

  const currentRule = useMemo(() => {
    return rules.find((r) => r.id === selectedRuleId) || rules[0] || null;
  }, [rules, selectedRuleId]);

  const simulation: MessageSimulationResult | null = useMemo(() => {
    if (!currentRule || !inputText.trim()) return null;
    return simulateMessageForward(inputText, currentRule);
  }, [inputText, currentRule]);

  const samplePresets = [
    {
      label: '⚡️ خبر تقني مطابق',
      text: 'عاجل وحصري: وصل تحديث تيليجرام الجديد بمميزات استثنائية وسرعة فائقة.',
    },
    {
      label: '⛔️ إعلان تجاري (سيتم حظره)',
      text: 'فرصة لا تعوض! إعلان ممول لأفضل استثمار، اشترك الآن قبل انتهاء العرض.',
    },
    {
      label: '🔗 منشور يحوي روابط ومعرفات',
      text: 'لتحميل التطبيق يرجى زيارة https://example.com/app ومتابعة @my_dev_bot للحصول على التوكن.',
    },
  ];

  const handleSimulateAndLog = () => {
    if (simulation && currentRule) {
      onLogResult(simulation, currentRule);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>محاكي واختبار توجيه الرسائل المباشر (Live Simulator)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            اختبر أي رسالة فوراً وتحقق من مطابقة الكلمات والفلاتر والتوقيع قبل تشغيل السكريبت
          </p>
        </div>

        {/* Rule selector */}
        {rules.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">القاعدة المختارة:</span>
            <select
              value={currentRule?.id || ''}
              onChange={(e) => onSelectRuleId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium"
            >
              {rules.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.sourceChatId})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {rules.length === 0 ? (
        <p className="text-xs text-slate-400">الرجاء إضافة قاعدة توجيه أولاً للبدء بالمحاكاة.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input & Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                أدخل نص رسالة تجريبية (واردة من القناة المصدر):
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {inputText.length} حرفاً
              </span>
            </div>

            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب هنا أو اختر من النماذج التجريبية أدناه..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed font-sans"
            />

            {/* Presets */}
            <div className="space-y-1.5">
              <span className="block text-[11px] font-semibold text-slate-400">نماذج سريعة للاختبار:</span>
              <div className="flex flex-wrap gap-2">
                {samplePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(preset.text)}
                    className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Diagnostic Result Card */}
            {simulation && (
              <div
                className={`p-4 rounded-xl border transition-all text-xs space-y-2.5 ${
                  simulation.accepted
                    ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-sm">
                  <div className="flex items-center gap-2">
                    {simulation.accepted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                    <span>
                      {simulation.accepted
                        ? '✅ سيتم التوجيه بنجاح إلى القناة الهدف'
                        : '⛔️ تم استبعاد الرسالة ومنع التوجيه'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateAndLog}
                    className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 rounded-lg text-slate-200 text-[11px] border border-slate-700 flex items-center gap-1"
                  >
                    <span>تسجيل في السجل</span>
                  </button>
                </div>

                <p className="text-xs leading-relaxed text-slate-300">
                  <strong>السبب: </strong>
                  {simulation.reason}
                </p>

                {simulation.matchedKeywords.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-emerald-400 font-semibold">الكلمات المتطابقة:</span>
                    <span className="font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      {simulation.matchedKeywords.join(', ')}
                    </span>
                  </div>
                )}

                {simulation.triggeredBlacklist.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-rose-400 font-semibold">الكلمات المحظورة:</span>
                    <span className="font-mono bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                      {simulation.triggeredBlacklist.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Realistic Telegram Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>معاينة النتيجة في تيليجرام (Telegram Preview):</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {currentRule?.destinationChatId || 'القناة الهدف'}
              </span>
            </div>

            {/* Telegram Chat Mockup */}
            <div
              className="bg-[#0e1621] rounded-2xl p-4 border border-slate-800 min-h-[220px] flex flex-col justify-end relative shadow-inner"
              style={{
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0)',
                backgroundSize: '16px 16px',
              }}
            >
              {simulation && simulation.accepted ? (
                <div className="max-w-[85%] self-end bg-[#182533] rounded-2xl p-3.5 shadow-md border border-slate-700/40 text-slate-100 text-xs sm:text-sm space-y-2 leading-relaxed">
                  {/* Quoted Forward header if forwardMode is quote */}
                  {currentRule?.forwardMode === 'quote' && (
                    <div className="border-r-2 border-sky-400 pr-2 pb-1 text-[11px] text-sky-400/90 font-medium">
                      <span>معاد توجيهه من: </span>
                      <span className="font-bold text-white font-mono">{currentRule.sourceChatId}</span>
                    </div>
                  )}

                  {/* Transformed Body */}
                  <div className="whitespace-pre-wrap break-words">
                    {simulation.transformedText}
                  </div>

                  {/* Message meta */}
                  <div className="flex items-center justify-end gap-1.5 pt-1 text-[10px] text-slate-400">
                    <span>11:42 م</span>
                    <Check className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  {simulation?.accepted === false ? (
                    <div className="space-y-1">
                      <ShieldAlert className="w-8 h-8 text-rose-500/60 mx-auto" />
                      <p className="text-rose-400 font-medium">الرسالة محجوبة ولن يتم إرسالها للهدف</p>
                    </div>
                  ) : (
                    <p>قم بكتابة نص في خانة الرسالة لعرض المعاينة المباشرة</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
