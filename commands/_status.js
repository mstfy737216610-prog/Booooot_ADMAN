/*CMD
  command: /status
  help: عرض تقارير النشر وإحصائيات العمليات الشاملة
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 📊 حالة النظام والتقارير, حالة النظام, 📊 تقارير النشر, 📊 حالة البوت, /stats, /report, تقارير النشر
CMD*/

var is_paused = Bot.getProperty("bot_paused", false);
var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");
var total_processed = Bot.getProperty("total_processed", 0);
var total_ads_replaced = Bot.getProperty("total_ads_replaced", 0);
var last_post_title = Bot.getProperty("last_post_title", "تحديث جامعي وأكاديمي (فصل الصيف)");
var last_post_time = Bot.getProperty("last_post_time", "منذ قليل");
var mappings = Bot.getProperty("channel_mappings", []);

var status_str = is_paused ? "🔴 متوقف مؤقتاً" : "🟢 نشط ويعمل على مدار الساعة 24/7";

var text = "📊 **تقرير النشر الشامل وإحصائيات الأداء الحية**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "• **حالة البوت العامة**: " + status_str + "\n" +
  "• **نموذج الذكاء المعتمد**: `" + current_model + "`\n" +
  "• **بوابة الذكاء الاصطناعي**: `https://api.hcnsec.cn/v1`\n" +
  "• **إجمالي المنشورات المعالجة**: `" + total_processed + "` منشور\n" +
  "• **إعلانات المنافسين المستبدلة**: `" + total_ads_replaced + "` إعلان طالب\n" +
  "• **قنوات النشر المستهدفة**: `" + mappings.length + "` قنوات مخصصة\n" +
  "• **آخر منشور معالج**: " + last_post_title + " (" + last_post_time + ")\n" +
  "• **دعم الوسائط**: نقل كامل للصور والفيديو والمستندات بدقة فائقة\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "👇 **إجراءات سريعة على التقارير:**";

var inline_keyboard = [
  [
    { title: "🔄 تحديث التقرير الآن", command: "/status" },
    { title: "⚡ فحص سرعة الاتصال بالـ API", command: "/api_test" }
  ],
  [
    { title: "🗺️ إدارة القنوات والمصادر", command: "/mapping" },
    { title: is_paused ? "▶️ تشغيل البوت" : "⏸️ إيقاف البوت", command: "/pause" }
  ],
  [
    { title: "🎛 العودة للوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
