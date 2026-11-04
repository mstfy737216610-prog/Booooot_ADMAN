import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  RefreshCw,
  GraduationCap,
  CheckCircle,
  TrendingUp,
  Award,
  Users,
  Compass,
  ArrowRight
} from 'lucide-react';

export interface UniversityKnowledgeItem {
  univ_id: string;
  univ_name: string;
  knowledge_summary: string;
  learned_topics?: string[] | string;
  learned_accounts?: string[] | string;
  updated_at: string;
}

export const KnowledgeIntelPanel: React.FC = () => {
  const [knowledgeList, setKnowledgeList] = useState<UniversityKnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [learningUnivId, setLearningUnivId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchKnowledge = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/university/knowledge');
      if (res.ok) {
        const data = await res.json();
        setKnowledgeList(data.knowledge || []);
      }
    } catch (e) {
      console.warn('Knowledge fetch note:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const handleLearnSources = async (id: string = 'all') => {
    setLearningUnivId(id);
    showToastMsg('جاري فحص المصادر وتحليل أسلوب الحسابات المنافسة واستخلاص الهوية...');
    try {
      const res = await fetch('/api/university/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg('✅ تم بنجاح فحص المصادر وتحديث الذاكرة المعرفية للجامعة!');
        fetchKnowledge();
      } else {
        showToastMsg(data.error || 'تعذر استكمال عملية التعلم');
      }
    } catch {
      showToastMsg('خطأ في الاتصال أثناء فحص المصادر');
    } finally {
      setLearningUnivId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 px-4 py-2 bg-slate-900 border border-sky-500/50 text-white text-xs font-bold rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Brain className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-extrabold text-white">
                آلية التعلم والربط المعرفي والتفوق التنافسي (Competitive Intelligence)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              يقوم البوت بدراسة حسابات ومصادر الجامعة ومراقبة قنوات المنافسين، واستخلاص هويتها الأكاديمية والهموم الحقيقية للطلبة (الإنذارات، نسب الغياب، المكافآت، الحذف والإضافة)، وتخزينها بشكل دائم في قاعدة البيانات ليصيغ محتوى متفوقاً وأكثر نفعاً من المنافسين.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLearnSources('all')}
              disabled={learningUnivId !== null}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-950/40 cursor-pointer disabled:opacity-50"
            >
              {learningUnivId === 'all' ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Sparkles className="w-4 h-4 text-indigo-300" />
              )}
              <span>فحص مصادر كافة الجامعات وتعلّم الهوية 🧠</span>
            </button>
            <button
              onClick={fetchKnowledge}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Pillars of Competitive Superiority */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
              <Award className="w-4 h-4" />
              <span>مبدأ التفوق على المنافسين</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              المنافسون ينشرون روابط جافة أو معلومات ناقصة؛ نحن نضيف الشروط، الخطوات، المدد الزمنية، ونبرة مستشار الدفعة الناصح.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>معالجة المشاكل الحقيقية للطلبة</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              التركيز المباشر على قضايا الغياب، الأعذار الطبية، شروط صرف المكافآت، ومساعدة الطالب في التظلم من الاختبارات.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <Brain className="w-4 h-4" />
              <span>الذاكرة المعرفية الدائمة</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              تخزين دائم في SQLite لا يمحى، يتم حقنه تلقائياً في موجه الذكاء الاصطناعي لضمان التناسق التام في اللهجة والمحتوى.
            </p>
          </div>
        </div>
      </div>

      {/* University Knowledge Cards */}
      <div className="space-y-4">
        {loading && knowledgeList.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span>جاري استدعاء الذاكرة المعرفية للجامعات...</span>
          </div>
        ) : knowledgeList.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-10 text-center">
            <Brain className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-300">لم يتم فحص المصادر بعد لتخزين المعرفة</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              اضغط على زر "فحص مصادر كافة الجامعات وتعلّم الهوية" ليقوم المحرك بسحب عينات وتلخيص الهوية واللوائح الأكاديمية.
            </p>
            <button
              onClick={() => handleLearnSources('all')}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              بدء فحص وتعلّم المصادر الآن 🚀
            </button>
          </div>
        ) : (
          knowledgeList.map((item) => {
            const isLearningThis = learningUnivId === item.univ_id;
            let topics: string[] = [];
            try {
              topics = typeof item.learned_topics === 'string' ? JSON.parse(item.learned_topics || '[]') : (item.learned_topics || []);
            } catch {
              topics = [];
            }

            return (
              <div
                key={item.univ_id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3.5 transition-all shadow-lg"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">{item.univ_name}</h3>
                      <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                        آخر تحديث معرفي: {new Date(item.updated_at).toLocaleString('ar-SA')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLearnSources(item.univ_id)}
                    disabled={isLearningThis}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 cursor-pointer disabled:opacity-50"
                  >
                    {isLearningThis ? (
                      <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>إعادة فحص مصادر {item.univ_name}</span>
                  </button>
                </div>

                {/* Knowledge summary */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-300 block">
                    ملخص الهوية الأكاديمية واللوائح المستفادة من مصادر الجامعة:
                  </span>
                  <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                    {item.knowledge_summary}
                  </div>
                </div>

                {/* Topics & Monitored Accounts */}
                {topics.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 font-semibold ml-1">أبرز المحاور والمصطلحات:</span>
                    {topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-800/40 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
