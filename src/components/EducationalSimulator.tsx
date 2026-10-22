import React, { useState } from 'react';
import { AIModelConfig, AdReplacementConfig, AVAILABLE_AI_MODELS } from '../types/index.ts';
import {
  Sparkles,
  Send,
  Play,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  Bot,
  Brain,
  Search,
  BookOpen,
  Eye,
  Megaphone,
} from 'lucide-react';

interface Props {
  aiConfig: AIModelConfig;
  adConfig: AdReplacementConfig;
  adminUsername: string;
}

export const EducationalSimulator: React.FC<Props> = ({
  aiConfig,
  adConfig,
  adminUsername,
}) => {
  const [inputText, setInputText] = useState(
    'تعلن عمادة القبول والتسجيل عن فتح باب التقديم لبرامج البكالوريوس والدبلوم للعام الجامعي القادم ابتداء من الأحد 15 ذو القعدة وحتى نهاية الشهر، ويشترط ألا يقل المعدل التراكمي عن 80% واجتياز اختبار القدرات والتحصيلي.'
  );

  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelUsed, setModelUsed] = useState('');
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [isAdReplaced, setIsAdReplaced] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const samplePresets = [
    {
      label: '🎓 إعلان قبول وتسجيل',
      text: 'تعلن عمادة القبول والتسجيل عن فتح باب التقديم لبرامج البكالوريوس والدبلوم للعام الجامعي القادم ابتداء من الأحد القادم وحتى نهاية الشهر، ويشترط ألا يقل المعدل التراكمي عن 80% واجتياز اختبار القدرات والتحصيلي.',
    },
    {
      label: '📊 نتائج امتحانات نهائية',
      text: 'تنويه: اعتماد نتائج الاختبارات النهائية للفصل الدراسي الثاني عبر البوابة الإلكترونية اليوم، وفترة الاعتراض متاحة لمدة 3 أيام من تاريخ الإعلان.',
    },
    {
      label: '📚 توفير مراجع وكتب PDF',
      text: 'يسر النادي الأكاديمي إتاحة النسخة الرقمية من المرجع الشامل لمادة الكيمياء الحيوية بصيغة PDF لجميع الطلبة مجاناً عبر الرابط المرفق.',
    },
    {
      label: '🎯 إعلان منافس (اختبار الاستبدال)',
      text: 'ترويج لخدمات طلابية: حل واجبات جامعية وبحوث تخرج بأرخص الأسعار وتوصيل سريع! تواصل معنا على الخاص.',
    },
  ];

  const [selectedModel, setSelectedModel] = useState<string>(aiConfig.primaryModel);

  const handleRunRephrase = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setIsAdReplaced(false);

    // 1. Check competitor ad replacement
    if (adConfig.enabled) {
      const isAd = adConfig.adDetectionKeywords.some((kw) =>
        inputText.toLowerCase().includes(kw.toLowerCase())
      );
      if (isAd) {
        setIsLoading(false);
        setOutputText(adConfig.customStudentAd);
        setModelUsed('استبدال تلقائي لإعلان المنافسين');
        setIsAdReplaced(true);
        setDurationMs(20);
        return;
      }
    }

    try {
      const res = await fetch('/api/ai/rephrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          model: selectedModel || aiConfig.primaryModel,
          fallbackModel: aiConfig.fallbackModel,
          systemPrompt: aiConfig.systemPrompt,
          customInstructions: aiConfig.customInstructions,
          apiKey: aiConfig.apiKey,
          apiBase: aiConfig.apiBase,
        }),
      });

      const data = await res.json();
      if (data.success && data.rephrasedText) {
        setOutputText(data.rephrasedText);
        setModelUsed(data.modelUsed || selectedModel);
        setDurationMs(data.durationMs || 500);
      } else {
        setError(data.error || 'فشلت معالجة النص.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`خطأ أثناء الاتصال: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>مختبر الصياغة والنشر الذكي (Live Educational AI Studio)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تجربة إعادة الصياغة فوراً عبر نماذج الذكاء الاصطناعي مع إمكانية التبديل بين النماذج
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
          >
            {AVAILABLE_AI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleRunRephrase}
            disabled={isLoading || !inputText.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-sky-600 hover:from-amber-400 hover:to-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Brain className="w-4 h-4" />
            )}
            <span>{isLoading ? 'جاري المعالجة...' : `إعادة الصياغة بواسطة ${selectedModel}`}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Input Raw text vs Output Formatted text */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Text + Presets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              النص الأصلي (الوارد من قنوات أو تويتر أو RSS):
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              {inputText.length} حرفاً
            </span>
          </div>

          <textarea
            rows={6}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="الصق هنا أي منشور من قناة جامعية أو حساب رسمي..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-sans"
          />

          {/* Quick Samples */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-semibold text-slate-400">نماذج جاهزة للتجربة:</span>
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

          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Right: Output Post in Telegram Preview Mockup */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>المنشور الجاهز للنشر في قناتك (Telegram Preview):</span>
            </label>

            {outputText && (
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>
            )}
          </div>

          {/* Telegram Bubble */}
          <div
            className="bg-[#0e1621] rounded-2xl p-4 border border-slate-800 min-h-[260px] flex flex-col justify-end relative shadow-inner"
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0)',
              backgroundSize: '16px 16px',
            }}
          >
            {outputText ? (
              <div className="max-w-[94%] self-end bg-[#182533] rounded-2xl p-4 shadow-md border border-slate-700/50 text-slate-100 text-xs sm:text-sm space-y-2.5 leading-relaxed">
                {isAdReplaced && (
                  <div className="border-r-2 border-emerald-400 pr-2 pb-1 text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>تم استبدال إعلان المنافس بإعلان خدماتك الطلابية بنجاح 🎯</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap break-words leading-relaxed">
                  {outputText}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <span className="font-mono text-emerald-400">
                    {modelUsed} {durationMs ? `(${durationMs}ms)` : ''}
                  </span>
                  <div className="flex items-center gap-1">
                    <span>11:58 ص</span>
                    <Check className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-14 text-center text-slate-500 text-xs space-y-2">
                <Brain className="w-8 h-8 text-slate-600 mx-auto" />
                <p>اضغط &quot;إعادة الصياغة بواسطة DeepSeek-V4.1-Flash&quot; لمعاينة المنشور التعليمي</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
