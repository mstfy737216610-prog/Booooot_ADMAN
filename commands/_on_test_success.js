/*CMD
  command: /on_test_success
  help: معالج نجاح تجربة الصياغة الفورية
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var rephrased = "";
try {
  var data = JSON.parse(content);
  if (data.choices && data.choices[0] && data.choices[0].message) {
    rephrased = data.choices[0].message.content.trim();
  }
} catch (e) {}

var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");

var text = "✨ **نتيجة الصياغة الذكية الفورية بنموذج (" + current_model + "):**\n" +
  "───────────────────\n" +
  rephrased + "\n" +
  "───────────────────\n\n" +
  "💡 تم التنسيق بنجاح بدون تأخير وبأعلى معايير الدقة الأكاديمية!";

var inline_keyboard = [
  [
    { title: "📝 صياغة ونشر خبر حقيقي الآن", command: "/new_post" },
    { title: "🔄 إعادة تجربة أخرى", command: "/test" }
  ],
  [
    { title: "⚙️ إعدادات الذكاء الاصطناعي", command: "/ai" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
