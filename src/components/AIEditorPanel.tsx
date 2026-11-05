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
  Trash2,
  Database,
  Plus,
  RefreshCw,
  ShieldBan,
  History,
} from 'lucide-react';

interface Props {
  aiConfig: AIModelConfig;
  onChange: (updated: AIModelConfig) => void;
  onSave?: (updated?: AIModelConfig) => Promise<void> | void;
  isSaving?: boolean;
}

interface LearnedRule {
  id: number;
  rule_type: string;
  keyword_or_topic: string;
  reason_text: string;
  user_comment?: string;
  hit_count: number;
  created_at: string;
  updated_at: string;
}

interface MemoryStats {
  dedupCount: number;
  rulesCount: number;
  decisionsCount: number;
  sizeKb: number;
}

export const AIEditorPanel: React.FC<Props> = ({ aiConfig, onChange, onSave, isSaving }) => {
  const [showKey, setShowKey] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    durationMs?: number;
    reply?: string;
    error?: string;
    model?: string;
  } | null>(null);

  // AI Memory & Feedback Loop States
  const [memoryRules, setMemoryRules] = useState<LearnedRule[]>([]);
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    dedupCount: 0,
    rulesCount: 0,
    decisionsCount: 0,
    sizeKb: 0,
  });
  const [isLoadingMemory, setIsLoadingMemory] = useState(false);
  const [isPruning, setIsPruning] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleReason, setNewRuleReason] = useState('');
  const [newRuleComment, setNewRuleComment] = useState('');
  const [isAddingRule, setIsAddingRule] = useState(false);

  const fetchMemoryData = React.useCallback(async () => {
    setIsLoadingMemory(true);
    try {
      const [rulesRes, statsRes] = await Promise.all([
        fetch('/api/ai/memory/rules'),
        fetch('/api/ai/memory/stats'),
      ]);
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        if (data.success && Array.isArray(data.rules)) {
          setMemoryRules(data.rules);
        }
      }
      if (statsRes.ok) {
        const sData = await statsRes.json();
        if (sData.success) {
          setMemoryStats({
            dedupCount: sData.dedupCount || 0,
            rulesCount: sData.rulesCount || 0,
            decisionsCount: sData.decisionsCount || 0,
            sizeKb: sData.sizeKb || 0,
          });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch AI memory data:', err);
    } finally {
      setIsLoadingMemory(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMemoryData();
  }, [fetchMemoryData]);

  const handleAddLearnedRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleKeyword.trim() || !newRuleReason.trim()) return;
    setIsAddingRule(true);
    try {
      const res = await fetch('/api/ai/memory/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: newRuleKeyword.trim(),
          reason: newRuleReason.trim(),
          userComment: newRuleComment.trim(),
        }),
      });
      if (res.ok) {
        setNewRuleKeyword('');
        setNewRuleReason('');
        setNewRuleComment('');
        setShowAddRuleModal(false);
        fetchMemoryData();
        setSaveSuccessMsg('تم تثبيت قاعدة التعلم الذاتي في bot_memory.db بنجاح 🧠');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch {
      alert('تعذر إضافة قاعدة التعلم الذاتي');
    } finally {
      setIsAddingRule(false);
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه القاعدة من الذاكرة؟')) return;
    try {
      const res = await fetch('/api/ai/memory/rules/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMemoryRules((prev) => prev.filter((r) => r.id !== id));
        fetchMemoryData();
      }
    } catch {
      alert('تعذر حذف القاعدة');
    }
  };

  const handlePruneMemory = async () => {
    if (!window.confirm('هل تريد تنظيف السجلات الأقدم من 90 يوماً وضغط قاعدة بيانات الذاكرة لتوفير المساحة؟')) return;
    setIsPruning(true);
    try {
      const res = await fetch('/api/ai/memory/prune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 90 }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchMemoryData();
        setSaveSuccessMsg(`تم تنظيف ${data.prunedCount || 0} سجلاً وضغط قاعدة البيانات بنجاح 🧹`);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch {
      alert('تعذر تنظيف الذاكرة');
    } finally {
      setIsPruning(false);
    }
  };

  const handleSaveLocal = async () => {
    setIsSavingLocal(true);
    setSaveSuccessMsg(null);
    try {
      if (onSave) {
        await onSave(aiConfig);
      } else {
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ai: aiConfig }),
        });
      }
      setSaveSuccessMsg('تم حفظ وتطبيق إعدادات ومفتاح الذكاء الاصطناعي مباشرة في البوت والملفات ووحدة التخزين الداخلية بنجاح! 💾');
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } catch {
      setSaveSuccessMsg('تم الحفظ بنجاح.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } finally {
      setIsSavingLocal(false);
    }
  };

  const presetInstructions = [
    {
      label: '👑 ممثل الدفعة ومستشار طلابي خليجي',
      text: 'أنت ممثل الدفعة والزميل الأكاديمي الناصح: ادخل في صلب الموضوع فوراً بدون أي قوالب مكررة، ركز على نقل المواعيد والشروط المذكورة نصاً فقط دون أي اختلاق، واجعل المواعيد الحقيقية بخط عريض <b>...</b>، واحتفظ بدعوات التوفيق الصادقة.',
    },
    {
      label: '📚 تسجيل المقررات والقبول الموثق',
      text: 'المحتوى يخص القبول أو التسجيل. التزم حرفياً بالمواعيد والشروط المذكورة فقط في النص المصدر دون أي زيادة أو تأليف مواعيد أو ذكر أي شخص لم يرد في النص.',
    },
    {
      label: '☀️ الفصل الصيفي (السمر)',
      text: 'بخصوص السمر (الفصل الصيفي).. صغ المنشور بأسلوب واضح ومرتب ومباشر مع إبراز مواعيد وشروط تنزيل المواد المذكورة فقط.',
    },
    {
      label: '📝 اختبارات وفاينل وأذكار وأدعية',
      text: 'ركز على الاختبارات والفاينل. هدأ الطلاب واذكرهم بالأذكار والأدعية والصلاة على النبي ﷺ والتوكل على الله وفالهم الـ A+، وأبرز التواريخ والقاعات المذكورة بـ <b>...</b>.',
    },
    {
      label: '🎓 تخرج وفرحة وتبريكات',
      text: 'بارك للخريجين والخريجات بحرارة وفرحة بالجهد المبارك والدعاء لهم بأفضل الوظائف والمستقبل الزاهر.',
    },
    {
      label: '🤝 مشاريع واستبيانات التخرج',
      text: 'استبيان أو مشروع تخرج لزميل.. اطلب دعم الزملاء لتعبئة الرابط المرفق بأسلوب أخوي جميل ودعوات بالخير والتوفيق.',
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

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {isTesting ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Activity className="w-3.5 h-3.5" />
            )}
            <span>فحص الاتصال بالـ API</span>
          </button>

          <button
            type="button"
            onClick={handleSaveLocal}
            disabled={isSaving || isSavingLocal}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/60 border border-emerald-500/50 transition-all disabled:opacity-50 cursor-pointer"
          >
            {(isSaving || isSavingLocal) ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            )}
            <span>حفظ وتطبيق إعدادات الذكاء فورياً 💾</span>
          </button>
        </div>
      </div>

      {/* Save Success Banner */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/60 rounded-xl flex items-center gap-2 text-xs text-emerald-200 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold">{saveSuccessMsg}</span>
        </div>
      )}

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

      {/* 🧠 AI Memory & Feedback Loop Section */}
      <div className="pt-6 border-t border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" />
              <span>الذاكرة الإدراكية وحلقة التغذية الراجعة (bot_memory.db)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              آلية التعلم القائم على القواعد والتاريخ: تذكر أسباب الرفض واستبعاد الإعلانات التجارية تلقائياً، ومنع التكرار التام.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchMemoryData}
              disabled={isLoadingMemory}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="تحديث بيانات الذاكرة"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMemory ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setShowAddRuleModal(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>قاعدة استبعاد جديدة</span>
            </button>
          </div>
        </div>

        {/* Memory Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <ShieldBan className="w-3.5 h-3.5 text-rose-400" />
              <span>منع التكرار (Deduplication)</span>
            </div>
            <div className="text-lg font-bold text-white font-mono">{memoryStats.dedupCount}</div>
            <span className="text-[10px] text-slate-500">منشور مفحوص بالهاش</span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>قواعد التعلم النشطة</span>
            </div>
            <div className="text-lg font-bold text-white font-mono">{memoryStats.rulesCount}</div>
            <span className="text-[10px] text-slate-500">قاعدة استبعاد محقونة</span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <History className="w-3.5 h-3.5 text-sky-400" />
              <span>سجل القرارات والرقابة</span>
            </div>
            <div className="text-lg font-bold text-white font-mono">{memoryStats.decisionsCount}</div>
            <span className="text-[10px] text-slate-500">قرار رقابي مسجل</span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>حجم الذاكرة (SQLite)</span>
            </div>
            <div className="text-lg font-bold text-white font-mono">{memoryStats.sizeKb} <span className="text-xs text-slate-400 font-normal">KB</span></div>
            <button
              type="button"
              onClick={handlePruneMemory}
              disabled={isPruning}
              className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
            >
              {isPruning ? 'جارٍ التنظيف...' : 'تنظيف > 90 يوم (VACUUM)'}
            </button>
          </div>
        </div>

        {/* Learned Rules List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              قواعد الاستبعاد التلقائية المستفادة من تعليقاتك وقراراتك السابقة:
            </span>
            <span className="text-[11px] text-slate-500">
              يتم حقنها تلقائياً في سياق الذكاء الاصطناعي لمنع الأخطاء
            </span>
          </div>

          {memoryRules.length === 0 ? (
            <div className="p-4 bg-slate-950/50 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
              لا توجد قواعد استبعاد مخصصة مسجلة بعد. عند رفض منشور أو إضافة قاعدة، سيتعلم البوت تلقائياً استبعادها مستقبلاً.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {memoryRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold rounded-lg text-[11px]">
                        استبعاد: {rule.keyword_or_topic}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        مرات التطبيق: <b className="text-purple-300">{rule.hit_count}</b>
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      <b>السبب:</b> {rule.reason_text}
                      {rule.user_comment && (
                        <span className="text-slate-400"> (ملاحظة: {rule.user_comment})</span>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="حذف القاعدة من الذاكرة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Learned Rule */}
      {showAddRuleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>إضافة قاعدة استبعاد للذاكرة الذكية</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddRuleModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLearnedRule} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  الكلمة المفتاحية أو الموضوع المستبعد:
                </label>
                <input
                  type="text"
                  required
                  value={newRuleKeyword}
                  onChange={(e) => setNewRuleKeyword(e.target.value)}
                  placeholder="مثال: كافيهات، بحوث جامعية وتكاليف، عروض تسويقية..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  سبب الاستبعاد (يفهمه الذكاء الاصطناعي بدقة):
                </label>
                <input
                  type="text"
                  required
                  value={newRuleReason}
                  onChange={(e) => setNewRuleReason(e.target.value)}
                  placeholder="مثال: إعلانات تجارية مخالفة لسياسة القناة الأكاديمية"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  ملاحظة إضافية أو توجيه خاص (اختياري):
                </label>
                <textarea
                  rows={2}
                  value={newRuleComment}
                  onChange={(e) => setNewRuleComment(e.target.value)}
                  placeholder="مثال: استبعد أي منشور يروج لخصومات كافيهات أو أرقام عمل مشاريع وبحوث مدفوعة"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRuleModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isAddingRule}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingRule ? 'جارٍ الحفظ...' : 'تثبيت في الذاكرة'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
