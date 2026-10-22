import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Smartphone,
  Layers,
  Send,
  Sparkles,
  Zap,
  Play,
  Pause,
  Plus,
  Trash2,
  FileCode,
  ShieldCheck,
  UserCheck,
  Key,
  Globe,
} from 'lucide-react';

interface Props {
  adminUsername: string;
  botUsername: string;
}

interface ChannelMapping {
  target: string;
  sources: string[];
  name: string;
  enabled: boolean;
}

export const GitHubHostingGuide: React.FC<Props> = ({ adminUsername }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeSimScreen, setActiveSimScreen] = useState<'start' | 'mapping' | 'ai' | 'userbot' | 'login' | 'status' | 'ad' | 'api_test'>('start');
  const [isBotPaused, setIsBotPaused] = useState(false);
  const [selectedModel, setSelectedModel] = useState('DeepSeek-V4.1-Flash');
  const [baseUrl, setBaseUrl] = useState('https://api.hcnsec.cn/v1');
  const [apiKey, setApiKey] = useState('sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii');
  const [isEditingBaseUrl, setIsEditingBaseUrl] = useState(false);
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [tempUrl, setTempUrl] = useState(baseUrl);
  const [tempKey, setTempKey] = useState(apiKey);
  const [totalProcessed, setTotalProcessed] = useState(14);
  const [userbotActive, setUserbotActive] = useState(true);
  const [userbotPhone, setUserbotPhone] = useState('+966501234567');
  
  // Login flow state
  const [loginStep, setLoginStep] = useState<1 | 2 | 3>(1);
  const [loginPhoneInput, setLoginPhoneInput] = useState('+966509876543');
  const [loginOtpInput, setLoginOtpInput] = useState('83921');
  const [login2faInput, setLogin2faInput] = useState('');

  const [mappings, setMappings] = useState<ChannelMapping[]>([
    {
      target: '@MyUniversityChannel',
      sources: ['@KSU_News', '@moe_gov_sa'],
      name: 'قناة النشر الرسمية (أ)',
      enabled: true,
    },
    {
      target: '@SecondTargetChannel',
      sources: ['@OtherUniversityChannel', 'https://x.com/moe_gov_sa'],
      name: 'القناة الثانية (ب)',
      enabled: true,
    },
  ]);

  const [newTarget, setNewTarget] = useState('');
  const [newSources, setNewSources] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleAddMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarget.trim()) return;
    const sourcesList = newSources.split(/[\s,]+/).filter(Boolean);
    setMappings([
      ...mappings,
      {
        target: newTarget.trim(),
        sources: sourcesList.length > 0 ? sourcesList : ['@KSU_News'],
        name: `قناة (${mappings.length + 1})`,
        enabled: true,
      },
    ]);
    setNewTarget('');
    setNewSources('');
    setShowAddForm(false);
  };

  const handleRemoveMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const commandsList = [
    { name: '/start', desc: 'لوحة التحكم الرئيسية بأزرار إنلاين تفاعلية (الأقسام الخمسة)' },
    { name: '/universities', desc: '🏛️ قائمة أزرار الجامعات المستقلة (زر وتحكم منفصل لكل جامعة)' },
    { name: '/univ_view <id>', desc: 'لوحة تحكم مخصصة وحصرية للجامعة المحددة' },
    { name: '/univ_crawl <id>', desc: 'سحب وفحص أخبار جامعة محددة فقط بدون أي خلط' },
    { name: '/univ_toggle <id>', desc: 'تفعيل أو إيقاف النشر لجامعة وقناتها المحددة' },
    { name: '/univ_post <id>', desc: 'صياغة ونشر خبر فوري لقناة الجامعة المحددة حصرياً' },
    { name: '/add_university', desc: '➕ معالج إضافة جامعة هرمي (5 خطوات صارمة لمنع التداخل)' },
    { name: '/del_university <id>', desc: 'حذف جامعة محددة وإلغاء ربط مصادرها' },
    { name: '/pause', desc: '🟢 تشغيل / إيقاف البوت فوراً' },
    { name: '/ai', desc: '⚙️ إعدادات الذكاء الاصطناعي واختيار النماذج وتعديل الروابط' },
    { name: '/set_base_url', desc: 'تعديل رابط الـ Base URL المعتمد' },
    { name: '/set_api_key', desc: 'تعديل مفتاح الـ API Key مباشرة من الشات' },
    { name: '/set_model', desc: 'التحويل الفوري بين DeepSeek-V4.1 و Qwen و glm بنقرة واحدة' },
    { name: '/mapping', desc: '🔗 إدارة وربط المصادر والأهداف المنفصلة' },
    { name: '/add_mapping', desc: 'إضافة ربط قناة هدف جديدة وتعيين مصادرها المستقلة' },
    { name: '/del_mapping', desc: 'حذف أي ربط قناة بسهولة' },
    { name: '/reset_mapping', desc: 'استعادة ضبط القنوات والمصادر الافتراضية' },
    { name: '/userbot', desc: '👤 إدارة الحساب المسجل وجلسة UserBot وسحب X والقنوات' },
    { name: '/login_start', desc: 'بدء تسجيل الدخول المباشر من داخل الشات' },
    { name: '/login_phone', desc: 'استلام رقم الهاتف وطلب كود OTP' },
    { name: '/login_code', desc: 'استلام كود التحقق وطلب 2FA' },
    { name: '/login_2fa', desc: 'إتمام الجلسة وبصمة Chrome 154 on Android' },
    { name: '/check_session', desc: 'فحص حالة الجلسة والتأكد من بصمة الجهاز' },
    { name: '/logout_session', desc: 'تسجيل الخروج وحذف الجلسة المؤقتة' },
    { name: '/status', desc: '📊 حالة النظام والتقارير وإحصائيات النشر' },
    { name: '/api_test', desc: 'فحص سرعة الاتصال بالـ API الحقيقي بالمللي ثانية' },
    { name: '/ad', desc: 'إدارة إعلان خدمات الطلاب البديل لإعلانات المنافسين' },
    { name: '/set_ad', desc: 'تعديل نص إعلان خدمات المشرف @M_S_F_G' },
    { name: '/test', desc: 'تجربة صياغة خبر فوري بالذكاء الاصطناعي' },
    { name: 'handle_user_post', desc: 'محرك النشر الآلي وسحب الوسائط والفرز بالخلفية' },
    { name: '/on_ai_post_success', desc: 'توزيع المنشور عالي الدقة على القنوات الهدف المحددة' },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">
              نظام التشغيل الكامل في تطبيق بوت بزنس (Bots.Business Full Package)
            </h2>
            <span className="px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-md font-mono">
              100% In-Telegram
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            البوت يعمل بالكامل وبشكل مستقل داخل تيليجرام وتطبيق Bots.Business عبر أزرار إنلاين تفاعلية، تسجيل الدخول المباشر من الشات (In-Chat Login)، وإدارة المصادر المنفصلة.
          </p>
        </div>

        {/* Download Zip Package button */}
        <a
          href="/Telegram_Educational_Bot_GitHub_Package.zip"
          download="Telegram_Educational_Bot_GitHub_Package.zip"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>تنزيل حزمة بوت بزنس المكتملة (ZIP)</span>
        </a>
      </div>

      {/* Telegram Live Interactive Bots.Business Simulator */}
      <div className="bg-slate-950/80 border border-purple-900/40 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">
              محاكي واجهة تحكم البوت داخل تطبيق تيليجرام (@admiuin_bot)
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span>المشرف المعتمد:</span>
            <span className="text-purple-300 font-bold">@M_S_F_G (7607633343)</span>
          </div>
        </div>

        {/* Telegram Chat Box Screen */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 space-y-4 text-xs font-sans">
          {/* Active Screen: START */}
          {activeSimScreen === 'start' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl leading-relaxed text-slate-200 space-y-2">
                <p>
                  👑 <strong>مرحباً بك يا مديرنا العزيز @{adminUsername}!</strong>
                  <br />
                  أنت المشرف المعتمد والمخول بالتحكم الكامل (ID: <code className="text-sky-300 font-mono">7607633343</code>)
                </p>
                <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80 font-mono text-[11px] space-y-1">
                  <p>• <strong>حالة البوت:</strong> {isBotPaused ? '🔴 متوقف مؤقتاً' : '🟢 نشط ويعمل 24/7'}</p>
                  <p>• <strong>النموذج المعتمد:</strong> <span className="text-emerald-400">{selectedModel}</span></p>
                  <p>• <strong>بوابة الذكاء الاصطناعي:</strong> <span className="text-sky-300">{baseUrl}</span></p>
                  <p>• <strong>جلسة اليوزربوت:</strong> {userbotActive ? '🟢 متصل (Chrome 154 on Android)' : '🔴 غير مسجل'}</p>
                  <p>• <strong>قنوات النشر المنفصلة:</strong> {mappings.length} قنوات مستقلة</p>
                  <p>• <strong>إجمالي المنشورات المعالجة:</strong> {totalProcessed} منشور</p>
                </div>
                <p className="text-[11px] text-slate-400">
                  👇 تحكم بكافة أقسام ووظائف البوت من الأزرار التفاعلية أدناه:
                </p>
              </div>

              {/* 5 Core Inline Sections Requested by User */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => setIsBotPaused(!isBotPaused)}
                  className={`p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs border ${
                    isBotPaused
                      ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
                      : 'bg-rose-950/50 border-rose-800/60 text-rose-300 hover:bg-rose-900/50'
                  }`}
                >
                  {isBotPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isBotPaused ? '▶️ تشغيل البوت (Start)' : '⏸️ إيقاف البوت (Stop)'}</span>
                </button>
                <button
                  onClick={() => setActiveSimScreen('ai')}
                  className="p-2.5 bg-sky-950/40 hover:bg-sky-900/50 text-sky-200 border border-sky-800/60 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>⚙️ إعدادات الذكاء الاصطناعي (AI Settings)</span>
                </button>
                <button
                  onClick={() => setActiveSimScreen('mapping')}
                  className="p-2.5 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border border-purple-800/60 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>🔗 إدارة وربط المصادر (Sources & Targets)</span>
                </button>
                <button
                  onClick={() => setActiveSimScreen('userbot')}
                  className="p-2.5 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-200 border border-indigo-800/60 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs"
                >
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>👤 إدارة الحساب المسجل (UserBot Session)</span>
                </button>
                <button
                  onClick={() => setActiveSimScreen('status')}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all text-xs col-span-1 sm:col-span-2"
                >
                  <span>📊 حالة النظام والتقارير (Status)</span>
                </button>
              </div>

              {/* Extra tools */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                <button
                  onClick={() => setActiveSimScreen('ad')}
                  className="p-2 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                >
                  <span>🎯 إعلان خدماتي البديل</span>
                </button>
                <button
                  onClick={() => setActiveSimScreen('api_test')}
                  className="p-2 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/40 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>⚡ فحص سرعة الاتصال بالـ API</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Screen: USERBOT & IN-CHAT LOGIN */}
          {activeSimScreen === 'userbot' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>👤 نظام السحب والتسجيل (UserBot Session & Scraping)</span>
                </h4>
                <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-[11px] text-slate-200 space-y-1">
                  <p>• <strong>حالة الجلسة:</strong> {userbotActive ? '🟢 متصلة وموثقة بنجاح' : '🔴 غير مسجلة'}</p>
                  <p>• <strong>بصمة الجهاز المسجلة في تيليجرام:</strong> <span className="text-emerald-400 font-bold">(متصفّح: Chrome 154 on Android)</span></p>
                  <p>• <strong>نظام التشغيل:</strong> Android 14 (Chromium Engine)</p>
                  <p>• <strong>الحساب المرتبط:</strong> <span className="text-sky-300">{userbotPhone}</span></p>
                  <p>• <strong>صلاحيات السحب:</strong> القنوات العامة والخاصة + تويتر (X)</p>
                  <p>• <strong>دعم الوسائط:</strong> صور، فيديوهات، مذكرات وكتب PDF بدقة كاملة</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setLoginStep(1);
                    setActiveSimScreen('login');
                  }}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>➕ تسجيل دخول جديد (In-Chat Login)</span>
                </button>
                <button
                  onClick={() => {
                    setUserbotActive(!userbotActive);
                  }}
                  className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border ${
                    userbotActive
                      ? 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/50'
                      : 'bg-emerald-950/40 border-emerald-800 text-emerald-300 hover:bg-emerald-900/50'
                  }`}
                >
                  <span>{userbotActive ? '🗑️ تسجيل الخروج وحذف الجلسة' : '🔄 إعادة تفعيل الجلسة'}</span>
                </button>
              </div>

              <button
                onClick={() => setActiveSimScreen('start')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                🔙 العودة للوحة الرئيسية
              </button>
            </div>
          )}

          {/* Active Screen: IN-CHAT LOGIN STEPPER */}
          {activeSimScreen === 'login' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 bg-slate-950/80 border border-indigo-800/50 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>تسجيل دخول مباشر من داخل الشات (خطوة {loginStep} من 3)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Chrome 154 on Android</span>
                </div>

                {loginStep === 1 && (
                  <div className="space-y-2">
                    <p className="text-slate-200">
                      📲 <strong>يرجى إرسال رقم الهاتف مع الرمز الدولي</strong> (مثال: <code className="text-sky-300 font-mono">+96650xxxxxxx</code>):
                    </p>
                    <input
                      type="text"
                      value={loginPhoneInput}
                      onChange={(e) => setLoginPhoneInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveSimScreen('userbot')}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={() => setLoginStep(2)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                      >
                        إرسال الرقم واستلام OTP ➔
                      </button>
                    </div>
                  </div>
                )}

                {loginStep === 2 && (
                  <div className="space-y-2">
                    <p className="text-slate-200">
                      📩 <strong>يرجى إرسال كود التحقق (OTP) الذي وصلك من تيليجرام</strong>:
                    </p>
                    <input
                      type="text"
                      value={loginOtpInput}
                      onChange={(e) => setLoginOtpInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setLoginStep(1)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                      >
                        رجوع
                      </button>
                      <button
                        onClick={() => setLoginStep(3)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                      >
                        تأكيد الكود ➔
                      </button>
                    </div>
                  </div>
                )}

                {loginStep === 3 && (
                  <div className="space-y-2">
                    <p className="text-slate-200">
                      🔐 <strong>إذا كان الحساب محمي بكلمة مرور (2FA)</strong>، أرسلها الآن (أو اضغط تخطي):
                    </p>
                    <input
                      type="password"
                      placeholder="كلمة مرور 2FA (اختياري)"
                      value={login2faInput}
                      onChange={(e) => setLogin2faInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setUserbotPhone(loginPhoneInput);
                          setUserbotActive(true);
                          setActiveSimScreen('userbot');
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>[✔] حفظ الجلسة وتثبيت البصمة (Chrome 154 on Android)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Screen: MULTI-SOURCE MAPPING */}
          {activeSimScreen === 'mapping' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>خريطة ربط القنوات والمصادر المنفصلة (Multi-Source Mapping)</span>
                  </h4>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة ربط جديد</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  تحديد دقيق للمصادر: قناة (أ) تسحب فقط من مصادرها، وقناة (ب) تسحب من مصادرها الخاصة، دون أي تداخل!
                </p>

                {showAddForm && (
                  <form onSubmit={handleAddMapping} className="p-3 bg-slate-900 rounded-lg border border-purple-800/50 space-y-2 mt-2">
                    <p className="font-bold text-white text-[11px]">إضافة ربط قناة نشر هدف ومصادرها:</p>
                    <input
                      type="text"
                      placeholder="قناة النشر الهدف (مثال: @FacultyNews)"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                    />
                    <input
                      type="text"
                      placeholder="المصادر المخصصة لها (مثال: @SourceA @SourceB)"
                      value={newSources}
                      onChange={(e) => setNewSources(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs"
                      >
                        حفظ التعيين
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 mt-2">
                  {mappings.map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>قناة النشر الهدف:</span>
                          <code className="text-sky-300 font-mono">{m.target}</code>
                        </div>
                        <button
                          onClick={() => handleRemoveMapping(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                          title="حذف هذا الربط"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="pr-6 text-[11px] text-slate-300">
                        <span className="text-slate-400 font-semibold">📡 المصادر المخصصة لها: </span>
                        {m.sources.map((s, si) => (
                          <span key={si} className="inline-block bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-purple-300 font-mono ml-1 text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveSimScreen('start')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  🔙 العودة للوحة الرئيسية
                </button>
              </div>
            </div>
          )}

          {/* Active Screen: AI CONFIG */}
          {activeSimScreen === 'ai' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-sky-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>إعدادات الذكاء الاصطناعي التفاعلية (AI Configuration)</span>
                </h4>

                {/* Base URL and API Key Editable directly */}
                <div className="space-y-2 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold flex items-center gap-1 text-[11px]">
                      <Globe className="w-3 h-3 text-sky-400" />
                      <span>Base URL:</span>
                    </span>
                    <button
                      onClick={() => setIsEditingBaseUrl(!isEditingBaseUrl)}
                      className="text-xs text-sky-400 hover:underline"
                    >
                      {isEditingBaseUrl ? 'إلغاء' : 'تعديل الرابط'}
                    </button>
                  </div>
                  {isEditingBaseUrl ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded p-1 text-white font-mono text-xs"
                      />
                      <button
                        onClick={() => {
                          setBaseUrl(tempUrl);
                          setIsEditingBaseUrl(false);
                        }}
                        className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                      >
                        حفظ
                      </button>
                    </div>
                  ) : (
                    <code className="block text-sky-300 font-mono text-xs">{baseUrl}</code>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400 font-bold flex items-center gap-1 text-[11px]">
                      <Key className="w-3 h-3 text-amber-400" />
                      <span>API Key:</span>
                    </span>
                    <button
                      onClick={() => setIsEditingApiKey(!isEditingApiKey)}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      {isEditingApiKey ? 'إلغاء' : 'تعديل المفتاح'}
                    </button>
                  </div>
                  {isEditingApiKey ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempKey}
                        onChange={(e) => setTempKey(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded p-1 text-white font-mono text-xs"
                      />
                      <button
                        onClick={() => {
                          setApiKey(tempKey);
                          setIsEditingApiKey(false);
                        }}
                        className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                      >
                        حفظ
                      </button>
                    </div>
                  ) : (
                    <code className="block text-amber-300 font-mono text-xs">
                      {apiKey.substring(0, 10)}...{apiKey.substring(apiKey.length - 4)}
                    </code>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 font-semibold">
                  🎯 اختيار النموذج بنقرة واحدة (Model Selection):
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {[
                    'DeepSeek-V4.1-Flash',
                    'DeepSeek-V4-Flash',
                    'Qwen3.8-27B',
                    'glm-5.3',
                    'MiniMax-M3.1-Flash',
                  ].map((modelName) => (
                    <button
                      key={modelName}
                      onClick={() => setSelectedModel(modelName)}
                      className={`p-2 rounded-lg text-xs font-mono font-bold flex items-center justify-between border transition-all ${
                        selectedModel === modelName
                          ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      <span>{modelName}</span>
                      {selectedModel === modelName && <span>✓ مفعّل</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveSimScreen('start')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  🔙 العودة للوحة الرئيسية
                </button>
                <button
                  onClick={() => setActiveSimScreen('api_test')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  ⚡ فحص سرعة النموذج
                </button>
              </div>
            </div>
          )}

          {/* Active Screen: API TEST */}
          {activeSimScreen === 'api_test' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-2">
                <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  <span>فحص سرعة الاتصال بالـ API الحقيقي:</span>
                </h4>
                <div className="p-2.5 bg-slate-950 rounded-lg font-mono text-[11px] text-slate-200 space-y-1">
                  <p>• <strong>البوابة:</strong> {baseUrl}</p>
                  <p>• <strong>النموذج:</strong> {selectedModel}</p>
                  <p>• <strong>زمن الاستجابة:</strong> <span className="text-emerald-400 font-bold">1020 ms ⚡</span></p>
                  <p>• <strong>الحالة:</strong> 🟢 اتصال مباشر ومستقر 100%</p>
                </div>
              </div>

              <button
                onClick={() => setActiveSimScreen('start')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                🔙 العودة للوحة الرئيسية
              </button>
            </div>
          )}

          {/* Active Screen: STATUS */}
          {activeSimScreen === 'status' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-white">📊 تقرير النشر والعمليات الحية:</h4>
                <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-[11px] text-slate-300 space-y-1">
                  <p>• حالة البوت: {isBotPaused ? '🔴 متوقف' : '🟢 يعمل 24/7'}</p>
                  <p>• إجمالي المنشورات الموجهة: {totalProcessed}</p>
                  <p>• إعلانات المنافسين المستبدلة: 3</p>
                  <p>• قنوات النشر النشطة: {mappings.length}</p>
                  <p>• جلسة اليوزربوت: {userbotActive ? 'متصلة (Chrome 154 on Android)' : 'غير متصلة'}</p>
                  <p>• دعم الوسائط: نقل الصور، الفيديو، ومستندات PDF بأعلى دقة</p>
                </div>
              </div>
              <button
                onClick={() => setActiveSimScreen('start')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                🔙 العودة للوحة الرئيسية
              </button>
            </div>
          )}

          {/* Active Screen: AD REPLACEMENT */}
          {activeSimScreen === 'ad' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-amber-300">🎯 إعلان خدمات الطلاب البديل لإعلانات المنافسين:</h4>
                <p className="text-[11px] text-slate-400">
                  عند رصد أي إعلان مدفوع لمنافس، يستبدله البوت تلقائياً بهذا النص قبل النشر:
                </p>
                <div className="p-2.5 bg-slate-900 rounded-lg text-slate-200 text-xs leading-relaxed border border-slate-800">
                  🎓 <strong>خدمات طلابية معتمدة وأكاديمية متكاملة</strong> 🎓
                  <br />• مساعدة في البحوث والمشاريع الأكاديمية
                  <br />• التدقيق اللغوي وتنسيق الرسائل الجامعية
                  <br />• تلخيص المحاضرات والمقررات الدراسية
                  <br />📞 للتواصل والطلب مباشرة عبر المشرف: <strong>@M_S_F_G</strong>
                </div>
              </div>
              <button
                onClick={() => setActiveSimScreen('start')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                🔙 العودة للوحة الرئيسية
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bots.Business Commands Declared in Repository */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-purple-400" />
            <span>أوامر بوت بزنس المضمنة في المستودع والحزمة ({commandsList.length} أمر BJS جاهز):</span>
          </span>
          <span className="text-[11px] text-emerald-400 font-mono">BJS Compatible 100%</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {commandsList.map((cmd, i) => (
            <div key={i} className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-0.5">
              <code className="text-sky-300 font-mono text-xs font-bold">{cmd.name}</code>
              <p className="text-[11px] text-slate-400 leading-snug">{cmd.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How to Sync to Bots.Business in 10 Seconds */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-sky-400 font-bold text-xs sm:text-sm">
          <Smartphone className="w-4 h-4" />
          <span>طريقة المزامنة الفورية في تطبيق Bots.Business (في 10 ثوانٍ):</span>
        </div>

        <div className="text-xs text-slate-300 space-y-2">
          <p><strong>رابط مستودع GitHub الخاص بك المربوط:</strong></p>
          <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg font-mono text-[11px] text-sky-300 flex items-center justify-between" dir="ltr">
            <span>https://github.com/mstfy737216610-prog/Booooot_ADMAN.git</span>
            <button
              onClick={() => handleCopy('https://github.com/mstfy737216610-prog/Booooot_ADMAN.git', 'repo_url')}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded ml-2"
            >
              {copiedCmd === 'repo_url' ? 'تم النسخ!' : 'نسخ'}
            </button>
          </div>
        </div>

        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed pr-1">
          <li>حمّل حزمة <strong>ZIP</strong> المحدثة من الزر بالأعلى (تحتوي على ملف <code className="text-sky-300 font-mono">bot.json</code> ومجلد <code className="text-sky-300 font-mono">commands/</code> بكافة الأوامر).</li>
          <li>افتح مستودعك على GitHub: <a href="https://github.com/mstfy737216610-prog/Booooot_ADMAN" target="_blank" rel="noreferrer" className="text-sky-400 underline font-mono">mstfy737216610-prog/Booooot_ADMAN</a> وارفع الملفات أو ادفعها عبر Git.</li>
          <li>افتح تطبيق <strong className="text-white">Bots.Business</strong> على هاتفك واضغط على زر <strong>Sync Git</strong>. سيتصل فوراً وستظهر كافة الأزرار والأقسام الخمسة في محادثتك مع البوت!</li>
        </ol>
      </div>
    </div>
  );
};
