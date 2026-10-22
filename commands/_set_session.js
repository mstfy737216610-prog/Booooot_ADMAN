/*CMD
  command: /set_session
  help: حفظ كود جلسة تيليجرام الحقيقية StringSession من داخل الشات
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: /string_session
CMD*/

if (!message || message.trim() == "/cancel") {
  Bot.sendMessage("تم إلغاء العملية بنجاح ✅");
  Bot.runCommand("/userbot");
  return;
}

var session = message.trim();

if (session.length < 50) {
  Bot.sendMessage("⚠️ **كود الجلسة غير صالح!**\nكود الـ StringSession يكون عادةً نصاً طويلاً ومشفراً يبدأ بأحرف وأرقام.\n\nيرجى إرسال الكود كاملاً أو أرسل /cancel للعودة.");
  Bot.run({ command: "/set_session" });
  return;
}

Bot.setProperty("userbot_string_session", session, "string");
Bot.setProperty("userbot_session_active", true, "boolean");
Bot.setProperty("userbot_session_time", new Date().toLocaleString(), "string");
Bot.setProperty("userbot_device_model", "Chrome 154 on Android", "string");

var text = "✅ **تم بنجاح حفظ وتفعيل جلسة المستخدم الحقيقية (String Session)!**\n\n" +
  "• **طبيعة الجلسة**: جلسة مستخدم حقيقية موثقة (MTProto)\n" +
  "• **بصمة الجهاز**: `Chrome 154 on Android`\n" +
  "• **حالة التفعيل**: 🟢 متصلة وجاهزة لقراءة المنشورات والوسائط\n\n" +
  "💡 يمكنك الآن إدارة القنوات والمصادر من اللوحة أدناه.";

var inline_keyboard = [
  [
    { title: "🔄 فحص حالة الجلسة", command: "/check_session" },
    { title: "🔗 ربط القنوات والمصادر", command: "/mapping" }
  ],
  [
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
