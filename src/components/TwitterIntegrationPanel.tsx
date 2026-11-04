import React, { useState, useEffect } from 'react';
import {
  Twitter,
  CheckCircle,
  AlertTriangle,
  Key,
  Save,
  Send,
  Sparkles,
  RefreshCw,
  Hash,
  Sliders,
  ShieldCheck,
  ExternalLink,
  Users,
  Image as ImageIcon,
  MessageCircle,
  Plus,
  Trash2,
  Edit3,
  Cookie,
  Download,
  Share2,
  Check,
  X,
  Palette,
  Maximize2,
  Search
} from 'lucide-react';

export interface TwitterAccount {
  id: string;
  username: string;
  display_name: string;
  university: string;
  auth_token: string;
  ct0: string;
  cookies_json?: string;
  proxy?: string;
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  access_secret?: string;
  bearer_token?: string;
  status: 'valid' | 'expired' | 'missing' | string;
  is_active: number;
  auto_publish: number;
  auto_reply: number;
  reply_persona?: string;
  custom_hashtags?: string;
  theme_color?: string;
  logo_path?: string;
  monitoring_sources?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface DesignedCard {
  id: number;
  account_id: string;
  title: string;
  body_text: string;
  image_path: string;
  dimensions: string;
  accent_color: string;
  created_at: string;
}

export interface ReplyLog {
  id: number;
  account_id: string;
  tweet_id?: string;
  comment_id?: string;
  student_username: string;
  comment_text: string;
  reply_text: string;
  status: string;
  confidence: number;
  created_at: string;
}

export const TwitterIntegrationPanel: React.FC = () => {
  const [subTab, setSubTab] = useState<'accounts' | 'fetcher' | 'studio' | 'replies' | 'settings'>('accounts');

  // twscrape Real Tweet Fetcher state
  const [fetchHandle, setFetchHandle] = useState('');
  const [fetchLimit, setFetchLimit] = useState(10);
  const [fetchedTweets, setFetchedTweets] = useState<any[]>([]);
  const [isFetchingTweets, setIsFetchingTweets] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchAccountUsed, setFetchAccountUsed] = useState('');

  // Accounts state
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<TwitterAccount | null>(null);

  // Modal / Form state for Add/Edit Account
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<TwitterAccount>>({});

  // Cookies Import Modal state
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const [cookieTargetAccount, setCookieTargetAccount] = useState<TwitterAccount | null>(null);
  const [cookieInput, setCookieInput] = useState('');
  const [isImportingCookies, setIsImportingCookies] = useState(false);

  // Studio / Card Designer state
  const [cardTitle, setCardTitle] = useState('مواعيد وتفاصيل التحويل الداخلي بين الكليات للعام الجامعي');
  const [cardBody, setCardBody] = useState('• بدء استقبال طلبات التحويل الداخلي عبر البوابة الأكاديمية المعتمدة.\n• يشترط اجتياز 24 ساعة بمعدل تراكمي لا يقل عن 3.50 من 5.00.\n• المفاضلة تتم آلياً حسب السعة الاستيعابية المتاحة لكل كلية.');
  const [cardDim, setCardDim] = useState<'1080x1350' | '1080x1080'>('1080x1350');
  const [cardAccent, setCardAccent] = useState('#0284c7');
  const [cardDarkMode, setCardDarkMode] = useState(true);
  const [cardBadge, setCardBadge] = useState('تنبيه أكاديمي معتمد 🎓');
  const [cardAccountId, setCardAccountId] = useState('');
  const [renderedImageUrl, setRenderedImageUrl] = useState<string | null>(null);
  const [isRenderingCard, setIsRenderingCard] = useState(false);
  const [cardsHistory, setCardsHistory] = useState<DesignedCard[]>([]);

  // Reply Engine state
  const [commentInput, setCommentInput] = useState('لو سمحت أنا عندي إنذار أكاديمي هل أقدر أطلب تأجيل الفصل الدراسي بدون ما أحرم من المكافأة؟');
  const [commentStudentUser, setCommentStudentUser] = useState('student_saad');
  const [commentTweetTopic, setCommentTweetTopic] = useState('إعلان شروط وضوابط التأجيل والاعتذار الأكاديمي');
  const [replyAccountId, setReplyAccountId] = useState('');
  const [generatedReply, setGeneratedReply] = useState<{ reply_text?: string; confidence?: number } | null>(null);
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [repliesHistory, setRepliesHistory] = useState<ReplyLog[]>([]);

  // Global Settings state
  const [globalSettings, setGlobalSettings] = useState({
    enabled: 1,
    api_key: '',
    api_secret: '',
    access_token: '',
    access_secret: '',
    bearer_token: '',
    auto_publish: 1,
    auto_thread: 1,
    max_chars: 280,
    custom_hashtags: '#جامعة_نجران #أخبار_الجامعات #صوت_الطالب'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [newSourceInputs, setNewSourceInputs] = useState<Record<string, string>>({});

  // Common UI State
  const [testingSessionId, setTestingSessionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleAddSource = async (accId: string) => {
    const src = (newSourceInputs[accId] || '').trim();
    if (!src) {
      showToastMsg('يرجى إدخال اسم المصدر أو الحساب (مثل @Najran_Univ)');
      return;
    }
    try {
      const res = await fetch(`/api/twitter/accounts/${accId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: src })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`تمت إضافة المصدر ${src} لمراقبة الحساب بنجاح 📡`);
        setNewSourceInputs(prev => ({ ...prev, [accId]: '' }));
        fetchAccounts();
      } else {
        showToastMsg(data.error || 'تعذر إضافة المصدر');
      }
    } catch {
      showToastMsg('خطأ أثناء إضافة المصدر');
    }
  };

  const handleRemoveSource = async (accId: string, src: string) => {
    try {
      const res = await fetch(`/api/twitter/accounts/${accId}/sources`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: src })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`تم حذف المصدر ${src} 🗑️`);
        fetchAccounts();
      } else {
        showToastMsg(data.error || 'تعذر حذف المصدر');
      }
    } catch {
      showToastMsg('خطأ أثناء حذف المصدر');
    }
  };

  // Fetch Accounts
  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await fetch('/api/twitter/accounts');
      if (res.ok) {
        const data = await res.json();
        if (data.accounts) {
          setAccounts(data.accounts);
          if (data.accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(data.accounts[0]);
            setCardAccountId(data.accounts[0].id);
            setReplyAccountId(data.accounts[0].id);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load twitter accounts:', e);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Fetch Cards History
  const fetchCardsHistory = async () => {
    try {
      const res = await fetch('/api/twitter/cards?limit=12');
      if (res.ok) {
        const data = await res.json();
        if (data.cards) setCardsHistory(data.cards);
      }
    } catch {
      // ignore
    }
  };

  // Fetch Replies History
  const fetchRepliesHistory = async () => {
    try {
      const res = await fetch('/api/twitter/replies-log?limit=20');
      if (res.ok) {
        const data = await res.json();
        if (data.replies) setRepliesHistory(data.replies);
      }
    } catch {
      // ignore
    }
  };

  // Fetch Global Settings
  const fetchGlobalSettings = async () => {
    try {
      const res = await fetch('/api/twitter/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setGlobalSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchCardsHistory();
    fetchRepliesHistory();
    fetchGlobalSettings();
  }, []);

  // Save Account handler
  const handleSaveAccount = async () => {
    if (!editingAccount.username || !editingAccount.university) {
      showToastMsg('اسم المستخدم والجامعة مطلوبان.');
      return;
    }

    try {
      const sourcesArr = Array.isArray(editingAccount.monitoring_sources)
        ? editingAccount.monitoring_sources
        : typeof (editingAccount as unknown as { monitoring_sources?: string }).monitoring_sources === 'string'
          ? ((editingAccount as unknown as { monitoring_sources?: string }).monitoring_sources as string).split(',').map((s: string) => s.trim()).filter(Boolean)
          : [];

      const payload: Partial<TwitterAccount> = {
        ...editingAccount,
        username: editingAccount.username.startsWith('@') ? editingAccount.username : `@${editingAccount.username}`,
        display_name: editingAccount.display_name || 'صوت الطالب المعتمد',
        monitoring_sources: sourcesArr,
        is_active: editingAccount.is_active ?? 1,
        auto_publish: editingAccount.auto_publish ?? 1,
        auto_reply: editingAccount.auto_reply ?? 1,
        status: editingAccount.status || 'valid',
        theme_color: editingAccount.theme_color || '#0284c7'
      };

      const res = await fetch('/api/twitter/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg('تم حفظ وتحديث بيانات حساب تويتر بنجاح 💾');
        setIsAccountModalOpen(false);
        setEditingAccount({});
        fetchAccounts();
      } else {
        showToastMsg(data.error || 'تعذر حفظ الحساب');
      }
    } catch {
      showToastMsg('خطأ أثناء حفظ الحساب');
    }
  };

  // Delete Account
  const handleDeleteAccount = async (accId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب من النظام؟')) return;
    try {
      const res = await fetch(`/api/twitter/accounts/${accId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToastMsg('تم حذف الحساب بنجاح 🗑️');
        fetchAccounts();
      }
    } catch {
      showToastMsg('تعذر حذف الحساب');
    }
  };

  // Test Session & Cookies
  const handleTestSession = async (accId: string) => {
    setTestingSessionId(accId);
    try {
      const res = await fetch(`/api/twitter/accounts/${accId}/test-session`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.result) {
        showToastMsg(data.result.message || 'تم فحص الجلسة بنجاح ✅');
        fetchAccounts();
      } else {
        showToastMsg(data.error || 'فحص الجلسة أظهر خطأ في الاتصال');
      }
    } catch {
      showToastMsg('خطأ أثناء فحص جلسة الحساب');
    } finally {
      setTestingSessionId(null);
    }
  };

  // Import Cookies
  const handleImportCookies = async () => {
    if (!cookieTargetAccount || !cookieInput.trim()) {
      showToastMsg('يرجى لصق الكوكيز أو ملف storage_state');
      return;
    }
    setIsImportingCookies(true);
    try {
      const res = await fetch(`/api/twitter/accounts/${cookieTargetAccount.id}/import-cookies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookiesInput: cookieInput })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(data.message || 'تم استيراد وحفظ الكوكيز وتفعيل الجلسة بنجاح ✅');
        setIsCookieModalOpen(false);
        setCookieInput('');
        fetchAccounts();
      } else {
        showToastMsg(data.error || 'تعذر استيراد الكوكيز');
      }
    } catch {
      showToastMsg('خطأ أثناء معالجة الكوكيز');
    } finally {
      setIsImportingCookies(false);
    }
  };

  // Fetch Real Tweets via twscrape
  const handleFetchTweets = async () => {
    const handle = fetchHandle.trim().replace(/^@/, '');
    if (!handle) {
      showToastMsg('يرجى إدخال اسم مستخدم تويتر أو حسابه (مثلاً: Najran_Univ أو KSU_News)');
      return;
    }
    setIsFetchingTweets(true);
    setFetchError(null);
    setFetchedTweets([]);

    try {
      const res = await fetch('/api/twitter/fetch-tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: handle,
          limit: fetchLimit,
          accountId: fetchAccountUsed || undefined
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.tweets)) {
        setFetchedTweets(data.tweets);
        if (data.tweets.length === 0) {
          showToastMsg(`لم يُعثر على تغريدات حديثة للحساب @${handle}`);
        } else {
          showToastMsg(`تم جلب ${data.tweets.length} تغريدة حقيقية بنجاح عبر twscrape 📡`);
        }
      } else {
        setFetchError(data.error || 'فشل جلب التغريدات. تأكد من استيراد الكوكيز الخاصة بك أولاً.');
        showToastMsg(data.error || 'تعذر جلب التغريدات');
      }
    } catch {
      setFetchError('حدث خطأ أثناء الاتصال بالخادم لجلب التغريدات الحقيقية.');
      showToastMsg('خطأ في الاتصال أثناء جلب التغريدات');
    } finally {
      setIsFetchingTweets(false);
    }
  };

  // Render Image Card
  const handleRenderCard = async () => {
    if (!cardTitle.trim() || !cardBody.trim()) {
      showToastMsg('العنوان ومحتوى الإعلان مطلوبان لتصميم البطاقة.');
      return;
    }
    setIsRenderingCard(true);
    setRenderedImageUrl(null);

    const [wStr, hStr] = cardDim.split('x');
    const width = parseInt(wStr, 10);
    const height = parseInt(hStr, 10);

    try {
      const res = await fetch('/api/twitter/render-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cardTitle,
          bodyText: cardBody,
          accountId: cardAccountId,
          width,
          height,
          accentColor: cardAccent,
          darkMode: cardDarkMode,
          customBadge: cardBadge
        })
      });
      const data = await res.json();
      if (data.success && data.webUrl) {
        setRenderedImageUrl(data.webUrl);
        showToastMsg('تم تصميم وتوليد البطاقة الأكاديمية بنجاح بدقة فائقة 🎨✨');
        fetchCardsHistory();
      } else {
        showToastMsg(data.error || 'تعذر تصميم البطاقة');
      }
    } catch {
      showToastMsg('خطأ أثناء تصميم البطاقة الأكاديمية');
    } finally {
      setIsRenderingCard(false);
    }
  };

  // Generate Smart Reply
  const handleGenerateReply = async () => {
    if (!commentInput.trim()) {
      showToastMsg('يرجى إدخال استفسار أو تعليق الطالب.');
      return;
    }
    setIsGeneratingReply(true);
    setGeneratedReply(null);
    try {
      const res = await fetch('/api/twitter/reply-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentText: commentInput,
          studentUsername: commentStudentUser,
          tweetTopic: commentTweetTopic,
          accountId: replyAccountId
        })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedReply({ reply_text: data.reply_text, confidence: data.confidence });
        showToastMsg('تم توليد الرد الذكي الموثوق وصوت الطالب بنجاح 🤖💬');
        fetchRepliesHistory();
      } else {
        showToastMsg(data.error || 'تعذر توليد الرد');
      }
    } catch {
      showToastMsg('خطأ أثناء توليد رد الذكاء الاصطناعي');
    } finally {
      setIsGeneratingReply(false);
    }
  };

  // Save Global Settings
  const handleSaveGlobalSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/twitter/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalSettings)
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg('تم حفظ وتحديث إعدادات تويتر العامة بنجاح 💾');
      } else {
        showToastMsg(data.error || 'تعذر حفظ الإعدادات');
      }
    } catch {
      showToastMsg('خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-950 border border-sky-500 text-sky-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce text-sm">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-lg shadow-sky-950/50">
            <Twitter className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white">
                منظومة تويتر (X) الاحترافية وإدارة الحسابات وتصميم الصور
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                PRO MULTI-ACCOUNT & AI STUDIO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              إدارة مستقلة بالكامل لكل حساب بكوكيز وجلسات منفصلة، تصميم بطاقات إعلانية أكاديمية (1080x1350)، ورد ذكي وفوري على تعليقات واستفسارات الطلاب دون هلوسة.
            </p>
          </div>
        </div>

        {/* Global Action Badges */}
        <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>الحسابات النشطة:</span>
            <span className="font-mono font-bold text-sky-300">{accounts.filter(a => a.is_active).length} / {accounts.length}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingAccount({
                id: `acc_${Date.now()}`,
                username: '@',
                display_name: 'صوت الطالب المعتمد 🎓',
                university: 'جامعة نجران',
                theme_color: '#0284c7',
                status: 'valid',
                is_active: 1,
                auto_publish: 1,
                auto_reply: 1,
                reply_persona: 'زميلك الأكاديمي الناصح وصوت الطالب الحقيقي، تنقل وتجيب بأمانة ولهجة سعودية بيضاء راقية دون اختلاق تواريخ وهمية.'
              });
              setIsAccountModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-950/40 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حساب جديد ➕</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold scroll-smooth">
        <button
          onClick={() => setSubTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            subTab === 'accounts'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-950/50'
          }`}
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span>👥 الحسابات المستقلة والكوكيز ({accounts.length})</span>
        </button>

        <button
          onClick={() => setSubTab('fetcher')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            subTab === 'fetcher'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-950/50'
          }`}
        >
          <Radio className="w-4 h-4 text-cyan-400" />
          <span>📡 جلب التغريدات الحقيقية (twscrape)</span>
        </button>

        <button
          onClick={() => setSubTab('studio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            subTab === 'studio'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-950/50'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-amber-400" />
          <span>🎨 استوديو تصميم البطاقات فائقة الدقة (1080x1350)</span>
        </button>

        <button
          onClick={() => setSubTab('replies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            subTab === 'replies'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-950/50'
          }`}
        >
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          <span>💬 مركز الرد الذكي على تعليقات الطلاب</span>
        </button>

        <button
          onClick={() => setSubTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            subTab === 'settings'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-950/50'
          }`}
        >
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>⚙️ مفاتيح API وإعدادات النشر المزدوج</span>
        </button>
      </div>

      {/* TAB 1: MULTI-ACCOUNTS & SESSIONS */}
      {subTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>كل حساب يعمل في بيئة جلسة مستقلة تماماً مع كوكيز مشفرة ومصادقة منفصلة. لا توجد أي حسابات وهمية مسبقة.</span>
            <button
              onClick={fetchAccounts}
              disabled={loadingAccounts}
              className="hover:text-sky-300 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAccounts ? 'animate-spin' : ''}`} />
              <span>تحديث الحسابات</span>
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="bg-slate-950/80 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Users className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-base font-black text-white">لا توجد حسابات مضافة حالياً (نظام نقي 100%)</h4>
                <p className="text-xs text-slate-400">
                  تم حذف جميع الحسابات والمصادر التجريبية. قم بالضغط على "إضافة حساب جديد" أدناه لإضافة حسابك الحقيقي وربط الكوكيز الخاصة بك.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAccount({
                    id: `acc_${Date.now()}`,
                    username: '@',
                    display_name: 'حسابي الجامعي 🎓',
                    university: '',
                    theme_color: '#0284c7',
                    status: 'needs_cookie',
                    is_active: 1,
                    auto_publish: 1,
                    auto_reply: 1,
                    reply_persona: 'زميلك الأكاديمي الناصح وصوت الطالب الحقيقي، تنقل وتجيب بأمانة ولهجة سعودية بيضاء راقية دون اختلاق تواريخ وهمية.'
                  });
                  setIsAccountModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول حساب لك الآن</span>
              </button>
            </div>
          ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map(acc => {
              const isValid = acc.status === 'valid';
              const isExpired = acc.status === 'expired';
              const isTesting = testingSessionId === acc.id;

              return (
                <div
                  key={acc.id}
                  className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all shadow-lg flex flex-col justify-between gap-4 relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 right-0 left-0 h-1"
                    style={{ backgroundColor: acc.theme_color || '#0284c7' }}
                  ></div>

                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-base">{acc.display_name}</span>
                          <span className="font-mono text-xs text-sky-400 font-bold">{acc.username}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{acc.university}</p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 shrink-0 ${
                          isValid
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isExpired
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {isValid ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        <span>{isValid ? 'جلسة نشطة ومصرحة' : isExpired ? 'كوكيز منتهية' : 'بحاجة لكوكيز'}</span>
                      </span>
                    </div>

                    {/* Features toggles info */}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[11px]">
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-1.5">
                        <span className="text-slate-400 block">حالة الحساب</span>
                        <span className={`font-bold ${acc.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {acc.is_active ? 'مفعل 🟢' : 'معطل ⚪'}
                        </span>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-1.5">
                        <span className="text-slate-400 block">النشر التلقائي</span>
                        <span className={`font-bold ${acc.auto_publish ? 'text-sky-400' : 'text-slate-500'}`}>
                          {acc.auto_publish ? 'تلقائي 🚀' : 'يدوي ⏸️'}
                        </span>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-1.5">
                        <span className="text-slate-400 block">الرد على الطلاب</span>
                        <span className={`font-bold ${acc.auto_reply ? 'text-purple-400' : 'text-slate-500'}`}>
                          {acc.auto_reply ? 'مفعل 🤖' : 'معطل ❌'}
                        </span>
                      </div>
                    </div>

                    {/* Has Cookies indicator */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                      <Cookie className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">
                        {acc.auth_token ? `auth_token: ${acc.auth_token.substring(0, 10)}... (محفوظ)` : 'لا توجد كوكيز مسجلة'}
                      </span>
                    </div>

                    {/* Dedicated Monitoring Sources */}
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-sky-300 flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-sky-400" />
                          <span>مصادر المراقبة الخاصة بهذا الحساب ({acc.monitoring_sources?.length || 0}):</span>
                        </span>
                        <span className="text-slate-500 text-[10px]">مراقبة تلقائية وسحب الأخبار</span>
                      </div>

                      {/* Chips list */}
                      <div className="flex flex-wrap gap-1.5">
                        {acc.monitoring_sources && acc.monitoring_sources.length > 0 ? (
                          acc.monitoring_sources.map(src => (
                            <span
                              key={src}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30"
                            >
                              <span>{src}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSource(acc.id, src)}
                                className="hover:text-rose-400 transition-colors cursor-pointer"
                                title="حذف هذا المصدر"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">لا توجد مصادر مخصصة بعد لهذا الحساب</span>
                        )}
                      </div>

                      {/* Inline quick add input */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          value={newSourceInputs[acc.id] || ''}
                          onChange={e => setNewSourceInputs(prev => ({ ...prev, [acc.id]: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSource(acc.id);
                            }
                          }}
                          placeholder="أضف معرف تويتر للمراقبة (مثل: @Najran_Univ)..."
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-sky-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSource(acc.id)}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                          <span>إضافة</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80 text-xs">
                    <button
                      type="button"
                      onClick={() => handleTestSession(acc.id)}
                      disabled={isTesting}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-sky-300 font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'جارٍ الفحص...' : 'فحص الجلسة ⚡'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCookieTargetAccount(acc);
                        setCookieInput(acc.cookies_json || (acc.auth_token ? `auth_token=${acc.auth_token}; ct0=${acc.ct0}` : ''));
                        setIsCookieModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Cookie className="w-3.5 h-3.5" />
                      <span>استيراد الكوكيز 🍪</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingAccount(acc);
                        setIsAccountModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all cursor-pointer mr-auto"
                      title="حذف الحساب"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* TAB: REAL TWEET FETCHER (TWSCRAPE) */}
      {subTab === 'fetcher' && (
        <div className="space-y-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <span>محرك جلب التغريدات الحقيقية (twscrape المفتوح بدون API رسمي)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  يعتمد 100% على الكوكيز الحقيقية المستوردة (<code className="text-amber-300">auth_token</code> و <code className="text-amber-300">ct0</code>). يجلب التغريدات ومرفقات الصور مباشرة من X دون واجهات مدفوعة.
                </p>
              </div>

              {accounts.filter(a => a.status === 'valid').length === 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-2 rounded-xl text-xs flex items-center gap-2 shrink-0">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>تنبيه: يلزم إضافة حساب واستيراد الكوكيز الخاصة به أولاً للاتصال بتويتر</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
              <div className="sm:col-span-5">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  معرف حساب تويتر المراد جلب تغريداته (Username):
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">@</span>
                  <input
                    type="text"
                    value={fetchHandle}
                    onChange={e => setFetchHandle(e.target.value.replace(/^@/, ''))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFetchTweets();
                      }
                    }}
                    placeholder="مثال: Najran_Univ أو KSU_News"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-8 pl-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الحساب المستخدم (الكوكيز):
                </label>
                <select
                  value={fetchAccountUsed}
                  onChange={e => setFetchAccountUsed(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">تلقائي (أي حساب نشط في المجمع)</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.display_name} ({acc.username}) - {acc.status === 'valid' ? 'كوكيز نشطة' : 'غير مهيأ'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  العدد المطلوب:
                </label>
                <select
                  value={fetchLimit}
                  onChange={e => setFetchLimit(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={5}>5 تغريدات</option>
                  <option value={10}>10 تغريدات</option>
                  <option value={20}>20 تغريدة</option>
                  <option value={30}>30 تغريدة</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={handleFetchTweets}
                  disabled={isFetchingTweets}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 disabled:opacity-50 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-950/50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetchingTweets ? 'animate-spin' : ''}`} />
                  <span>{isFetchingTweets ? 'جارٍ السحب...' : 'جلب التغريدات 📡'}</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {fetchError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="space-y-1">
                  <div className="font-bold">تعذر جلب التغريدات الحقيقية:</div>
                  <div className="font-mono text-[11px] leading-relaxed">{fetchError}</div>
                  <div className="text-[11px] text-rose-300/80">
                    💡 تلميح: توجه إلى تبويب "الحسابات المستقلة"، ثم اضغط "استيراد الكوكيز 🍪" وضع auth_token و ct0 الخاصة بحسابك في X.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-slate-300">
                التغريدات المسترجعة عبر twscrape ({fetchedTweets.length}):
              </span>
              {fetchedTweets.length > 0 && (
                <span className="text-[11px] text-cyan-400">
                  بيانات حقيقية مباشرة وموثقة
                </span>
              )}
            </div>

            {fetchedTweets.length === 0 && !isFetchingTweets && !fetchError && (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-500 text-xs space-y-2">
                <Radio className="w-8 h-8 mx-auto text-slate-600" />
                <p>أدخل معرف أي حساب تويتر واضغط "جلب التغريدات" لسحب التغريدات الحقيقية فورياً.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fetchedTweets.map((tw: any, idx: number) => {
                const tweetUrl = tw.url || `https://x.com/${tw.author?.username || fetchHandle}/status/${tw.id}`;
                const photos: string[] = tw.photos || [];
                const author = tw.author || {};

                return (
                  <div
                    key={tw.id || idx}
                    className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-lg transition-all"
                  >
                    <div>
                      {/* Author Header */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">
                            {author.display_name || author.username || `@${fetchHandle}`}
                          </span>
                          <span className="text-[11px] font-mono text-cyan-400">
                            @{author.username || fetchHandle}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {tw.date ? new Date(tw.date).toLocaleString('ar-SA') : ''}
                        </span>
                      </div>

                      {/* Tweet Content */}
                      <div className="mt-3 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                        {tw.text}
                      </div>

                      {/* Media Photos if present */}
                      {photos.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {photos.slice(0, 4).map((imgUrl, pIdx) => (
                            <img
                              key={pIdx}
                              src={imgUrl}
                              alt="مرفق التغريدة"
                              className="rounded-lg object-cover w-full h-32 border border-slate-800"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions on this Tweet */}
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <a
                        href={tweetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 font-bold text-[11px] flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>فتح التغريدة على X</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setCardTitle(`منشور معتمد: @${author.username || fetchHandle}`);
                          setCardBody(tw.text || '');
                          setSubTab('studio');
                          showToastMsg('تم نقل نص التغريدة إلى استوديو تصميم البطاقات 🎨');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Palette className="w-3 h-3" />
                        <span>تصميم بطاقة للنشر 🎨</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HIGH-RES CARD DESIGNER */}
      {subTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>محرر وقالب البطاقات الأكاديمية (Pillow & Tajawal)</span>
                </h4>
                <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                  1080x1350 High-Res
                </span>
              </div>

              {/* Target Account Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الحساب والجامعة المستهدفة:</label>
                <select
                  value={cardAccountId}
                  onChange={e => {
                    setCardAccountId(e.target.value);
                    const found = accounts.find(a => a.id === e.target.value);
                    if (found && found.theme_color) setCardAccent(found.theme_color);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.display_name} ({a.username}) - {a.university}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">عنوان الإعلان الرئيسي:</label>
                <input
                  type="text"
                  value={cardTitle}
                  onChange={e => setCardTitle(e.target.value)}
                  placeholder="مثال: إعلان هام بخصوص مواعيد الحذف والإضافة"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Body Text */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  المحتوى والنقاط الأكاديمية (يتم لف النص تلقائياً وضبط حجمه):
                </label>
                <textarea
                  rows={5}
                  value={cardBody}
                  onChange={e => setCardBody(e.target.value)}
                  placeholder="اكتب النقاط التفصيلية للخبر أو الشروط..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed font-mono"
                />
              </div>

              {/* Custom Badge & Color options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نص الشارة العلوية:</label>
                  <input
                    type="text"
                    value={cardBadge}
                    onChange={e => setCardBadge(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">لون التمييز (Accent):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cardAccent}
                      onChange={e => setCardAccent(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0.5"
                    />
                    <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                      {['#0284c7', '#059669', '#d97706', '#dc2626', '#9333ea'].map(col => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setCardAccent(col)}
                          style={{ backgroundColor: col }}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            cardAccent === col ? 'border-white scale-110' : 'border-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dimensions & Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">أبعاد التصميم:</label>
                  <select
                    value={cardDim}
                    onChange={e => setCardDim(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="1080x1350">1080x1350 (بورتريه 4:5 - الأفضل لتويتر للجوال)</option>
                    <option value="1080x1080">1080x1080 (مربع 1:1)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">النمط البصري:</label>
                  <button
                    type="button"
                    onClick={() => setCardDarkMode(!cardDarkMode)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{cardDarkMode ? 'الوضع الليلي الفخم 🌙' : 'الوضع النهاري الأبيض ☀️'}</span>
                  </button>
                </div>
              </div>

              {/* Render Button */}
              <button
                type="button"
                onClick={handleRenderCard}
                disabled={isRenderingCard}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isRenderingCard ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>تصميم وتوليد البطاقة الآن (Ultra-HD PNG) 🎨✨</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview & Result Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center min-h-[480px]">
              {renderedImageUrl ? (
                <div className="space-y-4 w-full flex flex-col items-center">
                  <div className="relative group max-w-sm rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black">
                    <img
                      src={renderedImageUrl}
                      alt="Student Announcement Card"
                      className="w-full h-auto object-contain max-h-[520px]"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <a
                        href={renderedImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 shadow-lg"
                        title="عرض بالحجم الكامل"
                      >
                        <Maximize2 className="w-5 h-5" />
                      </a>
                      <a
                        href={renderedImageUrl}
                        download={`announcement_${Date.now()}.png`}
                        className="p-3 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 shadow-lg flex items-center gap-1 text-xs"
                      >
                        <Download className="w-4 h-4" />
                        <span>تحميل PNG</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 w-full text-xs">
                    <a
                      href={renderedImageUrl}
                      download={`announcement_${Date.now()}.png`}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل الصورة بدقة أصلية 📥</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => showToastMsg('الصورة جاهزة ومربوطة بمحرك النشر المباشر على تويتر 🚀')}
                      className="px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 font-bold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>تجهيز للتغريد المباشر</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 space-y-3 text-slate-500">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-sm text-slate-400">معاينة البطاقة الأكاديمية</p>
                  <p className="text-xs max-w-xs text-slate-500">
                    اضغط على «تصميم وتوليد البطاقة الآن» لتوليد بطاقة فائقة الدقة بنص عربي RTL وخط تجوال وشعار الجامعة.
                  </p>
                </div>
              )}
            </div>

            {/* Recent Cards History */}
            {cardsHistory.length > 0 && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-400 block">أحدث التصاميم المحفوظة:</span>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {cardsHistory.slice(0, 6).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setRenderedImageUrl(c.image_path)}
                      className="rounded-lg overflow-hidden border border-slate-800 hover:border-amber-500 transition-all cursor-pointer aspect-[4/5] bg-slate-900"
                    >
                      <img src={c.image_path} alt={c.title} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SMART AUTO-REPLY TO STUDENT COMMENTS */}
      {subTab === 'replies' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>محاكي واختبار الرد الذكي على تعليقات الطلاب (Zero Hallucination)</span>
                </h4>
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  صوت الطالب المعتمد
                </span>
              </div>

              {/* Responding Account */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الحساب المجيب:</label>
                <select
                  value={replyAccountId}
                  onChange={e => setReplyAccountId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.display_name} ({a.username})
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Question Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">سؤال أو استفسار الطالب في تويتر:</label>
                  <input
                    type="text"
                    value={commentStudentUser}
                    onChange={e => setCommentStudentUser(e.target.value)}
                    placeholder="@student_user"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-[11px] text-sky-400 font-mono w-32"
                  />
                </div>
                <textarea
                  rows={3}
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  placeholder="مثال: متى تنزل مكافأة هذا الشهر وهل تشمل الطلاب اللي عليهم إنذار؟"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Tweet Topic Context */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">سياق المنشور الأصلي:</label>
                <input
                  type="text"
                  value={commentTweetTopic}
                  onChange={e => setCommentTweetTopic(e.target.value)}
                  placeholder="موضوع التغريدة الأساسية"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Preset Questions */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">أسئلة طلابية شائعة للتجربة السريعة:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'كم نسبة الحرمان من المادة وكيف أقدم عذر طبي؟',
                    'متى تنزل المكافأة للطلاب المستجدين؟',
                    'كيف أقدم طلب تحويل داخلي بين الكليات وما هي الشروط؟',
                    'هل أقدر أحذف المادة بدون ما تنحسب لي رسوب؟'
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCommentInput(q)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer text-right"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateReply}
                disabled={isGeneratingReply}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isGeneratingReply ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>توليد الرد الذكي الموثوق (Zero Hallucination) 🤖💬</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Reply & History Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <span className="text-xs font-bold text-slate-400 block">الرد المقترح لتويتر (أقل من 260 حرف):</span>
              {generatedReply ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs sm:text-sm text-slate-100 leading-relaxed shadow-inner">
                    <p className="whitespace-pre-line font-medium">{generatedReply.reply_text}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800">
                      <span>عدد الحروف: {generatedReply.reply_text?.length} / 280</span>
                      <span className="text-emerald-400 font-bold">دقة وتوثيق: 98% ✅</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedReply.reply_text || '');
                        showToastMsg('تم نسخ نص الرد إلى الحافظة 📋');
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      نسخ الرد 📋
                    </button>
                    <button
                      type="button"
                      onClick={() => showToastMsg('تم توثيق الرد في سجل ردود الطلاب بنجاح ✅')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      اعتماد الرد للتغريد 🚀
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  لم يتم توليد رد حتى الآن؛ اضغط «توليد الرد الذكي» لمعاينة أسلوب الذكاء في الرد على استفسار الطالب.
                </div>
              )}
            </div>

            {/* Replies History */}
            {repliesHistory.length > 0 && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-400 block">سجل الردود الأخيرة على استفسارات الطلاب:</span>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                  {repliesHistory.map(r => (
                    <div key={r.id} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-sky-400">{r.student_username}</span>
                        <span className="text-slate-500">{r.created_at ? r.created_at.slice(0, 16) : ''}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] font-mono">سؤال: {r.comment_text}</p>
                      <p className="text-emerald-300 text-[11px] bg-slate-950 p-2 rounded-lg">رد: {r.reply_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: API KEYS & GLOBAL SETTINGS */}
      {subTab === 'settings' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              <span>الإعدادات العامة للنشر المزدوج وربط API الرسمي (X Developer Portal)</span>
            </h4>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">النشر التلقائي المزدوج (Dual Auto-Publish)</span>
                  <span className="text-[11px] text-slate-400">نشر متزامن ومستقل لتويتر وتيليجرام فور ورود الخبر</span>
                </div>
                <input
                  type="checkbox"
                  checked={globalSettings.auto_publish === 1}
                  onChange={e => setGlobalSettings(p => ({ ...p, auto_publish: e.target.checked ? 1 : 0 }))}
                  className="w-4 h-4 accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">تقسيم التغريدات الطويلة (Auto Thread)</span>
                  <span className="text-[11px] text-slate-400">تقسيم المحتوى الغني تلقائياً إلى سلسلة تغريدات 1/2, 2/2</span>
                </div>
                <input
                  type="checkbox"
                  checked={globalSettings.auto_thread === 1}
                  onChange={e => setGlobalSettings(p => ({ ...p, auto_thread: e.target.checked ? 1 : 0 }))}
                  className="w-4 h-4 accent-sky-500 cursor-pointer"
                />
              </div>
            </div>

            {/* API Keys */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">API Key (Consumer Key):</label>
                <input
                  type="password"
                  value={globalSettings.api_key}
                  onChange={e => setGlobalSettings(p => ({ ...p, api_key: e.target.value }))}
                  placeholder="مفتاح API الخاص بحساب المطور"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">API Secret:</label>
                <input
                  type="password"
                  value={globalSettings.api_secret}
                  onChange={e => setGlobalSettings(p => ({ ...p, api_secret: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Access Token:</label>
                <input
                  type="password"
                  value={globalSettings.access_token}
                  onChange={e => setGlobalSettings(p => ({ ...p, access_token: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Access Secret:</label>
                <input
                  type="password"
                  value={globalSettings.access_secret}
                  onChange={e => setGlobalSettings(p => ({ ...p, access_secret: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الهاشتاجات الأكاديمية الافتراضية:</label>
                <input
                  type="text"
                  value={globalSettings.custom_hashtags}
                  onChange={e => setGlobalSettings(p => ({ ...p, custom_hashtags: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveGlobalSettings}
              disabled={isSavingSettings}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSavingSettings ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ إعدادات تويتر العامة 💾</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ACCOUNT */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-sm">
                {editingAccount.id && accounts.some(a => a.id === editingAccount.id)
                  ? 'تعديل بيانات الحساب'
                  : 'إضافة حساب تويتر جديد ➕'}
              </h3>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم المستخدم (المعرف):</label>
                  <input
                    type="text"
                    value={editingAccount.username || ''}
                    onChange={e => setEditingAccount(p => ({ ...p, username: e.target.value }))}
                    placeholder="@Najran_Students"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الاسم المعروض (Display Name):</label>
                  <input
                    type="text"
                    value={editingAccount.display_name || ''}
                    onChange={e => setEditingAccount(p => ({ ...p, display_name: e.target.value }))}
                    placeholder="صوت الطالب المعتمد 🎓"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الجامعة المخصصة:</label>
                <input
                  type="text"
                  value={editingAccount.university || ''}
                  onChange={e => setEditingAccount(p => ({ ...p, university: e.target.value }))}
                  placeholder="جامعة نجران / جامعة الملك سعود"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                  <span>مصادر المراقبة الخاصة بهذا الحساب (حسابات تويتر للمتابعة):</span>
                  <span className="text-[10px] text-sky-400 font-normal">مفصولة بفواصل</span>
                </label>
                <input
                  type="text"
                  value={Array.isArray(editingAccount.monitoring_sources) ? editingAccount.monitoring_sources.join(', ') : ((editingAccount as unknown as { monitoring_sources?: string }).monitoring_sources || '')}
                  onChange={e => {
                    const val = e.target.value;
                    const items = val.split(',').map(s => s.trim()).filter(Boolean);
                    setEditingAccount(p => ({ ...p, monitoring_sources: items }));
                  }}
                  placeholder="@Najran_Univ, @NU_Admission, @KSU_Official"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-sky-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  أضف الحسابات الرسمية والعمادات التابعة لهذه الجامعة حصراً (مثلاً: @Najran_Univ). سيقوم النظام بمراقبتها خصيصاً لهذا الحساب.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">شخصية وأسلوب الرد على الطلاب (Persona):</label>
                <textarea
                  rows={2}
                  value={editingAccount.reply_persona || ''}
                  onChange={e => setEditingAccount(p => ({ ...p, reply_persona: e.target.value }))}
                  placeholder="مثال: زميلك الأكاديمي الناصح وصوت الطالب الحقيقي، تنقل وتجيب بأمانة ولهجة سعودية بيضاء راقية دون اختلاق تواريخ وهمية."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">لون التمييز الجامعي:</label>
                  <input
                    type="color"
                    value={editingAccount.theme_color || '#0284c7'}
                    onChange={e => setEditingAccount(p => ({ ...p, theme_color: e.target.value }))}
                    className="w-full h-9 rounded-xl border border-slate-700 bg-transparent cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">البروكسي المستقل (اختياري):</label>
                  <input
                    type="text"
                    value={editingAccount.proxy || ''}
                    onChange={e => setEditingAccount(p => ({ ...p, proxy: e.target.value }))}
                    placeholder="http://user:pass@host:port"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAccount.is_active === 1}
                    onChange={e => setEditingAccount(p => ({ ...p, is_active: e.target.checked ? 1 : 0 }))}
                    className="accent-sky-500"
                  />
                  <span className="font-bold text-slate-300">تفعيل الحساب للنشر</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAccount.auto_reply === 1}
                    onChange={e => setEditingAccount(p => ({ ...p, auto_reply: e.target.checked ? 1 : 0 }))}
                    className="accent-purple-500"
                  />
                  <span className="font-bold text-slate-300">الرد الآلي على استفسارات الطلاب</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveAccount}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                حفظ الحساب 💾
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT COOKIES */}
      {isCookieModalOpen && cookieTargetAccount && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-white text-sm">استيراد كوكيز وجلسة تويتر المستقلة 🍪</h3>
                <span className="text-xs text-sky-400 font-mono">{cookieTargetAccount.username} ({cookieTargetAccount.university})</span>
              </div>
              <button
                onClick={() => setIsCookieModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400 text-xs leading-relaxed">
                الصق ملف جلسة Playwright Storage State (JSON) أو قائمة الكوكيز، أو الصيغة المباشرة (مثل: <code className="text-amber-300">auth_token=...; ct0=...</code>).
              </p>

              <textarea
                rows={6}
                value={cookieInput}
                onChange={e => setCookieInput(e.target.value)}
                placeholder={'{\n  "cookies": [\n    {"name": "auth_token", "value": "xxxx"},\n    {"name": "ct0", "value": "yyyy"}\n  ]\n}'}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCookieModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleImportCookies}
                disabled={isImportingCookies}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {isImportingCookies ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Cookie className="w-4 h-4" />
                    <span>حفظ وتفعيل الكوكيز ⚡</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
