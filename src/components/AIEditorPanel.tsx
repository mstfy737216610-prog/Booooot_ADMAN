import React, { useState } from 'react';
import { AIModelConfig, AVAILABLE_AI_MODELS } from '../types/index.ts';
import {
  Brain,
  Sparkles,
  Key,
  Globe,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Wand2,
  Zap,
  Activity,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  aiConfig: AIModelConfig;
  onChange: (updated: AIModelConfig) => void;
}

export const AIEditorPanel: React.FC<Props> = ({ aiConfig, onChange }) => {
  const [showKey, setShowKey] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    durationMs?: number;
    reply?: string;
    error?: string;
    model?: string;
  } | null>(null);

  const presetInstructions = [
    {
      label: '👑 مشرف قروبات جامعية نشط',
      text: 'كن مثل مشرفين القروبات الجامعية المخلصين الذي يبحث عن الأخبار الجديدة ويعطيها للطلاب بأسلوب ودود ومباشر.',
    },
    {
      label: '📅 التركيز على المواعيد والنتائج',
      text: 'ركز بشكل أساسي على إبراز تواريخ بدء وانتهاء التسجيل، ونسب القبول، وشروط التقديم بخط بارز.',
    },
    {
      label: '📚 ناشر كتب ومراجع PDF',
      text: 'إذا كان المنشور يحتوي على كتاب أو ملخص أو ملف PDF، صف محتواه وفائدته الأكاديمية وشجع الطلاب على تحميله.',
    },
    {
      label: '🎯 أسلوب إخباري أكاديمي رسمي',
      text: 'اجعل اللغة رصينة وأكاديمية ومقتضبة، خالية من الحشو، مع التركيز على القرارات الرسمية فقط.',
    },
  ];

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: aiConfig.primaryModel,
          apiKey: aiConfig.apiKey,
          apiBase: aiConfig.apiBase,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTestResult({
          ok: true,
          durationMs: data.durationMs,
          reply: data.reply,
          model: data.model,
        });
      } else {
        setTestResult({
          ok: false,
          durationMs: data.durationMs,
          error: data.error || 'فشل الاتصال بالبوابة',
        });
      }
    } catch (e: unknown) {
      const errStr = e instanceof Error ? e.message : String(e);
      setTestResult({
        ok: false,
        error: `خطأ في الاتصال: ${errStr}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            <span>محرك الذكاء الاصطناعي الخاص بكم ({aiConfig.primaryModel})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ربط المنشورات حصرياً بنقطة النهاية الخاصة بكم وتطبيق إعادة الصياغة الفورية والاحترافية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            {isTesting ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Activity className="w-3.5 h-3.5" />
            )}
            <span>فحص الاتصال المباشر بالـ API</span>
          </button>
        </div>
      </div>

      {/* Live Test Status Banner if available */}
      {testResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
            testResult.ok
              ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
              : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
          }`}
        >
          {testResult.ok ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-bold">
              {testResult.ok
                ? `✅ الاتصال ناجح ومستقر بنموذج ${testResult.model} (زمن الاستجابة: ${testResult.durationMs}ms)`
                : '❌ تعذر الاتصال بنقطة النهاية'}
            </p>
            {testResult.reply && (
              <p className="text-slate-300 font-mono text-[11px]">
                رد الاختبار من الخادم: &quot;{testResult.reply}&quot;
              </p>
            )}
            {testResult.error && (
              <p className="text-rose-300 text-[11px]">{testResult.error}</p>
            )}
          </div>
        </div>
      )}

      {/* API Key & Base URL Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Endpoint */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>عنوان الخدمة (Base URL)</span>
          </label>
          <input
            type="text"
            value={aiConfig.apiBase}
            onChange={(e) => onChange({ ...aiConfig, apiBase: e.target.value.trim() })}
            dir="ltr"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>مفتاح المصادقة (API Key)</span>
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={aiConfig.apiKey}
              onChange={(e) => onChange({ ...aiConfig, apiKey: e.target.value.trim() })}
              dir="ltr"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Category filter and Model Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-200">
            اختر النموذج من القائمة الشاملة ({AVAILABLE_AI_MODELS.length} نموذجاً متاحاً في بوابتك):
          </label>
        </div>

        {/* Model Selection Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              النموذج الأساسي المطلوب (Primary Model)
            </label>
            <select
              value={aiConfig.primaryModel}
              onChange={(e) => onChange({ ...aiConfig, primaryModel: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {AVAILABLE_AI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.recommended ? '⭐ (موصى به)' : ''}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-indigo-300 mt-1 block">
              💡 {AVAILABLE_AI_MODELS.find(m => m.id === aiConfig.primaryModel)?.desc || ''}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              النموذج الاحتياطي التلقائي عند الضغط (Fallback Model)
            </label>
            <select
              value={aiConfig.fallbackModel}
              onChange={(e) => onChange({ ...aiConfig, fallbackModel: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="auto">auto (توجيه ذكي تلقائي لأسرع نموذج)</option>
              {AVAILABLE_AI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              في حال تأخر استجابة النموذج الأساسي لأكثر من 5 ثوانٍ يتم التبديل فوراً.
            </span>
          </div>
        </div>

        {/* Quick Model Selector Pills */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-300">النماذج الأكثر استخداماً للأخبار الجامعية:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {[
              { id: 'DeepSeek-V4-Flash', label: '⚡ DeepSeek-V4-Flash', desc: 'الأسرع للأخبار' },
              { id: 'DeepSeek-V4.1-Flash', label: '🚀 DeepSeek-V4.1-Flash', desc: 'أعلى دقة أكاديمية' },
              { id: 'Qwen3.8-27B', label: '🧠 Qwen3.8-27B', desc: 'فصحى متقدمة' },
              { id: 'glm-5.3', label: '🌐 glm-5.3', desc: 'صياغة جذابة' },
              { id: 'MiniMax-M3.1-Flash', label: '📊 MiniMax-M3.1-Flash', desc: 'استخراج المواعيد' },
              { id: 'auto', label: '🤖 auto', desc: 'توجيه آلي' },
              { id: 'MiniCPM-V-4.7-35B-A3B', label: '👁️ MiniCPM-V (رؤية)', desc: 'فهم الصور والمستندات' },
              { id: 'stepaudio-2.5-tts', label: '🎙️ stepaudio-tts', desc: 'قراءة صوتية' },
            ].map((quick) => {
              const isSelected = aiConfig.primaryModel === quick.id;
              return (
                <button
                  key={quick.id}
                  type="button"
                  onClick={() => onChange({ ...aiConfig, primaryModel: quick.id })}
                  className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md shadow-indigo-950'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <span className="text-xs font-bold truncate block">{quick.label}</span>
                  <span className="text-[10px] text-slate-400 mt-1 block truncate">{quick.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom User Instructions Field */}
      <div className="space-y-2 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-amber-400" />
            <span>مجال التعليمات المخصصة للمشرف (يتم تطبيقها بدقة عالية):</span>
          </label>
          <span className="text-[11px] text-slate-500 font-mono">
            {aiConfig.customInstructions.length} حرفاً
          </span>
        </div>

        <textarea
          rows={3}
          value={aiConfig.customInstructions}
          onChange={(e) => onChange({ ...aiConfig, customInstructions: e.target.value })}
          placeholder="اكتب هنا أي تعليمات تريد من الذكاء الاصطناعي الالتزام بها (مثال: كن مثل مشرفين القروبات الذي يبحث عن الأخبار للطلاب، ركز على المواعيد، لا تذكر مصدر الخبر)..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-sans"
        />

        {/* Presets */}
        <div className="space-y-1.5 pt-1">
          <span className="block text-[11px] font-semibold text-slate-400">نماذج تعليمات سريعة جاهزة:</span>
          <div className="flex flex-wrap gap-2">
            {presetInstructions.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChange({ ...aiConfig, customInstructions: p.text })}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* System Prompt View Toggle */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowSystemPrompt(!showSystemPrompt)}
          className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-semibold"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>{showSystemPrompt ? 'إخفاء نص التوجيه الأساسي (System Prompt)' : 'عرض نص التوجيه الأساسي (System Prompt) المضمن'}</span>
        </button>

        {showSystemPrompt && (
          <div className="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {aiConfig.systemPrompt}
          </div>
        )}
      </div>
    </div>
  );
};
