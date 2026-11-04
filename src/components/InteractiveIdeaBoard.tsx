import React, { useState, useEffect, useCallback } from 'react';
import {
  Lightbulb,
  Plus,
  Send,
  Trash2,
  Edit3,
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Search,
  RefreshCw,
  Tag,
  GraduationCap,
  Sparkles,
  Share2
} from 'lucide-react';

export interface FutureIdeaItem {
  id: number;
  title: string;
  description?: string;
  operational_notes?: string;
  status: 'new' | 'in_progress' | 'ready' | 'published' | 'archived';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  university_id?: string;
  university_name?: string;
  source_post_id?: number;
  twitter_ready?: number;
  telegram_ready?: number;
  created_at: string;
  updated_at: string;
}

const STATUS_COLUMNS = [
  { id: 'new', label: 'أفكار جديدة', color: 'sky', icon: Lightbulb, desc: 'أفكار مستخلصة من مصادر واستفسارات الطلاب' },
  { id: 'in_progress', label: 'قيد الصياغة والتطوير', color: 'amber', icon: Clock, desc: 'يجري إثراؤها بالشروط واللوائح والروابط' },
  { id: 'ready', label: 'معتمدة وجاهزة للنشر', color: 'indigo', icon: Sparkles, desc: 'اكتملت صياغتها وجاهزة للبث للقنوات وتويتر' },
  { id: 'published', label: 'منفذة ومنشورة', color: 'emerald', icon: CheckCircle, desc: 'تم إرسالها وتعميمها بنجاح للطلبة' }
];

export const InteractiveIdeaBoard: React.FC = () => {
  const [ideas, setIdeas] = useState<FutureIdeaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniv, setSelectedUniv] = useState('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<FutureIdeaItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form states for adding/editing
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOperationalNotes, setFormOperationalNotes] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formTags, setFormTags] = useState('');
  const [formUnivName, setFormUnivName] = useState('جامعة الملك سعود');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        univId: selectedUniv
      });
      const res = await fetch(`/api/ideas?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setIdeas(data.ideas || []);
      }
    } catch (e) {
      console.warn('Failed to fetch ideas:', e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedUniv]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleCreateOrUpdateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToastMsg('يرجى إدخال عنوان الفكرة');
      return;
    }

    setIsSubmitting(true);
    const parsedTags = formTags
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    try {
      if (editingIdea) {
        const res = await fetch(`/api/ideas/${editingIdea.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            description: formDescription,
            operationalNotes: formOperationalNotes,
            priority: formPriority,
            tags: parsedTags,
            universityName: formUnivName,
            universityId: formUnivName
          })
        });
        if (res.ok) {
          showToastMsg('تم تحديث الفكرة والملاحظات التشغيلية بنجاح ✅');
          setEditingIdea(null);
          resetForm();
          fetchIdeas();
        }
      } else {
        const res = await fetch('/api/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            description: formDescription,
            operationalNotes: formOperationalNotes,
            status: 'new',
            priority: formPriority,
            tags: parsedTags,
            universityName: formUnivName,
            universityId: formUnivName
          })
        });
        if (res.ok) {
          showToastMsg('تمت إضافة الفكرة إلى اللوحة التفاعلية بنجاح 💡');
          setIsAddModalOpen(false);
          resetForm();
          fetchIdeas();
        }
      }
    } catch {
      showToastMsg('حدث خطأ أثناء حفظ الفكرة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormOperationalNotes('');
    setFormPriority('medium');
    setFormTags('');
    setFormUnivName('جامعة الملك سعود');
  };

  const handleMoveStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/ideas/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setIdeas(prev =>
          prev.map(i => (i.id === id ? { ...i, status: newStatus as any } : i))
        );
        showToastMsg('تم نقل الفكرة وتحديث حالتها بنجاح 📌');
      }
    } catch {
      showToastMsg('تعذر نقل الحالة');
    }
  };

  const handleDeleteIdea = async (id: number) => {
    if (!window.confirm('هل تريد حذف هذه الفكرة نهائياً من اللوحة؟')) return;
    try {
      const res = await fetch(`/api/ideas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setIdeas(prev => prev.filter(i => i.id !== id));
        showToastMsg('تم حذف الفكرة 🗑️');
      }
    } catch {
      showToastMsg('تعذر حذف الفكرة');
    }
  };

  const handlePublishIdea = async (id: number) => {
    if (!window.confirm('هل تريد نشر هذه الفكرة فورياً في قنوات النشر المعتمدة (تيليجرام وتويتر)؟')) return;
    try {
      const res = await fetch(`/api/ideas/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'both' })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg('🚀 تم إرسال الفكرة لطابور النشر وتحديث حالتها إلى منشورة!');
        fetchIdeas();
      } else {
        showToastMsg(data.error || 'تعذر النشر الفوري');
      }
    } catch {
      showToastMsg('خطأ أثناء إرسال الفكرة للنشر');
    }
  };

  const openEditModal = (idea: FutureIdeaItem) => {
    setEditingIdea(idea);
    setFormTitle(idea.title);
    setFormDescription(idea.description || '');
    setFormOperationalNotes(idea.operational_notes || '');
    setFormPriority(idea.priority || 'medium');
    setFormTags(Array.isArray(idea.tags) ? idea.tags.join(', ') : '');
    setFormUnivName(idea.university_name || 'جامعة الملك سعود');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 px-4 py-2 bg-slate-900 border border-sky-500/50 text-white text-xs font-bold rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Banner & Control Area */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-extrabold text-white">
                لوحة الأفكار والتغذية الراجعة الذكية (Interactive Idea Board)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              ذاكرة استراتيجية مرنة لحفظ التوجيهات والملاحظات التشغيلية وعقد التعلم المعرفية. استثمر المنشورات المرفوضة والمقبولة لتطوير محتوى طلابي يتفوق على المنافسين في معالجة هموم واحتياجات الطلبة.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={fetchIdeas}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span>تحديث</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-950/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فكرة جديدة 💡</span>
            </button>
          </div>
        </div>

        {/* Search & Quick Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في عناوين الأفكار والملاحظات التوجيهية والوسوم..."
              className="w-full pr-9 pl-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={selectedUniv}
            onChange={(e) => setSelectedUniv(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">جميع الجامعات والمشاريع</option>
            <option value="جامعة الملك سعود">جامعة الملك سعود</option>
            <option value="جامعة AUM">جامعة AUM</option>
            <option value="جامعة نجران">جامعة نجران</option>
            <option value="كليات التقنية العليا">كليات التقنية العليا</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUS_COLUMNS.map((col) => {
          const colIdeas = ideas.filter(i => i.status === col.id);
          const Icon = col.icon;

          return (
            <div
              key={col.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col h-[700px] overflow-hidden shadow-lg"
            >
              {/* Column Header */}
              <div className="p-3.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-amber-400" />
                  <span className="font-extrabold text-xs text-white">{col.label}</span>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-bold font-mono rounded-full bg-slate-800 text-slate-300 tabular-nums">
                  {colIdeas.length}
                </span>
              </div>

              {/* Ideas Card List (Scrollable) */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {colIdeas.length === 0 ? (
                  <div className="h-40 border border-dashed border-slate-800/80 rounded-xl flex flex-col items-center justify-center text-center p-4 text-slate-500">
                    <Icon className="w-6 h-6 mb-1.5 opacity-40" />
                    <span className="text-xs">لا توجد أفكار في هذا القسم حالياً</span>
                  </div>
                ) : (
                  colIdeas.map((idea) => {
                    const priorityColor =
                      idea.priority === 'high'
                        ? 'border-rose-700/60 bg-rose-950/30 text-rose-300'
                        : idea.priority === 'medium'
                        ? 'border-amber-700/60 bg-amber-950/30 text-amber-300'
                        : 'border-slate-700 bg-slate-950/40 text-slate-400';

                    return (
                      <div
                        key={idea.id}
                        className="bg-slate-950/90 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 transition-all shadow-md group"
                      >
                        {/* Tags and Priority */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityColor}`}
                          >
                            {idea.priority === 'high'
                              ? 'أولوية قصوى'
                              : idea.priority === 'medium'
                              ? 'أولوية متوسطة'
                              : 'أولوية عادية'}
                          </span>

                          {idea.university_name && (
                            <span className="text-[10px] text-sky-400 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800/40 font-medium truncate max-w-[120px]">
                              {idea.university_name}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-extrabold text-white leading-snug group-hover:text-amber-300 transition-colors">
                          {idea.title}
                        </h4>

                        {/* Description */}
                        {idea.description && (
                          <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                            {idea.description}
                          </p>
                        )}

                        {/* Operational Guidance Node / Notes */}
                        {idea.operational_notes && (
                          <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-2 text-[11px] text-amber-200/90 space-y-1">
                            <span className="font-bold text-amber-400 block text-[10px]">
                              🧠 التوجيه وعقدة التعلم:
                            </span>
                            <p className="line-clamp-3 leading-relaxed">{idea.operational_notes}</p>
                          </div>
                        )}

                        {/* Tags list */}
                        {Array.isArray(idea.tags) && idea.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {idea.tags.map((t, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer Controls & State Transitions */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          {/* Fast Action Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(idea)}
                              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                              title="تعديل الملاحظات والفكرة"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteIdea(idea.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                              title="حذف الفكرة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {col.id === 'ready' && (
                              <button
                                onClick={() => handlePublishIdea(idea.id)}
                                className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-md shadow-sm"
                                title="نشر فوري في القنوات وتويتر"
                              >
                                <Send className="w-3 h-3" />
                                <span>نشر 🚀</span>
                              </button>
                            )}
                          </div>

                          {/* Move to next stage */}
                          <div className="flex items-center gap-1">
                            {col.id === 'new' && (
                              <button
                                onClick={() => handleMoveStatus(idea.id, 'in_progress')}
                                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/20"
                              >
                                <span>دراسة</span>
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {col.id === 'in_progress' && (
                              <button
                                onClick={() => handleMoveStatus(idea.id, 'ready')}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/20"
                              >
                                <span>اعتماد</span>
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {col.id === 'ready' && (
                              <button
                                onClick={() => handleMoveStatus(idea.id, 'published')}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20"
                              >
                                <span>أرشفة تم</span>
                                <CheckCircle className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Idea Modal */}
      {(isAddModalOpen || editingIdea) && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Lightbulb className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">
                  {editingIdea ? 'تعديل الفكرة وعقدة التوجيه التشغيلي' : 'إضافة فكرة مستقبلية جديدة إلى اللوحة'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingIdea(null);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateIdea} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">عنوان الفكرة / المنشور:</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: خطوات الاعتراض على رصد درجات الاختبارات النصفية..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">وصف الفكرة ومحتواها الأكاديمي المقترح:</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="تفاصيل الموضوع، الخطوات الأكاديمية المقترحة، وأرقام البوابات..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-amber-300 font-bold block mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>الملاحظات والتوجيهات التشغيلية (عقدة التعلم والتفوق على المنافسين):</span>
                </label>
                <textarea
                  rows={3}
                  value={formOperationalNotes}
                  onChange={(e) => setFormOperationalNotes(e.target.value)}
                  placeholder="مثال: المنافسون ينشرون روابط جافة؛ نحن سنقدم خطوات البوابة مدعومة بالمدد النظامية للتظلمات وسنبدأ بنبرة أخوية تطمئن الطالب..."
                  className="w-full px-3 py-2 bg-slate-950 border border-amber-900/40 rounded-xl text-amber-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">الجامعة المستهدفة:</label>
                  <select
                    value={formUnivName}
                    onChange={(e) => setFormUnivName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="جامعة الملك سعود">جامعة الملك سعود</option>
                    <option value="جامعة AUM">جامعة AUM</option>
                    <option value="جامعة نجران">جامعة نجران</option>
                    <option value="كليات التقنية العليا">كليات التقنية العليا</option>
                    <option value="شأن طلابي عام">شأن طلابي عام</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">درجة الأولوية:</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="high">أولوية قصوى (عاجل)</option>
                    <option value="medium">أولوية متوسطة</option>
                    <option value="low">أولوية عادية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">الوسوم والهاشتاجات (مفصولة بفاصلة):</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="اختبارات, تظلمات, إرشاد_أكاديمي, المعدل"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingIdea(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Lightbulb className="w-4 h-4" />
                  )}
                  <span>{editingIdea ? 'تحديث الفكرة' : 'حفظ وإضافة الفكرة'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
