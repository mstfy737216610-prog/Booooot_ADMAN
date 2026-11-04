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
  ExternalLink
} from 'lucide-react';

export interface TwitterSettings {
  enabled: number;
  api_key: string;
  api_secret: string;
  access_token: string;
  access_secret: string;
  bearer_token: string;
  auto_publish: number;
  auto_thread: number;
  max_chars: number;
  custom_hashtags: string;
  last_tweet_id?: string;
  updated_at?: string;
}

export const TwitterIntegrationPanel: React.FC = () => {
  const [settings, setSettings] = useState<TwitterSettings>({
    enabled: 0,
    api_key: '',
    api_secret: '',
    access_token: '',
    access_secret: '',
    bearer_token: '',
    auto_publish: 0,
    auto_thread: 0,
    max_chars: 280,
    custom_hashtags: '#أخبار_الجامعات #القبول_والتسجيل'
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Test Tweet Simulator
  const [testText, setTestText] = useState('إعلان رسمي: بدء فترة التحويل الداخلي بين كليات جامعة الملك سعود للفصل الثاني عبر بوابة النظام الأكاديمي مع إرفاق شروط المعدلات والمفاضلة.');
  const [testUniv, setTestUniv] = useState('جامعة الملك سعود');
  const [testResult, setTestResult] = useState<{ formattedTweet?: string; result?: any } | null>(null);
  const [testing, setTesting] = useState(false);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/twitter/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      }
    } catch (e) {
      console.warn('Failed to fetch twitter settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/twitter/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg('تم حفظ وتحديث إعدادات منصة تويتر (X) بنجاح 💾');
      } else {
        showToastMsg(data.error || 'تعذر حفظ إعدادات تويتر');
      }
    } catch {
      showToastMsg('خطأ أثناء حفظ إعدادات تويتر');
    } finally {
      setSaving(false);
    }
  };

  const handleTestTweet = async () => {
    if (!testText.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/twitter/test-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText, targetUniv: testUniv })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data);
        showToastMsg('تمت صياغة التغريدة المستقلة ومحاكاتها بنجاح 🐦');
      } else {
        showToastMsg(data.error || 'فشل اختبار التغريدة');
      }
    } catch {
      showToastMsg('خطأ في اختبار صياغة التغريدة');
    } finally {
      setTesting(false);
    }
  };

  const hasCredentials = Boolean(
    settings.bearer_token || (settings.api_key && settings.access_token)
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 px-4 py-2 bg-slate-900 border border-sky-500/50 text-white text-xs font-bold rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
                <Twitter className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-extrabold text-white">
                تكامل النشر المزدوج والمستقل على منصة تويتر (X Publishing Integration)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              نظام النشر الآلي المتزامن لمنصة تويتر (X) وقنوات تيليجرام. تصاغ منشورات تويتر بصورة مستقلة ومكثفة (بحد أقصى 280 حرف، واختيار دقيق للهاشتاجات وروابط البوابات)، مع توفير محرك محاكاة واختبار الصياغة قبل الربط المباشر.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 text-xs font-bold rounded-xl border flex items-center gap-1.5 ${
                settings.enabled && settings.auto_publish
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  settings.enabled && settings.auto_publish ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              ></span>
              <span>
                {settings.enabled && settings.auto_publish ? 'النشر التلقائي نشط' : 'النشر التلقائي متوقف'}
              </span>
            </span>

            <button
              onClick={fetchSettings}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Master Toggles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Main Toggle */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-extrabold text-white block">
                تفعيل تكامل منصة تويتر (X Integration)
              </span>
              <span className="text-[11px] text-slate-400 block">
                تجهيز المحرك لصياغة المنشورات التويترية والربط عبر واجهة API
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled === 1}
                onChange={(e) => {
                  const val = e.target.checked ? 1 : 0;
                  setSettings(prev => ({ ...prev, enabled: val }));
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
          </div>

          {/* Auto Publish Toggle */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-extrabold text-white block">
                النشر التلقائي المزدوج (Auto Dual-Publish)
              </span>
              <span className="text-[11px] text-slate-400 block">
                نشر الأخبار الأكاديمية على تويتر فور اعتمادها ونشرها في تيليجرام
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.auto_publish === 1}
                onChange={(e) => {
                  const val = e.target.checked ? 1 : 0;
                  setSettings(prev => ({ ...prev, auto_publish: val }));
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Twitter API Credentials & Format Form */}
      <form onSubmit={handleSaveSettings} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">إعدادات ومفاتيح الربط البرمجي لتويتر (Twitter Developer API)</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {hasCredentials ? '✅ الاعتمادات مهيأة في قاعدة البيانات' : 'ℹ️ يمكن إدخال المفاتيح أو استخدام المحاكي'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Bearer Token (v2 App-Only أو User Context):</label>
            <input
              type="password"
              value={settings.bearer_token}
              onChange={(e) => setSettings({ ...settings, bearer_token: e.target.value })}
              placeholder="AAAAAAAAAAAAAAAAAAAAA..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">API Key (Consumer Key):</label>
            <input
              type="text"
              value={settings.api_key}
              onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
              placeholder="e.g. n3k2p8..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">API Secret Key (Consumer Secret):</label>
            <input
              type="password"
              value={settings.api_secret}
              onChange={(e) => setSettings({ ...settings, api_secret: e.target.value })}
              placeholder="e.g. 9xkL..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Access Token:</label>
            <input
              type="text"
              value={settings.access_token}
              onChange={(e) => setSettings({ ...settings, access_token: e.target.value })}
              placeholder="e.g. 172901..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Formatting Rules */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">الهاشتاجات المعتمدة للتغريدات (مفصولة بمسافة):</label>
            <input
              type="text"
              value={settings.custom_hashtags}
              onChange={(e) => setSettings({ ...settings, custom_hashtags: e.target.value })}
              placeholder="#أخبار_الجامعات #القبول_والتسجيل"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">الحد الأقصى لعدد الحروف في التغريدة:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="100"
                max="280"
                value={settings.max_chars}
                onChange={(e) => setSettings({ ...settings, max_chars: Number(e.target.value) })}
                className="w-28 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-center focus:outline-none focus:border-sky-500"
              />
              <span className="text-[11px] text-slate-400">حرفاً (الحد القياسي لتويتر 280 حرف)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-sky-950/40 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>حفظ إعدادات تويتر 💾</span>
          </button>
        </div>
      </form>

      {/* Test Tweet Simulator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-sky-400 border-b border-slate-800 pb-3">
          <Sparkles className="w-4 h-4" />
          <h3 className="text-sm font-bold text-white">محاكي واختبار الصياغة التويترية المستقلة (Tweet Formatter Simulator)</h3>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">أدخل نص خبر أو إعلان جامعي لتجربة صياغته لمنصة تويتر:</label>
            <textarea
              rows={3}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500 leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-slate-400 font-medium">الجامعة المستهدفة:</span>
              <input
                type="text"
                value={testUniv}
                onChange={(e) => setTestUniv(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
              />
            </div>

            <button
              onClick={handleTestTweet}
              disabled={testing || !testText.trim()}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {testing ? (
                <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Twitter className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span>تجربة الصياغة التويترية 🐦</span>
            </button>
          </div>

          {/* Formatted Preview Box */}
          {testResult && testResult.formattedTweet && (
            <div className="p-4 bg-slate-950 border border-sky-500/30 rounded-xl space-y-2 mt-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-2">
                <span className="font-bold text-sky-400">معاينة التغريدة الناتجة (صياغة مكثفة ومستقلة عن تيليجرام):</span>
                <span className="font-mono tabular-nums text-slate-300">
                  {testResult.formattedTweet.length} / {settings.max_chars || 280} حرف
                </span>
              </div>
              <div className="text-white text-xs whitespace-pre-wrap leading-relaxed font-sans">
                {testResult.formattedTweet}
              </div>
              {testResult.result?.note && (
                <p className="text-[11px] text-amber-300/90 pt-2 border-t border-slate-800/80">
                  ℹ️ ملاحظة المحرك: {testResult.result.note === 'queued_ready_for_credentials' ? 'تم تجهيز التغريدة بنجاح وجاهزة للإرسال الحي عند تفعيل توكنات الحساب.' : testResult.result.note}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
