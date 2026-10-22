import React, { useState } from 'react';
import {
  GitBranch,
  Download,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Server,
  Cloud,
  Layers,
  ArrowRight,
  ShieldCheck,
  Play,
  Terminal,
} from 'lucide-react';

interface Props {
  adminUsername: string;
  botUsername: string;
}

export const GitHubHostingGuide: React.FC<Props> = ({ adminUsername, botUsername }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const gitCommands = `# 1. تهيئة المستودع وإضافة الملفات
git init
git add .
git commit -m "Initial commit for Telegram Educational Bot"

# 2. ربط المستودع بجيت هب (استبدل YOUR_USERNAME باسم حسابك)
git remote add origin https://github.com/YOUR_USERNAME/telegram-edu-bot.git
git branch -M main
git push -u origin main`;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">
              دليل الربط السحابي مع GitHub وتطبيقات الاستضافة (Bots.Business & Free Hosting)
            </h2>
            <span className="px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-md font-mono">
              Cloud Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ارفع ملفات البوت إلى مستودع GitHub واربطها بتطبيق بوت بزنس أو أي منصة استضافة مجانية ليعمل 24 ساعة بدون انقطاع
          </p>
        </div>

        {/* Download Zip Package button */}
        <a
          href="/Telegram_Educational_Bot_GitHub_Package.zip"
          download="Telegram_Educational_Bot_GitHub_Package.zip"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>تنزيل حزمة GitHub الجاهزة (ZIP)</span>
        </a>
      </div>

      {/* 3 Step Interactive Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5 relative">
          <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h3 className="text-sm font-bold text-white">إنشاء مستودع ورفع الملفات</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            أنشئ مستودعاً جديداً (New Repository) على <a href="https://github.com" target="_blank" rel="noreferrer" className="text-purple-400 underline">GitHub</a> باسم <code className="text-sky-300 font-mono">telegram-edu-bot</code> وارفع فيه ملفات الحزمة المفكوكة (<code className="text-sky-300">main.py</code>, <code className="text-sky-300">Procfile</code>, <code className="text-sky-300">requirements.txt</code>, <code className="text-sky-300">sources.json</code>).
          </p>
        </div>

        {/* Step 2 */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5 relative">
          <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h3 className="text-sm font-bold text-white">الربط بتطبيق بوت بزنس (Bots.Business)</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            افتح تطبيق <strong className="text-white">Bots.Business</strong> في هاتفك أو موقعهم الإلكتروني، اختر <strong>&quot;Import from Git&quot;</strong> والصق رابط مستودع GitHub الخاص بك. سيقوم التطبيق بسحب الملفات تلقائياً.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5 relative">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h3 className="text-sm font-bold text-white">التشغيل السحابي 24/7</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            اضغط <strong>Deploy / Run</strong>. سيتصل البوت تلقائياً بتيليجرام ويبدأ بمراقبة المصادر وتعديل المنشورات واستبدال الإعلانات، مع خادم Keep-Alive مدمج لمنع إيقاف السيرفر.
          </p>
        </div>
      </div>

      {/* Details Tabs: Bots.Business vs Other Free Hosting Apps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        {/* Left: Bots.Business App instructions */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs sm:text-sm">
            <Smartphone className="w-4 h-4" />
            <span>حل خطأ بوت بزنس (ملف bot.json غير موجود) والربط:</span>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-200 leading-relaxed">
            <strong>⚠️ سبب رسالة Bots.Business:</strong> تطبيق بوت بزنس يبحث عن ملف إلزامي اسمه <code className="text-white font-mono bg-amber-950/60 px-1.5 py-0.5 rounded">bot.json</code> ومجلد <code className="text-white font-mono bg-amber-950/60 px-1.5 py-0.5 rounded">commands/</code> في المستودع الرئيسي. قمنا بإنشائهما وضمهما داخل الحزمة!
          </div>

          <div className="text-xs text-slate-300 space-y-2">
            <p><strong>مستودع GitHub الخاص بك المربوط:</strong></p>
            <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg font-mono text-[11px] text-sky-300 flex items-center justify-between" dir="ltr">
              <span>https://github.com/mstfy737216610-prog/ADMIN_-.git</span>
              <button
                onClick={() => handleCopy('https://github.com/mstfy737216610-prog/ADMIN_-.git', 'repo_url')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded ml-2"
              >
                {copiedCmd === 'repo_url' ? 'تم النسخ!' : 'نسخ'}
              </button>
            </div>
          </div>

          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed pr-1">
            <li>قم بتنزيل حزمة <strong>ZIP</strong> المحدثة بالأعلى (تحتوي على <code className="text-sky-300 font-mono">bot.json</code> ومجلد <code className="text-sky-300 font-mono">commands/</code>).</li>
            <li>افتح مستودعك على GitHub: <a href="https://github.com/mstfy737216610-prog/ADMIN_-" target="_blank" rel="noreferrer" className="text-sky-400 underline font-mono">mstfy737216610-prog/ADMIN_-</a> واضغط على <strong>Add file &gt; Upload files</strong> وارفع الملفات مباشرة.</li>
            <li>ارجع لتطبيق <strong className="text-white">Bots.Business</strong> واضغط على زر <strong>Sync Git</strong> أو أعد الاستيراد. سيتعرف التطبيق فوراً على البوت ويعمل بنجاح دون أي خطأ!</li>
          </ol>
        </div>

        {/* Right: Telegram Bot Free Hosting / Render / Railway */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs sm:text-sm">
            <Cloud className="w-4 h-4" />
            <span>تطبيقات ومنصات Telegram Bot Free Hosting (Render / Railway / Koyeb):</span>
          </div>

          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <p>
              إذا كنت تستخدم تطبيقات استضافة أخرى تدعم GitHub (مثل Render أو Railway أو Koyeb أو PythonAnywhere أو VPS):
            </p>
            <ul className="list-disc list-inside space-y-1.5 pr-1">
              <li>
                <strong>نوع الخدمة (Service Type):</strong> اختر <strong>Background Worker</strong> أو <strong>Web Service</strong>.
              </li>
              <li>
                <strong>أمر تثبيت المكتبات (Build Command):</strong> <code className="text-purple-300 font-mono">pip install -r requirements.txt</code>
              </li>
              <li>
                <strong>أمر تشغيل اليوزربوت (UserBot Start Command):</strong> <code className="text-emerald-300 font-mono">python3 userbot_publisher.py</code> (لسحب وسائط وقنوات تيليجرام 24/7).
              </li>
              <li>
                <strong>أمر تشغيل البوت المدمج (Web Bot Command):</strong> <code className="text-sky-300 font-mono">python3 main.py</code> (مع خادم Keep-Alive لمنع توقف السيرفر).
              </li>
              <li>
                <strong>المتغيرات البيئية (Env Vars):</strong> أضف <code className="text-amber-300 font-mono">STRING_SESSION</code> و <code className="text-amber-300 font-mono">AI_API_KEY</code> في لوحة إعدادات الاستضافة.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Terminal Git Commands Helper */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>أوامر الرفع عبر Git Terminal للمحترفين:</span>
          </span>

          <button
            onClick={() => handleCopy(gitCommands, 'git')}
            className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
          >
            {copiedCmd === 'git' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCmd === 'git' ? 'تم نسخ الأوامر!' : 'نسخ أوامر Git'}</span>
          </button>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto text-left" dir="ltr">
          <pre><code>{gitCommands}</code></pre>
        </div>
      </div>
    </div>
  );
};
