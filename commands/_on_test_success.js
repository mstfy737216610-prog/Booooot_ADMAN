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

var current_model = Bot.getProperty("ai_model", "DeepSeek-V4.1-Flash");

var text = "✨ **نتيجة الصياغة الذكية الفورية بنموذج (" + current_model + "):**\n" +
  "───────────────────\n" +
  rephrased + "\n" +
  "───────────────────\n\n" +
  "💡 هل أعجبك الأسلوب؟ يمكنك تعديل النموذج أو إضافة قنوات نشر ومصادر جديدة من اللوحة.";

var inline_keyboard = [
  [
    { title: "⚙️ تغيير النموذج", command: "/ai" },
    { title: "🗺️ إدارة القنوات والمصادر", command: "/mapping" }
  ],
  [
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
