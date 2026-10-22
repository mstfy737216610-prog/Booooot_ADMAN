/*CMD
  command: /crawl_sources
  help: المحرك الذكي لسحب وقراءة المنشورات من القنوات المصدرية الخارجية تلقائياً
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🔄 سحب وفحص المصادر, سحب المنشورات, /crawl, فحص المصادر, 🔄 سحب وقراءة المنشورات الآن
CMD*/

// 1. فحص حالة إيقاف البوت
var is_paused = Bot.getProperty("bot_paused", false);
if (is_paused) {
  Bot.sendMessage("⏸️ البوت متوقف حالياً. لتشغيل السحب التلقائي، استخدم /pause أو اضغط زر التشغيل في /start");
  return;
}

// 2. جلب قائمة المصادر المراقبة
var monitored = Bot.getProperty("monitored_sources");
if (!monitored || !Array.isArray(monitored) || monitored.length === 0) {
  monitored = ["@KSU_News", "@moe_gov_sa"];
  Bot.setProperty("monitored_sources", monitored, "json");
}

function cleanChannel(ch) {
  if (!ch) return "";
  var s = String(ch).trim();
  s = s.replace(/^https?:\/\/t\.me\/s\//i, "");
  s = s.replace(/^https?:\/\/t\.me\//i, "");
  s = s.replace(/^t\.me\//i, "");
  s = s.replace(/^@/, "");
  s = s.replace(/\/.*$/, "");
  return s.trim();
}

var checked_count = 0;
for (var i = 0; i < monitored.length; i++) {
  var raw_src = monitored[i];
  var ch_name = cleanChannel(raw_src);
  if (!ch_name) continue;

  // استدعاء صفحة المعاينة العامة لقناة تيليجرام https://t.me/s/channel مع ترويسات متصفح حقيقية
  HTTP.get({
    url: "https://t.me/s/" + ch_name,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache"
    },
    success: "/on_crawl_success " + ch_name,
    error: "/on_crawl_error " + ch_name,
    background: true
  });
  checked_count++;
}

// 3. جدولة الفحص التلقائي القادم (Auto-Schedule Loop كل 90 ثانية)
var auto_crawl = Bot.getProperty("auto_crawl_enabled", true);
if (auto_crawl) {
  Bot.run({
    command: "/crawl_sources",
    run_after: 90
  });
}

// 4. إشعار المشرف إذا تم طلب الفحص يدوياً
var target_current = Bot.getProperty("target_channels") || "@jhdhhdcj";
var status_msg = "🔄 **بدأ فحص وسحب المنشورات من القنوات المصدرية (" + checked_count + ")**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n";

for (var k = 0; k < monitored.length; k++) {
  status_msg += "• `" + monitored[k] + "` 📡 جاري جلب أحدث المنشورات...\n";
}

status_msg += "\n🎯 **القناة الهدف المعتمدة لنشر الأخبار**: `" + target_current + "`\n" +
  "🤖 **النموذج الذكي المستخدم**: `" + Bot.getProperty("ai_model", "DeepSeek-V4-Flash") + "`\n" +
  "⏱️ **المراقبة التلقائية**: " + (auto_crawl ? "🟢 شغالة تلقائياً كل 90 ثانية" : "🔴 يدوية فقط") + "\n\n" +
  "⚡ *سيقوم البوت بصياغة أي منشور جديد فوراً ونشره في قناتك الهدف دون الحاجة لأن تكون مشرفاً في القنوات المصدر.*";

var kb = [
  [
    { title: "➕ إضافة مصادر أخرى", command: "/add_source" },
    { title: "📢 تغيير قناة النشر", command: "/set_channel" }
  ],
  [
    { title: "📋 قائمة المصادر", command: "/sources" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(kb, status_msg);
