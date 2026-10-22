/*CMD
  command: /start
  help: لوحة التحكم الرئيسية المنظمة لبوت النشر الأكاديمي والجامعي الذكي V3.1
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 🏛️ إدارة الجامعات وقنوات النشر, 🔄 فحص وسحب أخبار الجامعات\n➕ إضافة جامعة وقناة نشر, 🌐 بحث أخبار جوجل للجامعة\n📝 صياغة ونشر خبر فوري, 🎯 إعلان خدماتي البديل\n⚙️ إعدادات الذكاء الاصطناعي, 💬 محادثة الذكاء والبحث\n📊 حالة النظام والتقارير, 🟢 تشغيل / إيقاف البوت
  aliases: 🎛 لوحة التحكم الرئيسية, لوحة التحكم, /help, /menu, /admin, الرئيسية
CMD*/

var ADMIN_ID = 7607633343;
var ADMIN_USER = "M_S_F_G";

var is_paused = Bot.getProperty("bot_paused", false);
var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");
var base_url = Bot.getProperty("ai_base_url", "https://api.hcnsec.cn/v1");
var total_processed = Bot.getProperty("total_processed", 0);
var total_ads_replaced = Bot.getProperty("total_ads_replaced", 0);
var custom_ins = Bot.getProperty("custom_instructions", "كن مثل مشرفين القروبات الذي يبحث عن الأخبار الأكاديمية الجديدة ويعطيها للطلاب بوضوح تام");

// جلب مشاريع الجامعات المنفصلة
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

var bot_text = "👑 **مرحباً بك يا مديرنا العزيز @" + ADMIN_USER + "**!\n" +
  "أنت المشرف العام المعتمد للنظام الأكاديمي الذكي (ID: `" + ADMIN_ID + "`)\n\n" +
  "🏛️ **نظام النشر الجامعي الذكي المعزول (Multi-University Channels V3.1)**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "• **حالة البوت العامة**: " + status_emoji + "\n" +
  "• **الجامعات المستهدفة المعتمدة**: " + univ_projects.length + " جامعة مستقلة\n" +
  "• **الذكاء الاصطناعي**: `" + current_model + "` عبر " + base_url + "\n" +
  "• **فلترة المحتوى**: عزل تام لكل جامعة (لا يتم خلط الأخبار إطلاقاً)\n" +
  "• **بحث جوجل نيوز**: مفعل آلياً لكل جامعة لجلب أحدث أخبارها\n" +
  "• **تنقية الويب**: إزالة مخلفات HTML و &nbsp; و X نهائياً\n" +
  "• **إجمالي المنشورات المعالجة**: " + total_processed + " منشور\n" +
  "• **إعلانات المنافسين المستبدلة**: " + total_ads_replaced + " إعلان\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "📋 **الجامعات وقنوات النشر المربوطة حالياً**:\n";

for (var u = 0; u < univ_projects.length; u++) {
  var un = univ_projects[u];
  var u_st = un.enabled ? "🟢" : "🔴";
  bot_text += u_st + " **" + un.name + "** ➔ `" + un.target_channel + "`\n" +
    "   └ مصادر تيليجرام: " + (un.telegram_sources ? un.telegram_sources.join("، ") : "لا يوجد") + "\n" +
    "   └ حسابات X: " + (un.twitter_sources ? un.twitter_sources.join("، ") : "لا يوجد") + "\n";
}

bot_text += "\n👇 **اختر الإجراء المطلوب من الأزرار المنظمة أدناه:**";

var inline_keyboard = [
  [
    { title: "🏛️ إدارة الجامعات وقنوات النشر", command: "/universities" },
    { title: "➕ إضافة جامعة وقناة نشر جديدة", command: "/add_university" }
  ],
  [
    { title: "🔄 فحص وسحب أخبار الجامعات", command: "/crawl_sources" },
    { title: "🌐 بحث أخبار جوجل لجامعة", command: "/google_news" }
  ],
  [
    { title: "📝 صياغة ونشر خبر فوري", command: "/new_post" },
    { title: "🎯 إعلان خدماتي البديل", command: "/ad" }
  ],
  [
    { title: "⚙️ إعدادات الذكاء الاصطناعي", command: "/ai" },
    { title: "💬 محادثة الذكاء والبحث", command: "/chat" }
  ],
  [
    { title: "📊 حالة النظام والتقارير", command: "/status" },
    { title: is_paused ? "▶️ تشغيل البوت الآن" : "⏸️ إيقاف البوت مؤقتاً", command: "/pause" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, bot_text);
