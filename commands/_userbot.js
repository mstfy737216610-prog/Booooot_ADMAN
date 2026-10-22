/*CMD
  command: /userbot
  help: نظام سحب وقراءة المنشورات والتحكم من داخل تيليجرام
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 👤 إدارة اليوزربوت وجلسة الحساب, 👤 إدارة اليوزربوت, اليوزربوت, 👤 إدارة الحساب المسجل, /session, /userbot
CMD*/

var has_session = Bot.getProperty("userbot_session_active", true);
var device_model = Bot.getProperty("userbot_device_model", "Chrome 154 on Android");
var has_string = Bot.getProperty("userbot_string_session") ? "🟢 مخزنة وموثقة" : "⚪ غير محددة";

var text = "👤 **نظام سحب وقراءة المنشورات الأكاديمية (In-Telegram Engine)**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "• **طريقة التشغيل**: تعمل 100% داخل Bots.Business وتيليجرام (بدون ترمكس وبدون ويب)\n" +
  "• **حالة المحرك**: 🟢 جاهز ويعمل 24/7\n" +
  "• **بصمة المعالجة**: `(متصفّح: " + device_model + ")`\n" +
  "• **جلسة StringSession**: " + has_string + "\n" +
  "• **دقة نقل الوسائط**: 100% صور بجودتها الأصلية، فيديو MP4، ومستندات PDF\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "⚡ **كيف يعمل النظام لسحب وقراءة المنشورات من داخل تيليجرام؟**\n" +
  "  1️⃣ **طريقة التوجيه الفوري (الأسرع والأسهل)**:\n" +
  "     قم بتوجيه (Forward) أي منشور من أي قناة خاصة أو عامة إلى هذا الشات مباشرة. البوت فورياً سيعيد صياغته بالذكاء الاصطناعي، ويضع إعلانك، وينشره في قنواتك!\n\n" +
  "  2️⃣ **طريقة المشرف الآلي (24/7)**:\n" +
  "     أضف البوت مشرفاً في قناتك المصدرية وقناتك المستهدفة، وسيقوم بالتقاط ونشر كل خبر تلقائياً.\n\n" +
  "  3️⃣ **طريقة الـ StringSession (جلسة المستخدم)**:\n" +
  "     يمكنك استخراج جلسة تيليجرام في 30 ثانية من داخل تيليجرام ولصقها هنا لربط حسابك مباشرة.\n\n" +
  "👇 **اختر الإجراء المطلوب من الأزرار الشفافة أدناه:**";

var inline_keyboard = [
  [
    { title: "🔑 إدخال كود StringSession جاهز", command: "/prompt_session" },
    { title: "💡 شرح استخراج الجلسة في ثوانٍ", command: "/session_help" }
  ],
  [
    { title: "📝 صياغة ونشر خبر فوري الآن", command: "/new_post" },
    { title: "🔄 فحص حالة الاتصال بالجلسة", command: "/check_session" }
  ],
  [
    { title: "🔗 ربط القنوات والمصادر", command: "/mapping" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
