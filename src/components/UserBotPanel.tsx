import React, { useState } from 'react';
import { BotConfig, SourceItem } from '../types/index.ts';
import {
  validateApiId,
  validateApiHash,
  validateStringSession,
  getBotVsUserBotComparison,
  generateTelethonUserBotCode,
  generatePyrogramFSMUserBotCode,
  generateStringSessionScript,
} from '../utils/userbotEngine.ts';
import {
  Smartphone,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Terminal,
  HelpCircle,
  ExternalLink,
  Zap,
  KeyRound,
  Eye,
  EyeOff,
  Layers,
  ArrowRightLeft,
  FileCode,
  Sparkles,
  Info,
  Radio,
  Lock,
} from 'lucide-react';

interface Props {
  config: BotConfig;
  onChange: (updated: BotConfig) => void;
  sources: SourceItem[];
}

export const UserBotPanel: React.FC<Props> = ({ config, onChange, sources }) => {
  const [showSecretHash, setShowSecretHash] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'pyrogram_fsm' | 'why' | 'credentials' | 'termux' | 'session_helper' | 'code'>('pyrogram_fsm');
  const [simPhone, setSimPhone] = useState('+965');
  const [simCode, setSimCode] = useState('');
  const [simPassword, setSimPassword] = useState('');
  const [simStep, setSimStep] = useState<'phone' | 'code' | '2fa' | 'success'>('phone');
  const [simLoading, setSimLoading] = useState(false);

  const comparison = getBotVsUserBotComparison();
  const apiIdValidation = validateApiId(config.telethon.apiId || '');
  const apiHashValidation = validateApiHash(config.telethon.apiHash || '');
  const stringSessionValidation = validateStringSession(config.telethon.stringSession || '');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadCode = () => {
    const code = generateTelethonUserBotCode(config, sources);
    const blob = new Blob([code], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'userbot_publisher.py';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-md">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">
              محرك اليوزربوت وسحب القنوات (UserBot Telethon / Pyrogram)
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-lg">
              جلسة مستخدم حقيقية
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            حل مشكلة قراءة رسائل القنوات بدون الحاجة لرتبة مشرف، وسحب الوسائط والنصوص وإعادة نشرها آلياً.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const code = generatePyrogramFSMUserBotCode(config, sources);
              const blob = new Blob([code], { type: 'text/x-python;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'pyrogram_publisher_bot.py';
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>تحميل محرك Pyrogram + FSM الحصري</span>
          </button>
          <button
            onClick={handleDownloadCode}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Telethon</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b border-slate-800">
        <button
          onClick={() => setActiveSection('pyrogram_fsm')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 ${
            activeSection === 'pyrogram_fsm'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'bg-slate-950/70 text-emerald-400 hover:text-white border border-emerald-500/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          <span className="font-extrabold">✨ نظام Pyrogram + FSM (تسجيل الدخول من الشات)</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-emerald-500/30 text-emerald-200 rounded font-mono">جديد</span>
        </button>

        <button
          onClick={() => setActiveSection('termux')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 ${
            activeSection === 'termux'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>تشغيل Termux (أندرويد) 📱</span>
        </button>

        <button
          onClick={() => setActiveSection('why')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 ${
            activeSection === 'why'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>لماذا لا يقرأ البوت العادي؟ ومقارنة الربط</span>
        </button>

        <button
          onClick={() => setActiveSection('credentials')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 ${
            activeSection === 'credentials'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>بيانات جلسة اليوزربوت (API ID & Hash)</span>
        </button>

        <button
          onClick={() => setActiveSection('session_helper')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 ${
            activeSection === 'session_helper'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>توليد كود الجلسة (StringSession) في 10 ثوانٍ</span>
        </button>

        <button
          onClick={() => setActiveSection('code')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 ${
            activeSection === 'code'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>كود البايثون الجاهز (Telethon + AI)</span>
        </button>
      </div>

      {/* 0. PYROGRAM FSM IN-TELEGRAM AUTH & SCRAPING ENGINE */}
      {activeSection === 'pyrogram_fsm' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Hero Header */}
          <div className="p-5 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/40 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-2xl shrink-0 border border-emerald-500/30">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-white">
                      محرك Pyrogram V2 الاحترافي بنظام الحالات (In-Telegram FSM Auth & Scraper)
                    </h3>
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-full">
                      تحكم كامل 100% من داخل البوت
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                    الحل الجذري والنهائي: تسجيل دخول حقيقي بالهاتف والكود الرسمي وكلمة مرور 2FA من داخل شات تيليجرام نفسه، مع يوزربوت يسحب المنشورات والميديا الكاملة (صور، فيديو، مستندات PDF، ألبومات) فوراً!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const code = generatePyrogramFSMUserBotCode(config, sources);
                    const blob = new Blob([code], { type: 'text/x-python;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'pyrogram_publisher_bot.py';
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل pyrogram_publisher_bot.py</span>
                </button>
              </div>
            </div>

            {/* Key Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تسجيل دخول رسمي مباشر</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  كود التحقق يرسله سيرفر تيليجرام الرسمي لتطبيقك، وتدخل الكود و 2FA بالشات مباشرة.
                </p>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
                  <Layers className="w-4 h-4" />
                  <span>سحب الميديا بنقاوة كاملة</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  سحب فوري لملفات PDF، الفيديوهات، الصور الأصلية، والألبومات دون أي تشويه أو ضغط.
                </p>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <Zap className="w-4 h-4" />
                  <span>حل مشكلة URL Timeout</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  اعتماد DeepSeek-V4-Flash السريع جداً مع مهلة آمنة ومنسق محلي فوري لمنع أي بطء.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Simulation of In-Telegram FSM Auth Flow */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  محاكاة تفاعلية: تجربة تسجيل الدخول الفوري (FSM Login Simulation)
                </h4>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Pyrogram In-Memory Client
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Chat Simulation */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-300">💬 محادثة المشرف مع البوت في تيليجرام</span>
                  <span className="text-[10px]">الآدمن: @{config.adminUsername}</span>
                </div>

                {/* Step 1: User starts */}
                <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto p-1">
                  <div className="self-end bg-sky-600 text-white p-2.5 rounded-2xl rounded-tr-none max-w-[80%]">
                    /start
                  </div>
                  <div className="self-start bg-slate-800 border border-slate-700 text-slate-200 p-3 rounded-2xl rounded-tl-none max-w-[90%] space-y-2">
                    <p className="font-bold text-white">👋 مرحباً بك يا مشرفنا @{config.adminUsername}!</p>
                    <p className="text-[11px] text-slate-300">اختر من اللوحة التفاعلية أدناه لبدء الربط أو إدارة القنوات:</p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button className="px-2 py-1.5 bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-bold text-[11px] text-center">
                        🔐 تسجيل الدخول (FSM Login)
                      </button>
                      <button className="px-2 py-1.5 bg-slate-700/60 text-slate-300 border border-slate-600/30 rounded-lg text-[11px] text-center">
                        📊 الإحصائيات
                      </button>
                    </div>
                  </div>

                  {simStep !== 'phone' && (
                    <>
                      <div className="self-end bg-sky-600 text-white p-2 rounded-xl rounded-tr-none">
                        {simPhone}
                      </div>
                      <div className="self-start bg-slate-800 border border-emerald-500/30 text-slate-200 p-2.5 rounded-2xl rounded-tl-none max-w-[90%] space-y-1">
                        <p className="font-bold text-emerald-300">📩 تم إرسال كود التحقق الرسمي من تيليجرام!</p>
                        <p className="text-[11px] text-slate-300">
                          افتح تطبيق تيليجرام، ستجد رسالة رسمية من Telegram تحتوي كود الدخول. أرسله هنا:
                        </p>
                      </div>
                    </>
                  )}

                  {(simStep === '2fa' || simStep === 'success') && (
                    <>
                      <div className="self-end bg-sky-600 text-white p-2 rounded-xl rounded-tr-none">
                        {simCode || '84920'}
                      </div>
                      <div className="self-start bg-slate-800 border border-amber-500/30 text-slate-200 p-2.5 rounded-2xl rounded-tl-none max-w-[90%] space-y-1">
                        <p className="font-bold text-amber-300">🔐 الحساب محمي بالتحقق بخطوتين (2FA)</p>
                        <p className="text-[11px] text-slate-300">أدخل كلمة المرور السحابية لحسابك لإكمال الجلسة:</p>
                      </div>
                    </>
                  )}

                  {simStep === 'success' && (
                    <>
                      <div className="self-end bg-sky-600 text-white p-2 rounded-xl rounded-tr-none">
                        ••••••••
                      </div>
                      <div className="self-start bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 p-3 rounded-2xl rounded-tl-none max-w-[90%] space-y-1.5">
                        <p className="font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>🎉 تم تفعيل اليوزربوت وجلسة النشر بنجاح!</span>
                        </p>
                        <p className="text-[11px] text-emerald-300 leading-relaxed">
                          تم توليد وحفظ كود StringSession تلقائياً. المحرك يراقب الآن القنوات المصدرية وينشر الوسائط والنصوص الذكية في قنواتك فوراً!
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column: Interactive Test Controls */}
              <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3.5 flex flex-col justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 pb-2 border-b border-slate-800">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>جرّب دورة الـ FSM الآن:</span>
                  </h5>

                  {simStep === 'phone' && (
                    <div className="space-y-3 pt-3">
                      <label className="text-[11px] text-slate-300 block font-semibold">
                        1. أدخل رقم هاتفك الدولي:
                      </label>
                      <input
                        type="text"
                        value={simPhone}
                        onChange={(e) => setSimPhone(e.target.value)}
                        placeholder="+965xxxxxxx"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                        dir="ltr"
                      />
                      <button
                        onClick={() => {
                          setSimLoading(true);
                          setTimeout(() => {
                            setSimLoading(false);
                            setSimStep('code');
                          }, 900);
                        }}
                        disabled={simLoading || !simPhone || simPhone.length < 8}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {simLoading ? <span>جاري الاتصال بسيرفر تيليجرام...</span> : <span>إرسال طلب كود التحقق 📲</span>}
                      </button>
                    </div>
                  )}

                  {simStep === 'code' && (
                    <div className="space-y-3 pt-3">
                      <label className="text-[11px] text-slate-300 block font-semibold">
                        2. أدخل كود التحقق من تيليجرام:
                      </label>
                      <input
                        type="text"
                        value={simCode}
                        onChange={(e) => setSimCode(e.target.value)}
                        placeholder="12345"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                        dir="ltr"
                      />
                      <button
                        onClick={() => {
                          setSimLoading(true);
                          setTimeout(() => {
                            setSimLoading(false);
                            setSimStep('2fa');
                          }, 800);
                        }}
                        disabled={simLoading || !simCode}
                        className="w-full py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        {simLoading ? <span>جاري التحقق من الكود...</span> : <span>تأكيد الكود (Sign In) 🔑</span>}
                      </button>
                    </div>
                  )}

                  {simStep === '2fa' && (
                    <div className="space-y-3 pt-3">
                      <label className="text-[11px] text-slate-300 block font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>3. أدخل كلمة مرور التحقق بخطوتين (2FA Password):</span>
                      </label>
                      <input
                        type="password"
                        value={simPassword}
                        onChange={(e) => setSimPassword(e.target.value)}
                        placeholder="كلمة المرور السحابية..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          setSimLoading(true);
                          setTimeout(() => {
                            setSimLoading(false);
                            setSimStep('success');
                          }, 900);
                        }}
                        disabled={simLoading || !simPassword}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        {simLoading ? <span>جاري فحص 2FA وتوليد الجلسة...</span> : <span>إكمال الربط وتوليد الجلسة ✨</span>}
                      </button>
                    </div>
                  )}

                  {simStep === 'success' && (
                    <div className="space-y-3 pt-3 text-center">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold">
                        تمت محاكاة تسجيل الدخول بنجاح! هذا هو بالضبط ما يحصل في شات التيليجرام الحقيقي عند تشغيل `python3 pyrogram_publisher_bot.py`.
                      </div>
                      <button
                        onClick={() => {
                          setSimStep('phone');
                          setSimCode('');
                          setSimPassword('');
                        }}
                        className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        🔄 إعادة التجربة من جديد
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Info */}
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  💡 الكود الحقيقي يستخدم <code className="text-emerald-300">Client(in_memory=True)</code> لتوليد جلسة مشفرة بدون حفظ أي ملفات حساسة على القرص.
                </div>
              </div>
            </div>
          </div>

          {/* Quick Terminal Run Command */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>أمر التشغيل المباشر لمحرك Pyrogram على سيرفرك أو جهازك:</span>
              </label>
              <button
                onClick={() => handleCopy('pip install pyrogram tgcrypto aiohttp requests python-dotenv && python3 pyrogram_publisher_bot.py', 'pyrogram_cmd')}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {copiedId === 'pyrogram_cmd' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'pyrogram_cmd' ? 'تم النسخ!' : 'نسخ الأمر'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto text-left" dir="ltr">
              <code>pip install pyrogram tgcrypto aiohttp requests python-dotenv && python3 pyrogram_publisher_bot.py</code>
            </pre>
          </div>
        </div>
      )}

      {/* 0. TERMUX SECTION: How to run on Android Termux */}
      {activeSection === 'termux' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Main Termux Quick Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-2xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-300 shrink-0 mt-0.5">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-emerald-200 flex items-center gap-2">
                  <span>دليل تشغيل اليوزربوت على هاتفك الأندرويد بواسطة تطبيق Termux</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 rounded-md">
                    24/7 Background
                  </span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  تطبيق <strong>Termux</strong> يحول هاتفك الأندرويد إلى سيرفر لينكس حقيقي! يمكنك تشغيل سكريبت اليوزربوت <code className="text-emerald-300 font-mono">userbot_publisher.py</code> فيه، وسيقوم بقراءة قنوات المصدر بالخلفية وإعادة صياغتها عبر الذكاء الاصطناعي ونشرها بقناتك تلقائياً دون انقطاع.
                </p>
              </div>
            </div>
          </div>

          {/* Quick 1-Click Master Command */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>أمر التثبيت والتجهيز الشامل بنقرة واحدة (انسخه والصقه في ترميكس):</span>
              </label>
              <button
                onClick={() =>
                  handleCopy(
                    'pkg update -y && pkg install -y python git && pip install telethon requests && termux-wake-lock',
                    'termux_master'
                  )
                }
                className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {copiedId === 'termux_master' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'termux_master' ? 'تم النسخ!' : 'نسخ الأمر الشامل'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto text-left" dir="ltr">
              <code>pkg update -y && pkg install -y python git && pip install telethon requests && termux-wake-lock</code>
            </pre>
            <span className="text-[11px] text-slate-400 block">
              💡 هذا الأمر يحدّث ترميكس، يثبت بايثون ومكتبتي Telethon و Requests، ويفعّل ميزة <code className="text-sky-300">termux-wake-lock</code> لمنع نظام أندرويد من إيقاف السكريبت عند إطفاء الشاشة.
            </span>
          </div>

          {/* Step by Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Install Termux */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-sky-300 font-bold text-xs">
                <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-xs">1</span>
                <span>تثبيت تطبيق Termux (تنبيه مهم)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                لا تقم بتثبيت ترميكس من متجر جوجل بلاي لأن نسخته متوقفة منذ سنوات! حمله من المتجر المفتوح <strong className="text-white">F-Droid</strong> أو من صفحتهم على GitHub:
              </p>
              <a
                href="https://f-droid.org/en/packages/com.termux/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline font-mono"
              >
                <span>تحميل Termux APK من F-Droid</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Step 2: Clone repository or download script */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">2</span>
                  <span>تنزيل مستودع البوت الخاص بك في ترميكس</span>
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      'git clone https://github.com/mstfy737216610-prog/Booooot_ADMAN.git && cd Booooot_ADMAN',
                      'termux_clone'
                    )
                  }
                  className="text-[11px] text-indigo-400 hover:text-white flex items-center gap-1"
                >
                  {copiedId === 'termux_clone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'termux_clone' ? 'تم!' : 'نسخ'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sky-300 font-mono text-[11px] overflow-x-auto text-left" dir="ltr">
                <code>git clone https://github.com/mstfy737216610-prog/Booooot_ADMAN.git && cd Booooot_ADMAN</code>
              </pre>
              <span className="text-[11px] text-slate-400 block">
                سيتم تنزيل جميع الملفات والدخول لمجلد البوت مباشرة.
              </span>
            </div>

            {/* Step 3: Run the UserBot */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs">3</span>
                  <span>أمر تشغيل سكريبت اليوزربوت</span>
                </div>
                <button
                  onClick={() => handleCopy('python userbot_publisher.py', 'termux_run')}
                  className="text-[11px] text-purple-400 hover:text-white flex items-center gap-1"
                >
                  {copiedId === 'termux_run' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'termux_run' ? 'تم!' : 'نسخ'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-emerald-300 font-mono text-[11px] overflow-x-auto text-left" dir="ltr">
                <code>python userbot_publisher.py</code>
              </pre>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                عند أول تشغيل، سيطلب منك إدخال رقم هاتفك بالصيغة الدولية (مثل: <code className="text-white">+966...</code>) ثم كود التحقق الذي يصلك على تطبيق تيليجرام الرسمي. بعد تسجيل الدخول سيعمل البوت للأبد!
              </p>
            </div>

            {/* Step 4: Run in background 24/7 */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">4</span>
                  <span>التشغيل الدائم بالخلفية بدون إغلاق (nohup)</span>
                </div>
                <button
                  onClick={() =>
                    handleCopy('nohup python userbot_publisher.py > bot.log 2>&1 &', 'termux_nohup')
                  }
                  className="text-[11px] text-emerald-400 hover:text-white flex items-center gap-1"
                >
                  {copiedId === 'termux_nohup' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'termux_nohup' ? 'تم!' : 'نسخ'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-amber-300 font-mono text-[11px] overflow-x-auto text-left" dir="ltr">
                <code>nohup python userbot_publisher.py &gt; bot.log 2&gt;&amp;1 &amp;</code>
              </pre>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                هذا الأمر يجعل السكريبت يستمر بالعمل حتى لو أغلقت نافذة تطبيق Termux. لمتابعة سجل الرسائل اكتب: <code className="text-sky-300 font-mono">tail -f bot.log</code>
              </p>
            </div>
          </div>

          {/* Battery optimization tip */}
          <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <span>⚠️ خطوة ضرورية في إعدادات هاتف أندرويد:</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              ادخل على إعدادات هاتفك ➔ التطبيقات ➔ <strong>Termux</strong> ➔ البطارية ➔ اختر <strong>&quot;غير مقيّد (Unrestricted)&quot;</strong> أو عطل ميزة توفير الطاقة للتطبيق، حتى لا يقوم نظام أندرويد بإغلاقه أثناء قفل الشاشة.
            </p>
          </div>
        </div>
      )}

      {/* 1. WHY SECTION: Explaining why Bot API fails and why UserBot works */}
      {activeSection === 'why' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Main Answer Highlight Card */}
          <div className="p-4 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900 border border-amber-500/30 rounded-2xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl text-amber-300 shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-200">
                  الإجابة المباشرة على سؤالك: لماذا لا يستطيع البوت العادي قراءة الرسائل من القنوات؟
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  بوتات تيليجرام العادية (Bot Token من BotFather) مقيدة بـ <strong>Privacy Mode</strong> في خوادم تيليجرام، ولا تسمح بقراءة أي قناة إلا إذا كان البوت <strong>مشرفاً (Admin)</strong> بداخلها ولديه صلاحية صريحة. بينما <strong>اليوزربوت (UserBot)</strong> يعمل بحساب مستخدم حقيقي عبر بروتوكول MTProto، فيستطيع قراءة وسحب أي قناة مشتركة أو عامة وسحب صورها وفيديوهاتها فوراً وبدون أي إذن!
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Cards: Bot API vs UserBot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Standard Bot Limitations */}
            <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>البوت الرسمي (Bot Token عبر BotFather)</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {comparison.botApiReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">✕</span>
                    <span className="leading-relaxed">{reason}</span>
                  </li>
                ))}
              </ul>
              <div className="p-2.5 bg-slate-950/60 rounded-lg text-[11px] text-slate-400 border border-slate-800">
                <strong>النتيجة:</strong> لن يقرأ قنوات المصدر الخاصة بالجامعات إلا إذا عيّنك أصحابها مشرفاً فيها (وهو أمر مستحيل).
              </div>
            </div>

            {/* Right: UserBot Advantages */}
            <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>اليوزربوت (UserBot عبر Telethon أو Pyrogram)</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {comparison.userBotAdvantages.map((adv, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span className="leading-relaxed">{adv}</span>
                  </li>
                ))}
              </ul>
              <div className="p-2.5 bg-slate-950/60 rounded-lg text-[11px] text-emerald-300/90 border border-emerald-800/40">
                <strong>النتيجة:</strong> يقرأ ويسحب أي قناة فوراً دون أدمن، يرسل النص إلى الـ API، ويعيد النشر بالوسائط فورياً.
              </div>
            </div>
          </div>

          {/* Explanation of Telegram Widgets / VirtualSMS */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5">
            <h4 className="text-xs font-bold text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>ماذا عن الربط المذكور (Telegram Widgets مثل virtualsms.de)؟</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {comparison.widgetExplanation}
            </p>
            <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-lg text-xs text-slate-300">
              💡 <strong>الخلاصة:</strong> لتشغيل البوت بحيث يسحب المنشورات ويعالجها بـ API الذكاء الاصطناعي (DeepSeek-V4.1-Flash) وينشرها في قنواتك، الحل المثالي هو <strong>اليوزربوت (Telethon)</strong> عبر <strong>StringSession</strong> المدمجة في هذا النظام.
            </div>
          </div>
        </div>
      )}

      {/* 2. CREDENTIALS SECTION: API ID, API HASH, StringSession */}
      {activeSection === 'credentials' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* API ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-200">
                  Telegram API ID (من my.telegram.org)
                </label>
                {config.telethon.apiId && (
                  <span className={`text-[11px] ${apiIdValidation.valid ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {apiIdValidation.valid ? '✓ صحيح' : apiIdValidation.error}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={config.telethon.apiId}
                onChange={(e) =>
                  onChange({
                    ...config,
                    telethon: { ...config.telethon, apiId: e.target.value.trim() },
                  })
                }
                placeholder="مثال: 20123456"
                dir="ltr"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
              />
            </div>

            {/* API HASH */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-200">
                  Telegram API HASH (32 خانة)
                </label>
                {config.telethon.apiHash && (
                  <span className={`text-[11px] ${apiHashValidation.valid ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {apiHashValidation.valid ? '✓ صحيح' : apiHashValidation.error}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showSecretHash ? 'text' : 'password'}
                  value={config.telethon.apiHash}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      telethon: { ...config.telethon, apiHash: e.target.value.trim() },
                    })
                  }
                  placeholder="e.g. 0123456789abcdef0123456789abcdef"
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretHash(!showSecretHash)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showSecretHash ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* StringSession input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>كود الجلسة المشفرة (StringSession) - اختياري للسحابة:</span>
              </label>
              {config.telethon.stringSession && (
                <span className={`text-[11px] ${stringSessionValidation.valid ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {stringSessionValidation.valid ? '✓ جلسة صالحة' : stringSessionValidation.error}
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={config.telethon.stringSession || ''}
              onChange={(e) =>
                onChange({
                  ...config,
                  telethon: { ...config.telethon, stringSession: e.target.value.trim() },
                })
              }
              placeholder="1BVtsOHMBux4k... (StringSession code for Cloud/Serverless)"
              dir="ltr"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono"
            />
            <p className="text-[11px] text-slate-400">
              إذا لم تكن تمتلك كود الجلسة بعد، استخدم تبويب <strong>&quot;توليد كود الجلسة في 10 ثوانٍ&quot;</strong> أعلاه لتوليده بسهولة من رقم هاتفك.
            </p>
          </div>

          {/* Target Channels */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>القنوات المستهدفة للنشر (Target Channels):</span>
            </label>
            <input
              type="text"
              value={config.targetChannels.join(' ')}
              onChange={(e) => {
                const parts = e.target.value.split(/[\s,]+/).filter(Boolean);
                onChange({ ...config, targetChannels: parts });
              }}
              placeholder="@MyUniversityChannel @SecondChannel"
              dir="ltr"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
            />
            <span className="text-[10px] text-slate-400 block">
              افصل بين القنوات بمسافة. يجب أن يكون البوت أو حسابك عضواً وله صلاحية النشر في هذه القنوات.
            </span>
          </div>
        </div>
      )}

      {/* 3. SESSION HELPER SECTION: How to generate StringSession */}
      {activeSection === 'session_helper' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 bg-purple-950/30 border border-purple-800/40 rounded-xl space-y-2 text-xs text-slate-300 leading-relaxed">
            <h4 className="font-bold text-purple-200 text-sm">كيف تستخرج كود StringSession في دقيقة واحدة؟</h4>
            <ol className="list-decimal list-inside space-y-1.5 pr-1">
              <li>افتح موقع <a href="https://my.telegram.org" target="_blank" rel="noreferrer" className="text-sky-400 underline font-mono">my.telegram.org</a> وسجل دخول برقم هاتفك.</li>
              <li>اضغط على <strong>API development tools</strong> وأنشئ تطبيقاً للحصول على <strong>API_ID</strong> و <strong>API_HASH</strong>.</li>
              <li>شغل السكريبت البسيط أدناه في جهازك أو في تيرمينال بايثون:</li>
            </ol>
          </div>

          <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
              <span className="text-slate-300 font-semibold">generate_session.py</span>
              <button
                onClick={() => handleCopy(generateStringSessionScript(), 'session_script')}
                className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-white"
              >
                {copiedId === 'session_script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'session_script' ? 'تم النسخ!' : 'نسخ الكود'}</span>
              </button>
            </div>
            <pre className="p-4 text-slate-300 overflow-x-auto max-h-56 leading-relaxed text-left" dir="ltr">
              <code>{generateStringSessionScript()}</code>
            </pre>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              بمجرد تشغيل السكريبت ستصلك رسالة كود على تطبيق تيليجرام الرسمي، أدخل الكود وانسخ النص المشفر الناتج وضعه في خانة <strong>StringSession</strong>.
            </span>
          </div>
        </div>
      )}

      {/* 4. CODE SECTION: Full Telethon UserBot Script */}
      {activeSection === 'code' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              كود بايثون متكامل (userbot_publisher.py) مربوط مع API الذكاء الاصطناعي والقنوات:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(generateTelethonUserBotCode(config, sources), 'userbot_code')}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700"
              >
                {copiedId === 'userbot_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'userbot_code' ? 'تم النسخ!' : 'نسخ الكود'}</span>
              </button>
              <button
                onClick={handleDownloadCode}
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل .py</span>
              </button>
            </div>
          </div>

          <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
            <pre className="p-4 text-slate-300 overflow-x-auto max-h-96 leading-relaxed text-left" dir="ltr">
              <code>{generateTelethonUserBotCode(config, sources)}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
