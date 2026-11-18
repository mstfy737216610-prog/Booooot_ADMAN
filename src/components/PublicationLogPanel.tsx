import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Bookmark,
  Search,
  RefreshCw,
  Trash2,
  Save,
  Eye,
  Link2Off,
  Link as LinkIcon,
  Calendar,
  ArrowUpDown,
  Lightbulb,
  ShieldBan,
  Plus,
  ExternalLink,
  Check,
  AlertTriangle,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  PublicationAuditLogItem,
  PublicationAuditCounts,
  BlockedLinkItem,
} from '../types/index.ts';

interface PublicationLogPanelProps {
  onNotify?: (message: string) => void;
}

type StatusFilter = 'all' | 'published' | 'rejected' | 'pending';
type SortOption = 'newest' | 'oldest' | 'event_date' | 'future_first';
type ActiveView = 'table' | 'blocked_links';

function formatArabicDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderTelegramPreviewLines(raw: string): React.ReactNode {
  if (!raw) return <span className="text-slate-500">لا يوجد نص منسق</span>;
  const normalized = raw
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>');

  return normalized.split('\n').map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    const tagRe = /<(b|strong|i|em|code|u|s)>(.*?)<\/\1>|<a\s+href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
    let lastIdx = 0;
    let match: RegExpExecArray | null;
    let keyCounter = 0;

    while ((match = tagRe.exec(line)) !== null) {
      if (match.index > lastIdx) {
        parts.push(line.slice(lastIdx, match.index));
      }
      if (match[1]) {
        const tag = match[1].toLowerCase();
        const inner = match[2];
        if (tag === 'b' || tag === 'strong') {
          parts.push(
            <strong key={`t-${lineIdx}-${keyCounter++}`} className="font-bold text-white">
              {inner}
            </strong>
          );
        } else if (tag === 'code') {
          parts.push(
            <code
              key={`t-${lineIdx}-${keyCounter++}`}
              className="px-1 py-0.5 rounded bg-slate-800 text-sky-300 font-mono text-xs"
            >
              {inner}
            </code>
          );
        } else if (tag === 'i' || tag === 'em') {
          parts.push(
            <em key={`t-${lineIdx}-${keyCounter++}`} className="italic text-slate-200">
              {inner}
            </em>
          );
        } else {
          parts.push(inner);
        }
      } else if (match[3]) {
        parts.push(
          <a
            key={`t-${lineIdx}-${keyCounter++}`}
            href={match[3]}
            target="_blank"
            rel="noreferrer"
            className="text-sky-400 underline hover:text-sky-300"
          >
            {match[4] || match[3]}
          </a>
        );
      }
      lastIdx = tagRe.lastIndex;
    }

    if (lastIdx < line.length) {
      parts.push(line.slice(lastIdx));
    }

    return (
      <div key={`l-${lineIdx}`} className={line.trim() === '' ? 'h-2' : 'leading-relaxed'}>
        {parts.length > 0 ? parts : line}
      </div>
    );
  });
}

export const PublicationLogPanel: React.FC<PublicationLogPanelProps> = ({ onNotify }) => {
  const [activeView, setActiveView] = useState<ActiveView>('table');
  const [logs, setLogs] = useState<PublicationAuditLogItem[]>([]);
  const [counts, setCounts] = useState<PublicationAuditCounts>({
    total: 0,
    published: 0,
    rejected: 0,
    pending: 0,
    future: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [futureOnly, setFutureOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [savingRowId, setSavingRowId] = useState<number | null>(null);
  const [savedRowId, setSavedRowId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [selectedLog, setSelectedLog] = useState<PublicationAuditLogItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const [newPostTitle, setNewPostTitle] = useState<string>('');
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [newPostStatus, setNewPostStatus] = useState<'published' | 'rejected'>('published');
  const [newPostReason, setNewPostReason] = useState<string>('');
  const [newPostNotes, setNewPostNotes] = useState<string>('');
  const [newPostFuture, setNewPostFuture] = useState<boolean>(false);
  const [newPostEventDate, setNewPostEventDate] = useState<string>('');
  const [dateAnalysis, setDateAnalysis] = useState<{
    detectedDates: string[];
    isExpired: boolean;
    blockedLinks: { url: string; reason: string }[];
  } | null>(null);

  const [blockedLinks, setBlockedLinks] = useState<BlockedLinkItem[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState<boolean>(false);
  const [linkPattern, setLinkPattern] = useState<string>('');
  const [linkMatchType, setLinkMatchType] = useState<'contains' | 'domain' | 'exact'>('contains');
  const [linkReason, setLinkReason] = useState<string>('');
  const [linkIsBroken, setLinkIsBroken] = useState<boolean>(true);
  const [probeResult, setProbeResult] = useState<{
    url: string;
    blocked: boolean;
    blockReason: string;
    reachable: boolean | null;
    httpStatus: number | null;
    probeError: string;
  } | null>(null);
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const notify = useCallback(
    (text: string, type: 'ok' | 'err' = 'ok') => {
      setFeedbackBanner({ type, text });
      if (onNotify) onNotify(text);
      setTimeout(() => {
        setFeedbackBanner((prev) => (prev?.text === text ? null : prev));
      }, 3500);
    },
    [onNotify]
  );

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '150',
        status: statusFilter,
        futureOnly: String(futureOnly),
        sortBy,
        search: searchQuery.trim(),
      });
      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error('تعذر جلب السجلات من الخادم');
      const data = await res.json();
      if (data.success) {
        const list: PublicationAuditLogItem[] = Array.isArray(data.logs) ? data.logs : [];
        setLogs(list);
        if (data.counts) setCounts(data.counts);
        setNoteDrafts((prev) => {
          const next = { ...prev };
          for (const item of list) {
            if (next[item.id] === undefined) {
              next[item.id] = item.notes || '';
            }
          }
          return next;
        });
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'تعذر تحميل سجل المنشورات', 'err');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, futureOnly, sortBy, searchQuery, notify]);

  const fetchBlockedLinks = useCallback(async () => {
    setIsLoadingLinks(true);
    try {
      const res = await fetch('/api/blocked-links');
      if (!res.ok) throw new Error('تعذر جلب قائمة مانع الروابط');
      const data = await res.json();
      if (data.success && Array.isArray(data.links)) {
        setBlockedLinks(data.links);
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'تعذر جلب مانع الروابط', 'err');
    } finally {
      setIsLoadingLinks(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchBlockedLinks();
  }, [fetchBlockedLinks]);

  const handleUpdateLogField = async (
    itemId: number,
    patch: { notes?: string; is_future?: boolean; event_date?: string }
  ) => {
    setSavingRowId(itemId);
    try {
      const res = await fetch(`/api/audit-logs/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.log) {
        throw new Error(data.error || 'تعذر حفظ التعديل في قاعدة البيانات');
      }
      setLogs((prev) => prev.map((row) => (row.id === itemId ? data.log : row)));
      if (selectedLog?.id === itemId) setSelectedLog(data.log);
      if (data.counts) setCounts(data.counts);
      setNoteDrafts((prev) => ({ ...prev, [itemId]: data.log.notes || '' }));
      setSavedRowId(itemId);
      setTimeout(() => {
        setSavedRowId((curr) => (curr === itemId ? null : curr));
      }, 2000);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل حفظ التعديل', 'err');
    } finally {
      setSavingRowId(null);
    }
  };

  const handleDeleteLog = async (itemId: number) => {
    try {
      const res = await fetch('/api/audit-logs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId }),
      });
      const data = await res.json();
      if (data.success) {
        setLogs((prev) => prev.filter((r) => r.id !== itemId));
        if (data.counts) setCounts(data.counts);
        if (selectedLog?.id === itemId) setSelectedLog(null);
        setConfirmDeleteId(null);
        notify('تم حذف السجل من قاعدة البيانات بنجاح');
      }
    } catch {
      notify('تعذر حذف السجل', 'err');
    }
  };

  const handleConvertToIdea = async (item: PublicationAuditLogItem) => {
    try {
      const note = noteDrafts[item.id] ?? item.notes ?? '';
      const res = await fetch('/api/audit-logs/convert-to-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, notes: note }),
      });
      const data = await res.json();
      if (data.success) {
        notify('تم حفظ المنشور كفكرة في لوحة الأفكار المستقبلية');
      } else {
        notify('تعذر تحويل المنشور إلى فكرة', 'err');
      }
    } catch {
      notify('تعذر الاتصال بالخادم', 'err');
    }
  };

  const handleQuickBlockUrl = async (urlToBlock: string, reasonText = 'رابط معطل أو مرفوض من المشرف') => {
    try {
      const res = await fetch('/api/blocked-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: urlToBlock,
          match_type: 'contains',
          reason: reasonText,
          is_broken: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.links)) setBlockedLinks(data.links);
        notify(`تمت إضافة الرابط إلى مانع الروابط وحفظه في SQLite: ${urlToBlock}`);
      } else {
        notify(data.error || 'تعذر حظر الرابط', 'err');
      }
    } catch {
      notify('تعذر حفظ قاعدة الحظر', 'err');
    }
  };

  const handleAddBlockedRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkPattern.trim()) return;
    try {
      const res = await fetch('/api/blocked-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: linkPattern.trim(),
          match_type: linkMatchType,
          reason: linkReason.trim() || (linkIsBroken ? 'رابط لا يعمل / معطل' : 'رابط محظور يدوياً'),
          is_broken: linkIsBroken,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.links)) setBlockedLinks(data.links);
        setLinkPattern('');
        setLinkReason('');
        setProbeResult(null);
        notify('تم حفظ قاعدة منع الرابط في قاعدة البيانات ولن يُنشر في تيليجرام');
      } else {
        notify(data.error || 'تعذر إضافة قاعدة الحظر', 'err');
      }
    } catch {
      notify('خطأ في الاتصال أثناء حفظ قاعدة الحظر', 'err');
    }
  };

  const handleToggleBlockedRule = async (rule: BlockedLinkItem) => {
    try {
      const res = await fetch(`/api/blocked-links/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.links)) {
        setBlockedLinks(data.links);
        notify(!rule.enabled ? 'تم تفعيل قاعدة الحظر' : 'تم تعطيل قاعدة الحظر مؤقتاً');
      }
    } catch {
      notify('تعذر تعديل حالة قاعدة الحظر', 'err');
    }
  };

  const handleDeleteBlockedRule = async (id: number) => {
    try {
      const res = await fetch(`/api/blocked-links/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success && Array.isArray(data.links)) {
        setBlockedLinks(data.links);
        notify('تم حذف قاعدة منع الرابط نهائياً');
      }
    } catch {
      notify('تعذر حذف قاعدة الحظر', 'err');
    }
  };

  const handleProbeUrl = async (targetUrl?: string) => {
    const u = (targetUrl || linkPattern).trim();
    if (!u) return;
    setIsProbing(true);
    try {
      const res = await fetch('/api/blocked-links/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: u, probeLive: true }),
      });
      const data = await res.json();
      if (data.success) {
        setProbeResult({
          url: data.url,
          blocked: Boolean(data.blocked),
          blockReason: data.blockReason || '',
          reachable: data.reachable,
          httpStatus: data.httpStatus,
          probeError: data.probeError || '',
        });
      }
    } catch {
      notify('تعذر فحص حالة الرابط', 'err');
    } finally {
      setIsProbing(false);
    }
  };

  const handleAnalyzeNewPostDates = async () => {
    if (!newPostContent.trim()) return;
    try {
      const res = await fetch('/api/audit-logs/analyze-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${newPostTitle}\n${newPostContent}` }),
      });
      const data = await res.json();
      if (data.success && data.dateMeta) {
        setDateAnalysis({
          detectedDates: data.dateMeta.detected_dates || [],
          isExpired: Boolean(data.dateMeta.is_expired),
          blockedLinks: data.blockedLinks || [],
        });
        if (data.dateMeta.event_date && !newPostEventDate) {
          setNewPostEventDate(data.dateMeta.event_date);
        }
        if (data.dateMeta.is_future) {
          setNewPostFuture(true);
        }
      }
    } catch {
      notify('تعذر تحليل التواريخ والروابط', 'err');
    }
  };

  const handleCreateManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && !newPostTitle.trim()) return;
    try {
      const res = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPostTitle.trim() || undefined,
          raw_content: newPostContent.trim(),
          final_content: newPostStatus === 'published' ? newPostContent.trim() : '',
          status: newPostStatus,
          rejection_reason: newPostStatus === 'rejected' ? newPostReason.trim() : '',
          notes: newPostNotes.trim(),
          is_future: newPostFuture,
          event_date: newPostEventDate.trim(),
          source_type: 'manual',
          source_origin: 'إدخال يدوي',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setNewPostTitle('');
        setNewPostContent('');
        setNewPostReason('');
        setNewPostNotes('');
        setNewPostFuture(false);
        setNewPostEventDate('');
        setDateAnalysis(null);
        await fetchLogs();
        notify('تم حفظ السجل الجديد في قاعدة البيانات بنجاح');
      } else {
        notify(data.error || 'تعذر حفظ السجل', 'err');
      }
    } catch {
      notify('تعذر حفظ السجل في قاعدة البيانات', 'err');
    }
  };

  return (
    <div dir="rtl" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-slate-200">
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-950/60">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              سجل المنشورات الجدولي ومانع الروابط
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تدقيق المنشورات المعتمدة والمرفوضة، تحرير الملاحظات وحفظها في SQLite، تمييز المنشورات المستقبلية، ومنع الروابط المعطلة قبل النشر في تيليجرام.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-900 border border-slate-800 p-1">
            <button
              type="button"
              onClick={() => setActiveView('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeView === 'table'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>جدول السجلات</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('blocked_links')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeView === 'blocked_links'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldBan className="w-3.5 h-3.5" />
              <span>مانع الروابط ({blockedLinks.filter((l) => l.enabled).length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen((prev) => !prev)}
            className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة / فحص منشور</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchLogs();
              fetchBlockedLinks();
            }}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isLoadingLinks ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`px-5 py-2.5 text-xs font-medium border-b flex items-center justify-between gap-2 ${
            feedbackBanner.type === 'ok'
              ? 'bg-emerald-950/60 border-emerald-800/70 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800/70 text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedbackBanner.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackBanner.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Compact Hairline KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-800 border-b border-slate-800 bg-slate-900">
        <button
          type="button"
          onClick={() => {
            setActiveView('table');
            setStatusFilter('all');
            setFutureOnly(false);
          }}
          className={`px-5 py-3 text-right hover:bg-slate-800/40 transition-colors cursor-pointer ${
            statusFilter === 'all' && !futureOnly && activeView === 'table' ? 'bg-slate-800/50' : ''
          }`}
        >
          <div className="text-[11px] text-slate-400">إجمالي السجلات</div>
          <div className="text-xl font-bold text-white tabular-nums font-mono mt-0.5">{counts.total}</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveView('table');
            setStatusFilter('published');
            setFutureOnly(false);
          }}
          className={`px-5 py-3 text-right hover:bg-slate-800/40 transition-colors cursor-pointer ${
            statusFilter === 'published' && !futureOnly && activeView === 'table' ? 'bg-emerald-950/25' : ''
          }`}
        >
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>المنشورات المعتمدة</span>
          </div>
          <div className="text-xl font-bold text-emerald-300 tabular-nums font-mono mt-0.5">
            {counts.published}
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveView('table');
            setStatusFilter('rejected');
            setFutureOnly(false);
          }}
          className={`px-5 py-3 text-right hover:bg-slate-800/40 transition-colors cursor-pointer ${
            statusFilter === 'rejected' && !futureOnly && activeView === 'table' ? 'bg-rose-950/25' : ''
          }`}
        >
          <div className="text-[11px] text-rose-400 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>المنشورات المرفوضة</span>
          </div>
          <div className="text-xl font-bold text-rose-300 tabular-nums font-mono mt-0.5">
            {counts.rejected}
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveView('table');
            setStatusFilter('all');
            setFutureOnly((prev) => !prev);
          }}
          className={`px-5 py-3 text-right hover:bg-slate-800/40 transition-colors cursor-pointer ${
            futureOnly && activeView === 'table' ? 'bg-amber-950/25' : ''
          }`}
        >
          <div className="text-[11px] text-amber-400 flex items-center gap-1">
            <Star className="w-3.5 h-3.5" />
            <span>المنشورات المستقبلية المهمة</span>
          </div>
          <div className="text-xl font-bold text-amber-300 tabular-nums font-mono mt-0.5">
            {counts.future}
          </div>
        </button>
      </div>

      {/* Quick Add & Date Analyzer Drawer */}
      {isAddModalOpen && (
        <form
          onSubmit={handleCreateManualLog}
          className="p-5 bg-slate-950/80 border-b border-slate-800 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>تسجيل منشور جديد أو فحص التواريخ والروابط قبل الحفظ</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              placeholder="عنوان المنشور (اختياري - يُستخلص تلقائياً)"
              className="md:col-span-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
            />
            <select
              value={newPostStatus}
              onChange={(e) => setNewPostStatus(e.target.value as 'published' | 'rejected')}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="published">حالة النشر: معتمد</option>
              <option value="rejected">حالة النشر: مرفوض</option>
            </select>
          </div>

          <textarea
            rows={3}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="الصق نص المنشور أو الإعلان الجامعي هنا لاستخراج التواريخ والروابط تلقائياً..."
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            {newPostStatus === 'rejected' && (
              <input
                type="text"
                value={newPostReason}
                onChange={(e) => setNewPostReason(e.target.value)}
                placeholder="سبب الرفض (مثال: رابط لا يعمل / خبر منتهي)"
                className="px-3 py-2 rounded-lg bg-slate-900 border border-rose-800/70 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            )}
            <input
              type="text"
              value={newPostNotes}
              onChange={(e) => setNewPostNotes(e.target.value)}
              placeholder="ملاحظات المشرف"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 shrink-0">تاريخ الحدث:</span>
              <input
                type="date"
                value={newPostEventDate}
                onChange={(e) => setNewPostEventDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono tabular-nums"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-amber-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newPostFuture}
                onChange={(e) => setNewPostFuture(e.target.checked)}
                className="rounded border-slate-600 bg-slate-900 text-amber-500"
              />
              <span>تمييز كمؤشر «مستقبلي»</span>
            </label>
          </div>

          {dateAnalysis && (
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs flex flex-wrap items-center gap-4">
              <span className="text-slate-300">
                التواريخ المكتشفة:{' '}
                <span className="font-mono text-sky-400 tabular-nums">
                  {dateAnalysis.detectedDates.length > 0
                    ? dateAnalysis.detectedDates.join(' ، ')
                    : 'لا يوجد تاريخ صريح'}
                </span>
              </span>
              <span className={dateAnalysis.isExpired ? 'text-rose-400' : 'text-emerald-400'}>
                {dateAnalysis.isExpired ? 'تنبيه: التاريخ في الماضي (منتهي)' : 'صالح زمنياً / قادم'}
              </span>
              {dateAnalysis.blockedLinks.length > 0 && (
                <span className="text-rose-400">
                  تم رصد {dateAnalysis.blockedLinks.length} رابط محظور وسيُستبعد تلقائياً
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleAnalyzeNewPostDates}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-sky-300 cursor-pointer whitespace-nowrap"
            >
              تحليل التواريخ والروابط ذكياً
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
            >
              حفظ في قاعدة البيانات
            </button>
          </div>
        </form>
      )}

      {/* VIEW 1: TABULAR PUBLICATION LOG */}
      {activeView === 'table' && (
        <div>
          {/* Filter & Sort Toolbar */}
          <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/70">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-sm min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث بالعنوان، النص، سبب الرفض، الملاحظات، أو التاريخ..."
                  className="w-full pr-9 pl-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="inline-flex rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs">
                {(['all', 'published', 'rejected'] as StatusFilter[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      statusFilter === st
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'all' ? 'الكل' : st === 'published' ? 'المعتمدة' : 'المرفوضة'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setFutureOnly((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  futureOnly
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${futureOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>المستقبلية فقط</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="newest">الترتيب: الأحدث أولاً</option>
                <option value="oldest">الترتيب: الأقدم أولاً (تسلسل زمني)</option>
                <option value="event_date">الترتيب: حسب تاريخ الحدث القادم</option>
                <option value="future_first">الترتيب: المستقبلية المهمة أولاً</option>
              </select>
            </div>
          </div>

          {/* Data Grid Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                  <th className="py-3 px-3 whitespace-nowrap w-24 text-center">مستقبلي</th>
                  <th className="py-3 px-3 whitespace-nowrap w-32">حالة النشر</th>
                  <th className="py-3 px-4 min-w-[260px]">المنشور والمصدر والروابط</th>
                  <th className="py-3 px-3 whitespace-nowrap w-40">التاريخ والموعد</th>
                  <th className="py-3 px-4 min-w-[180px]">سبب الرفض إن وجد</th>
                  <th className="py-3 px-4 min-w-[230px]">ملاحظات قابلة للتحرير</th>
                  <th className="py-3 px-3 whitespace-nowrap w-32 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center text-slate-400">
                      {isLoading
                        ? 'جاري تحميل السجلات من SQLite...'
                        : 'لا توجد سجلات مطابقة لمعايير البحث الحالية. سيتم توثيق كل منشور يُعالج تلقائياً أو يدوياً هنا مباشرة.'}
                    </td>
                  </tr>
                ) : (
                  logs.map((item) => {
                    const currentNote = noteDrafts[item.id] ?? item.notes ?? '';
                    const isDirty = currentNote !== (item.notes || '');
                    const isSaving = savingRowId === item.id;
                    const isSaved = savedRowId === item.id;

                    return (
                      <tr
                        key={item.id}
                        className={`align-top transition-colors hover:bg-slate-800/35 ${
                          item.is_future ? 'bg-amber-950/10' : ''
                        }`}
                      >
                        {/* 1. مؤشر مستقبلي */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateLogField(item.id, { is_future: !item.is_future })
                            }
                            title={item.is_future ? 'إزالة مؤشر مستقبلي' : 'تمييز كمنشور مستقبلي مهم'}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                              item.is_future
                                ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-600/40'
                            }`}
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${
                                item.is_future ? 'fill-amber-400 text-amber-400' : ''
                              }`}
                            />
                            <span>{item.is_future ? 'مستقبلي' : 'عادي'}</span>
                          </button>
                        </td>

                        {/* 2. حالة النشر */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-semibold whitespace-nowrap">
                            {item.status === 'published' ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="text-emerald-300">معتمد</span>
                              </>
                            ) : item.status === 'rejected' ? (
                              <>
                                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                <span className="text-rose-300">مرفوض</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="text-amber-300">قيد المراجعة</span>
                              </>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 truncate max-w-[130px]">
                            {item.target_univ || 'عام'}
                          </div>
                          {item.target_destination && (
                            <div className="text-[10px] text-slate-500 font-mono truncate max-w-[130px]">
                              {item.target_destination}
                            </div>
                          )}
                        </td>

                        {/* 3. المنشور والمصدر والروابط */}
                        <td className="py-3 px-4 max-w-[340px]">
                          <div className="font-semibold text-white line-clamp-1">
                            {item.title || 'منشور بدون عنوان'}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {(item.final_content || item.raw_content || '').replace(/<[^>]+>/g, '')}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                            {item.source_origin && (
                              <span className="text-sky-400 font-mono">{item.source_origin}</span>
                            )}
                            {item.post_links && item.post_links.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-slate-300">
                                <LinkIcon className="w-3 h-3 text-slate-400" />
                                <span className="font-mono truncate max-w-[160px]" dir="ltr">
                                  {item.post_links[0]}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleQuickBlockUrl(
                                      item.post_links[0],
                                      `محظور من سجل المنشور #${item.id}`
                                    )
                                  }
                                  title="حظر هذا الرابط في مانع الروابط"
                                  className="text-rose-400 hover:text-rose-300 underline cursor-pointer whitespace-nowrap"
                                >
                                  حظر
                                </button>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. التاريخ والموعد المستقبلي */}
                        <td className="py-3 px-3">
                          <div className="text-[11px] text-slate-300 font-mono tabular-nums whitespace-nowrap">
                            {formatArabicDateTime(item.published_at || item.created_at)}
                          </div>
                          <div className="mt-1.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                            <input
                              type="date"
                              value={item.event_date || ''}
                              onChange={(e) =>
                                handleUpdateLogField(item.id, { event_date: e.target.value })
                              }
                              title="تاريخ الحدث أو الموعد المرتبط بالمنشور"
                              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] font-mono tabular-nums text-slate-200 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </td>

                        {/* 5. سبب الرفض إن وجد */}
                        <td className="py-3 px-4 max-w-[220px]">
                          {item.status === 'rejected' || item.rejection_reason ? (
                            <span className="text-rose-300 text-[11px] leading-relaxed block">
                              {item.rejection_reason || 'مرفوض دون ذكر سبب محدد'}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">— لا يوجد رفض</span>
                          )}
                        </td>

                        {/* 6. حقل ملاحظات قابل للتحرير */}
                        <td className="py-3 px-4 min-w-[230px]">
                          <div className="space-y-1.5">
                            <textarea
                              rows={2}
                              value={currentNote}
                              onChange={(e) =>
                                setNoteDrafts((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              onBlur={() => {
                                if (isDirty) {
                                  handleUpdateLogField(item.id, { notes: currentNote });
                                }
                              }}
                              placeholder="اكتب ملاحظة تشغيلية أو تعديل..."
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 resize-y"
                            />
                            <div className="flex items-center justify-between text-[10px]">
                              {isSaved ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>تم الحفظ في SQLite</span>
                                </span>
                              ) : isDirty ? (
                                <span className="text-amber-400">تعديل غير محفوظ</span>
                              ) : (
                                <span className="text-slate-600">محفوظ</span>
                              )}

                              {isDirty && (
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() =>
                                    handleUpdateLogField(item.id, { notes: currentNote })
                                  }
                                  className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                >
                                  <Save className="w-3 h-3" />
                                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 7. إجراءات */}
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedLog(item)}
                              title="معاينة صيغة تيليجرام والتفاصيل"
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-sky-400 hover:text-white hover:border-sky-500 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleConvertToIdea(item)}
                              title="تحويل إلى فكرة في لوحة الأفكار"
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 hover:text-white hover:border-amber-500 cursor-pointer"
                            >
                              <Lightbulb className="w-3.5 h-3.5" />
                            </button>

                            {confirmDeleteId === item.id ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteLog(item.id)}
                                className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer whitespace-nowrap"
                              >
                                تأكيد
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(item.id)}
                                title="حذف السجل"
                                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: CUSTOM BLOCKED LINKS MANAGER */}
      {activeView === 'blocked_links' && (
        <div className="p-5 space-y-5">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Link2Off className="w-4 h-4 text-rose-400" />
                <span>إضافة رابط أو نطاق إلى مانع الروابط في تيليجرام والويب</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                أي رابط أو نطاق تضيفه هنا يتم منعه وحذفه تلقائياً من نصوص المنشورات ومن أزرار الروابط المرفقة في تيليجرام قبل النشر، ويُحفظ فوراً في SQLite.
              </p>
            </div>

            <form onSubmit={handleAddBlockedRule} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5">
                <label className="block text-[11px] text-slate-400 mb-1">
                  الرابط أو النطاق المراد منعه
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={linkPattern}
                  onChange={(e) => setLinkPattern(e.target.value)}
                  placeholder="https://broken-site.com/path أو domain.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">نوع المطابقة</label>
                <select
                  value={linkMatchType}
                  onChange={(e) =>
                    setLinkMatchType(e.target.value as 'contains' | 'domain' | 'exact')
                  }
                  className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="contains">يحتوي النص/الرابط</option>
                  <option value="domain">حظر النطاق بالكامل</option>
                  <option value="exact">مطابقة الرابط تماماً</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-[11px] text-slate-400 mb-1">سبب المنع</label>
                <input
                  type="text"
                  value={linkReason}
                  onChange={(e) => setLinkReason(e.target.value)}
                  placeholder="مثال: رابط لا يعمل / معطل"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isProbing || !linkPattern.trim()}
                  onClick={() => handleProbeUrl()}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-sky-300 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {isProbing ? 'يفحص...' : 'فحص'}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
                >
                  حظر وحفظ
                </button>
              </div>
            </form>

            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={linkIsBroken}
                onChange={(e) => setLinkIsBroken(e.target.checked)}
                className="rounded border-slate-600 bg-slate-900 text-rose-500"
              />
              <span>تصنيف كرابط معطل / لا يعمل</span>
            </label>

            {probeResult && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-mono text-slate-200" dir="ltr">
                    {probeResult.url}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[11px]">
                    <span className={probeResult.blocked ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                      {probeResult.blocked
                        ? `محظور حالياً: ${probeResult.blockReason}`
                        : 'غير مدرج في قائمة المنع'}
                    </span>
                    {probeResult.reachable !== null && (
                      <span
                        className={
                          probeResult.reachable ? 'text-emerald-400' : 'text-rose-400 font-semibold'
                        }
                      >
                        {probeResult.reachable
                          ? `الرابط يستجيب (HTTP ${probeResult.httpStatus})`
                          : `الرابط لا يعمل (${probeResult.httpStatus || probeResult.probeError || 'تعذر الوصول'})`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                  <th className="py-3 px-4">الرابط / النمط المحظور</th>
                  <th className="py-3 px-3 whitespace-nowrap">المطابقة</th>
                  <th className="py-3 px-4">سبب المنع</th>
                  <th className="py-3 px-3 whitespace-nowrap text-center">مرات المنع</th>
                  <th className="py-3 px-3 whitespace-nowrap text-center">الحالة</th>
                  <th className="py-3 px-3 whitespace-nowrap text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {blockedLinks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-slate-400">
                      لا توجد روابط محظورة مضافة بعد. يمكنك إضافة أي رابط معطل أو غير مرغوب أعلاه لمنعه من النشر في تيليجرام.
                    </td>
                  </tr>
                ) : (
                  blockedLinks.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono text-white" dir="ltr">
                        {rule.pattern}
                      </td>
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {rule.match_type === 'domain'
                          ? 'نطاق كامل'
                          : rule.match_type === 'exact'
                          ? 'مطابقة تامة'
                          : 'يحتوي'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {rule.reason || 'رابط محظور'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-amber-300">
                        {rule.hit_count}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleBlockedRule(rule)}
                          className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
                            rule.enabled
                              ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                              : 'bg-slate-950 border-slate-700 text-slate-400'
                          }`}
                        >
                          {rule.enabled ? 'مفعل' : 'معطل'}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteBlockedRule(rule.id)}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PREVIEW DRAWER MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedLog.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono tabular-nums">
                  {selectedLog.target_univ || 'عام'} • {formatArabicDateTime(selectedLog.published_at || selectedLog.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {selectedLog.rejection_reason && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/70 text-xs text-rose-300">
                  <strong>سبب الرفض:</strong> {selectedLog.rejection_reason}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 mb-2">النص المصدري الأصلي</div>
                  <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                    {selectedLog.raw_content || 'لا يوجد'}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] font-bold text-emerald-400 mb-2">
                    معاينة الصيغة النهائية في تيليجرام
                  </div>
                  <div className="text-xs text-slate-100 leading-relaxed max-h-64 overflow-y-auto">
                    {renderTelegramPreviewLines(selectedLog.final_content || selectedLog.raw_content)}
                  </div>
                </div>
              </div>

              {selectedLog.post_links && selectedLog.post_links.length > 0 && (
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-300">
                    الروابط المكتشفة في المنشور ({selectedLog.post_links.length})
                  </div>
                  <div className="divide-y divide-slate-800">
                    {selectedLog.post_links.map((lk, idx) => (
                      <div
                        key={`lk-${idx}`}
                        className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <a
                          href={lk}
                          target="_blank"
                          rel="noreferrer"
                          dir="ltr"
                          className="text-sky-400 hover:underline font-mono truncate max-w-lg flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span>{lk}</span>
                        </a>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickBlockUrl(lk, `محظور من معاينة المنشور #${selectedLog.id}`)}
                            className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                          >
                            حظر هذا الرابط
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
