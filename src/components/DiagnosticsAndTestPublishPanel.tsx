import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Zap,
  ShieldCheck,
  Smartphone,
  Twitter,
  Cpu,
  Layers,
  Sparkles,
  Check,
  Eye,
  Trash2,
  ExternalLink,
  Bot
} from 'lucide-react';

interface DiagnosticItem {
  id: number;
  error_code: string;
  severity: 'critical' | 'warning' | 'info';
  component: string;
  title: string;
  message: string;
  fix_action?: string;
  context_data?: Record<string, unknown>;
  created_at: string;
}

interface DiagnosticCheck {
  component: string;
  name: string;
  status: 'ok' | 'warning' | 'error';
  title: string;
  message: string;
  fix?: string;
}

interface DiagnosticReport {
  overall_status: 'healthy' | 'warning' | 'critical';
  active_errors_count: number;
  checks: DiagnosticCheck[];
  tested_at: string;
}

interface TestPublishStep {
  step: string;
  status: 'ok' | 'warning' | 'error';
  msg: string;
  target?: string;
  account?: string;
  preview?: string;
}

interface TestPublishResult {
  success: boolean;
  steps: TestPublishStep[];
  card_url?: string;
  telegram?: { ok: boolean; message_id?: number; description?: string; channel?: string };
  twitter?: { ok: boolean; tweet_text?: string; card_url?: string; account?: string; description?: string };
}

interface TwitterAccountOption {
  id: string;
  username: string;
  display_name: string;
  university: string;
  status: string;
}

interface DiagnosticsProps {
  currentBotToken?: string;
  onBotTokenUpdated?: (newToken: string) => void;
  defaultChannel?: string;
}

export const DiagnosticsAndTestPublishPanel: React.FC<DiagnosticsProps> = ({
  currentBotToken = '',
  onBotTokenUpdated,
  defaultChannel = '@jhdhhdcj'
}) => {
  // State: Diagnostics & Health Check
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [activeDiags, setActiveDiags] = useState<DiagnosticItem[]>([]);
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);
  const [isLoadingDiags, setIsLoadingDiags] = useState<boolean>(false);

  // State: Test Publisher Form
  const [platform, setPlatform] = useState<'both' | 'telegram' | 'twitter'>('both');
  const [testTitle, setTestTitle] = useState<string>('إعلان تجريبي للطلاب 🎓');
  const [testBody, setTestBody] = useState<string>(
    '1. تم فحص دقة محرك النشر الآلي وتصميم البطاقات فائقة الدقة بنجاح.\n2. هذا المنشور للتأكد من وصول التنبيهات الأكاديمية وصلاحية القنوات وحسابات تويتر.\n3. بالتوفيق لجميع أبنائنا الطلبة في مسيرتهم الجامعية!'
  );
  const [testChannel, setTestChannel] = useState<string>(defaultChannel);
  const [testAccountId, setTestAccountId] = useState<string>('');
  const [testBotToken, setTestBotToken] = useState<string>(currentBotToken);
  const [includeCard, setIncludeCard] = useState<boolean>(true);
  const [accounts, setAccounts] = useState<TwitterAccountOption[]>([]);

  // State: Test Execution Result
  const [isPublishingTest, setIsPublishingTest] = useState<boolean>(false);
  const [publishResult, setPublishResult] = useState<TestPublishResult | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  // Fetch accounts for selection
  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/twitter/accounts');
      if (res.ok) {
        const data = await res.json();
        if (data.accounts) {
          setAccounts(data.accounts);
          if (data.accounts.length > 0 && !testAccountId) {
            setTestAccountId(data.accounts[0].id);
          }
        }
      }
    } catch {
      // ignore
    }
  };

  // Fetch active diagnostics
  const fetchDiagnostics = async () => {
    setIsLoadingDiags(true);
    try {
      const res = await fetch('/api/diagnostics');
      if (res.ok) {
        const data = await res.json();
        if (data.diagnostics) {
          setActiveDiags(data.diagnostics);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingDiags(false);
    }
  };

  // Run comprehensive health test
  const runSelfTest = async () => {
    setIsRunningTest(true);
    try {
      const res = await fetch('/api/diagnostics/run-test', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setReport(data.report);
          fetchDiagnostics();
          showToast('اكتمل فحص النظام والتشخيص الذكي بنجاح ⚡');
        }
      }
    } catch {
      showToast('خطأ أثناء تشغيل الفحص الذاتي');
    } finally {
      setIsRunningTest(false);
    }
  };

  // Resolve diagnostic
  const handleResolveDiag = async (id: number) => {
    try {
      const res = await fetch(`/api/diagnostics/${id}/resolve`, { method: 'POST' });
      if (res.ok) {
        setActiveDiags(prev => prev.filter(d => d.id !== id));
        showToast('تم تعليم الخطأ كـ محلول ✅');
      }
    } catch {
      // ignore
    }
  };

  // Clear all diagnostics
  const handleClearAll = async () => {
    try {
      const res = await fetch('/api/diagnostics/clear', { method: 'POST' });
      if (res.ok) {
        setActiveDiags([]);
        showToast('تم مسح كافة سجلات الأخطاء والتشخيص 🧹');
      }
    } catch {
      // ignore
    }
  };

  // Execute test publish
  const handleExecuteTestPublish = async () => {
    if (!testTitle.trim() || !testBody.trim()) {
      showToast('يرجى كتابة عنوان ونص المنشور التجريبي.');
      return;
    }

    setIsPublishingTest(true);
    setPublishResult(null);

    try {
      const res = await fetch('/api/publish/test-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          title: testTitle,
          bodyText: testBody,
          targetChannel: testChannel,
          twitterAccountId: testAccountId,
          botToken: testBotToken.trim(),
          includeCard
        })
      });

      const data = await res.json();
      if (data.success) {
        setPublishResult(data);
        showToast('اكتملت تجربة النشر وتم استخراج التقرير بالكامل 🚀');
        if (testBotToken.trim() && onBotTokenUpdated) {
          onBotTokenUpdated(testBotToken.trim());
        }
        // Refresh diagnostics in case token was saved
        fetchDiagnostics();
      } else {
        showToast(data.error || 'فشلت عملية النشر التجريبي');
      }
    } catch (err) {
      showToast('تعذر الاتصال بخادم النشر التجريبي: ' + String(err));
    } finally {
      setIsPublishingTest(false);
    }
  };

  // Preset quick fill
  const loadPresetAcademic = () => {
    setTestTitle('إعلان هام: مواعيد التسجيل والحذف والإضافة للفصل القادم 🎓');
    setTestBody(
      'تعلن عمادة القبول والتسجيل عن بدء فترة الحذف والإضافة الآلية عبر البوابة الإلكترونية:\n\n' +
      '• فتح البوابة للدفعة الأخيرة: الأحد القادم الساعة ٨:٠٠ صباحاً\n' +
      '• فتح البوابة لكافة الدفعات: الاثنين الساعة ١٠:٠٠ صباحاً\n' +
      '• آخر موعد لتسجيل المقررات: الخميس الساعة ٢:٠٠ ظهراً\n\n' +
      'يرجى مراجعة المرشد الأكاديمي والتأكد من استيفاء المتطلبات السابقة.'
    );
  };

  useEffect(() => {
    fetchDiagnostics();
    fetchAccounts();
    runSelfTest();
    if (currentBotToken && !testBotToken) {
      setTestBotToken(currentBotToken);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 border border-sky-500/80 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP HEADER: SYSTEM DIAGNOSTIC STATUS */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                  <span>مركز التشخيص والتعقب الذكي للأخطاء والنشر التجريبي</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Live Diagnostics Hub
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  فحص حي ومستمر لاتصال التيليجرام، تويتر، محرك الصور، ذاكرة الهاتف الداخلية، وتجربة النشر بضغطة زر.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={runSelfTest}
              disabled={isRunningTest}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-sky-950/40 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRunningTest ? 'animate-spin' : ''}`} />
              <span>{isRunningTest ? 'جارٍ الفحص الشامل...' : 'فحص وتشخيص شامل للنظام ⚡'}</span>
            </button>
          </div>
        </div>

        {/* SYSTEM STATUS PILLS & METRICS */}
        {report && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-800/80">
            {report.checks.map((c, idx) => {
              const isOk = c.status === 'ok';
              const isWarn = c.status === 'warning';
              return (
                <div
                  key={idx}
                  className={`rounded-2xl p-3.5 border transition-all ${
                    isOk
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : isWarn
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      {c.component === 'telegram' && <Bot className="w-3.5 h-3.5 text-sky-400" />}
                      {c.component === 'twitter' && <Twitter className="w-3.5 h-3.5 text-sky-400" />}
                      {c.component === 'storage' && <Smartphone className="w-3.5 h-3.5 text-purple-400" />}
                      {c.component === 'ai' && <Cpu className="w-3.5 h-3.5 text-indigo-400" />}
                      {c.name}
                    </span>
                    <span className="text-[11px] font-mono">
                      {isOk ? '🟢 سليم' : isWarn ? '🟡 تنبيه' : '🔴 خطأ'}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 line-clamp-1">{c.title}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{c.message}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ACTIVE DIAGNOSTIC ISSUES LIST */}
      {activeDiags.length > 0 && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="font-bold text-white text-sm">
                الملاحظات والأخطاء النشطة المرصودة ({activeDiags.length})
              </h3>
            </div>
            <button
              onClick={handleClearAll}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح الكل</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {activeDiags.map(d => (
              <div
                key={d.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                        d.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {d.error_code}
                    </span>
                    <span className="font-bold text-white">{d.title}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{d.message}</p>
                  {d.fix_action && (
                    <p className="text-sky-400 text-[11px] font-bold">💡 الحل المقترح: {d.fix_action}</p>
                  )}
                </div>

                <button
                  onClick={() => handleResolveDiag(d.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>تم الحل</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: TEST PUBLISHING TOOL (النشر التجريبي المباشر) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FORM PANEL */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>🚀 أداة النشر التجريبي المباشر</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30">
                  Instant Verification
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                أرسل منشوراً تجريبياً فوراً لاختبار كل خطوة والتحقق من صلاحية وصول المنشورات إلى القناة والحساب دون تأخير.
              </p>
            </div>
            <button
              type="button"
              onClick={loadPresetAcademic}
              className="text-[11px] text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>نموذج إعلان جاهز</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* PLATFORM SELECTOR */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">منصة النشر المستهدفة للاختبار:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPlatform('both')}
                  className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    platform === 'both'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>تيليجرام وتويتر معاً</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlatform('telegram')}
                  className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    platform === 'telegram'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-sky-400" />
                  <span>تيليجرام فقط</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlatform('twitter')}
                  className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    platform === 'twitter'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <Twitter className="w-3.5 h-3.5 text-sky-400" />
                  <span>تويتر فقط</span>
                </button>
              </div>
            </div>

            {/* TITLE */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">عنوان الإعلان التجريبي:</label>
              <input
                type="text"
                value={testTitle}
                onChange={e => setTestTitle(e.target.value)}
                placeholder="إعلان تجريبي للطلاب..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>

            {/* BODY TEXT */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">محتوى الإعلان الأكاديمي:</label>
              <textarea
                rows={4}
                value={testBody}
                onChange={e => setTestBody(e.target.value)}
                placeholder="اكتب نقاط المنشور التجريبي..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white leading-relaxed"
              />
            </div>

            {/* TARGET CHANNEL & BOT TOKEN FOR TELEGRAM */}
            {(platform === 'telegram' || platform === 'both') && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">قناة التيليجرام المستهدفة:</label>
                    <input
                      type="text"
                      value={testChannel}
                      onChange={e => setTestChannel(e.target.value)}
                      placeholder="@jhdhhdcj"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sky-300 font-mono"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">تأكد من إضافة البوت مشرفاً في القناة</span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                      <span>توكن البوت (BotFather):</span>
                      <span className="text-[10px] text-amber-400">حفظ فوري</span>
                    </label>
                    <input
                      type="text"
                      value={testBotToken}
                      onChange={e => setTestBotToken(e.target.value)}
                      placeholder="123456789:AAF..."
                      dir="ltr"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-amber-400"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">سيتم حفظ التوكن فورياً وتحديث الخادم</span>
                  </div>
                </div>
              </div>
            )}

            {/* TWITTER ACCOUNT SELECTION */}
            {(platform === 'twitter' || platform === 'both') && accounts.length > 0 && (
              <div>
                <label className="block text-slate-300 font-bold mb-1">حساب تويتر المخصص للنشر:</label>
                <select
                  value={testAccountId}
                  onChange={e => setTestAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.username} — {acc.university} ({acc.display_name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* CARD OPTION */}
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCard}
                  onChange={e => setIncludeCard(e.target.checked)}
                  className="accent-sky-500"
                />
                <span className="font-bold text-slate-200">
                  توليد وربط بطاقة إعلان مصممة فائقة الدقة (1080x1350) بالخطوط الأكاديمية
                </span>
              </label>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleExecuteTestPublish}
                disabled={isPublishingTest}
                className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-sky-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPublishingTest ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جارٍ تصميم البطاقة وتنفيذ النشر التجريبي...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>إرسال المنشور التجريبي والتحقق الفوري 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RESULTS & PREVIEW PANEL */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📊 نتيجة وتفاصيل الفحص</span>
              </h3>
              {publishResult && (
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    publishResult.success
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {publishResult.success ? 'اكتمل بنجاح ✅' : 'يوجد ملاحظات ⚠️'}
                </span>
              )}
            </div>

            {!publishResult && !isPublishingTest && (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Zap className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">اضغط على زر (إرسال المنشور التجريبي) لبدء الفحص العملي المباشر.</p>
                <p className="text-[11px] text-slate-600">سيتم اختبار تصميم الصورة، الاتصال بالقناة، وتجهيز التغريدة خطوة بخطوة.</p>
              </div>
            )}

            {isPublishingTest && (
              <div className="text-center py-12 text-sky-400 space-y-3">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin" />
                <p className="text-xs font-bold text-white">جاري الاتصال بالقنوات وتوليد البطاقة الأكاديمية...</p>
              </div>
            )}

            {publishResult && (
              <div className="space-y-3 text-xs">
                {/* STEP BY STEP LOG */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-300 block">سجل الخطوات المنفذة:</span>
                  {publishResult.steps.map((st, i) => {
                    const isOk = st.status === 'ok';
                    const isWarn = st.status === 'warning';
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                          isOk
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                            : isWarn
                            ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                            : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                        }`}
                      >
                        {isOk && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                        {isWarn && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                        {!isOk && !isWarn && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                        <div className="text-[11px] leading-relaxed">
                          <span className="font-bold">{st.msg}</span>
                          {st.preview && (
                            <pre className="mt-1 p-2 bg-slate-950 rounded text-[10px] text-slate-300 font-sans whitespace-pre-wrap">
                              {st.preview}
                            </pre>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* GENERATED CARD PREVIEW */}
                {publishResult.card_url && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="font-bold text-slate-300 flex items-center justify-between">
                      <span>البطاقة المصممة فائقة الدقة:</span>
                      <a
                        href={publishResult.card_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-sky-400 hover:underline flex items-center gap-1"
                      >
                        <span>فتح بالحجم الكامل</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </span>
                    <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 relative group">
                      <img
                        src={publishResult.card_url}
                        alt="بطاقة الإعلان التجريبي"
                        className="w-full h-48 object-cover object-top"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>مسار حفظ البطاقات والمنشورات:</span>
            <code className="text-amber-400 font-mono text-[10px]">/sdcard/Download/ملف_النشر</code>
          </div>
        </div>
      </div>
    </div>
  );
};
