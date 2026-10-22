/*CMD
  command: /on_api_test_error
  help: معالج فحص بوابة الذكاء الاصطناعي
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");

var text = "⚡ **تقرير فحص بوابة الذكاء الاصطناعي:**\n\n" +
  "• **البوابة**: `https://api.hcnsec.cn/v1`\n" +
  "• **النموذج المحدد**: `" + current_model + "`\n" +
  "• **نظام الأمان اللحظي**: مفعل 🟢 (في حال أي تأخير من السيرفر الخارجي، يتدخل محرك التنسيق التلقائي فوراً لضمان عدم تأخر أي منشور).\n\n" +
  "💡 يمكنك تجربة فحص الاستجابة مرة أخرى أو تجربة صياغة منشور كامل.";

var inline_keyboard = [
  [
    { title: "⚡ إعادة الفحص السريع", command: "/api_test" },
    { title: "🧪 تجربة صياغة منشور", command: "/test" }
  ],
  [
    { title: "⚙️ إعدادات النماذج", command: "/ai" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
