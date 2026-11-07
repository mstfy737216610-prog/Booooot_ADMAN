import React, { useState, useEffect, useCallback } from 'react';
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
import { PostAuditLogPanel } from './components/PostAuditLogPanel.tsx';
import { InteractiveIdeaBoard } from './components/InteractiveIdeaBoard.tsx';
import { TwitterIntegrationPanel } from './components/TwitterIntegrationPanel.tsx';
import { KnowledgeIntelPanel } from './components/KnowledgeIntelPanel.tsx';
import { DiagnosticsAndTestPublishPanel } from './components/DiagnosticsAndTestPublishPanel.tsx';
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
  Save,
  RefreshCw,
  Database,
  FileText,
  Lightbulb,
  Twitter,
} from 'lucide-react';

const STORAGE_KEY_CONFIG = 'tg_educational_config_v2';
const STORAGE_KEY_SOURCES = 'tg_educational_sources_v2';

const DEFAULT_CONFIG: BotConfig = {
  botToken: '',
  adminId: '7607633343',
  adminUsername: '@M_S_F_G',
  additionalAdminIds: [],
  targetChannels: [],
  notifyAdminOnForward: false,
  enableTelegramAdminCommands: true,
  preferredEngine: 'userbot',
  ai: {
    apiBase: 'https://api.hcnsec.cn/v1',
    apiKey: 'sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii',
    primaryModel: 'DeepSeek-V4-Flash',
    fallbackModel: 'auto',
    systemPrompt: `# الدور: ممثل الدفعة والزميل الأكاديمي الناصح وصوت الطالب الحقيقي (إنسان حقيقي ورفيق لزملائه)
## الهوية والروح الحقيقية:
أنت لست آلة تنسخ بيانات جامعية جافة، بل أنت ممثل الدفعة والزميل المقرب المحبوب والناصح الأمين. تنقل الأخبار الجامعية بمصداقية وأمانة مطلقة وبأسلوب أخوي راقٍ.

## 🚫 ضوابط حاسمة وصارمة لمنع التوليد الوهمي (Zero Hallucination Rules):
1. **منع اختلاق التواريخ والمواعيد منعاً كلياً:**
   - يمنع منعاً باتاً اختراع أي موعد، ساعة، تاريخ، أو نسبة غير موجودة حرفياً في النص المصدري المرفق.
   - يمنع منعاً باتاً اختلاق أو ذكر أي أسماء وهمية ما لم تكن مذكورة نصاً في الخبر.
   - إذا لم يحتوي الخبر المصدري على تاريخ أو موعد محدد، لا تذكر أي تاريخ على الإطلاق!
2. **عزل الجامعات والسياق واللهجات التام:**
   - لكل جامعة مسارها وقناتها المستقلة حصرياً؛ يمنع خلط أخبار جامعة مع أخرى.
   - التزم بلهجة وثقافة البلد المخصص للجامعة دون أي تشتت.
3. **حظر الروابط والعبارات الوهمية والمقالات الإنشائية:**
   - يمنع منعاً باتاً طباعة عبارات مثل [الرابط هنا] أو روابط تجريبية.
   - إذا لم يتوفر رابط حقيقي في الخبر المصدري، يُلغى سطر الرابط تماماً ولا يُكتب أي رابط.
   - اجعل المنشور مختصراً، مباشراً، ودقيقاً ينقل الفائدة الحقيقية للطالب دون حشو إنشائي طويل.
4. **كسر الروبوتية والقوالب الباردة:**
   - ادخل في صلب الموضوع مباشرة.

## 🔤 التنسيق والتنظيم الإلزامي:
- أبرز المواعيد والنسب والشروط الحقيقية المذكورة فقط بالخط العريض <b>...</b> لتسهيل القراءة.
- استخدم النقاط المنظمة [▫️] لسرد الخطوات الأكاديمية بوضوح تام.
- اختم دائماً بدعوات طيبة ولمسة أخوية تلامس قلب الطالب.`,
    customInstructions: 'التزم بنقل الحقائق والتواريخ المذكورة نصاً في الخبر فقط دون اختراع أي مواعيد أو أسماء وهمية. اعزل الجامعات بدقة، واحذف أسطر الروابط إن لم يكن هناك رابط حقيقي.',
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
    customStudentAd: '',
  },
  telethon: {
    apiId: '',
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

const DEFAULT_SOURCES: SourceItem[] = [];

const INITIAL_LOGS: ActivityLogItem[] = [];

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
  
  // Re-organized Professional Hubs & Sub-Navigation
  type MainHub = 'control' | 'sources' | 'twitter' | 'ai' | 'telegram' | 'logs' | 'all';
  const [activeHub, setActiveHub] = useState<MainHub>('control');
  const [subControl, setSubControl] = useState<'diagnostics' | 'credentials' | 'github' | 'guide'>('diagnostics');
  const [subSources, setSubSources] = useState<'manager' | 'intel'>('manager');
  const [subAi, setSubAi] = useState<'editor' | 'sim' | 'chat'>('editor');
  const [subTelegram, setSubTelegram] = useState<'userbot' | 'ad_replace'>('userbot');
  const [subLogs, setSubLogs] = useState<'sqlite_logs' | 'audit' | 'ideas' | 'code'>('sqlite_logs');

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
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [aiHealth, setAiHealth] = useState<{
    status: 'online' | 'degraded' | 'offline';
    message: string;
    provider?: string;
    primaryModel?: string;
    latency_ms?: number;
    lastError?: string;
  } | null>(null);

  // Sync with sources.json on backend mount - always respect server as source of truth
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const res = await fetch('/api/sources');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.sources)) {
            setSources(data.sources);
            localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(data.sources));
          }
        }
      } catch (e) {
        console.warn('Sources fetch fallback to local state', e);
      }
    };
    fetchSources();
  }, []);

  // Sync unified full config directly from files (config.json & SQLite) on mount
  useEffect(() => {
    const fetchServerConfig = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const serverCfg = await res.json();
          if (serverCfg && typeof serverCfg === 'object') {
            setConfig((prev) => ({
              ...prev,
              ...serverCfg,
              ai: {
                ...prev.ai,
                ...(serverCfg.ai || {}),
              },
              adReplacement: {
                ...prev.adReplacement,
                ...(serverCfg.adReplacement || {}),
              },
            }));
          }
        }
      } catch (e) {
        console.warn('Config initial server fetch note', e);
      }
    };
    fetchServerConfig();
  }, []);

  // Fetch AI health status
  const fetchAiHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/health');
      if (res.ok) {
        const data = await res.json();
        setAiHealth(data);
      }
    } catch {
      setAiHealth({
        status: 'degraded',
        message: 'المحرك الأكاديمي الداخلي نشط للردود الذكية وحماية القنوات'
      });
    }
  }, []);

  useEffect(() => {
    fetchAiHealth();
    const interval = setInterval(fetchAiHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchAiHealth]);

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

  // Save config directly to server files (config.json, state.json, SQLite, and phone storage)
  const handleSaveConfigDirectly = async (cfgToSave?: BotConfig) => {
    const target = cfgToSave || config;
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target),
      });
      if (res.ok) {
        showToast('تم حفظ كافة التعديلات مباشرة في الملفات والتخزين الداخلي بنجاح! 💾');
        fetchAiHealth();
      } else {
        showToast('تم الحفظ محلياً.');
      }
    } catch {
      showToast('تم الحفظ محلياً.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Local Persistence
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
      if (newSources.length === 0) {
        await fetch('/api/sources/clear', { method: 'POST' });
      } else {
        await fetch('/api/sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sources: newSources }),
        });
      }
      localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(newSources));
      showToast('تم حفظ المصادر وتحديث قاعدة البيانات والملفات مباشرة! 💾');
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

  const handleResetDefaults = async () => {
    if (window.confirm('هل تريد مسح كافة الإعدادات والمصادر والعودة للوضع الافتراضي النظيف في السيرفر؟')) {
      setConfig(DEFAULT_CONFIG);
      setSources([]);
      try {
        await fetch('/api/sources/clear', { method: 'POST' });
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(DEFAULT_CONFIG),
        });
      } catch {}
      localStorage.removeItem(STORAGE_KEY_SOURCES);
      localStorage.removeItem(STORAGE_KEY_CONFIG);
      showToast('تمت إعادة ضبط النظام ومسح كافة المصادر من السيرفر بنجاح 🧹');
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
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-medium">
                <span className="font-semibold text-amber-300">محرر ومراقب جامعي ذكي</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-300 font-mono">DeepSeek-V4-Flash + MiniCPM Vision</span>
                <span aria-hidden="true">·</span>
                <span className="text-sky-300">البوت: <b className="font-mono" dir="ltr">@admiuin_bot</b></span>
                <span aria-hidden="true">·</span>
                <span className="text-indigo-300">المشرف: <b className="font-mono" dir="ltr">{config.adminUsername} ({config.adminId})</b></span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                منصة أتمتة النشر الأكاديمي الموحدة وتنسيق المحتوى الذكي
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                مراقبة قنوات تيليجرام وحسابات تويتر (X)، وقراءة الإعلانات بالذكاء البصري (Vision OCR)، وصياغة المنشورات بدقة متناهية بدون هلوسة، واستبدال أرقام المساعدين بحساب المشرف المعتمد، مع حفظ متزامن فوري في SQLite والملفات.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
              {/* Direct Save Button */}
              <button
                type="button"
                onClick={() => handleSaveConfigDirectly()}
                disabled={isSavingConfig}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
              >
                {isSavingConfig ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>حفظ التعديلات في الملفات والتخزين 💾</span>
              </button>

              {/* Live AI Health Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    aiHealth?.status === 'online'
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-amber-400 animate-pulse'
                  }`}
                ></span>
                <span className="text-slate-200 font-semibold text-[11px]">
                  {aiHealth?.status === 'online' ? (
                    <span className="text-emerald-300">الذكاء الاصطناعي متصل ({aiHealth.latency_ms || 320}ms)</span>
                  ) : (
                    <span className="text-amber-300" title={aiHealth?.lastError || ''}>
                      {aiHealth?.message || 'المحرك الأكاديمي الداخلي نشط'}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={fetchAiHealth}
                  title="إعادة فحص حالة الذكاء الاصطناعي"
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

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

        {/* Primary Workspace Hubs Navigation Bar */}
        <div className="space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 shadow-xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveHub('control')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                  activeHub === 'control'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <AlertCircle className="w-4 h-4 text-sky-300 shrink-0" />
                <span className="whitespace-nowrap">مركز التحكم</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHub('sources')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                  activeHub === 'sources'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-300 shrink-0" />
                <span className="whitespace-nowrap">المصادر والجامعات</span>
                {sources.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                    {sources.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveHub('twitter')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                  activeHub === 'twitter'
                    ? 'bg-sky-500 text-slate-950 font-extrabold shadow-md shadow-sky-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Twitter className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="whitespace-nowrap">مركز تويتر (X)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHub('ai')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                  activeHub === 'ai'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Brain className="w-4 h-4 text-purple-300 shrink-0" />
                <span className="whitespace-nowrap">الذكاء والذاكرة</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHub('telegram')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                  activeHub === 'telegram'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-300 shrink-0" />
                <span className="whitespace-nowrap">تيليجرام والتوجيه</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHub('logs')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                  activeHub === 'logs'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Database className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="whitespace-nowrap">سجلات الأحداث</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHub('all')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer col-span-2 sm:col-span-2 lg:col-span-1 ${
                  activeHub === 'all'
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="whitespace-nowrap">عرض الكل</span>
              </button>
            </div>
          </div>

          {/* Contextual Sub-Navigation Bars */}
          {activeHub === 'control' && (
            <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-x-auto text-xs">
              <span className="text-[11px] text-slate-400 px-2 font-medium shrink-0">أقسام التحكم:</span>
              <button
                type="button"
                onClick={() => setSubControl('diagnostics')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  subControl === 'diagnostics' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🛠️ مركز الفحص والتشخيص والنشر التجريبي
              </button>
              <button
                type="button"
                onClick={() => setSubControl('credentials')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  subControl === 'credentials' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🔑 توكن البوت والاعتمادات الرسمية
              </button>
              <button
                type="button"
                onClick={() => setSubControl('github')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  subControl === 'github' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🐙 الربط بـ GitHub وبوت بزنس
              </button>
              <button
                type="button"
                onClick={() => setSubControl('guide')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  subControl === 'guide' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                📖 دليل النشر والاستضافة
              </button>
            </div>
          )}

          {activeHub === 'sources' && (
            <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-x-auto text-xs">
              <span className="text-[11px] text-slate-400 px-2 font-medium shrink-0">أقسام المصادر:</span>
              <button
                type="button"
                onClick={() => setSubSources('manager')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  subSources === 'manager' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                📚 إدارة مصادر الجامعات وقنوات النشر
              </button>
              <button
                type="button"
                onClick={() => setSubSources('intel')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  subSources === 'intel' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🧠 الربط المعرفي والمنافسة الأكاديمية
              </button>
            </div>
          )}

          {activeHub === 'ai' && (
            <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-x-auto text-xs">
              <span className="text-[11px] text-slate-400 px-2 font-medium shrink-0">أقسام الذكاء:</span>
              <button
                type="button"
                onClick={() => setSubAi('editor')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  subAi === 'editor' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🧠 النماذج والذاكرة الإدراكية (bot_memory.db)
              </button>
              <button
                type="button"
                onClick={() => setSubAi('sim')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  subAi === 'sim' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ✍️ مختبر الصياغة الأكاديمية الحية
              </button>
              <button
                type="button"
                onClick={() => setSubAi('chat')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  subAi === 'chat' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                💬 دردشة الذكاء الفورية
              </button>
            </div>
          )}

          {activeHub === 'telegram' && (
            <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-x-auto text-xs">
              <span className="text-[11px] text-slate-400 px-2 font-medium shrink-0">أقسام تيليجرام:</span>
              <button
                type="button"
                onClick={() => setSubTelegram('userbot')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  subTelegram === 'userbot' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡️ اليوزربوت وسحب القنوات (Telethon)
              </button>
              <button
                type="button"
                onClick={() => setSubTelegram('ad_replace')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  subTelegram === 'ad_replace' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🛡️ استبدال إعلانات المنافسين بالمشرف (@M_S_F_G)
              </button>
            </div>
          )}

          {activeHub === 'logs' && (
            <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-x-auto text-xs">
              <span className="text-[11px] text-slate-400 px-2 font-medium shrink-0">سجلات المراقبة:</span>
              <button
                type="button"
                onClick={() => setSubLogs('sqlite_logs')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  subLogs === 'sqlite_logs' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                🗄️ سجلات الأحداث الحية (SQLite Logs)
              </button>
              <button
                type="button"
                onClick={() => setSubLogs('audit')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  subLogs === 'audit' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                📋 سجل الرقابة وتدقيق المنشورات
              </button>
              <button
                type="button"
                onClick={() => setSubLogs('ideas')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  subLogs === 'ideas' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                💡 لوحة الأفكار والتغذية
              </button>
              <button
                type="button"
                onClick={() => setSubLogs('code')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  subLogs === 'code' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                💻 السكربتات وملفات الإعدادات
              </button>
            </div>
          )}
        </div>

        {/* ==================== HUB 1: CONTROL CENTER ==================== */}
        {(activeHub === 'all' || (activeHub === 'control' && subControl === 'diagnostics')) && (
          <section id="diagnostics-section" className="space-y-4">
            <DiagnosticsAndTestPublishPanel
              currentBotToken={config.botToken}
              onBotTokenUpdated={(tok) => {
                setConfig((prev) => ({ ...prev, botToken: tok }));
                handleSaveConfigDirectly({ ...config, botToken: tok });
              }}
              defaultChannel={config.targetChannels?.[0] || ''}
            />
          </section>
        )}

        {(activeHub === 'all' || (activeHub === 'control' && subControl === 'credentials')) && (
          <section id="credentials-section" className="space-y-4">
            <CredentialsPanel
              config={config}
              onChange={(updatedCfg) => {
                setConfig(updatedCfg);
                handleSaveConfigDirectly(updatedCfg);
              }}
              onTestBot={handleTestBot}
              onSaveBotToken={handleSaveBotToken}
              isTestingBot={isTestingBot}
              botInfo={botInfo}
            />
          </section>
        )}

        {(activeHub === 'all' || (activeHub === 'control' && subControl === 'github')) && (
          <section id="github-section" className="space-y-4">
            <GitHubHostingGuide
              adminUsername={config.adminUsername}
              botUsername="admiuin_bot"
            />
          </section>
        )}

        {(activeHub === 'all' || (activeHub === 'control' && subControl === 'guide')) && (
          <section id="guide-section" className="space-y-4">
            <DeploymentGuide />
          </section>
        )}

        {/* ==================== HUB 2: SOURCES & UNIVERSITIES ==================== */}
        {(activeHub === 'all' || (activeHub === 'sources' && subSources === 'manager')) && (
          <section id="sources-section" className="space-y-4">
            <SourcesManager
              sources={sources}
              onSaveSources={handleSaveSources}
              onRefresh={handleRefreshSources}
              isSaving={isSavingSources}
            />
          </section>
        )}

        {(activeHub === 'all' || (activeHub === 'sources' && subSources === 'intel')) && (
          <section id="knowledge-section" className="space-y-4">
            <KnowledgeIntelPanel />
          </section>
        )}

        {/* ==================== HUB 3: TWITTER X HUB ==================== */}
        {(activeHub === 'all' || activeHub === 'twitter') && (
          <section id="twitter-section" className="space-y-4">
            <TwitterIntegrationPanel />
          </section>
        )}

        {/* ==================== HUB 4: AI ENGINE & MEMORY ==================== */}
        {(activeHub === 'all' || (activeHub === 'ai' && subAi === 'editor')) && (
          <section id="ai-section" className="space-y-4">
            <AIEditorPanel
              aiConfig={config.ai}
              onChange={(updatedAI) => {
                const next = { ...config, ai: updatedAI };
                setConfig(next);
              }}
              onSave={async (updatedAI) => {
                const next = updatedAI ? { ...config, ai: updatedAI } : config;
                await handleSaveConfigDirectly(next);
              }}
              isSaving={isSavingConfig}
            />
          </section>
        )}

        {(activeHub === 'all' || (activeHub === 'ai' && subAi === 'sim')) && (
          <section id="sim-section" className="space-y-4">
            <EducationalSimulator
              aiConfig={config.ai}
              adConfig={config.adReplacement}
              adminUsername={config.adminUsername}
            />
          </section>
        )}

        {(activeHub === 'all' || (activeHub === 'ai' && subAi === 'chat')) && (
          <section id="chat-section" className="space-y-4">
            <ChatPanel aiConfig={config.ai} />
          </section>
        )}

        {/* ==================== HUB 5: TELEGRAM & FORWARDING ==================== */}
        {(activeHub === 'all' || (activeHub === 'telegram' && subTelegram === 'userbot')) && (
          <section id="userbot-section" className="space-y-4">
            <UserBotPanel
              config={config}
              onChange={setConfig}
              sources={sources}
            />
          </section>
        )}

        {(activeHub === 'all' || (activeHub === 'telegram' && subTelegram === 'ad_replace')) && (
          <section id="ad-section" className="space-y-4">
            <AdReplacementPanel
              adConfig={config.adReplacement}
              onChange={(updatedAd) => {
                const next = { ...config, adReplacement: updatedAd };
                setConfig(next);
                handleSaveConfigDirectly(next);
              }}
              adminUsername={config.adminUsername}
            />
          </section>
        )}

        {/* ==================== HUB 6: AUDIT & EVENT LOGS ==================== */}
        {(activeHub === 'all' || (activeHub === 'logs' && subLogs === 'sqlite_logs')) && (
          <section id="logs-section" className="space-y-4">
            <ActivityLogs logs={logs} onClearLogs={() => setLogs([])} />
          </section>
        )}

        {(activeHub === 'all' || (activeHub === 'logs' && subLogs === 'audit')) && (
          <section id="audit-section" className="space-y-4">
            <PostAuditLogPanel />
          </section>
        )}

        {(activeHub === 'all' || (activeHub === 'logs' && subLogs === 'ideas')) && (
          <section id="ideas-section" className="space-y-4">
            <InteractiveIdeaBoard />
          </section>
        )}

        {(activeHub === 'all' || (activeHub === 'logs' && subLogs === 'code')) && (
          <section id="code-section" className="space-y-4">
            <PythonScriptViewer
              config={config}
              rules={[]}
              sources={sources}
            />
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
