import React, { useState } from 'react';
import { SourceItem, SourceType, SourcePriority, SourceRule } from '../types/index.ts';
import {
  Layers,
  Plus,
  Trash2,
  ExternalLink,
  Rss,
  Twitter,
  Send,
  CheckCircle2,
  XCircle,
  Tag,
  ShieldAlert,
  ArrowUpDown,
  RefreshCw,
  Edit,
  Save,
} from 'lucide-react';

interface Props {
  sources: SourceItem[];
  onSaveSources: (sources: SourceItem[]) => void;
  onRefresh: () => void;
  isSaving: boolean;
}

export const SourcesManager: React.FC<Props> = ({
  sources,
  onSaveSources,
  onRefresh,
  isSaving,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSource, setNewSource] = useState<Partial<SourceItem>>({
    type: 'telegram',
    target: '',
    title: '',
    priority: 'high',
    rule: 'official',
    keywords: ['قبول', 'تسجيل', 'نتائج', 'منح', 'pdf'],
    blacklist: ['إعلان تجاري'],
    enabled: true,
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [blacklistInput, setBlacklistInput] = useState('');

  const handleToggle = (id: string) => {
    const updated = sources.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    onSaveSources(updated);
  };

  const handleDelete = (id: string) => {
    const updated = sources.filter((s) => s.id !== id);
    onSaveSources(updated);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.target || !newSource.title) return;

    const created: SourceItem = {
      id: 'src_' + Date.now(),
      type: newSource.type || 'telegram',
      target: newSource.target.trim(),
      title: newSource.title.trim(),
      priority: newSource.priority || 'medium',
      rule: newSource.rule || 'official',
      keywords: newSource.keywords || [],
      blacklist: newSource.blacklist || [],
      enabled: true,
      lastPostId: '0',
      lastChecked: new Date().toISOString(),
    };

    onSaveSources([...sources, created]);
    setShowAddModal(false);
    setNewSource({
      type: 'telegram',
      target: '',
      title: '',
      priority: 'high',
      rule: 'official',
      keywords: ['قبول', 'تسجيل', 'نتائج', 'منح', 'pdf'],
      blacklist: ['إعلان تجاري'],
      enabled: true,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <span>مدير مصادر المراقبة (Watchlist & sources.json)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            مراقبة قنوات تيليجرام وحسابات X/تويتر الرسمية ومواقع الأخبار الجامعية عبر RSS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl text-xs border border-slate-700 transition-colors"
            title="تحديث من sources.json"
          >
            <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مصدر مراقبة</span>
          </button>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {sources.map((source) => (
          <div
            key={source.id}
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
              source.enabled
                ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                : 'bg-slate-950/30 border-slate-900 opacity-60'
            }`}
          >
            {/* Top row: Type Icon + Rule badge + Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  source.type === 'telegram'
                    ? 'bg-sky-500/15 text-sky-400'
                    : source.type === 'twitter'
                    ? 'bg-indigo-500/15 text-indigo-400'
                    : 'bg-amber-500/15 text-amber-400'
                }`}>
                  {source.type === 'telegram' && <Send className="w-4 h-4 transform -rotate-45" />}
                  {source.type === 'twitter' && <Twitter className="w-4 h-4" />}
                  {source.type === 'rss' && <Rss className="w-4 h-4" />}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white line-clamp-1">{source.title}</h3>
                  <span className="text-[11px] font-mono text-slate-400 block">{source.target}</span>
                </div>
              </div>

              <button
                onClick={() => handleToggle(source.id)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer ${
                  source.enabled
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {source.enabled ? 'نشط' : 'معطل'}
              </button>
            </div>

            {/* Badges: Rule & Priority & Keywords */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded font-medium text-[10px] ${
                  source.rule === 'official'
                    ? 'bg-sky-950 text-sky-300 border border-sky-800/60'
                    : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                }`}>
                  {source.rule === 'official' ? 'رسمي (نشر مباشر)' : 'شبه رسمي (تدقيق وبحث)'}
                </span>

                <span className={`px-2 py-0.5 rounded font-medium text-[10px] ${
                  source.priority === 'high'
                    ? 'bg-rose-950/60 text-rose-300 border border-rose-900/60'
                    : source.priority === 'medium'
                    ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-900/60'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  أولوية: {source.priority === 'high' ? 'عالية' : source.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                </span>
              </div>

              {source.keywords.length > 0 && (
                <div className="flex items-center gap-1 text-slate-400 text-[10px] line-clamp-1">
                  <Tag className="w-3 h-3 text-sky-400 shrink-0" />
                  <span>الكلمات: {source.keywords.join('، ')}</span>
                </div>
              )}
            </div>

            {/* Footer row: last ID & delete */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
              <span className="font-mono">آخر منشور: #{source.lastPostId || '0'}</span>
              <button
                onClick={() => handleDelete(source.id)}
                className="text-slate-500 hover:text-rose-400 p-1"
                title="حذف المصدر"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn" dir="rtl">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 text-slate-100 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" />
              <span>إضافة مصدر مراقبة جديد (Sync with sources.json)</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">نوع المصدر</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSource({ ...newSource, type: 'telegram' })}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold ${
                      newSource.type === 'telegram'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>تيليجرام</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewSource({ ...newSource, type: 'twitter' })}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold ${
                      newSource.type === 'twitter'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Twitter className="w-3.5 h-3.5" />
                    <span>تويتر / X</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewSource({ ...newSource, type: 'rss' })}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold ${
                      newSource.type === 'rss'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Rss className="w-3.5 h-3.5" />
                    <span>موقع RSS</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم المصدر الوصفي</label>
                <input
                  type="text"
                  value={newSource.title}
                  onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
                  placeholder="مثال: قناة عمادة القبول والتسجيل"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  المعرف أو الرابط (Target ID / Username / URL)
                </label>
                <input
                  type="text"
                  value={newSource.target}
                  onChange={(e) => setNewSource({ ...newSource, target: e.target.value })}
                  placeholder="مثال: @KSU_News أو -10012345678 أو رابط RSS"
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">قاعدة المصدر</label>
                  <select
                    value={newSource.rule}
                    onChange={(e) => setNewSource({ ...newSource, rule: e.target.value as SourceRule })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                  >
                    <option value="official">[رسمي] نشر مباشر بعد الصياغة</option>
                    <option value="semi-official">[شبه رسمي] صياغة + تدقيق وبحث</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الأولوية</label>
                  <select
                    value={newSource.priority}
                    onChange={(e) => setNewSource({ ...newSource, priority: e.target.value as SourcePriority })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                  >
                    <option value="high">عالية (فورية)</option>
                    <option value="medium">متوسطة</option>
                    <option value="low">منخفضة</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg"
                >
                  إضافة ومزامنة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
