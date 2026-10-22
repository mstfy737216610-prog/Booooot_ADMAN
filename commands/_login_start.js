/*CMD
  command: /login_start
  help: ربط وتسجيل جلسة المستخدم المباشرة
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: تسجيل دخول جديد, /login
CMD*/

var text = "👤 **خيارات تفعيل جلسة المستخدم وسحب المنشورات من داخل تيليجرام:**\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "⚡ **الخيار 1: المحرك التلقائي الفوري (بدون رقم هاتف أو كود تحقق)**:\n" +
  "• يعمل مباشرة 100% داخل تطبيق Bots.Business وتيليجرام دون أي إعدادات معقدة!\n" +
  "• ما عليك سوى **توجيه (Forward)** أي منشور من أي قناة خاصة أو عامة إلى هذا الشات مع البوت.\n" +
  "• أو إضافة البوت `@admiuin_bot` **كمشرف (Admin)** في القنوات لنشر كل جديد تلقائياً.\n\n" +
  "🔑 **الخيار 2: ربط جلسة مستخدم حقيقية (String Session)**:\n" +
  "• إذا كنت تملك كود جلسة بايروجرام/تيليثون (StringSession)، يمكنك لصقه مباشرة في البوت.\n" +
  "• (يمكنك توليد الجلسة في ثوانٍ من داخل تيليجرام عبر البوت الرسمي المعتمد `@StringSessionBot` مجاناً دون حاسوب ودون ترمكس).\n\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "👇 **اختر الطريقة المفضلة لديك أدناه:**";

var inline_keyboard = [
  [
    { title: "⚡ تفعيل المحرك التلقائي الفوري (موصى به)", command: "/userbot" }
  ],
  [
    { title: "🔑 إدخال كود StringSession جاهز", command: "/prompt_session" }
  ],
  [
    { title: "💡 شرح كيفية استخراج StringSession من تيليجرام", command: "/session_help" }
  ],
  [
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
