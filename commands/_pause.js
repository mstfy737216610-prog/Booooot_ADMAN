/*CMD
  command: /pause
  help: إيقاف أو تشغيل البوت والنشر التلقائي
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🟢 تشغيل / إيقاف البوت, تشغيل / إيقاف البوت, ⏸️ تشغيل / إيقاف البوت, ⏸ إيقاف / استئناف, ⏸ إيقاف / تشغيل البوت, /resume, /toggle, إيقاف البوت, تشغيل البوت
CMD*/

var is_paused = Bot.getProperty("bot_paused", false);
var new_state = !is_paused;
Bot.setProperty("bot_paused", new_state, "boolean");

var text = "";
if (new_state) {
  text = "⏸️ **تم إيقاف النشر التلقائي للبوت مؤقتاً!**\n\n" +
    "• حالة البوت: 🔴 متوقف\n" +
    "• لن يتم توجيه أي منشورات جديدة إلى قنواتك حتى تعيد تشغيله.\n" +
    "• يمكنك إعادة تشغيله في أي وقت بالضغط على زر التشغيل أدناه.";
} else {
  text = "▶️ **تم استئناف وتشغيل النشر التلقائي بنجاح!**\n\n" +
    "• حالة البوت: 🟢 نشط ويعمل على مدار الساعة 24/7\n" +
    "• يقوم الآن بمراقبة كافة المصادر وإعادة صياغتها ونشرها فوراً.";
}

var inline_keyboard = [
  [
    { title: new_state ? "▶️ تشغيل البوت الآن" : "⏸️ إيقاف البوت مؤقتاً", command: "/pause" }
  ],
  [
    { title: "📊 عرض تقرير النشر", command: "/status" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
