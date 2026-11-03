import React, { useState, useEffect, useCallback } from 'react';
import { ActivityLogItem } from '../types/index.ts';
import {
  Activity,
  Trash2,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Search,
  Database,
  Edit3,
  Plus,
  RefreshCw,
  HardDrive,
  Save,
  X,
  Check,
  Clock,
  Send,
  Sparkles,
} from 'lucide-react';

interface Props {
  logs: ActivityLogItem[];
  onClearLogs?: () => void;
}

export const ActivityLogs: React.FC<Props> = ({ logs: inMemoryLogs, onClearLogs }) => {
  const [activeSource, setActiveSource] = useState<'sqlite' | 'memory'>('sqlite');
  const [dbLogs, setDbLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Batch Selection State
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState<boolean>(false);
  const [isClearingSeenCache, setIsClearingSeenCache] = useState<boolean>(false);

  // Filters & Search
  const [filterType, setFilterType] = useState<'all' | 'success' | 'filtered' | 'error' | 'info'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [editingLog, setEditingLog] = useState<ActivityLogItem | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingNew, setIsSavingNew] = useState(false);

  // New Log Form
  const [newLogData, setNewLogData] = useState<{
    type: 'success' | 'filtered' | 'error' | 'info';
    messageText: string;
    details: string;
    source: string;
    destination: string;
    appliedRuleName: string;
  }>({
    type: 'info',
    messageText: '',
    details: '',
    source: 'المشرف',
    destination: 'قناة النشر',
    appliedRuleName: 'سجل يدوي',
  });

  // Fetch SQLite logs from server
  const fetchDbLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('limit', '200');
      if (filterType !== 'all') q.set('type', filterType);
      if (searchTerm.trim()) q.set('search', searchTerm.trim());

      const res = await fetch(`/api/logs/db?${q.toString()}`);
      if (!res.ok) throw new Error('فشل جلب السجلات من الخادم');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setDbLogs(data.logs);
      }
    } catch (err: unknown) {
      console.error('Error fetching SQLite logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, searchTerm]);

  useEffect(() => {
    if (activeSource === 'sqlite') {
      fetchDbLogs();
    }
  }, [activeSource, fetchDbLogs]);

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Handle Log Update
  const handleSaveEdit = async () => {
    if (!editingLog) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch('/api/logs/db/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingLog.id,
          messageText: editingLog.messageText,
          details: editingLog.details,
          type: editingLog.type,
          source: editingLog.source,
          destination: editingLog.destination,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('تم تحديث السجل بنجاح في قاعدة بيانات SQLite الدائمة 💾');
        setEditingLog(null);
        fetchDbLogs();
      } else {
        showNotification(`تعذر التعديل: ${data.error || 'خطأ غير معروف'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`خطأ في الاتصال: ${msg}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Log Delete
  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا السجل نهائياً من قاعدة بيانات SQLite؟')) {
      return;
    }
    try {
      const res = await fetch('/api/logs/db/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('تم حذف السجل من قاعدة البيانات 🗑️');
        setDbLogs((prev) => prev.filter((l) => l.id !== id));
      } else {
        showNotification(`فشل الحذف: ${data.error || 'خطأ'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`خطأ: ${msg}`);
    }
  };

  // Handle Clear SQLite Logs
  const handleClearDbLogs = async () => {
    if (!window.confirm('تحذير: سيتم مسح كافة سجلات الأحداث المخزنة في قاعدة بيانات SQLite. هل تريد المتابعة؟')) {
      return;
    }
    try {
      const res = await fetch('/api/logs/db/clear', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showNotification('تم مسح جميع السجلات من قاعدة بيانات SQLite بنجاح 🧹');
        setDbLogs([]);
      } else {
        showNotification(`تعذر مسح السجلات: ${data.error || 'خطأ'}`);
      }
    } catch (err: unknown) {
      showNotification(`خطأ: ${err}`);
    }
  };

  // Handle Batch Delete of Selected Logs / Posts
  const handleBatchDelete = async () => {
    if (selectedLogIds.size === 0) return;
    if (!window.confirm(`هل أنت متأكد من حذف (${selectedLogIds.size}) سجل ومنشور محدد نهائياً من قاعدة بيانات SQLite؟`)) {
      return;
    }
    setIsBatchDeleting(true);
    try {
      const idsArray = Array.from(selectedLogIds);
      const res = await fetch('/api/logs/db/delete-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsArray }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`تم بنجاح حذف (${data.deleted_count || idsArray.length}) منشور وسجل من قاعدة البيانات 🗑️`);
        setDbLogs((prev) => prev.filter((l) => !selectedLogIds.has(String(l.id))));
        setSelectedLogIds(new Set());
      } else {
        showNotification(`تعذر حذف الدفعة: ${data.error || 'خطأ'}`);
      }
    } catch (err: unknown) {
      showNotification(`خطأ في الحذف الجماعي: ${err}`);
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // Handle Clear Seen Posts & Duplicate Hash Cache
  const handleClearSeenPostsCache = async () => {
    if (!window.confirm('هل تريد تصفير سجل المنشورات المعالجة وكاش التكرار؟ سيتيح هذا للبوت إعادة سحب ومعالجة كافة الأخبار السابقة من الصفر دون قيود.')) {
      return;
    }
    setIsClearingSeenCache(true);
    try {
      const res = await fetch('/api/posts/clear-seen-cache', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification(`تم تصفير كاش التكرار بنجاح (تم مسح ${data.seen_posts_cleared || 0} سجل منع تكرار) 🧹✨`);
        fetchDbLogs();
      } else {
        showNotification(`فشل تصفير الكاش: ${data.error || 'خطأ'}`);
      }
    } catch (err: unknown) {
      showNotification(`خطأ أثناء تصفير الكاش: ${err}`);
    } finally {
      setIsClearingSeenCache(false);
    }
  };

  const toggleSelectLog = (id: string) => {
    setSelectedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLogIds.size === filteredLogs.length && filteredLogs.length > 0) {
      setSelectedLogIds(new Set());
    } else {
      setSelectedLogIds(new Set(filteredLogs.map((l) => String(l.id))));
    }
  };


  // Handle Add New Log
  const handleAddNewLog = async () => {
    if (!newLogData.messageText.trim()) {
      alert('يرجى إدخال نص الرسالة للسجل');
      return;
    }
    setIsSavingNew(true);
    try {
      const res = await fetch('/api/logs/db/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLogData),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('تم إضافة السجل الجديد إلى قاعدة بيانات SQLite بنجاح ✅');
        setIsAddModalOpen(false);
        setNewLogData({
          type: 'info',
          messageText: '',
          details: '',
          source: 'المشرف',
          destination: 'قناة النشر',
          appliedRuleName: 'سجل يدوي',
        });
        fetchDbLogs();
      } else {
        showNotification(`فشلت الإضافة: ${data.error || 'خطأ'}`);
      }
    } catch (err: unknown) {
      showNotification(`خطأ في الإضافة: ${err}`);
    } finally {
      setIsSavingNew(false);
    }
  };

  // Current displayed logs based on source
  const currentLogs = activeSource === 'sqlite' ? dbLogs : inMemoryLogs;

  const filteredLogs = currentLogs.filter((log) => {
    if (filterType !== 'all' && log.type !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (log.messageText || '').toLowerCase().includes(term) ||
        (log.details || '').toLowerCase().includes(term) ||
        (log.source || '').toLowerCase().includes(term) ||
        (log.destination || '').toLowerCase().includes(term) ||
        (log.appliedRuleName || '').toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Status banner */}
      {statusMessage && (
        <div className="p-3 bg-sky-950/80 border border-sky-600/50 rounded-xl text-sky-200 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-sky-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <span>إدارة سجلات الأحداث وقاعدة بيانات SQLite الدائمة</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-700/50 flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-indigo-400" />
              bot_database.db
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            سجلات دائمة محفوظة على القرص ووحدة التخزين الداخلية للهاتف، قابلة للعرض والتعديل والحذف المباشر من لوحة التحكم
          </p>
        </div>

        {/* Source Switcher & Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          {/* Storage Mode Toggle */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => setActiveSource('sqlite')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeSource === 'sqlite'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>قاعدة SQLite ({dbLogs.length})</span>
            </button>
            <button
              onClick={() => setActiveSource('memory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeSource === 'memory'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>سجلات الجلسة ({inMemoryLogs.length})</span>
            </button>
          </div>

          {/* Action Buttons */}
          {activeSource === 'sqlite' && (
            <>
              <button
                onClick={handleClearSeenPostsCache}
                disabled={isClearingSeenCache}
                title="تصفير كاش التكرار وسجل المنشورات المحفوظة لإتاحة إعادة النشر فوراً"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-amber-950/50 text-slate-300 hover:text-amber-300 rounded-xl text-xs border border-slate-700 transition-colors"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isClearingSeenCache ? 'animate-spin' : ''}`} />
                <span>تصفير كاش المنشورات المحفوظة</span>
              </button>

              <button
                onClick={fetchDbLogs}
                disabled={isLoading}
                title="تحديث السجلات من قاعدة بيانات SQLite"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs border border-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة سجل</span>
              </button>

              {dbLogs.length > 0 && (
                <button
                  onClick={handleClearDbLogs}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-xl text-xs border border-slate-700/60 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح الكل</span>
                </button>
              )}
            </>
          )}

          {activeSource === 'memory' && onClearLogs && inMemoryLogs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-xl text-xs border border-slate-700/60 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح الجلسة</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في الرسائل، التفاصيل، القنوات، أو القواعد..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 pl-8"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              filterType === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({currentLogs.length})
          </button>

          <button
            onClick={() => setFilterType('success')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              filterType === 'success' ? 'bg-emerald-600/80 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            الموجهة ({currentLogs.filter((l) => l.type === 'success').length})
          </button>

          <button
            onClick={() => setFilterType('filtered')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              filterType === 'filtered' ? 'bg-amber-600/80 text-white shadow-sm' : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            المستبعدة ({currentLogs.filter((l) => l.type === 'filtered').length})
          </button>

          <button
            onClick={() => setFilterType('error')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              filterType === 'error' ? 'bg-rose-600/80 text-white shadow-sm' : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            الأخطاء ({currentLogs.filter((l) => l.type === 'error').length})
          </button>

          <button
            onClick={() => setFilterType('info')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              filterType === 'info' ? 'bg-sky-600/80 text-white shadow-sm' : 'text-slate-400 hover:text-sky-400'
            }`}
          >
            معلومات ({currentLogs.filter((l) => l.type === 'info').length})
          </button>
        </div>
      </div>

      {/* Batch Selection Action Bar */}
      {activeSource === 'sqlite' && filteredLogs.length > 0 && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 px-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={selectedLogIds.size === filteredLogs.length && filteredLogs.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="font-medium">تحديد الكل ({filteredLogs.length})</span>
            </label>
            {selectedLogIds.size > 0 && (
              <span className="text-indigo-400 font-semibold bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded-full text-[11px]">
                تم اختيار {selectedLogIds.size} من {filteredLogs.length}
              </span>
            )}
          </div>

          {selectedLogIds.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchDelete}
                disabled={isBatchDeleting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold shadow-md transition-colors cursor-pointer text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف المحدد ({selectedLogIds.size}) منشور / سجل</span>
              </button>
              <button
                onClick={() => setSelectedLogIds(new Set())}
                className="text-slate-400 hover:text-white px-2 py-1 text-xs"
              >
                إلغاء التحديد
              </button>
            </div>
          )}
        </div>
      )}

      {/* Logs Table / List */}
      {filteredLogs.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl space-y-2">
          <Database className="w-8 h-8 text-slate-600 mx-auto" />
          <p>لا توجد سجلات مطابقة حالياً.</p>
          {activeSource === 'sqlite' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-indigo-400 hover:underline text-xs inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة أول سجل في قاعدة البيانات</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`p-3.5 rounded-xl border text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors ${
                selectedLogIds.has(String(log.id))
                  ? 'bg-indigo-950/30 border-indigo-700/80 shadow-sm ring-1 ring-indigo-500/30'
                  : log.type === 'success'
                  ? 'bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-700/60'
                  : log.type === 'filtered'
                  ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60'
                  : log.type === 'error'
                  ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Main Log Info */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {activeSource === 'sqlite' && (
                  <input
                    type="checkbox"
                    checked={selectedLogIds.has(String(log.id))}
                    onChange={() => toggleSelectLog(String(log.id))}
                    className="w-4 h-4 mt-1 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                  />
                )}
                <div className="mt-1 shrink-0">
                  {log.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {log.type === 'filtered' && <XCircle className="w-4 h-4 text-amber-400" />}
                  {log.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  {log.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-200">
                      {log.appliedRuleName || 'قاعدة عامة'}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {log.source || 'المصدر'} ➔ {log.destination || 'الوجهة'}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        log.type === 'success'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : log.type === 'filtered'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : log.type === 'error'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-sky-950 text-sky-400 border border-sky-800'
                      }`}
                    >
                      {log.type === 'success'
                        ? 'توجيه ناجح'
                        : log.type === 'filtered'
                        ? 'مستبعد'
                        : log.type === 'error'
                        ? 'خطأ'
                        : 'معلومات'}
                    </span>
                  </div>

                  <p className="text-slate-200 font-sans break-words">{log.messageText}</p>
                  {log.details && (
                    <p className="text-[11px] text-slate-400 break-words bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/80">
                      {log.details}
                    </p>
                  )}
                </div>
              </div>

              {/* Timestamp & Management Actions */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span>
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'الآن'}
                  </span>
                </div>

                {/* Edit & Delete for SQLite */}
                {activeSource === 'sqlite' && (
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setEditingLog({ ...log })}
                      title="تعديل هذا السجل في قاعدة بيانات SQLite"
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      title="حذف هذا السجل نهائياً"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Log Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>تعديل السجل في SQLite (ID: {editingLog.id})</span>
              </h3>
              <button
                onClick={() => setEditingLog(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">نوع السجل والحالة:</label>
                <select
                  value={editingLog.type}
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      type: e.target.value as 'success' | 'filtered' | 'error' | 'info',
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="success">موجهة بنجاح (success)</option>
                  <option value="filtered">مستبعدة (filtered)</option>
                  <option value="error">خطأ في المعالجة (error)</option>
                  <option value="info">معلومات / تشغيل (info)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">نص الرسالة أو المنشور:</label>
                <textarea
                  value={editingLog.messageText}
                  onChange={(e) =>
                    setEditingLog({ ...editingLog, messageText: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-indigo-500"
                  placeholder="محتوى السجل..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">التفاصيل والملاحظات:</label>
                <textarea
                  value={editingLog.details}
                  onChange={(e) =>
                    setEditingLog({ ...editingLog, details: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-indigo-500"
                  placeholder="سبب الاستبعاد أو معرف النشر..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">المصدر (Source):</label>
                  <input
                    type="text"
                    value={editingLog.source}
                    onChange={(e) =>
                      setEditingLog({ ...editingLog, source: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الوجهة (Destination):</label>
                  <input
                    type="text"
                    value={editingLog.destination}
                    onChange={(e) =>
                      setEditingLog({ ...editingLog, destination: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingEdit ? 'جاري الحفظ...' : 'حفظ في SQLite 💾'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Log Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>إضافة سجل جديد لقاعدة بيانات SQLite</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">نوع السجل:</label>
                  <select
                    value={newLogData.type}
                    onChange={(e) =>
                      setNewLogData({
                        ...newLogData,
                        type: e.target.value as 'success' | 'filtered' | 'error' | 'info',
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="info">معلومات / تشغيل (info)</option>
                    <option value="success">توجيه ناجح (success)</option>
                    <option value="filtered">مستبعد (filtered)</option>
                    <option value="error">خطأ (error)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">اسم القاعدة / العملية:</label>
                  <input
                    type="text"
                    value={newLogData.appliedRuleName}
                    onChange={(e) =>
                      setNewLogData({ ...newLogData, appliedRuleName: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                    placeholder="مثال: نشر يدوي / تدقيق زمني"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">نص الرسالة أو الحدث:</label>
                <textarea
                  value={newLogData.messageText}
                  onChange={(e) =>
                    setNewLogData({ ...newLogData, messageText: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-emerald-500"
                  placeholder="أدخل نص الرسالة أو العملية هنا..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">التفاصيل والملاحظات:</label>
                <textarea
                  value={newLogData.details}
                  onChange={(e) =>
                    setNewLogData({ ...newLogData, details: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-emerald-500"
                  placeholder="ملاحظات توضيحية حول السجل..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">المصدر (Source):</label>
                  <input
                    type="text"
                    value={newLogData.source}
                    onChange={(e) =>
                      setNewLogData({ ...newLogData, source: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الوجهة (Destination):</label>
                  <input
                    type="text"
                    value={newLogData.destination}
                    onChange={(e) =>
                      setNewLogData({ ...newLogData, destination: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddNewLog}
                disabled={isSavingNew}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSavingNew ? 'جاري الإضافة...' : 'إضافة إلى SQLite 💾'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
