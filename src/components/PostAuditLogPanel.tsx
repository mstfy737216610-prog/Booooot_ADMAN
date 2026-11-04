import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Lightbulb,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image,
  Video,
  Send,
  MessageSquare
} from 'lucide-react';

export interface AuditLogItem {
  id: number;
  post_id: string;
  status: 'published' | 'rejected' | 'pending';
  title: string;
  raw_content: string;
  final_content?: string;
  rejection_reason?: string;
  source_type: string;
  source_origin: string;
  target_destination: string;
  target_univ: string;
  media_type: string;
  media_url?: string;
  created_at: string;
  published_at?: string;
}

export const PostAuditLogPanel: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [counts, setCounts] = useState({ total: 0, published: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Modal for converting log to future idea
  const [convertingLog, setConvertingLog] = useState<AuditLogItem | null>(null);
  const [ideaNotes, setIdeaNotes] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filterStatus,
        search: searchQuery,
        limit: '150'
      });
      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (e) {
      console.warn('Audit logs fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleDeleteLog = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل نهائياً؟')) return;
    try {
      const res = await fetch('/api/audit-logs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setLogs(prev => prev.filter(l => l.id !== id));
        showToastMsg('تم حذف السجل بنجاح 🗑️');
      }
    } catch {
      showToastMsg('تعذر حذف السجل');
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('هل تريد مسح كافة سجلات المنشورات المحددة حالياً؟')) return;
    try {
      const res = await fetch('/api/audit-logs/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: filterStatus })
      });
      if (res.ok) {
        fetchLogs();
        showToastMsg('تم مسح السجلات المحددة بنجاح 🧹');
      }
    } catch {
      showToastMsg('تعذر مسح السجلات');
    }
  };

  const handleConvertToIdea = async () => {
    if (!convertingLog) return;
    setIsConverting(true);
    try {
      const res = await fetch('/api/audit-logs/convert-to-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: convertingLog.id, notes: ideaNotes })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg('💡 تم تحويل المنشور بنجاح إلى لوحة الأفكار المستقبلية!');
        setConvertingLog(null);
        setIdeaNotes('');
      } else {
        showToastMsg(data.error || 'تعذر التحويل إلى فكرة');
      }
    } catch {
      showToastMsg('خطأ أثناء تحويل المنشور إلى فكرة');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 px-4 py-2 bg-slate-900 border border-emerald-500/50 text-white text-xs font-bold rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header & KPI Metrics Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-extrabold text-white">سجل المنشورات الشامل والرقابة الأكاديمية (Audit Log)</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              توثيق شامل لكافة المنشورات المعالجة: المنشورات المقبولة وتفاصيل نشرها، والمنشورات المرفوضة مع بيان سبب الرفض الدقيق (تكرار، إعلانات، عدم أهمية).
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
              <span>تحديث</span>
            </button>
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-xl border border-rose-800/50 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>تفريغ السجل</span>
            </button>
          </div>
        </div>

        {/* Counter cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">إجمالي المنشورات المعالجة</span>
              <p className="text-xl font-bold font-mono text-white mt-0.5 tabular-nums">{counts.total}</p>
            </div>
            <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-950/60 border border-emerald-900/30 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-300 font-medium">المنشورات المقبولة والمنشورة</span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">{counts.published}</p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-950/60 border border-rose-900/30 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-rose-300 font-medium">المنشورات المرفوضة والمستبعدة</span>
              <p className="text-xl font-bold font-mono text-rose-400 mt-0.5 tabular-nums">{counts.rejected}</p>
            </div>
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({counts.total})
          </button>
          <button
            onClick={() => setFilterStatus('published')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
              filterStatus === 'published'
                ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-700/50 shadow-sm'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>المقبولة ({counts.published})</span>
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
              filterStatus === 'rejected'
                ? 'bg-rose-950/60 text-rose-200 border border-rose-700/50 shadow-sm'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>المرفوضة ({counts.rejected})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في العنوان، المحتوى، أو سبب الرفض..."
            className="w-full pr-9 pl-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="space-y-3">
        {loading && logs.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span>جاري تحميل سجلات التدقيق...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-10 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-300">لا توجد سجلات منشورة أو مرفوضة مطابقة</h3>
            <p className="text-xs text-slate-500 mt-1">
              سيتم تسجيل كل خبر يتم التعامل معه تلقائياً هنا مع تفاصيل قبوله أو أسباب رفضه.
            </p>
          </div>
        ) : (
          logs.map((item) => {
            const isPublished = item.status === 'published';
            const isExpanded = expandedId === item.id;
            const timeFormatted = item.created_at ? new Date(item.created_at).toLocaleString('ar-SA') : 'الآن';

            return (
              <div
                key={item.id}
                className={`bg-slate-900/80 border rounded-xl overflow-hidden transition-all shadow-md ${
                  isPublished
                    ? 'border-emerald-900/40 hover:border-emerald-800/60'
                    : 'border-rose-900/40 hover:border-rose-800/60'
                }`}
              >
                {/* Header Row */}
                <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                        isPublished ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {isPublished ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            isPublished
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isPublished ? 'منشور بنجاح' : 'تم الرفض والاستبعاد'}
                        </span>

                        {item.target_univ && (
                          <span className="text-[11px] text-sky-400 font-semibold bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                            {item.target_univ}
                          </span>
                        )}

                        <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {timeFormatted}
                        </span>

                        <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          المصدر: {item.source_origin || item.source_type}
                        </span>

                        {item.target_destination && isPublished && (
                          <span className="text-[11px] text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40">
                            القناة: {item.target_destination}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white tracking-tight truncate">
                        {item.title}
                      </h3>

                      {!isPublished && item.rejection_reason && (
                        <div className="text-xs text-rose-300 bg-rose-950/30 border border-rose-900/50 rounded-lg px-2.5 py-1 inline-flex items-center gap-1.5 mt-1">
                          <span className="font-semibold text-rose-400">سبب الرفض الدقيق:</span>
                          <span>{item.rejection_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => {
                        setConvertingLog(item);
                        setIdeaNotes(
                          item.rejection_reason
                            ? `ملاحظة توجيهية: تم استبعاد المنشور بسبب (${item.rejection_reason}) ولكن يمكن الاستفادة من فكرته في...`
                            : 'ملاحظة توجيهية لتطوير المحتوى والبناء على هذا المنشور...'
                        );
                      }}
                      title="تحويل هذا المنشور إلى فكرة مستقبلية في لوحة الأفكار"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/40 transition-all cursor-pointer"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>تحويل لفكرة 💡</span>
                    </button>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all cursor-pointer"
                      title={isExpanded ? 'طي التفاصيل' : 'عرض التفاصيل'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleDeleteLog(item.id)}
                      className="p-1.5 bg-slate-800/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700/60 transition-all cursor-pointer"
                      title="حذف السجل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details View */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950/70 border-t border-slate-800 space-y-3 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Raw Content */}
                      <div className="space-y-1.5">
                        <span className="font-bold text-slate-400 block">النص الأصلي المسحوب من المصدر:</span>
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 whitespace-pre-wrap font-sans text-xs max-h-56 overflow-y-auto leading-relaxed">
                          {item.raw_content || 'لا يوجد نص خام'}
                        </div>
                      </div>

                      {/* Final Content or Rejection details */}
                      <div className="space-y-1.5">
                        <span className="font-bold text-slate-400 block">
                          {isPublished ? 'النص النهائي المحرر والمنشور في القناة:' : 'تفاصيل وقرار الفلترة الأكاديمية:'}
                        </span>
                        <div
                          className={`p-3 rounded-xl border whitespace-pre-wrap font-sans text-xs max-h-56 overflow-y-auto leading-relaxed ${
                            isPublished
                              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-100'
                              : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                          }`}
                        >
                          {isPublished ? item.final_content || item.raw_content : `❌ سبب الاستبعاد:\n${item.rejection_reason || 'تم الاستبعاد آلياً لمنع الحشو أو التكرار.'}\n\n💡 نصيحة: يمكنك الضغط على "تحويل لفكرة" لاستثمار الموضوع في أفكار قادمة.`}
                        </div>
                      </div>
                    </div>

                    {item.media_url && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                        <Image className="w-3.5 h-3.5 text-sky-400" />
                        <span>رابط الميديا المرفقة:</span>
                        <a href={item.media_url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline truncate max-w-md">
                          {item.media_url}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Convert to Idea Modal */}
      {convertingLog && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Lightbulb className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">تحويل المنشور إلى فكرة مستقبلية في لوحة الأفكار</h3>
              </div>
              <button
                onClick={() => setConvertingLog(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-1">عنوان الفكرة المقترحة:</span>
                <input
                  type="text"
                  defaultValue={convertingLog.title}
                  id="convert_title"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">
                  الملاحظات والتوجيهات التشغيلية (عقدة التعلم والتفوق التنافسي):
                </span>
                <textarea
                  rows={4}
                  value={ideaNotes}
                  onChange={(e) => setIdeaNotes(e.target.value)}
                  placeholder="اكتب توجيهك أو وجهة نظرك في كيفية استغلال هذه الفكرة للطلاب، وما الذي يجب أن نركز عليه لنتفوق على المنافسين..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
                <span>الجامعة المرتبطة:</span>{' '}
                <span className="text-sky-300 font-bold">{convertingLog.target_univ || 'شأن طلابي عام'}</span>
                {' · '}
                <span>الحالة في السجل:</span>{' '}
                <span className={convertingLog.status === 'published' ? 'text-emerald-400' : 'text-rose-400'}>
                  {convertingLog.status === 'published' ? 'منشور' : 'مرفوض'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setConvertingLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  const titleInput = (document.getElementById('convert_title') as HTMLInputElement)?.value;
                  if (titleInput) convertingLog.title = titleInput;
                  handleConvertToIdea();
                }}
                disabled={isConverting}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer disabled:opacity-50"
              >
                {isConverting ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Lightbulb className="w-4 h-4" />
                )}
                <span>حفظ في لوحة الأفكار</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
