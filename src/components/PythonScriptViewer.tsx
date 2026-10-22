import React, { useState } from 'react';
import { BotConfig, ForwardRule, SourceItem } from '../types/index.ts';
import {
  generateTelethonUserBotCode,
  generatePyrogramFSMUserBotCode,
  generateStringSessionScript,
} from '../utils/userbotEngine.ts';
import {
  Code,
  Download,
  Copy,
  Check,
  Terminal,
  FileCode,
  Smartphone,
  Brain,
  Layers,
  Database,
  Bot,
  Sparkles,
} from 'lucide-react';

interface Props {
  config: BotConfig;
  rules: ForwardRule[];
  sources: SourceItem[];
}

export const PythonScriptViewer: React.FC<Props> = ({ config, sources }) => {
  const [activeTab, setActiveTab] = useState<'pyrogram' | 'userbot' | 'main' | 'session_gen' | 'sources' | 'state' | 'env' | 'requirements'>('pyrogram');
  const [copied, setCopied] = useState(false);

  const pyrogramScript = generatePyrogramFSMUserBotCode(config, sources);
  const userbotScript = generateTelethonUserBotCode(config, sources);
  const sessionGenScript = generateStringSessionScript();

  const mainPyScript = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
🤖 بوت النشر التعليمي متعدد القنوات (Standalone Multi-Channel Publisher)
================================================================================
الآدمن: @${config.adminUsername} (ID: ${config.adminId})
توكن البوت: ${config.botToken}
مزود الذكاء الاصطناعي: ${config.ai.primaryModel} (${config.ai.apiBase})
================================================================================
"""
# يرجى تشغيل السكريبت: python3 main.py
# مدمج به خادم Health-Check لمنع الإيقاف التلقائي في الاستضافات السحابية المجانية.
`;

  const sourcesJson = JSON.stringify(
    {
      _info: "Telegram University Educational AutoForwarder Watchlist",
      version: "2.1.0",
      lastUpdated: new Date().toISOString(),
      target_channels: config.targetChannels,
      sources: sources,
    },
    null,
    2
  );

  const stateJson = JSON.stringify(
    {
      bot_status: "active",
      admin_id: config.adminId,
      admin_user: config.adminUsername,
      processed_count: 0,
      forwarded_count: 0,
      ad_replaced_count: 0,
      last_run_timestamp: new Date().toISOString(),
      last_processed_ids: sources.reduce((acc, s) => ({ ...acc, [s.target]: s.lastPostId || "0" }), {})
    },
    null,
    2
  );

  const envContent = `# Telegram Educational Auto-Publisher Pro
BOT_TOKEN="${config.botToken}"
ADMIN_ID="${config.adminId}"
ADMIN_USERNAME="${config.adminUsername}"

# Telegram UserBot (Telethon)
TELEGRAM_API_ID="${config.telethon.apiId}"
TELEGRAM_API_HASH="${config.telethon.apiHash}"
TELEGRAM_PHONE="${config.telethon.phoneNumber}"
STRING_SESSION="${config.telethon.stringSession || ''}"

# AI Provider Credentials
AI_BASE_URL="${config.ai.apiBase}"
AI_API_KEY="${config.ai.apiKey}"
PRIMARY_MODEL="${config.ai.primaryModel}"
FALLBACK_MODEL="${config.ai.fallbackModel}"

# Destination Channels
TARGET_CHANNELS="${config.targetChannels.join(',')}"
`;

  const requirementsContent = `# Requirements for Telegram Auto-Publisher Bot & UserBot
pyrogram>=2.0.106
tgcrypto>=1.2.5
aiohttp>=3.9.0
requests>=2.31.0
python-dotenv>=1.0.0
feedparser>=6.0.10
telethon>=1.36.0
`;

  const getActiveCode = () => {
    switch (activeTab) {
      case 'pyrogram':
        return {
          filename: 'pyrogram_publisher_bot.py',
          code: pyrogramScript,
          lang: 'python',
        };
      case 'userbot':
        return {
          filename: 'userbot_publisher.py',
          code: userbotScript,
          lang: 'python',
        };
      case 'session_gen':
        return {
          filename: 'generate_session.py',
          code: sessionGenScript,
          lang: 'python',
        };
      case 'main':
        return {
          filename: 'main.py',
          code: mainPyScript,
          lang: 'python',
        };
      case 'sources':
        return {
          filename: 'sources.json',
          code: sourcesJson,
          lang: 'json',
        };
      case 'state':
        return {
          filename: 'state.json',
          code: stateJson,
          lang: 'json',
        };
      case 'env':
        return {
          filename: '.env',
          code: envContent,
          lang: 'shell',
        };
      case 'requirements':
        return {
          filename: 'requirements.txt',
          code: requirementsContent,
          lang: 'text',
        };
    }
  };

  const current = getActiveCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([current.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = current.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-emerald-400" />
            <span>محرك الأكواد والتكوين السحابي (Python Engine & Config)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            أكواد برمجية جاهزة للتشغيل المباشر على السيرفر، VPS، أو الاستضافات السحابية المجانية
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تحميل {current.filename}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('pyrogram')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all shrink-0 ${
            activeTab === 'pyrogram'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">✨ محرك Pyrogram + FSM (الأحدث)</span>
        </button>

        <button
          onClick={() => setActiveTab('userbot')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all shrink-0 ${
            activeTab === 'userbot'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4 text-purple-400" />
          <span>اليوزربوت (userbot_publisher.py)</span>
        </button>

        <button
          onClick={() => setActiveTab('session_gen')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all shrink-0 ${
            activeTab === 'session_gen'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>توليد الجلسة (generate_session.py)</span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all shrink-0 ${
            activeTab === 'sources'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-sky-400" />
          <span>قائمة المصادر (sources.json)</span>
        </button>

        <button
          onClick={() => setActiveTab('state')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all shrink-0 ${
            activeTab === 'state'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-amber-400" />
          <span>حالة البوت (state.json)</span>
        </button>

        <button
          onClick={() => setActiveTab('env')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all shrink-0 ${
            activeTab === 'env'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>المتغيرات (.env)</span>
        </button>

        <button
          onClick={() => setActiveTab('requirements')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all shrink-0 ${
            activeTab === 'requirements'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>المكتبات (requirements.txt)</span>
        </button>
      </div>

      {/* Code Viewer */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/70"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/70"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/70"></div>
            <span className="text-slate-300 font-semibold ml-2 text-xs">{current.filename}</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {current.code.split('\n').length} سطراً
          </span>
        </div>

        <pre className="p-4 text-slate-300 overflow-x-auto max-h-[380px] leading-relaxed text-left selection:bg-sky-500/30 selection:text-white" dir="ltr">
          <code>{current.code}</code>
        </pre>
      </div>
    </div>
  );
};
