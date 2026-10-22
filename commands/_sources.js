/*CMD
  command: /sources
  help: عرض وإدارة مصادر المراقبة والقنوات الخارجية
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 📋 إدارة المصادر, المصادر, /channels_list, 📋 قائمة المصادر
CMD*/

var monitored = Bot.getProperty("monitored_sources");
if (!monitored || !Array.isArray(monitored) || monitored.length === 0) {
  monitored = ["@KSU_News", "@moe_gov_sa", "@mstfyuhhh"];
  Bot.setProperty("monitored_sources", monitored, "json");
}

var target_current = Bot.getProperty("target_channels") || "@jhdhhdcj";
var auto_crawl = Bot.getProperty("auto_crawl_enabled", true);

var text = "📋 **إدارة ومراقبة المصادر الخارجية (External Sources Hub)**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "📡 **المصادر المراقبة حالياً (" + monitored.length + "):**\n";

for (var k = 0; k < monitored.length; k++) {
  var s_name = monitored[k].replace(/^@/, "");
  var last_id = Bot.getProperty("last_crawl_id_" + s_name.toLowerCase(), 0);
  text += "  " + (k + 1) + ". `" + monitored[k] + "` 🟢 مراقبة نشطة " + (last_id > 0 ? "(آخر منشور: #" + last_id + ")" : "") + "\n";
}

text += "\n━━━━━━━━━━━━━━━━━━━\n" +
  "🎯 **قناة النشر الهدف الحالية**: `" + target_current + "`\n" +
  "⏱️ **السحب والمراقبة التلقائية**: " + (auto_crawl ? "🟢 شغالة تلقائياً كل 90 ثانية" : "🔴 يدوية فقط") + "\n\n" +
  "⚡ **كيف يقرأ البوت المنشورات من هذه المصادر؟**\n" +
  "  1️⃣ **الساحب الآلي الذكي (Scraper)**: يفحص البوت روابط القنوات تلقائياً ويسحب المنشورات والصور ويعيد صياغتها بالذكاء الاصطناعي دون الحاجة لأن تكون مشرفاً في القنوات المصدر!\n" +
  "  2️⃣ **التوجيه المباشر (Forward)**: وجّه أي رسالة من أي قناة إلى البوت هنا وسينشرها فوراً!\n" +
  "  3️⃣ **إضافة البوت كمشرف**: إذا كانت القناة ملكك، أضف البوت مشرفاً لقراءة المنشورات لحظياً.\n\n" +
  "👇 **اختر إجراءً من الأزرار التفاعلية أدناه:**";

var inline_keyboard = [
  [
    { title: "🔄 فحص وسحب المنشورات الآن", command: "/crawl_sources" },
    { title: "➕ إضافة مصادر خارجية", command: "/add_source" }
  ],
  [
    { title: "📢 تحديد قناة النشر الهدف", command: "/set_channel" },
    { title: "🗑️ حذف مصدر خارجي", command: "/del_source" }
  ],
  [
    { title: "🗺️ خريطة القنوات والأهداف", command: "/mapping" },
    { title: "📝 صياغة ونشر خبر فوري", command: "/new_post" }
  ],
  [
    { title: "🧪 تجربة الصياغة الفورية", command: "/test" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
