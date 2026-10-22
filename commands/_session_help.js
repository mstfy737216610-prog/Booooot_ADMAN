/*CMD
  command: /session_help
  help: دليل استخراج كود الجلسة StringSession من داخل تيليجرام
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var text = "📖 **كيفية الحصول على كود الجلسة (StringSession) من داخل تيليجرام فقط (بدون ترمكس وبدون ويب):**\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "1️⃣ افتح تطبيق تيليجرام وابحث عن البوت الموثوق: `@StringSessionBot` أو `@GenStrBot`\n" +
  "2️⃣ اضغط Start ثم اختر **Pyrogram** أو **Telethon**\n" +
  "3️⃣ أدخل رقم هاتفك وكود التحقق الذي يصلك داخل تيليجرام\n" +
  "4️⃣ سيرسل لك البوت كود الجلسة المشفر في محادثة 'الرسائل المحفوظة' (Saved Messages)\n" +
  "5️⃣ انسخ الكود وارجع هنا واضغط على زر: `🔑 إدخال كود StringSession جاهز` والصقه!\n\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "💡 **ملاحظة هامة**: إذا كنت تريد النشر التلقائي الأسهل والأسرع، يمكنك ببساطة **توجيه (Forward)** المنشورات لهذا البوت أو إضافته مشرفاً في القنوات دون الحاجة لأي جلسات!";

var inline_keyboard = [
  [
    { title: "🔑 إدخال كود StringSession الآن", command: "/prompt_session" }
  ],
  [
    { title: "⚡ العودة لإدارة الجلسة", command: "/userbot" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
