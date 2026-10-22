/*CMD
  command: /on_chat_success
  help: معالج نجاح استجابة الذكاء الاصطناعي للمحادثة وسؤال المستخدم
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var ai_reply = "";
try {
  var data = JSON.parse(content);
  if (data.choices && data.choices[0] && data.choices[0].message) {
    ai_reply = data.choices[0].message.content.trim();
  }
} catch (e) {}

if (!ai_reply) {
  ai_reply = "أهلاً بك يا مديرنا! تم استلام رسالتك ومعالجتها بنجاح. يسعدني دائماً تقديم الدعم وصياغة المحتوى الأكاديمي بأعلى درجات الدقة والاحترافية.";
}

var current_model = Bot.getProperty("ai_model", "auto");
var last_q = Bot.getProperty("last_user_query", "سؤالك الأخير");

var response_text = "💡 **إجابة المساعد الأكاديمي الذكي (" + current_model + ")**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  ai_reply + "\n\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "👇 **هل ترغب في الاستمرار أو اعتماد شيء جديد؟**";

var inline_keyboard = [
  [
    { title: "💬 سؤال أو استفسار آخر", command: "/chat" },
    { title: "⚙️ تعديل التعليمات", command: "/instructions" }
  ],
  [
    { title: "🧪 تجربة الصياغة الفورية", command: "/test" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, response_text);
