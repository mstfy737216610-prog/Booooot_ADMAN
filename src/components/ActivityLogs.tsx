import React, { useState } from 'react';
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
} from 'lucide-react';

interface Props {
  logs: ActivityLogItem[];
  onClearLogs: () => void;
}

export const ActivityLogs: React.FC<Props> = ({ logs, onClearLogs }) => {
  const [filterType, setFilterType] = useState<'all' | 'success' | 'filtered' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (filterType !== 'all' && log.type !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        log.messageText.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term) ||
        log.source.toLowerCase().includes(term) ||
        log.destination.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            <span>سجل النشاط المباشر والعمليات (Activity Logs)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            متابعة الرسائل التي تم معالجتها وتوجيهها أو استبعادها والأخطاء لحظة بلحظة
          </p>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 rounded-xl text-xs border border-slate-700/60 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح السجل</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في الرسائل والسجلات..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 pl-8"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterType === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({logs.length})
          </button>

          <button
            onClick={() => setFilterType('success')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterType === 'success' ? 'bg-emerald-600/80 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            الموجهة ({logs.filter((l) => l.type === 'success').length})
          </button>

          <button
            onClick={() => setFilterType('filtered')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterType === 'filtered' ? 'bg-amber-600/80 text-white shadow-sm' : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            المستبعدة ({logs.filter((l) => l.type === 'filtered').length})
          </button>

          <button
            onClick={() => setFilterType('error')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterType === 'error' ? 'bg-rose-600/80 text-white shadow-sm' : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            الأخطاء ({logs.filter((l) => l.type === 'error').length})
          </button>
        </div>
      </div>

      {/* Logs Table / List */}
      {filteredLogs.length === 0 ? (
        <div className="py-10 text-center text-slate-500 text-xs">
          لا توجد سجلات مطابقة حالياً. قم بتشغيل المحاكي أو اختبار توجيه رسالة.
        </div>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                log.type === 'success'
                  ? 'bg-emerald-950/20 border-emerald-900/40'
                  : log.type === 'filtered'
                  ? 'bg-amber-950/20 border-amber-900/40'
                  : log.type === 'error'
                  ? 'bg-rose-950/20 border-rose-900/40'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-start gap-2.5 flex-1">
                <div className="mt-0.5 shrink-0">
                  {log.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {log.type === 'filtered' && <XCircle className="w-4 h-4 text-amber-400" />}
                  {log.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  {log.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">
                      {log.appliedRuleName || 'قاعدة عامة'}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      {log.source} ➔ {log.destination}
                    </span>
                  </div>
                  <p className="text-slate-300 font-sans line-clamp-1">{log.messageText}</p>
                  <p className="text-[11px] text-slate-400">{log.details}</p>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-mono shrink-0 self-end sm:self-center">
                {log.timestamp}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
