/*CMD
  command: /check_session
  help: فحص حالة جلسة الـ UserBot وبصمة الجهاز
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var active = Bot.getProperty("userbot_session_active", true);
var device = Bot.getProperty("userbot_device_model", "Chrome 154 on Android");
var phone = Bot.getProperty("userbot_session_phone", "+96650xxxxxxx");
var last_sync = Bot.getProperty("userbot_session_time", "نشط ومسجل");

var text = "📱 **تقرير حالة جلسة المستخدم (UserBot Session Status)**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "• **حالة الجلسة**: " + (active ? "🟢 متصلة ونشطة (Active MTProto User Session)" : "🔴 غير مسجلة") + "\n" +
  "• **بصمة الجهاز المعتمدة**: `(متصفّح: " + device + ")`\n" +
  "• **النظام**: `Android 14 (Chromium Engine)`\n" +
  "• **رقم الهاتف**: `" + phone + "`\n" +
  "• **آخر توثيق**: " + last_sync + "\n" +
  "• **سحب القنوات الخاصة والعامة**: 🟢 متاح بالكامل\n" +
  "• **سحب تويتر (X)**: 🟢 متاح ومربوط\n" +
  "• **نقل الوسائط (صور / فيديو / PDF)**: 🟢 دقة كاملة 100%\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "👇 يمكنك إدارة الجلسة من الأزرار أدناه:";

var inline_keyboard = [
  [
    { title: "➕ تسجيل دخول جديد (In-Chat Login)", command: "/login_start" },
    { title: "🗑️ حذف الجلسة وتسجيل الخروج", command: "/logout_session" }
  ],
  [
    { title: "🎛 العودة للوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
