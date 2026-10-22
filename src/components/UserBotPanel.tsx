import React, { useState } from 'react';
import { BotConfig, SourceItem } from '../types/index.ts';
import {
  validateApiId,
  validateApiHash,
  validateStringSession,
  getBotVsUserBotComparison,
  generateTelethonUserBotCode,
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
} from 'lucide-react';

interface Props {
  config: BotConfig;
  onChange: (updated: BotConfig) => void;
  sources: SourceItem[];
}

export const UserBotPanel: React.FC<Props> = ({ config, onChange, sources }) => {
  const [showSecretHash, setShowSecretHash] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'why' | 'credentials' | 'session_helper' | 'code'>('why');

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

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCode}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تحميل سكريبت اليوزربوت (userbot_publisher.py)</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b border-slate-800">
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
