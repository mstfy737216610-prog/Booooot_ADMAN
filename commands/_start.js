/*CMD
  command: /start
  help: لوحة التحكم الرئيسية الشاملة في تيليجرام عبر Bots.Business
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 🟢 تشغيل / إيقاف البوت, 📝 صياغة ونشر خبر فوري\n⚙️ إعدادات الذكاء الاصطناعي, 🔗 إدارة وربط المصادر\n👤 نظام السحب واليوزربوت, 📊 حالة النظام والتقارير\n🎯 إعلان خدماتي البديل, 🧪 تجربة الصياغة الفورية
  aliases: 🎛 لوحة التحكم الرئيسية, لوحة التحكم, /help, /menu, /admin, الرئيسية
CMD*/

// بيانات الآدمن المشرف
var ADMIN_ID = 7607633343;
var ADMIN_USER = "M_S_F_G";

// جلب الحالة والخصائص المخزنة
var is_paused = Bot.getProperty("bot_paused", false);
var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");
var base_url = Bot.getProperty("ai_base_url", "https://api.hcnsec.cn/v1");
var total_processed = Bot.getProperty("total_processed", 0);
var mappings = Bot.getProperty("channel_mappings");

if (!mappings || !Array.isArray(mappings)) {
  mappings = [
    {
      target: "@MyUniversityChannel",
      sources: ["@KSU_News", "@moe_gov_sa"],
      enabled: true,
      name: "القناة الأكاديمية (أ)"
    },
    {
      target: "@StudentServicesNews",
      sources: ["@saudi_universities", "@kau_edu_sa"],
      enabled: true,
      name: "قناة الخدمات (ب)"
    }
  ];
  Bot.setProperty("channel_mappings", mappings, "json");
}

var session_active = Bot.getProperty("userbot_session_active", true);
var status_emoji = is_paused ? "🔴 متوقف مؤقتاً" : "🟢 نشط ويعمل 24/7";
var session_status = session_active ? "🟢 متصل (Chrome 154 on Android)" : "🔴 غير مسجل";

var bot_text = "👑 **مرحباً بك يا مديرنا العزيز @" + ADMIN_USER + "**!\n" +
  "أنت المشرف المعتمد والمخول بالتحكم الكامل في النظام (ID: `" + ADMIN_ID + "`)\n\n" +
  "🎛 **نظام إدارة ونشر المحتوى الأكاديمي واليوزربوت (Bots.Business Engine)**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "• **حالة البوت**: " + status_emoji + "\n" +
  "• **نموذج الذكاء المعتمد**: `" + current_model + "` ⚡ (الأسرع والأدق)\n" +
  "• **بوابة الذكاء الاصطناعي**: `" + base_url + "`\n" +
  "• **جلسة سحب المنشورات**: " + session_status + "\n" +
  "• **قنوات النشر المربوطة**: " + mappings.length + " قناة هدف مستقلة\n" +
  "• **إجمالي المنشورات المعالجة**: " + total_processed + " منشور\n" +
  "• **نقل الوسائط**: صور أصلية، فيديو، ومستندات PDF كاملة\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "💡 **طريقة التشغيل من تيليجرام مباشرة**:\n" +
  "وجّه أي منشور من أي قناة إلى البوت هنا، أو اكتب خبراً عبر زر 'نشر خبر فوري'، وسيتكفل البوت بالباقي!\n\n" +
  "👇 **تحكم بكافة أقسام ووظائف البوت من الأزرار التفاعلية أدناه:**";

var inline_keyboard = [
  [
    { title: "📝 صياغة ونشر خبر فوري جديد", command: "/new_post" },
    { title: is_paused ? "▶️ تشغيل البوت" : "⏸️ إيقاف البوت", command: "/pause" }
  ],
  [
    { title: "⚙️ إعدادات الذكاء الاصطناعي", command: "/ai" },
    { title: "🔗 ربط القنوات والمصادر", command: "/mapping" }
  ],
  [
    { title: "👤 نظام السحب وقراءة القنوات", command: "/userbot" },
    { title: "📊 حالة النظام والتقارير", command: "/status" }
  ],
  [
    { title: "🎯 إعلان خدماتي البديل", command: "/ad" },
    { title: "🧪 تجربة الصياغة الفورية", command: "/test" }
  ],
  [
    { title: "📋 مصادر المراقبة", command: "/sources" },
    { title: "⚡ فحص سرعة الاستجابة", command: "/api_test" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, bot_text);
