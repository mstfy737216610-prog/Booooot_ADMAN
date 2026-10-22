/*CMD
  command: /on_api_test_error
  help: معالج فشل اختبار الذكاء الاصطناعي
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var text = "⚠️ **تنبيه حول اتصال الذكاء الاصطناعي:**\n\n" +
  "استغرق الطلب وقتاً طويلاً أو تعذر الوصول اللحظي للبوابة. النظام مزوّد بمحرك صياغة أكاديمي احتياطي مدمج يقوم بتنسيق المنشورات وتلميعها واستبدال الإعلانات حتى في حال بطء السيرفر الخارجي.\n\n" +
  "💡 يمكنك تجربة التبديل إلى نموذج سريع مثل `DeepSeek-V4-Flash` عبر زر النماذج أدناه.";

var inline_keyboard = [
  [
    { title: "🔄 إعادة الفحص", command: "/api_test" },
    { title: "⚙️ إعدادات النماذج", command: "/ai" }
  ],
  [
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
