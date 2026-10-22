/*CMD
  command: /crawl_sources
  help: فحص وسحب المنشورات من القنوات المصدرية المعتمدة
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🔄 سحب وفحص المصادر, سحب المنشورات, /crawl, فحص المصادر, 🔄 سحب وقراءة المنشورات الآن, 🔄 فحص وسحب المنشورات
CMD*/

// 1. فحص حالة إيقاف البوت
var is_paused = Bot.getProperty("bot_paused", false);
if (is_paused) {
  Bot.sendMessage("⏸️ البوت متوقف حالياً. لتشغيل النشر، اضغط زر التشغيل في /start");
  return;
}

// 2. جلب قائمة المصادر المراقبة وقناة النشر الهدف
var monitored = Bot.getProperty("monitored_sources");
if (!monitored || !Array.isArray(monitored) || monitored.length === 0) {
  monitored = ["@KSU_News", "@moe_gov_sa", "@mstfyuhhh"];
  Bot.setProperty("monitored_sources", monitored, "json");
}

var target_current = Bot.getProperty("target_channels") || "@jhdhhdcj";
var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");

// إيقاف التكرار التلقائي العشوائي نهائياً لمنع إزعاج وتكرار الرسائل في الشات
Bot.setProperty("auto_crawl_enabled", false, "boolean");

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

// 3. فحص المصادر وإرسال الطلبات
var checked_count = 0;
for (var i = 0; i < monitored.length; i++) {
  var raw_src = monitored[i];
  var ch_name = cleanChannel(raw_src);
  if (!ch_name) continue;

  HTTP.get({
    url: "https://t.me/s/" + ch_name,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ar,en-US;q=0.9,en;q=0.8"
    },
    success: "/on_crawl_success " + ch_name,
    error: "/on_crawl_error " + ch_name,
    background: true
  });
  checked_count++;
}

// 4. إشعار المشرف مرة واحدة فقط (بدون أي تكرار آلي مزعج)
var status_msg = "🔄 **تم بدء فحص ومراقبة المصادر (" + checked_count + ") بنجاح**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n";

for (var k = 0; k < monitored.length; k++) {
  status_msg += "• `" + monitored[k] + "` 📡 جاري المراقبة والجلب...\n";
}

status_msg += "\n🎯 **القناة الهدف المعتمدة للنشر**: `" + target_current + "`\n" +
  "🤖 **النموذج الذكي**: `" + current_model + "`\n" +
  "🛡 **الحماية من التكرار**: تم إيقاف الرسائل المتكررة المزعجة نهائياً.\n\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "⚡ **كيف تضمن وصول المنشورات إلى قناتك فوراً 100%؟**\n\n" +
  "1️⃣ **التوجيه المباشر (الأسرع والأسهل على الإطلاق)**:\n" +
  "   قم بتوجيه (Forward) أي منشور من أي قناة إلى شات البوت هنا مباشرة، وسيقوم البوت فوراً وبشكل تلقائي بما يلي:\n" +
  "   • استخراج الصور والوسائط بدقة عالية.\n" +
  "   • صياغة المحتوى أكاديمياً بنموذج " + current_model + ".\n" +
  "   • استبدال إعلانات المنافسين بإعلانك الخاص @M_S_F_G.\n" +
  "   • نشره فوراً في قناتك `" + target_current + "` دون أي تأخير!\n\n" +
  "2️⃣ **صياغة خبر فوري يدوياً**:\n" +
  "   أرسل نص الخبر أو الصورة هنا مباشرة أو عبر زر `📝 صياغة ونشر خبر فوري`.\n\n" +
  "3️⃣ **السحب الآلي الكامل عبر MTProto (اليوزربوت)**:\n" +
  "   للقراءة الآلية من كافة القنوات العامة والخاصة على مدار الساعة دون قيود ويب، شغّل سكريبت `main.py` بحسابك الشخصي عبر Telethon.";

var kb = [
  [
    { title: "📝 صياغة ونشر خبر فوري", command: "/new_post" },
    { title: "➕ إضافة مصادر أخرى", command: "/add_source" }
  ],
  [
    { title: "📢 قناة النشر المعتمدة", command: "/set_channel" },
    { title: "📋 قائمة المصادر", command: "/sources" }
  ],
  [
    { title: "🧪 تجربة الصياغة الفورية", command: "/test" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(kb, status_msg);
