import React, { useState, useEffect } from 'react';
import type { SourceItem, SourceType, SourcePriority, SourceRule, UniversityProject } from '../types/index.ts';
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
  RefreshCw,
  Building2,
  Globe,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  MessageSquare,
  Play,
  Pause,
  HelpCircle,
  Radio,
  Lock,
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
  // Universities list & active view
  const [universities, setUniversities] = useState<UniversityProject[]>([]);
  const [isLoadingUnivs, setIsLoadingUnivs] = useState(false);
  const [activeTab, setActiveTab] = useState<'universities' | 'mapping' | 'all_sources'>('universities');

  // 5-Step Configuration Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [wizardData, setWizardData] = useState({
    targetChannel: '@jhdhhdcj',
    name: '',
    telegramSources: '',
    twitterSources: '',
    googleNewsQuery: '',
  });
  const [isSubmittingWizard, setIsSubmittingWizard] = useState(false);

  // Per-university action states
  const [crawlingUnivId, setCrawlingUnivId] = useState<string | null>(null);
  const [gnewsUniv, setGnewsUniv] = useState<UniversityProject | null>(null);
  const [gnewsItems, setGnewsItems] = useState<Array<{ title: string; link: string; pubDate: string }>>([]);
  const [isLoadingGnews, setIsLoadingGnews] = useState(false);

  // Direct post modal
  const [directPostUniv, setDirectPostUniv] = useState<UniversityProject | null>(null);
  const [directPostText, setDirectPostText] = useState('');
  const [isSendingPost, setIsSendingPost] = useState(false);
  const [postResult, setPostResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Status message / toast
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Standard Source Add Modal
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
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

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Fetch universities
  const fetchUniversities = async () => {
    setIsLoadingUnivs(true);
    try {
      const res = await fetch('/api/universities');
      if (res.ok) {
        const data = await res.json();
        if (data.universities && Array.isArray(data.universities)) {
          setUniversities(data.universities);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch universities', e);
    } finally {
      setIsLoadingUnivs(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  // University Toggle
  const handleToggleUniv = async (univId: string) => {
    try {
      const res = await fetch('/api/university/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: univId }),
      });
      const data = await res.json();
      if (data.success) {
        setUniversities((prev) =>
          prev.map((u) => (u.id === univId ? { ...u, enabled: data.enabled } : u))
        );
        showNotice(data.enabled ? 'تم تفعيل معالجة ونشر أخبار الجامعة ✅' : 'تم إيقاف الجامعة مؤقتاً ⏸️');
      }
    } catch {
      showNotice('حدث خطأ أثناء تعديل حالة الجامعة');
    }
  };

  // University Delete
  const handleDeleteUniv = async (univId: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف مشروع "${name}" وإلغاء ربط مصادره الحصرية؟`)) {
      return;
    }
    try {
      const res = await fetch('/api/university/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: univId }),
      });
      const data = await res.json();
      if (data.success) {
        setUniversities((prev) => prev.filter((u) => u.id !== univId));
        showNotice(`تم حذف جامعة "${name}" ومصادرها بنجاح 🗑️`);
      }
    } catch {
      showNotice('فشل حذف الجامعة');
    }
  };

  // University Independent Crawl
  const handleCrawlUniv = async (univ: UniversityProject) => {
    setCrawlingUnivId(univ.id);
    try {
      const res = await fetch('/api/university/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: univ.id }),
      });
      const data = await res.json();
      if (data.success) {
        showNotice(`🚀 بدأ فحص وسحب مصادر ${univ.name} حصرياً إلى ${univ.target_channel}`);
      } else {
        showNotice('تعذر بدء الفحص');
      }
    } catch {
      showNotice('خطأ أثناء تشغيل الفحص المخصص');
    } finally {
      setTimeout(() => setCrawlingUnivId(null), 1500);
    }
  };

  // Google News Live Query
  const handleOpenGNews = async (univ: UniversityProject) => {
    setGnewsUniv(univ);
    setIsLoadingGnews(true);
    setGnewsItems([]);
    try {
      const res = await fetch('/api/university/gnews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: univ.id, query: univ.google_news_query || univ.name }),
      });
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        setGnewsItems(data.items);
      }
    } catch {
      showNotice('تعذر جلب أخبار جوجل');
    } finally {
      setIsLoadingGnews(false);
    }
  };

  // Direct Post Submission
  const handleSendDirectPost = async () => {
    if (!directPostUniv || !directPostText.trim()) return;
    setIsSendingPost(true);
    setPostResult(null);
    try {
      const res = await fetch('/api/university/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_channel: directPostUniv.target_channel,
          text: directPostText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPostResult({ ok: true, msg: `تم النشر بنجاح في ${directPostUniv.target_channel} (ID: #${data.messageId})` });
        setTimeout(() => {
          setDirectPostUniv(null);
          setDirectPostText('');
          setPostResult(null);
        }, 2000);
      } else {
        setPostResult({ ok: false, msg: data.error || 'فشل النشر عبر تيليجرام' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPostResult({ ok: false, msg: `خطأ اتصال: ${msg}` });
    } finally {
      setIsSendingPost(false);
    }
  };

  // 5-Step Wizard Submit
  const handleWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardData.targetChannel || !wizardData.name) {
      alert('الرجاء إكمال الخطوتين 1 و 2 أولاً');
      return;
    }
    setIsSubmittingWizard(true);

    const tgSources = wizardData.telegramSources
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => (s.startsWith('@') || s.startsWith('-') ? s : `@${s}`));

    const twSources = wizardData.twitterSources
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => (s.startsWith('@') ? s : `@${s}`));

    try {
      const res = await fetch('/api/university/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: wizardData.name.trim(),
          target_channel: wizardData.targetChannel.trim(),
          telegram_sources: tgSources,
          twitter_sources: twSources,
          google_news_query: wizardData.googleNewsQuery.trim() || wizardData.name.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotice(`🎉 تم إنشاء مشروع جامعة "${wizardData.name}" مع عزل صارم 100%!`);
        setShowWizard(false);
        setWizardStep(1);
        setWizardData({
          targetChannel: '@jhdhhdcj',
          name: '',
          telegramSources: '',
          twitterSources: '',
          googleNewsQuery: '',
        });
        await fetchUniversities();
        onRefresh();
      } else {
        alert(data.error || 'تعذر إضافة الجامعة');
      }
    } catch {
      alert('حدث خطأ أثناء حفظ المشروع');
    } finally {
      setIsSubmittingWizard(false);
    }
  };

  // Standard Source Toggle & Delete
  const handleSourceToggle = (id: string) => {
    const updated = sources.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    onSaveSources(updated);
  };

  const handleSourceDelete = (id: string) => {
    const updated = sources.filter((s) => s.id !== id);
    onSaveSources(updated);
  };

  const handleAddSourceSubmit = (e: React.FormEvent) => {
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
    setShowAddSourceModal(false);
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
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5" dir="rtl">
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 border border-sky-500/60 text-sky-200 text-xs font-bold rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>نظام تحكم الجامعات المعزول وتدفق الإعدادات الهرمي</span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>عزل صارم 100%</span>
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                زر مستقل وتحكم منفصل لكل جامعة مع ربط حصري بقناة النشر بدون أي تداخل أو خلط بين المصادر
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              fetchUniversities();
              onRefresh();
            }}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl text-xs border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingUnivs || isSaving ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <button
            onClick={() => {
              setWizardStep(1);
              setShowWizard(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>معالج إضافة جامعة (5 خطوات هرمية)</span>
          </button>

          <button
            onClick={() => setShowAddSourceModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>إضافة مصدر يدوي</span>
          </button>
        </div>
      </div>

      {/* Official Channel & Support Bar */}
      <div className="bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-slate-900 border border-sky-800/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">القنوات الرسمية المعتمدة للربط والتحكم المباشر:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="https://t.me/jhdhhdcj"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-900/60 hover:bg-sky-800/80 border border-sky-700 text-sky-200 rounded-lg font-mono font-bold transition-colors"
          >
            <Send className="w-3 h-3 text-sky-400 -rotate-45" />
            <span>@jhdhhdcj (قناة النشر الافتراضية)</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="https://t.me/M_S_F_G"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-700 text-indigo-200 rounded-lg font-mono font-bold transition-colors"
          >
            <span>@M_S_F_G (المشرف العام والخدمات)</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="https://t.me/admiuin_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700 text-emerald-200 rounded-lg font-mono font-bold transition-colors"
          >
            <span>@admiuin_bot (بوت التحكم)</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('universities')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'universities'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>أزرار الجامعات المستقلة ({universities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mapping')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'mapping'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>جدول العزل الصارم (Strict Relational Mapping)</span>
        </button>

        <button
          onClick={() => setActiveTab('all_sources')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'all_sources'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>جميع مصادر المراقبة العامة ({sources.length})</span>
        </button>
      </div>

      {/* TAB 1: Independent University Cards with Dedicated Control Buttons */}
      {activeTab === 'universities' && (
        <div className="space-y-4">
          {universities.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">لا توجد جامعات مضافة بعد</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                استخدم معالج الإعداد الهرمي لإضافة أول جامعة وقناة نشر هدف مع عزل مصادرها بالكامل.
              </p>
              <button
                onClick={() => {
                  setWizardStep(1);
                  setShowWizard(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول جامعة الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {universities.map((univ) => {
                const isCrawling = crawlingUnivId === univ.id;
                return (
                  <div
                    key={univ.id}
                    className={`bg-slate-950/80 border rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-all shadow-md ${
                      univ.enabled
                        ? 'border-sky-800/60 hover:border-sky-600/80'
                        : 'border-slate-800 opacity-65'
                    }`}
                  >
                    {/* Top Row: Name + Target Channel + Status */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                              <span>🏛️</span>
                              <span>{univ.name}</span>
                            </h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                univ.enabled
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {univ.enabled ? 'نشط للنشر' : 'متوقف مؤقتاً'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-sky-400 mt-1">
                            <span className="text-slate-400">قناة النشر الحصرية:</span>
                            <span className="font-mono font-bold px-1.5 py-0.5 bg-sky-950/80 border border-sky-800/80 rounded" dir="ltr">
                              {univ.target_channel}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {univ.id}
                        </span>
                      </div>

                      {/* Source Badges */}
                      <div className="space-y-2 text-xs pt-2">
                        {/* Telegram Exclusive Sources */}
                        <div className="flex items-start gap-1.5">
                          <Send className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0 -rotate-45" />
                          <div className="flex-1">
                            <span className="text-slate-400 text-[11px] block">قنوات تيليجرام المصدرة (معزولة):</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {univ.telegram_sources && univ.telegram_sources.length > 0 ? (
                                univ.telegram_sources.map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-sky-950/70 text-sky-300 border border-sky-800/70 rounded text-[11px] font-mono"
                                    dir="ltr"
                                  >
                                    {s}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-500 text-[11px]">لا توجد قنوات تيليجرام مرتبطة</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Twitter/X Exclusive Sources */}
                        <div className="flex items-start gap-1.5">
                          <Twitter className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <span className="text-slate-400 text-[11px] block">حسابات X/تويتر المصدرة (معزولة):</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {univ.twitter_sources && univ.twitter_sources.length > 0 ? (
                                univ.twitter_sources.map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-indigo-950/70 text-indigo-300 border border-indigo-800/70 rounded text-[11px] font-mono"
                                    dir="ltr"
                                  >
                                    {s}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-500 text-[11px]">لا توجد حسابات تويتر مرتبطة</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Google News Query */}
                        <div className="flex items-start gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <span className="text-slate-400 text-[11px] block">استعلام أخبار جوجل التلقائي:</span>
                            <span className="text-amber-200 text-[11px] font-semibold bg-amber-950/50 px-2 py-0.5 rounded border border-amber-900/60 inline-block mt-0.5">
                              {univ.google_news_query || univ.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dedicated Independent Control Buttons for THIS University */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                        <span>أزرار التحكم المنفصلة لـ {univ.name}:</span>
                        <span className="text-[10px] text-emerald-400 font-normal">منع الخلط: مفعّل 🔒</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* 1. Crawl Button */}
                        <button
                          onClick={() => handleCrawlUniv(univ)}
                          disabled={isCrawling}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-900 text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer"
                          title="فحص وسحب الأخبار لهذه الجامعة فقط"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isCrawling ? 'animate-spin' : ''}`} />
                          <span>{isCrawling ? 'جاري السحب...' : 'سحب الأخبار'}</span>
                        </button>

                        {/* 2. Toggle Status Button */}
                        <button
                          onClick={() => handleToggleUniv(univ.id)}
                          className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            univ.enabled
                              ? 'bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border-amber-700/60'
                              : 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-700/60'
                          }`}
                        >
                          {univ.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{univ.enabled ? 'إيقاف مؤقت' : 'تفعيل النشر'}</span>
                        </button>

                        {/* 3. Google News Live Preview */}
                        <button
                          onClick={() => handleOpenGNews(univ)}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/70 text-indigo-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5 text-indigo-400" />
                          <span>أخبار جوجل</span>
                        </button>

                        {/* 4. Direct Post to THIS Target Channel */}
                        <button
                          onClick={() => {
                            setDirectPostUniv(univ);
                            setDirectPostText(`📌 إعلان أكاديمي رسمي - ${univ.name}\n\n• يعلن قسم القبول والتسجيل عن تفاصيل التقديم الجديدة.\n• المواعيد والشروط متوفرة عبر البوابة الرسمية.\n\n🔗 رابط البوابة المعتمدة:\nhttps://edu.example.com\n\n💬 يسعدنا استقبال استفساراتكم ومشاركة المنشور!`);
                          }}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/70 text-emerald-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>نشر مباشر</span>
                        </button>
                      </div>

                      {/* Delete University Action */}
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleDeleteUniv(univ.id, univ.name)}
                          className="text-[11px] text-rose-400/80 hover:text-rose-300 flex items-center gap-1 py-1 px-2 rounded hover:bg-rose-950/50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>حذف هذا المشروع وعزل قنواته</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Strict Relational Mapping Matrix */}
      {activeTab === 'mapping' && (
        <div className="space-y-4">
          <div className="bg-slate-950/90 border border-indigo-900/50 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>مصفوفة العزل الصارم (Strict 1-to-1 Relational Pipeline)</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              هذا الجدول يوضح الربط الصارم بين قنوات النشر المستهدفة والمصادر الحصرية. النظام يفرض عزلاً تاماً حيث لا يمكن لأي منشور من مصدر أن يُنشر إلا في القناة المربوطة به حصرياً، مع إلحاق حقل التعريفي <code className="text-sky-300 font-mono">[Source Metadata Tag]</code> لمنع أي تسريب للمحتوى أو تداخل بين الجامعات.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">قناة النشر الهدف (Destination)</th>
                  <th className="p-3">اسم الجامعة / القسم</th>
                  <th className="p-3">المصادر الحصرية المقفلة</th>
                  <th className="p-3">استعلام أخبار جوجل</th>
                  <th className="p-3 text-center">حالة العزل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {universities.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-sky-300" dir="ltr">
                      {u.target_channel}
                    </td>
                    <td className="p-3 font-bold text-white">
                      {u.name}
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {u.telegram_sources && u.telegram_sources.length > 0 && (
                          <div className="flex flex-wrap gap-1 font-mono text-[11px] text-sky-300" dir="ltr">
                            {u.telegram_sources.join(', ')}
                          </div>
                        )}
                        {u.twitter_sources && u.twitter_sources.length > 0 && (
                          <div className="flex flex-wrap gap-1 font-mono text-[11px] text-indigo-300" dir="ltr">
                            {u.twitter_sources.join(', ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-amber-300 text-[11px]">
                      {u.google_news_query || u.name}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full font-semibold text-[10px]">
                        <Check className="w-3 h-3" />
                        <span>معزول 100% (صفر تسريب)</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: All Watchlist Sources */}
      {activeTab === 'all_sources' && (
        <div className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        source.type === 'telegram'
                          ? 'bg-sky-500/15 text-sky-400'
                          : source.type === 'twitter'
                          ? 'bg-indigo-500/15 text-indigo-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {source.type === 'telegram' && <Send className="w-4 h-4 -rotate-45" />}
                      {source.type === 'twitter' && <Twitter className="w-4 h-4" />}
                      {source.type === 'rss' && <Rss className="w-4 h-4" />}
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-white line-clamp-1">{source.title}</h3>
                      <span className="text-[11px] font-mono text-slate-400 block" dir="ltr">
                        {source.target}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSourceToggle(source.id)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer ${
                      source.enabled
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {source.enabled ? 'نشط' : 'معطل'}
                  </button>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-medium text-[10px] ${
                        source.rule === 'official'
                          ? 'bg-sky-950 text-sky-300 border border-sky-800/60'
                          : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                      }`}
                    >
                      {source.rule === 'official' ? 'رسمي (نشر مباشر)' : 'شبه رسمي (تدقيق وبحث)'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded font-medium text-[10px] ${
                        source.priority === 'high'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-900/60'
                          : source.priority === 'medium'
                          ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-900/60'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      أولوية: {source.priority === 'high' ? 'عالية' : source.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                    </span>
                  </div>

                  {source.keywords && source.keywords.length > 0 && (
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] line-clamp-1">
                      <Tag className="w-3 h-3 text-sky-400 shrink-0" />
                      <span>الكلمات: {source.keywords.join('، ')}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-mono">آخر منشور: #{source.lastPostId || '0'}</span>
                  <button
                    onClick={() => handleSourceDelete(source.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                    title="حذف المصدر"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5-STEP CONFIGURATION WIZARD MODAL */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="w-full max-w-xl bg-slate-900 border border-sky-600/50 rounded-2xl p-6 text-slate-100 space-y-5 shadow-2xl relative">
            {/* Wizard Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  <span>معالج إعداد وربط الجامعة الهرمي (5 خطوات دقيقة)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  تدفق منظم يضمن العزل الصارم لمصادر كل قناة ومنع خلط المنشورات نهائياً
                </p>
              </div>
              <button
                onClick={() => setShowWizard(false)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="flex items-center justify-between px-2">
              {[
                { num: 1, label: 'قناة الهدف' },
                { num: 2, label: 'اسم الجامعة' },
                { num: 3, label: 'مصادر TG' },
                { num: 4, label: 'مصادر X' },
                { num: 5, label: 'أخبار جوجل' },
              ].map((step) => (
                <div key={step.num} className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      wizardStep === step.num
                        ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/30'
                        : wizardStep > step.num
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {wizardStep > step.num ? <Check className="w-3.5 h-3.5" /> : step.num}
                  </div>
                  <span className={`text-[10px] mt-1 ${wizardStep === step.num ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Step Contents */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 min-h-[170px] flex flex-col justify-center">
              {/* STEP 1 */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                    <span>الخطوة 1 من 5:</span>
                    <span>تحديد قناة النشر الهدف (Destination Channel)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    أدخل معرف القناة التي سينشر فيها البوت منشورات هذه الجامعة حصرياً (مثل @jhdhhdcj أو معرف القناة ID).
                  </p>
                  <div>
                    <input
                      type="text"
                      value={wizardData.targetChannel}
                      onChange={(e) => setWizardData({ ...wizardData, targetChannel: e.target.value })}
                      placeholder="@jhdhhdcj"
                      dir="ltr"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <span>الخطوة 2 من 5:</span>
                    <span>تحديد اسم الجامعة / القسم بالتفصيل</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    يحدد سياق الذكاء الاصطناعي بدقة (مثل: "جامعة الملك سعود" أو "جامعة الشرق الأوسط الأمريكية AUM" أو "كلية الهندسة").
                  </p>
                  <div>
                    <input
                      type="text"
                      value={wizardData.name}
                      onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                      placeholder="مثال: جامعة الملك سعود - الشؤون الأكاديمية"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {wizardStep === 3 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                    <span>الخطوة 3 من 5:</span>
                    <span>تحديد قنوات التليجرام المصدرة (حصرياً لهذه الجامعة)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    أدخل معرفات القنوات مفصولة بفواصل أو أسطر جديدة (لن تُخلط مع أي جامعة أخرى).
                  </p>
                  <div>
                    <textarea
                      value={wizardData.telegramSources}
                      onChange={(e) => setWizardData({ ...wizardData, telegramSources: e.target.value })}
                      placeholder="@KSU_News, @KSU_Admission"
                      dir="ltr"
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {wizardStep === 4 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                    <span>الخطوة 4 من 5:</span>
                    <span>تحديد حسابات تويتر (X) المصدرة</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    أدخل معرفات حسابات تويتر/X لمراقبة التغريدات الرسمية والإعلانات الخاصة بهذه الجامعة.
                  </p>
                  <div>
                    <textarea
                      value={wizardData.twitterSources}
                      onChange={(e) => setWizardData({ ...wizardData, twitterSources: e.target.value })}
                      placeholder="@ksu_news, @moe_gov_sa"
                      dir="ltr"
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* STEP 5 */}
              {wizardStep === 5 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <span>الخطوة 5 من 5:</span>
                    <span>البحث التلقائي في أخبار جوجل (Google News) والتأكيد</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    جملة البحث لجلب آخر الأخبار الموثقة من جوجل للجامعة، مع تأكيد مسار العزل الصارم.
                  </p>
                  <div>
                    <input
                      type="text"
                      value={wizardData.googleNewsQuery || wizardData.name}
                      onChange={(e) => setWizardData({ ...wizardData, googleNewsQuery: e.target.value })}
                      placeholder={`أخبار ${wizardData.name || 'الجامعة'}`}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-[11px] text-emerald-300 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>تأكيد العزل الصارم:</span>
                    </p>
                    <p>
                      القناة: <span className="font-mono text-white" dir="ltr">{wizardData.targetChannel}</span> ← الجامعة: <span className="text-white font-bold">{wizardData.name}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (wizardStep > 1) setWizardStep((prev) => (prev - 1) as any);
                }}
                disabled={wizardStep === 1}
                className="flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowWizard(false)}
                  className="px-3.5 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>

                {wizardStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (wizardStep === 1 && !wizardData.targetChannel) {
                        alert('يرجى إدخال قناة النشر أولاً');
                        return;
                      }
                      if (wizardStep === 2 && !wizardData.name) {
                        alert('يرجى إدخال اسم الجامعة');
                        return;
                      }
                      setWizardStep((prev) => (prev + 1) as any);
                    }}
                    className="flex items-center gap-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                  >
                    <span>التالي</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleWizardSubmit}
                    disabled={isSubmittingWizard}
                    className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmittingWizard ? 'جاري الحفظ...' : 'حفظ وبدء العزل الصارم'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE NEWS PREVIEW MODAL */}
      {gnewsUniv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="w-full max-w-xl bg-slate-900 border border-indigo-700/60 rounded-2xl p-5 text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>نتائج أخبار Google المباشرة لـ: {gnewsUniv.name}</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                  Query: {gnewsUniv.google_news_query || gnewsUniv.name}
                </span>
              </div>
              <button
                onClick={() => setGnewsUniv(null)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isLoadingGnews ? (
              <div className="p-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-sky-400 mx-auto" />
                <p className="text-xs text-slate-400">جاري فحص خلاصة أخبار جوجل الآن...</p>
              </div>
            ) : gnewsItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                لم يتم العثور على أخبار حديثة لهذا الاستعلام حالياً.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {gnewsItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                    <h4 className="text-xs font-bold text-white hover:text-sky-300 transition-colors">
                      {item.title}
                    </h4>
                    {item.pubDate && (
                      <span className="text-[10px] text-slate-500 block font-mono" dir="ltr">
                        {item.pubDate}
                      </span>
                    )}
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 font-mono"
                        dir="ltr"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>فتح الرابط الأصلي</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setGnewsUniv(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT POST MODAL */}
      {directPostUniv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="w-full max-w-lg bg-slate-900 border border-emerald-600/60 rounded-2xl p-5 text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>نشر مباشر لقناة: {directPostUniv.name}</span>
                </h3>
                <span className="text-xs text-emerald-300 font-mono" dir="ltr">
                  Target: {directPostUniv.target_channel}
                </span>
              </div>
              <button
                onClick={() => setDirectPostUniv(null)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                نص الرسالة المنشور في القناة (يدعم HTML & إيموجي):
              </label>
              <textarea
                value={directPostText}
                onChange={(e) => setDirectPostText(e.target.value)}
                rows={7}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono leading-relaxed"
                placeholder="اكتب المنشور هنا..."
              />
            </div>

            {postResult && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold ${
                  postResult.ok
                    ? 'bg-emerald-950/70 border border-emerald-700 text-emerald-300'
                    : 'bg-rose-950/70 border border-rose-700 text-rose-300'
                }`}
              >
                {postResult.msg}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDirectPostUniv(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSendDirectPost}
                disabled={isSendingPost || !directPostText.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 -rotate-45" />
                <span>{isSendingPost ? 'جاري الإرسال...' : 'نشر الآن في القناة'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STANDARD ADD SOURCE MODAL */}
      {showAddSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn" dir="rtl">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 text-slate-100 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" />
              <span>إضافة مصدر مراقبة يدوي (Sync with sources.json)</span>
            </h3>

            <form onSubmit={handleAddSourceSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">نوع المصدر</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSource({ ...newSource, type: 'telegram' })}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold cursor-pointer ${
                      newSource.type === 'telegram'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5 -rotate-45" />
                    <span>تيليجرام</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewSource({ ...newSource, type: 'twitter' })}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold cursor-pointer ${
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
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold cursor-pointer ${
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
                  onClick={() => setShowAddSourceModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg cursor-pointer"
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
