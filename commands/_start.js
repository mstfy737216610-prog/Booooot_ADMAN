/*CMD
  command: /start
  help: عرض لوحة التحكم الرئيسية
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🎛 لوحة التحكم الرئيسية, لوحة التحكم, /help
CMD*/

var keyboard = "🎛 لوحة التحكم الرئيسية, 📊 حالة البوت\n📋 إدارة المصادر, 🎯 إعلاني الخاص (المنافسين)\n⚙️ تعليمات المحرر, 🔑 المفاتيح والبيانات\n⏸ إيقاف / استئناف, 🧪 تجربة صياغة منشور";

var inline_keyboard = [
  [
    { title: "📋 المصادر المراقبة (sources.json)", command: "/sources" },
    { title: "🎯 إعلان خدماتي البديل", command: "/ad" }
  ],
  [
    { title: "⚙️ تخصيص تعليمات المشرف", command: "/instructions" },
    { title: "🔑 بيانات المفتاح والتوكن", command: "/keys" }
  ],
  [
    { title: "📊 الإحصائيات الشاملة", command: "/status" },
    { title: "✍️ صياغة منشور الآن", command: "/test" }
  ]
];

var text = "👋 مرحباً بك يا مديرنا العزيز @M_S_F_G!\n" +
  "👑 أنت المشرف المعتمد والمخول بالتحكم الكامل (ID: 7607633343)\n\n" +
  "🎛 **لوحة التحكم بمحرر المحتوى التعليمي الجامعي الذكي**:\n" +
  "• حالة النشر التلقائي: 🟢 نشط ويعمل 24/7\n" +
  "• النموذج الفعال: DeepSeek-V4.1-Flash\n" +
  "• مستودع GitHub: mstfy737216610-prog/ADMIN_-\n\n" +
  "👇 **اختر من الأزرار التفاعلية أدناه للتحكم المباشر:**\n" +
  "(أو أرسل/وجّه أي خبر للمحادثة وسيقوم البوت بإعادة صياغته فوراً)";

Bot.sendKeyboard(keyboard, "تم تفعيل كيبورد التحكم الدائم بنجاح ✅");
Bot.sendInlineKeyboard(inline_keyboard, text);
