/*CMD
  command: /on_api_test_success
  help: معالج نجاح اختبار الذكاء الاصطناعي
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var t_start = params ? parseInt(params) : Date.now();
var duration = Date.now() - t_start;
var current_model = Bot.getProperty("ai_model", "DeepSeek-V4.1-Flash");

var reply = "جاهز";
try {
  var data = JSON.parse(content);
  if (data.choices && data.choices[0] && data.choices[0].message) {
    reply = data.choices[0].message.content.trim();
  }
} catch (e) {}

var text = "✅ **تم الاتصال بنجاح بخادم الذكاء الاصطناعي!**\n\n" +
  "• **النموذج**: `" + current_model + "`\n" +
  "• **زمن الاستجابة**: `" + duration + " ms` ⚡\n" +
  "• **رد الخادم**: " + reply + "\n" +
  "• **الحالة**: البوابة جاهزة تماماً لمعالجة منشورات القنوات الأكاديمية فورياً.";

var inline_keyboard = [
  [
    { title: "🧪 تجربة صياغة خبر كامل الآن", command: "/test" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
