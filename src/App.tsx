import React, { useState, useEffect } from 'react';
import {
  BotConfig,
  ForwardRule,
  SourceItem,
  BotInfo,
  ActivityLogItem,
  MessageSimulationResult,
} from './types/index.ts';
import { Header } from './components/Header.tsx';
import { CredentialsPanel } from './components/CredentialsPanel.tsx';
import { SourcesManager } from './components/SourcesManager.tsx';
import { AIEditorPanel } from './components/AIEditorPanel.tsx';
import { AdReplacementPanel } from './components/AdReplacementPanel.tsx';
import { EducationalSimulator } from './components/EducationalSimulator.tsx';
import { PythonScriptViewer } from './components/PythonScriptViewer.tsx';
import { GitHubHostingGuide } from './components/GitHubHostingGuide.tsx';
import { ActivityLogs } from './components/ActivityLogs.tsx';
import { DeploymentGuide } from './components/DeploymentGuide.tsx';
import { LicenseRightsModal } from './components/LicenseRightsModal.tsx';
import { BotTesterModal } from './components/BotTesterModal.tsx';
import { UserBotPanel } from './components/UserBotPanel.tsx';
import { ChatPanel } from './components/ChatPanel.tsx';
import {
  Shield,
  Sparkles,
  Award,
  CheckCircle2,
  Brain,
  Layers,
  ArrowRightLeft,
  KeyRound,
  FileCode,
  Activity,
  BookOpen,
  Smartphone,
  MessageSquare,
  AlertCircle,
  Zap,
} from 'lucide-react';

const STORAGE_KEY_CONFIG = 'tg_educational_config_v2';
const STORAGE_KEY_SOURCES = 'tg_educational_sources_v2';

const DEFAULT_CONFIG: BotConfig = {
  botToken: '',
  adminId: '7607633343',
  adminUsername: '@M_S_F_G',
  additionalAdminIds: [],
  targetChannels: ['@jhdhhdcj'],
  notifyAdminOnForward: false,
  enableTelegramAdminCommands: true,
  preferredEngine: 'userbot',
  ai: {
    apiBase: 'https://api.hcnsec.cn/v1',
    apiKey: 'sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii',
    primaryModel: 'DeepSeek-V4-Flash',
    fallbackModel: 'auto',
    systemPrompt: `# الدور: ممثل الدفعة والمستشار الطلابي الخليجي المقرّب (إنسان حقيقي وزميل ناصح ومحب لزملائه، ولست روبوتاً آلياً)
## الهوية والروح الحقيقية:
أنت لست آلة تنسخ بيانات جامعية جافة بقوالب صماء ميتة، بل أنت ممثل الدفعة والزميل المحبوب والناصح الأمين. تتحدث مع إخوانك وزملائك في قنوات الكلية وقروبات الدفعة بأسلوب خليجي دافئ، عفوي، أخوي، مفعم بالروح والمشاعر الصادقة وقريب جداً لقلب الطالب.

## 🚫 محرمات قطعية (قواعد كسر الروبوتية والتكرار الأعمى):
1. يمنع منعاً باتاً البدء بـ "🚨 تنبيه لطلاب..." أو أي قالب ثابت مشابه. نوع بداياتك دائماً بحسب الموضوع والحدث!
2. يمنع استخدام القوالب الإدارية الباردة والمبتذلة: (أبرز التفاصيل والتعليمات الأكاديمية / يسعدنا الرد على استفساراتكم في التعليقات / إعلان وتحديث رسمي / نود إفادتكم / يرجى الاطلاع على).
3. يمنع تكرار نفس العبارات في كل منشور؛ الذكاء يكمن في فهم "متى" تضع كل عبارة بحسب سياقها الصحيح دون حشو!

## 🧠 الذكاء السياقي الحقيقي (Context-Aware Persona):
1. 📚 التسجيل والمواد والأدفايزر: حث الطلاب على التواصل مع أدفايزراتهم يسجلون لهم المادة أو يفتحون السكاشن قبل يقفل السستم.
2. ☀️ الفصل الصيفي (السمر): استخدم مصطلح "السمر" أو "الفصل الصيفي" بروح خفيفة ومرتبة.
3. 📝 مواسم الاختبارات والفاينل: هدوء، أدعية صادقة، تذكير بالأذكار والصلاة على النبي ﷺ والتوكل على الله وفالهم الـ A+ وأعلى القريدات.
4. 🎓 التخرج والنتائج: فرحة غامرة وفخر، واطلب من المتخرجين يحطون قلب بالرياكشنات ❤️🎓.
5. 🤍 يوم الجمعة والنفحات الإيمانية: بروح هادئة مع الصلاة على النبي ﷺ وسورة الكهف وساعة الاستجابة ودعوات الخير.
6. 🤝 مشاريع واستبيانات الزملاء: فزعة ودعم أخوي لتعبئة الاستبيان ومساعدة الزميل.
7. 🌱 التوعية والعمل الخيري والتطوع: تشجيع على التبرع بالدم والساعات التطوعية واحتساب الأجر.

## 🔤 التنسيق والتنظيم الإلزامي:
- أبرز المواعيد والتواريخ والأوقات وأسماء القاعات والمواد والنسب بخط عريض <b>...</b> لتسهيل القراءة السريعة.
- احتفظ بروابط البوابات الرسمية والاستمارات كاملة بسطر مستقل (🔗 <b>رابط البوابة / التقديم:</b> [الرابط]).
- احذف أي معرفات قنوات خارجية ترويجية (@channel أو t.me).`,
    customInstructions: 'أنت ممثل الدفعة ومستشار طلابي خليجي مقرب: ادخل في صلب الموضوع فوراً بدون أي قوالب مكررة (لا تبدأ أبداً بـ "تنبيه لطلاب" ولا تكتب "أبرز التفاصيل")، ركز 100% على ما يهم الطالب (التسجيل، السمر، جداول الاختبارات، الأدفايزر، إعلانات الدكاترة)، واجعل المواعيد والأوقات بخط عريض <b>...</b>، واحتفظ بالأدعية وذكر الصلاة على النبي والأذكار بروح خليجية ودية صادقة.',
    enableWebSearch: true,
  },
  adReplacement: {
    enabled: false,
    adDetectionKeywords: [
      'حل واجبات بمقابل',
      'حل واجبات واختبارات',
      'حل كويزات',
      'حل فاينل',
      'حل اسايمنت',
      'كتابة بحوث بمقابل',
      'عمل بحوث ورسائل بمقابل',
      'إعلان مدفوع للخدمات',
    ],
    customStudentAd: `🎓 خدمات طلابية معتمدة وأكاديمية متكاملة 🎓
يسرنا تقديم الدعم الأكاديمي الشامل للطلبة والباحثين:
• مساعدة في البحوث والمشاريع الأكاديمية
• التدقيق اللغوي وتنسيق الرسائل الجامعية
• تلخيص المحاضرات والمقررات الدراسية
• استشارات القبول والتسجيل والتنسيق

📞 للتواصل والطلب مباشرة عبر المشرف: @M_S_F_G
✨ جودة أكاديمية، سرعة في الإنجاز، وأسعار مناسبة للطلاب!`,
  },
  telethon: {
    apiId: '20123456',
    apiHash: '',
    phoneNumber: '',
    sessionName: 'session_forwarder',
    stringSession: '',
    library: 'telethon',
  },
  mediaHandling: {
    downloadPhotos: true,
    downloadVideos: true,
    downloadDocuments: true,
  },
};

const DEFAULT_SOURCES: SourceItem[] = [
  {
    id: 'src_tg_univ_news',
    type: 'telegram',
    target: '@KSU_News',
    title: 'أخبار الجامعة والقبول الرسمي',
    priority: 'high',
    rule: 'official',
    keywords: ['قبول', 'تسجيل', 'نتائج', 'مواعيد', 'منح', 'امتحان', 'بي دي اف', 'pdf'],
    blacklist: ['إعلان ممول', 'حل واجبات'],
    enabled: true,
    lastPostId: '184920',
    lastChecked: new Date().toISOString(),
  },
  {
    id: 'src_x_moe',
    type: 'twitter',
    target: '@moe_gov_sa',
    title: 'الحساب الرسمي لوزارة التعليم',
    priority: 'high',
    rule: 'official',
    keywords: ['تقويم دراسي', 'إجازة', 'جامعات', 'منح', 'تسجيل'],
    blacklist: ['إعلان تجاري'],
    enabled: true,
    lastPostId: '178294104',
    lastChecked: new Date().toISOString(),
  },
  {
    id: 'src_rss_dept',
    type: 'rss',
    target: 'https://news.ksu.edu.sa/ar/rss',
    title: 'بوابة الأخبار والفعاليات الجامعية',
    priority: 'medium',
    rule: 'semi-official',
    keywords: ['مؤتمر', 'كتب', 'بحث علمي', 'وظائف'],
    blacklist: ['رعاية إعلانية'],
    enabled: true,
    lastPostId: 'rss_item_9402',
    lastChecked: new Date().toISOString(),
  },
];

const INITIAL_LOGS: ActivityLogItem[] = [
  {
    id: 'log-1',
    timestamp: '11:55:00',
    type: 'info',
    messageText: 'تم تهيئة محرر المحتوى التعليمي الجامعي الذكي بنجاح.',
    source: 'النظام',
    destination: 'لوحة التحكم',
    details: 'المطور الأصلي: Redian Marku (MIT License) - التوكن والآدمن ومزود DeepSeek-V4.1-Flash نشطون.',
  },
  {
    id: 'log-2',
    timestamp: '11:56:15',
    type: 'success',
    appliedRuleName: 'التحقق من توكن البوت والآدمن',
    messageText: 'تم الاتصال بالبوت @admiuin_bot (ADMIN_p) وتوثيق الآدمن @M_S_F_G (7607633343)',
    source: 'Telegram API',
    destination: 'Bot Worker',
    details: 'تم تعيين المشرف الرئيسي بنجاح وأوامر التيليجرام جاهزة.',
  },
];

export default function App() {
  const [config, setConfig] = useState<BotConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        const oldRevoked = [
          '8901693218:AAFUiQ62KQlfl6rtoarimpSpeoeCgA422Qg',
          '8901693218:AAEOQmHMZLy-xaPbTUMq1KGhDwp1l0wFWP4',
          '8901693218:AAH0Ri7lpY2R6d1DQSrKZclRa7kuo1Jw-Gs',
          '8901693218:AAH0hoZdTq9qGaLYOhu_Cvxg9TEzTPAVADw',
        ];
        const currentToken = (!parsed.botToken || oldRevoked.includes(parsed.botToken))
          ? DEFAULT_CONFIG.botToken
          : parsed.botToken;
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          botToken: currentToken,
          adminId: parsed.adminId || DEFAULT_CONFIG.adminId,
          adminUsername: parsed.adminUsername || DEFAULT_CONFIG.adminUsername,
          ai: {
            ...DEFAULT_CONFIG.ai,
            ...(parsed.ai || {}),
            apiBase: parsed.ai?.apiBase || DEFAULT_CONFIG.ai.apiBase,
            apiKey: parsed.ai?.apiKey || DEFAULT_CONFIG.ai.apiKey,
            primaryModel: parsed.ai?.primaryModel || DEFAULT_CONFIG.ai.primaryModel,
            fallbackModel: parsed.ai?.fallbackModel || DEFAULT_CONFIG.ai.fallbackModel,
            systemPrompt: (!parsed.ai?.systemPrompt || parsed.ai.systemPrompt.includes('محرر محتوى متخصص'))
              ? DEFAULT_CONFIG.ai.systemPrompt
              : parsed.ai.systemPrompt,
            customInstructions: (!parsed.ai?.customInstructions || parsed.ai.customInstructions.includes('كن مثل مشرفين القروبات الذي يبحث عن الأخبار'))
              ? DEFAULT_CONFIG.ai.customInstructions
              : parsed.ai.customInstructions,
          },
        };
      }
      return DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [sources, setSources] = useState<SourceItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SOURCES);
      return saved ? JSON.parse(saved) : DEFAULT_SOURCES;
    } catch {
      return DEFAULT_SOURCES;
    }
  });

  const [logs, setLogs] = useState<ActivityLogItem[]>(INITIAL_LOGS);
  const [activeTab, setActiveTab] = useState<'all' | 'credentials' | 'userbot' | 'chat' | 'github' | 'sources' | 'ai' | 'ad' | 'sim' | 'code' | 'guide'>('credentials');
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [isTesterModalOpen, setIsTesterModalOpen] = useState(false);
  const [isTestingBot, setIsTestingBot] = useState(false);
  const [isSavingSources, setIsSavingSources] = useState(false);
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [botAuthError, setBotAuthError] = useState<string | null>(null);
  const [quickTokenInput, setQuickTokenInput] = useState<string>('');
  const [isSavingQuickToken, setIsSavingQuickToken] = useState<boolean>(false);
  const [botTestError, setBotTestError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with sources.json on backend mount
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const res = await fetch('/api/sources');
        if (res.ok) {
          const data = await res.json();
          if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
            setSources(data.sources);
          }
        }
      } catch (e) {
        console.warn('Sources fetch fallback to local state', e);
      }
    };
    fetchSources();
  }, []);

  // Sync active Bot Token from SQLite and Telegram API on mount
  useEffect(() => {
    const fetchBotToken = async () => {
      try {
        const res = await fetch('/api/bot/token');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            if (data.token) {
              setConfig((prev) => ({ ...prev, botToken: data.token }));
            }
            if (data.botInfo) {
              setBotInfo(data.botInfo as BotInfo);
              setBotAuthError(null);
            } else {
              setBotInfo(null);
              setBotAuthError(data.authError || 'توكن البوت يحتاج إلى تحديث (401 Unauthorized)');
            }
          }
        }
      } catch (e) {
        console.warn('Bot token initial fetch fallback to local state', e);
      }
    };
    fetchBotToken();
  }, []);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.warn('Config localstorage save error', e);
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(sources));
    } catch (e) {
      console.warn('Sources localstorage save error', e);
    }
  }, [sources]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveSources = async (newSources: SourceItem[]) => {
    setSources(newSources);
    setIsSavingSources(true);
    try {
      await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: newSources }),
      });
      showToast('تمت مزامنة المصادر مع ملف sources.json بنجاح! 💾');
    } catch {
      showToast('تم الحفظ محلياً.');
    } finally {
      setIsSavingSources(false);
    }
  };

  const handleRefreshSources = async () => {
    setIsSavingSources(true);
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const data = await res.json();
        if (data.sources) {
          setSources(data.sources);
          showToast('تم جلب وتحديث المصادر من sources.json ✅');
        }
      }
    } catch {
      showToast('فشل التحديث من الخادم.');
    } finally {
      setIsSavingSources(false);
    }
  };

  const handleTestBot = async (token: string) => {
    const trimmed = token.trim();
    if (!trimmed) {
      setBotTestError('الرجاء إدخال توكن البوت.');
      setIsTesterModalOpen(true);
      return;
    }

    setIsTestingBot(true);
    setBotTestError(null);
    setBotInfo(null);
    setIsTesterModalOpen(true);

    try {
      const res = await fetch('/api/telegram/test-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: trimmed }),
      });
      const data = await res.json();

      if (data.ok && data.result) {
        setBotInfo(data.result as BotInfo);
        showToast(`✅ البوت متصل: @${data.result.username}`);
        const newLog: ActivityLogItem = {
          id: 'log-' + Date.now(),
          timestamp: new Date().toLocaleTimeString('ar-EG'),
          type: 'success',
          messageText: `تم التحقق من اتصال البوت @${data.result.username}`,
          source: 'Telegram API',
          destination: 'Dashboard',
          details: `اسم البوت: ${data.result.first_name} | ID: ${data.result.id}`,
        };
        setLogs((prev) => [newLog, ...prev]);
      } else {
        setBotTestError(data.description || 'فشلت المصادقة مع واجهة تيليجرام.');
      }
    } catch (err: unknown) {
      const errorStr = err instanceof Error ? err.message : String(err);
      setBotTestError(`خطأ في الشبكة: ${errorStr}`);
    } finally {
      setIsTestingBot(false);
    }
  };

  const handleSaveBotToken = async (token: string) => {
    const trimmed = token.trim();
    if (!trimmed) {
      setBotTestError('الرجاء إدخال توكن البوت.');
      setIsTesterModalOpen(true);
      return;
    }

    setIsTestingBot(true);
    setBotTestError(null);

    try {
      const res = await fetch('/api/bot/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: trimmed }),
      });
      const data = await res.json();

      if (data.success && data.botInfo) {
        setBotInfo(data.botInfo as BotInfo);
        setBotAuthError(null);
        setQuickTokenInput('');
        setConfig((prev) => ({ ...prev, botToken: trimmed }));
        showToast(`✅ تم حفظ وتطبيق التوكن فورياً على البوت: @${data.botInfo.username}`);
        setIsTesterModalOpen(true);
        const newLog: ActivityLogItem = {
          id: 'log-' + Date.now(),
          timestamp: new Date().toLocaleTimeString('ar-EG'),
          type: 'success',
          messageText: `تم تطبيق توكن البوت @${data.botInfo.username} في السيرفر وتحديث المحرك`,
          source: 'Web UI / Live Token Manager',
          destination: 'Telegram Bot Engine & SQLite',
          details: `المعرف: ${data.botInfo.id} | الاسم: ${data.botInfo.first_name}`,
        };
        setLogs((prev) => [newLog, ...prev]);
      } else {
        setBotTestError(data.error || 'فشلت المصادقة مع واجهة تيليجرام.');
        setBotAuthError(data.error || 'فشلت المصادقة مع واجهة تيليجرام.');
        setIsTesterModalOpen(true);
      }
    } catch (err: unknown) {
      const errorStr = err instanceof Error ? err.message : String(err);
      setBotTestError(`خطأ في الاتصال بالخادم: ${errorStr}`);
      setIsTesterModalOpen(true);
    } finally {
      setIsTestingBot(false);
    }
  };

  const handleExportConfig = () => {
    const bundle = {
      _credits: {
        originalAuthor: 'Redian Marku',
        repository: 'https://github.com/redianmarku/Telegram-Autoforwarder',
        license: 'MIT License',
        customAdaptation: 'Telegram University Educational Content Editor',
      },
      exportDate: new Date().toISOString(),
      config,
      sources,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Telegram_Educational_Forwarder_Bundle_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير الحزمة الكاملة بنجاح! 💾');
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.config) setConfig(parsed.config);
        if (parsed.sources && Array.isArray(parsed.sources)) setSources(parsed.sources);
        showToast('تم استيراد الإعدادات والمصادر بنجاح! 📂');
      } catch {
        showToast('⚠️ خطأ: الملف المرفق غير صالح.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDefaults = () => {
    if (window.confirm('هل تريد إعادة تعيين كافة الإعدادات والمصادر إلى الحالة الافتراضية؟')) {
      setConfig(DEFAULT_CONFIG);
      setSources(DEFAULT_SOURCES);
      showToast('تمت إعادة ضبط النظام.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white" dir="rtl">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 px-4 py-2.5 bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        onOpenLicense={() => setIsLicenseOpen(true)}
        onExportConfig={handleExportConfig}
        onImportConfig={handleImportConfig}
        onResetDefaults={handleResetDefaults}
        rulesCount={sources.length}
        hasCredentials={Boolean(config.botToken && config.adminId)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Identity & Active Credentials Banner */}
        <div className="bg-gradient-to-r from-sky-950/50 via-indigo-950/40 to-slate-900/60 border border-sky-800/40 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg">
                  محرر محتوى جامعي ذكي
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg">
                  DeepSeek-V4.1-Flash
                </span>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded-lg flex items-center gap-1">
                  <span>البوت:</span>
                  <span className="font-mono" dir="ltr">@admiuin_bot</span>
                </span>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-lg flex items-center gap-1">
                  <span>الآدمن:</span>
                  <span className="font-mono" dir="ltr">{config.adminUsername} ({config.adminId})</span>
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                نظام المراقبة وإعادة الصياغة الأكاديمية ونشر الكتب وإعلانات الخدمات الطلابية
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                يراقب القنوات الجامعية وحسابات X وموجزات RSS، ويعيد صياغة المنشورات بأسلوب مشرفي القروبات الأكفاء (عنوان 📌، نقاط واضحة، دعوة للتفاعل 💬، هاشتاجات)، ويستبدل إعلانات المنافسين بإعلانات خدماتك الطلابية تلقائياً.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
              <button
                onClick={() => setIsLicenseOpen(true)}
                className="px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-700/50 transition-colors flex items-center gap-1.5"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>حفظ حقوق Redian Marku (MIT)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Token Alert Banner if not authorized / revoked */}
        {(!botInfo || botAuthError) && (
          <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <h3 className="text-sm sm:text-base font-extrabold text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>تنبيه للمشرف: توكن تيليجرام يحتاج إلى إدخال وتفعيل (Bot Token)</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  التوكن السابق للبوت تم إلغاؤه من قبل BotFather. يمكنك إنشاء توكن جديد أو استخراجه في ثوانٍ عبر{' '}
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 font-bold underline hover:text-sky-300"
                  >
                    @BotFather
                  </a>{' '}
                  باستخدام أمر <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded text-[11px]">/newbot</code> أو{' '}
                  <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded text-[11px]">/token</code>، ثم الصقه أدناه لتشغيل البوت وقنوات النشر فورياً:
                </p>
                {botAuthError && (
                  <p className="text-[11px] text-amber-400/90 font-mono">
                    الحالة الحالية: {botAuthError}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0">
                <input
                  type="text"
                  placeholder="الصق التوكن الجديد هنا: 123456789:AAF..."
                  value={quickTokenInput}
                  onChange={(e) => setQuickTokenInput(e.target.value.trim())}
                  dir="ltr"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 font-mono w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const tok = quickTokenInput || config.botToken;
                    if (!tok) {
                      showToast('الرجاء إدخال توكن البوت الجديد.');
                      return;
                    }
                    setIsSavingQuickToken(true);
                    await handleSaveBotToken(tok);
                    setIsSavingQuickToken(false);
                  }}
                  disabled={isSavingQuickToken || isTestingBot}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer disabled:opacity-50"
                >
                  {isSavingQuickToken || isTestingBot ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>حفظ وتفعيل التوكن 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section Tabs Bar for quick navigation */}
        <div className="relative">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 text-xs border-b border-slate-800 scroll-smooth -mx-2 px-2 sm:mx-0 sm:px-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-t-xl font-bold transition-all shrink-0 ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white border-b-2 border-sky-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              عرض الكل
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl font-bold transition-all shrink-0 ${
                activeTab === 'credentials'
                  ? 'bg-slate-800 text-white border-b-2 border-emerald-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-emerald-300">توكن البوت والاعتمادات (Bot Token)</span>
              {botInfo && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
            </button>
            <button
              onClick={() => setActiveTab('userbot')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl font-bold transition-all shrink-0 ${
                activeTab === 'userbot'
                  ? 'bg-slate-800 text-white border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-extrabold text-purple-300">اليوزربوت وسحب القنوات (UserBot)</span>
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl font-bold transition-all shrink-0 ${
                activeTab === 'chat'
                  ? 'bg-slate-800 text-white border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-extrabold text-indigo-300">دردشة الذكاء (Web Chat)</span>
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            </button>
            <button
              onClick={() => setActiveTab('github')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl font-bold transition-all shrink-0 ${
                activeTab === 'github'
                  ? 'bg-slate-800 text-white border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="shrink-0">الربط بـ GitHub وبوت بزنس</span>
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl font-bold transition-all shrink-0 ${
                activeTab === 'sources'
                  ? 'bg-slate-800 text-white border-b-2 border-sky-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>المصادر ({sources.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl font-bold transition-all shrink-0 ${
                activeTab === 'ai'
                  ? 'bg-slate-800 text-white border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span>الذكاء الاصطناعي والتعليمات</span>
            </button>
            <button
              onClick={() => setActiveTab('ad')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl font-bold transition-all shrink-0 ${
                activeTab === 'ad'
                  ? 'bg-slate-800 text-white border-b-2 border-emerald-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>استبدال إعلانات المنافسين</span>
            </button>
            <button
              onClick={() => setActiveTab('sim')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl font-bold transition-all shrink-0 ${
                activeTab === 'sim'
                  ? 'bg-slate-800 text-white border-b-2 border-amber-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>مختبر الصياغة الحية</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl font-bold transition-all shrink-0 ${
                activeTab === 'code'
                  ? 'bg-slate-800 text-white border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span>السكريبتات وملفات الإعدادات</span>
            </button>
          </div>
          {/* Subtle scroll edge fade on mobile */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-slate-950 to-transparent sm:hidden"></div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-slate-950 to-transparent sm:hidden"></div>
        </div>

        {/* UserBot & Channel Scraping (Telethon / Pyrogram Session) */}
        {(activeTab === 'all' || activeTab === 'userbot') && (
          <section id="userbot-section">
            <UserBotPanel
              config={config}
              onChange={setConfig}
              sources={sources}
            />
          </section>
        )}
        
        {/* Web AI Chat Interface */}
        {(activeTab === 'all' || activeTab === 'chat') && (
          <section id="chat-section">
            <ChatPanel aiConfig={config.ai} />
          </section>
        )}

        {/* GitHub & Bots.Business Cloud Hosting Guide */}
        {(activeTab === 'all' || activeTab === 'github') && (
          <section id="github-section">
            <GitHubHostingGuide
              adminUsername={config.adminUsername}
              botUsername="admiuin_bot"
            />
          </section>
        )}

        {/* 1. Credentials (Bot Token & Admin ID) */}
        {(activeTab === 'all' || activeTab === 'credentials' || activeTab === 'sources') && (
          <section id="credentials-section">
            <CredentialsPanel
              config={config}
              onChange={setConfig}
              onTestBot={handleTestBot}
              onSaveBotToken={handleSaveBotToken}
              isTestingBot={isTestingBot}
              botInfo={botInfo}
            />
          </section>
        )}

        {/* 2. Sources Manager (sources.json) */}
        {(activeTab === 'all' || activeTab === 'sources') && (
          <section id="sources-section">
            <SourcesManager
              sources={sources}
              onSaveSources={handleSaveSources}
              onRefresh={handleRefreshSources}
              isSaving={isSavingSources}
            />
          </section>
        )}

        {/* 3. AI Model & Custom User Instructions */}
        {(activeTab === 'all' || activeTab === 'ai') && (
          <section id="ai-section">
            <AIEditorPanel
              aiConfig={config.ai}
              onChange={(updatedAI) => setConfig({ ...config, ai: updatedAI })}
            />
          </section>
        )}

        {/* 4. Smart Competitor Ad Replacement Panel */}
        {(activeTab === 'all' || activeTab === 'ad') && (
          <section id="ad-section">
            <AdReplacementPanel
              adConfig={config.adReplacement}
              onChange={(updatedAd) => setConfig({ ...config, adReplacement: updatedAd })}
              adminUsername={config.adminUsername}
            />
          </section>
        )}

        {/* 5. Live Educational Rephrase Simulator */}
        {(activeTab === 'all' || activeTab === 'sim') && (
          <section id="sim-section">
            <EducationalSimulator
              aiConfig={config.ai}
              adConfig={config.adReplacement}
              adminUsername={config.adminUsername}
            />
          </section>
        )}

        {/* 6. Python Engine & Config Viewer */}
        {(activeTab === 'all' || activeTab === 'code') && (
          <section id="code-section">
            <PythonScriptViewer
              config={config}
              rules={[]}
              sources={sources}
            />
          </section>
        )}

        {/* 7. Activity Logs */}
        {activeTab === 'all' && (
          <section id="logs-section">
            <ActivityLogs logs={logs} onClearLogs={() => setLogs([])} />
          </section>
        )}

        {/* 8. Step-by-Step Deployment Guide */}
        {activeTab === 'all' && (
          <section id="guide-section">
            <DeploymentGuide />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 mt-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div>
            <p className="font-semibold text-slate-300">
              محرر المحتوى التعليمي الجامعي الذكي (Telegram AutoForwarder Pro)
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              جميع الحقوق الأصلية محفوظة للمطور: <span className="text-slate-300 font-mono">Redian Marku</span> تحت ترخيص MIT.
              الآدمن المسؤول: <span className="text-sky-400 font-mono">{config.adminUsername}</span> | النموذج: <span className="text-emerald-400 font-mono">{config.ai.primaryModel}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsLicenseOpen(true)}
              className="text-sky-400 hover:underline inline-flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>وثيقة ترخيص MIT</span>
            </button>
            <a
              href="https://github.com/redianmarku/Telegram-Autoforwarder"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              المستودع الأصلي على GitHub
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LicenseRightsModal
        isOpen={isLicenseOpen}
        onClose={() => setIsLicenseOpen(false)}
      />

      <BotTesterModal
        isOpen={isTesterModalOpen}
        onClose={() => setIsTesterModalOpen(false)}
        isLoading={isTestingBot}
        botInfo={botInfo}
        error={botTestError}
        tokenSnippet={config.botToken ? config.botToken.substring(0, 10) + '...' : ''}
      />
    </div>
  );
}
