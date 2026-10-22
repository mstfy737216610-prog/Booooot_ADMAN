/*CMD
  command: /start
  help: لوحة التحكم الرئيسية الشاملة في تيليجرام عبر Bots.Business
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 🔄 فحص وسحب المنشورات, ➕ إضافة مصادر خارجية\n📢 تحديد قناة النشر, 📝 صياغة ونشر خبر فوري\n📋 قائمة المصادر, ⚙️ إعدادات الذكاء الاصطناعي\n🔗 ربط القنوات والأهداف, 🎯 إعلان خدماتي البديل\n🟢 تشغيل / إيقاف البوت, 🧪 تجربة الصياغة الفورية
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
var monitored_sources = Bot.getProperty("monitored_sources", ["@KSU_News", "@moe_gov_sa"]);
var target_current = Bot.getProperty("target_channels") || "@MyUniversityChannel";
var auto_crawl = Bot.getProperty("auto_crawl_enabled", true);

var status_emoji = is_paused ? "🔴 متوقف مؤقتاً" : "🟢 نشط ويعمل 24/7";
var crawler_status = auto_crawl ? "🟢 سحب آلي كل 90 ثانية" : "🔴 سحب يدوي";

var bot_text = "👑 **مرحباً بك يا مديرنا العزيز @" + ADMIN_USER + "**!\n" +
  "أنت المشرف المعتمد والمخول بالتحكم الكامل في النظام (ID: `" + ADMIN_ID + "`)\n\n" +
  "🎛 **نظام النشر الأكاديمي والساحب الذكي للمصادر (Bots.Business Engine)**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "• **حالة البوت**: " + status_emoji + "\n" +
  "• **الساحب الآلي للمصادر**: " + crawler_status + " ⚡\n" +
  "• **المصادر المراقبة**: " + monitored_sources.length + " مصدر نشط\n" +
  "• **قناة النشر الهدف**: `" + target_current + "`\n" +
  "• **نموذج الذكاء المعتمد**: `" + current_model + "`\n" +
  "• **بوابة الذكاء الاصطناعي**: `" + base_url + "`\n" +
  "• **إجمالي المنشورات المعالجة**: " + total_processed + " منشور\n" +
  "• **نقل الوسائط**: صور أصلية، فيديو، ومستندات كاملة\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "💡 **طريقة العمل وسحب المنشورات**:\n" +
  "  1️⃣ **الساحب التلقائي**: اضغط `🔄 فحص وسحب المنشورات الآن` لسحب أحدث الأخبار فوراً من القنوات المراقبة دون الحاجة لصلاحية مشرف.\n" +
  "  2️⃣ **تحديد قناتك**: اضغط `📢 تحديد قناة النشر` لتحديد القناة التي ترغب في النشر إليها وتأكد من رفع البوت مشرفاً فيها.\n" +
  "  3️⃣ **التوجيه المباشر**: وجّه (Forward) أي منشور من أي قناة إلى البوت ليقوم بصياغته ونشره فوراً.\n\n" +
  "👇 **تحكم بكافة أقسام ووظائف البوت من الأزرار التفاعلية أدناه:**";

var inline_keyboard = [
  [
    { title: "🔄 فحص وسحب المنشورات الآن", command: "/crawl_sources" },
    { title: "➕ إضافة مصادر خارجية", command: "/add_source" }
  ],
  [
    { title: "📢 تحديد قناة النشر الهدف", command: "/set_channel" },
    { title: "📋 قائمة المصادر المراقبة", command: "/sources" }
  ],
  [
    { title: "⚙️ إعدادات الذكاء الاصطناعي", command: "/ai" },
    { title: "🔗 ربط القنوات والأهداف", command: "/mapping" }
  ],
  [
    { title: "🎯 إعلان خدماتي البديل", command: "/ad" },
    { title: "📝 صياغة ونشر خبر فوري", command: "/new_post" }
  ],
  [
    { title: is_paused ? "▶️ تشغيل البوت" : "⏸️ إيقاف البوت", command: "/pause" },
    { title: "🧪 تجربة الصياغة الفورية", command: "/test" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, bot_text);
