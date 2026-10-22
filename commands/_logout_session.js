/*CMD
  command: /logout_session
  help: تسجيل الخروج وحذف جلسة الـ UserBot
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

Bot.setProperty("userbot_session_active", false, "boolean");
Bot.setProperty("userbot_session_phone", null, "string");
Bot.setProperty("userbot_login_phone", null, "string");
Bot.setProperty("userbot_login_otp", null, "string");

var text = "🚪 **تم تسجيل الخروج وإلغاء جلسة الـ UserBot بنجاح!**\n\n" +
  "تم مسح بيانات الاعتماد من ذاكرة البوت.\n" +
  "يمكنك في أي وقت تسجيل الدخول مجدداً مباشرة من الشات.";

var inline_keyboard = [
  [
    { title: "➕ تسجيل دخول جديد الآن", command: "/login_start" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
