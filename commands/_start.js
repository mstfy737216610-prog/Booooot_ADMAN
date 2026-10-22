/*CMD
  command: /start
  help: لوحة التحكم الرئيسية المنظمة والشاملة لبوت النشر الأكاديمي الذكي V3.2
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 🏛️ إدارة الجامعات والمصادر, ➕ معالج ربط جامعة وقناة (5 خطوات)\n🔄 فحص وسحب الأخبار فوراً, 🌐 بحث أخبار جوجل الأكاديمية\n📝 صياغة ونشر خبر فوري, 🎯 إعلان خدماتي البديل\n⚙️ إعدادات الذكاء الاصطناعي, 💬 محادثة وبحث الذكاء\n🔑 مفاتيح API والاعتمادات, 👤 إدارة اليوزربوت وجلسة الحساب\n📝 تعليمات المحرر الأكاديمي, 🧪 تجربة الصياغة الفورية\n📊 حالة النظام والتقارير, 🟢 تشغيل / إيقاف البوت\n📞 الدعم الفني والمساعدة, 🌐 قنواتنا وروابط التواصل
  aliases: 🎛 لوحة التحكم الرئيسية, لوحة التحكم, /help, /menu, /admin, الرئيسية
CMD*/

var ADMIN_ID = 7607633343;
var ADMIN_USER = "M_S_F_G";

var is_paused = Bot.getProperty("bot_paused", false);
var current_model = Bot.getProperty("ai_model", "DeepSeek-V4.1-Flash");
var base_url = Bot.getProperty("ai_base_url", "https://api.hcnsec.cn/v1");
var total_processed = Bot.getProperty("total_processed", 0);
var total_ads_replaced = Bot.getProperty("total_ads_replaced", 0);

// جلب مشاريع الجامعات المعزولة
var univ_projects = Bot.getProperty("university_projects");
if (!univ_projects || !Array.isArray(univ_projects) || univ_projects.length === 0) {
  var target_ch = Bot.getProperty("target_channels") || "@jhdhhdcj";
  univ_projects = [
    {
      id: "univ_ksu",
      name: "جامعة الملك سعود",
      target_channel: target_ch,
      telegram_sources: ["@KSU_News"],
      twitter_sources: ["@ksu_news"],
      google_news_query: "جامعة الملك سعود",
      google_news_enabled: true,
      keywords: ["جامعة الملك سعود", "الملك سعود", "KSU", "القبول الموحد", "تسجيل"],
      enabled: true
    }
  ];
  Bot.setProperty("university_projects", univ_projects, "json");
}

var status_emoji = is_paused ? "🔴 متوقف مؤقتاً" : "🟢 نشط ويعمل 24/7";

var bot_text = "👑 **أهلاً بك يا مديرنا العزيز @" + ADMIN_USER + "**!\n" +
  "أنت المشرف العام المعتمد للنظام الأكاديمي والجامعي الذكي (ID: `" + ADMIN_ID + "`)\n\n" +
  "🏛️ **نظام النشر الجامعي المتقدم والعزل الصارم (Multi-University V3.2)**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "• **حالة البوت العامة**: " + status_emoji + "\n" +
  "• **مشاريع الجامعات المعزولة**: " + univ_projects.length + " جامعة مستقلة\n" +
  "• **الذكاء الاصطناعي**: `" + current_model + "` عبر " + base_url + "\n" +
  "• **جدول الربط الصارم**: كل قناة هدف مرتبطة حصرياً بمصادرها\n" +
  "• **وسم البيانات (Source Tag)**: عزل تام لمنع تداخل أو خلط المنشورات\n" +
  "• **تنقية الويب وشوائب X**: إزالة &nbsp; و X ونقاط الفراغ نهائياً\n" +
  "• **إجمالي المنشورات المعالجة**: " + total_processed + " منشور\n" +
  "• **إعلانات المنافسين المستبدلة**: " + total_ads_replaced + " إعلان بديل\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "📋 **الجامعات وقنوات النشر المربوطة حالياً**:\n";

for (var u = 0; u < univ_projects.length; u++) {
  var un = univ_projects[u];
  var u_st = un.enabled ? "🟢" : "🔴";
  bot_text += u_st + " **" + un.name + "** ➔ `" + un.target_channel + "`\n" +
    "   └ مصادر تيليجرام: " + (un.telegram_sources && un.telegram_sources.length > 0 ? un.telegram_sources.join("، ") : "لا يوجد") + "\n" +
    "   └ حسابات تويتر: " + (un.twitter_sources && un.twitter_sources.length > 0 ? un.twitter_sources.join("، ") : "لا يوجد") + "\n" +
    "   └ بحث جوجل نيوز: " + (un.google_news_enabled ? ("مفعل (" + un.google_news_query + ")") : "معطل") + "\n";
}

bot_text += "\n👇 **اختر الإجراء المطلوب من الأزرار المخصصة أدناه (كل أمر له زر مستقل ومباشر):**";

var inline_keyboard = [
  [
    { title: "🏛️ إدارة الجامعات والمصادر", command: "/universities" },
    { title: "➕ معالج ربط جامعة وقناة (5 خطوات)", command: "/add_university" }
  ],
  [
    { title: "🔄 فحص وسحب الأخبار فوراً", command: "/crawl_sources" },
    { title: "🌐 بحث أخبار جوجل للجامعة", command: "/google_news" }
  ],
  [
    { title: "📝 صياغة ونشر خبر فوري", command: "/new_post" },
    { title: "🎯 إعلان خدماتي البديل", command: "/ad" }
  ],
  [
    { title: "⚙️ إعدادات الذكاء الاصطناعي", command: "/ai" },
    { title: "💬 محادثة وبحث الذكاء", command: "/chat" }
  ],
  [
    { title: "🔑 مفاتيح API والاعتمادات", command: "/keys" },
    { title: "👤 إدارة اليوزربوت وجلسة الحساب", command: "/userbot" }
  ],
  [
    { title: "📝 تعليمات المحرر الأكاديمي", command: "/instructions" },
    { title: "🧪 تجربة الصياغة الفورية", command: "/test" }
  ],
  [
    { title: "📊 حالة النظام والتقارير", command: "/status" },
    { title: is_paused ? "▶️ تشغيل البوت الآن" : "⏸️ إيقاف البوت مؤقتاً", command: "/pause" }
  ],
  [
    { title: "📞 الدعم الفني والمساعدة", command: "/support" },
    { title: "🌐 قنواتنا وروابط التواصل", command: "/social" }
  ]
];

var reply_kb = "🏛️ إدارة الجامعات وقنوات النشر, ➕ معالج ربط جامعة وقناة (5 خطوات)\n" +
  "🔄 فحص وسحب الأخبار فوراً, 🌐 بحث أخبار جوجل للجامعة\n" +
  "📝 صياغة ونشر خبر فوري, 🎯 إعلان خدماتي البديل\n" +
  "⚙️ إعدادات الذكاء الاصطناعي, 📊 حالة النظام والتقارير\n" +
  "👤 إدارة اليوزربوت وجلسة الحساب, 📞 الدعم الفني والمشرف @M_S_F_G";

Bot.sendKeyboard(reply_kb, "⌨️ **لوحة المفاتيح الدائمة نشطة على شاشتك للتحكم السريع:**");
Bot.sendInlineKeyboard(inline_keyboard, bot_text);
