/*CMD
  command: /userbot
  help: نظام السحب والتسجيل المباشر وجلسة المستخدم الحقيقية (UserBot & Scraping)
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 👤 إدارة الحساب المسجل, /session
CMD*/

var has_session = Bot.getProperty("userbot_session_active", true);
var device_model = Bot.getProperty("userbot_device_model", "Chrome 154 on Android");
var phone = Bot.getProperty("userbot_session_phone", "+96650xxxxxxx");

var text = "👤 **نظام السحب والتسجيل (UserBot Session & Scraping)**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "• **طبيعة الجلسة**: جلسة مستخدم حقيقية (MTProto User Session)\n" +
  "• **حالة الجلسة**: " + (has_session ? "🟢 متصلة وجاهزة للعمل" : "🔴 غير مسجلة") + "\n" +
  "• **بصمة الجهاز المعتمدة**: `(متصفّح: " + device_model + ")`\n" +
  "• **الحساب المرتبط**: `" + phone + "`\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "📡 **قدرات السحب والتسجيل المدمجة**:\n" +
  "  1️⃣ **القنوات العامة والخاصة**: سحب الرسائل والمنشورات فوراً دون الحاجة لرتبة مشرف.\n" +
  "  2️⃣ **منصات التواصل وتويتر (X)**: مراقبة المصادر وتحويل المنشورات آلياً للمستودع.\n" +
  "  3️⃣ **الوسائط بدقة فائقة**: نقل الصور، الفيديوهات MP4، المستندات، ملفات PDF، والتنسيقات دون أي ضغط أو تشويه.\n\n" +
  "👇 **اختر إجراءً من الأزرار التفاعلية أدناه:**";

var inline_keyboard = [
  [
    { title: "➕ تسجيل دخول جديد (In-Chat Login)", command: "/login_start" }
  ],
  [
    { title: "🔄 فحص حالة الاتصال بالجلسة", command: "/check_session" },
    { title: "🗑️ تسجيل الخروج وحذف الجلسة", command: "/logout_session" }
  ],
  [
    { title: "🔗 إدارة وربط المصادر والأهداف", command: "/mapping" },
    { title: "🎛 العودة للوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
