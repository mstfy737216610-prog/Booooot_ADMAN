import React, { useState } from 'react';
import { BotConfig, BotInfo } from '../types/index.ts';
import { validateBotToken, validateAdminId } from '../utils/rulesEngine.ts';
import {
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Send,
  Zap,
  Info,
  Sliders,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  config: BotConfig;
  onChange: (updated: BotConfig) => void;
  onTestBot: (token: string) => void;
  isTestingBot: boolean;
  botInfo: BotInfo | null;
}

export const CredentialsPanel: React.FC<Props> = ({
  config,
  onChange,
  onTestBot,
  isTestingBot,
  botInfo,
}) => {
  const [showToken, setShowToken] = useState(false);
  const [showTelethonSecret, setShowTelethonSecret] = useState(false);
  const [copiedHelper, setCopiedHelper] = useState<string | null>(null);

  const tokenValidation = validateBotToken(config.botToken);
  const adminValidation = validateAdminId(config.adminId);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHelper(id);
    setTimeout(() => setCopiedHelper(null), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-sky-400" />
            <span>بيانات الاعتمادات: الآدمن والتوكن الجديد</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            قم بإدخال توكن البوت ومعرف الآدمن المسؤول للتحكم الكامل بالتوجيه
          </p>
        </div>

        {/* Engine switcher tabs */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onChange({ ...config, preferredEngine: 'bot' })}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              config.preferredEngine === 'bot'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>توكن البوت الرسمي (Bot Token)</span>
          </button>

          <button
            onClick={() => onChange({ ...config, preferredEngine: 'userbot' })}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              config.preferredEngine === 'userbot' || config.preferredEngine === 'telethon'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>حساب اليوزربوت (MTProto Userbot)</span>
          </button>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="mt-5 space-y-6">
        {config.preferredEngine === 'bot' ? (
          /* BOT TOKEN & ADMIN SECTION */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Bot Token Input Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                  <span>توكن البوت الجديد (Bot Token)</span>
                  <span className="text-rose-400 font-bold">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {config.botToken && (
                    <span
                      className={`text-[11px] font-medium flex items-center gap-1 ${
                        tokenValidation.valid ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {tokenValidation.valid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>صيغة صحيحة</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>صيغة غير مكتملة</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={config.botToken}
                  onChange={(e) => onChange({ ...config, botToken: e.target.value.trim() })}
                  placeholder="مثال: 7123456789:AAFlkBx-9z..."
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono pr-24 pl-3"
                />

                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    aria-label={showToken ? 'إخفاء التوكن' : 'إظهار التوكن'}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Bot Test Action Button & Status */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400">
                  الحصول عليه من <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">@BotFather</a> عبر أمر <code className="text-sky-300">/newbot</code>
                </p>

                <button
                  type="button"
                  onClick={() => onTestBot(config.botToken)}
                  disabled={!config.botToken || isTestingBot}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 hover:text-white text-xs font-semibold rounded-lg border border-sky-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isTestingBot ? (
                    <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  <span>فحص التوكن الآن</span>
                </button>
              </div>

              {/* Verified Bot Info Banner if available */}
              {botInfo && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-300">{botInfo.first_name}</span>
                      <span className="text-slate-400 mx-1.5 font-mono">(@{botInfo.username})</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold rounded-md">
                    جاهز للعمل
                  </span>
                </div>
              )}
            </div>

            {/* 2. Admin ID & Username Input Card */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>معرّف الآدمن (Admin ID)</span>
                      <span className="text-rose-400 font-bold">*</span>
                    </label>
                    {config.adminId && (
                      <span
                        className={`text-[11px] font-medium flex items-center gap-1 ${
                          adminValidation.valid ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {adminValidation.valid ? 'معرف صالح ✅' : 'رقم غير صحيح'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={config.adminId}
                    onChange={(e) => onChange({ ...config, adminId: e.target.value.trim() })}
                    placeholder="7607633343"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <span>يوزر المشرف (Admin Username)</span>
                    </label>
                    <span className="text-[11px] text-sky-400 font-mono">
                      {config.adminUsername || '@M_S_F_G'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={config.adminUsername}
                    onChange={(e) => onChange({ ...config, adminUsername: e.target.value.trim() })}
                    placeholder="@M_S_F_G"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>احصل على معرفك من</span>
                  <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                    @userinfobot
                  </a>
                  <span>أو أرسل /id لبوتات الاستعلام</span>
                </p>

                <button
                  type="button"
                  onClick={() => handleCopy('@userinfobot', 'bot')}
                  className="text-[10px] text-slate-400 hover:text-slate-200 inline-flex items-center gap-1"
                >
                  {copiedHelper === 'bot' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>نسخ اسم البوت</span>
                </button>
              </div>

              {/* Admin Options */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={config.notifyAdminOnForward}
                    onChange={(e) => onChange({ ...config, notifyAdminOnForward: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                  />
                  <span>إرسال إشعار للآدمن عند كل توجيه</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={config.enableTelegramAdminCommands}
                    onChange={(e) => onChange({ ...config, enableTelegramAdminCommands: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-0"
                  />
                  <span>تفعيل أوامر التيليجرام (/status, /stats)</span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          /* TELETHON MTPROTO SECTION */
          <div className="space-y-4">
            <div className="p-3.5 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-indigo-200 flex items-start gap-3">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">وضع تليثون (حساب شخصي MTProto Userbot):</p>
                <p className="text-slate-300 leading-relaxed">
                  يستخدم هذا الوضع مكتبة Telethon (كما في الكود الأصلي للمطور Redian Marku). يتميز بإمكانية التوجيه من القنوات والمجموعات الخاصة والمغلقة التي تمنع إضافة البوتات الرسمية.
                  احصل على API_ID و API_HASH من <a href="https://my.telegram.org" target="_blank" rel="noreferrer" className="text-sky-400 underline">my.telegram.org</a>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  API ID (رقمي)
                </label>
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  API HASH
                </label>
                <div className="relative">
                  <input
                    type={showTelethonSecret ? 'text' : 'password'}
                    value={config.telethon.apiHash}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        telethon: { ...config.telethon, apiHash: e.target.value.trim() },
                      })
                    }
                    placeholder="32 حرفاً وهيكس"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTelethonSecret(!showTelethonSecret)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showTelethonSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رقم الهاتف (مع الرمز الدولي)
                </label>
                <input
                  type="text"
                  value={config.telethon.phoneNumber}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      telethon: { ...config.telethon, phoneNumber: e.target.value.trim() },
                    })
                  }
                  placeholder="+966501234567"
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Instructions Banner */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              جميع البيانات محفوظة بأمان محلياً في متصفحك، وجاهزة للتضمين الفوري في ملفات السكريبت والتشغيل.
            </span>
          </div>
          <span className="text-slate-500 font-mono text-[11px] hidden md:inline">
            AES-256 Client-Side Ready
          </span>
        </div>
      </div>
    </div>
  );
};
