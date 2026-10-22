/*CMD
  command: /set_api_key
  help: تعديل مفتاح الـ API Key للذكاء الاصطناعي
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 🔑 **تعديل مفتاح الـ API Key الخاص بالذكاء الاصطناعي**:\n\nالمفتاح الافتراضي المعتمد:\n`sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii`\n\nأرسل مفتاح الـ API Key الجديد الآن:\n\n*(أرسل المفتاح كرسالة عادية، أو أرسل /cancel للإلغاء)*
  keyboard: 
  aliases: 
CMD*/

if (!message || message.trim() == "/cancel") {
  Bot.sendMessage("تم إلغاء تعديل المفتاح ✅");
  Bot.runCommand("/ai");
  return;
}

var key = message.trim();
if (key.length < 10) {
  Bot.sendMessage("❌ المفتاح المدخل قصير جداً وغير صالح! تأكد من نسخ المفتاح كاملاً.");
  Bot.runCommand("/ai");
  return;
}

Bot.setProperty("ai_api_key", key, "string");
var masked = key.substring(0, 8) + "..." + key.substring(key.length - 4);

var text = "✅ **تم بنجاح حفظ مفتاح الـ API Key الجديد!**\n\n" +
  "• المفتاح المعتمد: `" + masked + "`\n" +
  "تم تحديث بيانات الاعتماد لجميع عمليات إعادة الصياغة القادمة.";

var inline_keyboard = [
  [
    { title: "⚡ فحص سرعة الاتصال بالمفتاح الجديد", command: "/api_test" },
    { title: "⚙️ العودة لإعدادات الذكاء", command: "/ai" }
  ],
  [
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
