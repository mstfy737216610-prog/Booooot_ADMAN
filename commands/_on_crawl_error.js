/*CMD
  command: /on_crawl_error
  help: معالج الأخطاء عند فحص وسحب القنوات المصدر
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var ch = (params || "").trim();
var status_code = (typeof http_status !== "undefined" && http_status) ? http_status : "انقطاع أو حجب مؤقت";
var target_current = Bot.getProperty("target_channels") || "@jhdhhdcj";

var err_text = "⚠️ **تنبيه فحص المصدر @" + ch + "**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "تعذر الاتصال المباشر بصفحة القناة المصدرية (رمز الحالة: `" + status_code + "`).\n\n" +
  "💡 **الحل الفوري الأكيد لجلب المنشورات الآن:**\n" +
  "• وجّه (Forward) أي منشور من @" + ch + " مباشرة إلى هذا الشات مع البوت.\n" +
  "• وسيقوم البوت بصياغته بذكاء اصطناعي (DeepSeek) ونشره فوراً في قناتك الهدف `" + target_current + "`!\n\n" +
  "*(أو أرسل نص الخبر عبر زر صياغة خبر فوري أدناه)*";

var kb = [
  [
    { title: "📝 صياغة ونشر خبر فوري", command: "/new_post" },
    { title: "👤 إدارة جلسة الحساب", command: "/userbot" }
  ],
  [
    { title: "📢 قناة النشر المعتمدة", command: "/set_channel" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(kb, err_text);
