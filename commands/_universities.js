/*CMD
  command: /universities
  help: إدارة وتوزيع مشاريع الجامعات وقنوات النشر المستقلة
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🏛️ إدارة الجامعات وقنوات النشر, /univ, /mapping, 🔗 ربط القنوات والأهداف
CMD*/

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
      keywords: ["جامعة الملك سعود", "الملك سعود", "KSU", "قبول", "تسجيل"],
      enabled: true
    }
  ];
  Bot.setProperty("university_projects", univ_projects, "json");
}

var text = "🏛️ **إدارة الجامعات وقنوات النشر المنفصلة (Multi-University Channels)**:\n\n" +
  "🛡️ **مبدأ العزل التام**: كل جامعة لها قناة نشر خاصة بها ومصادر محددة، ويقوم الذكاء الاصطناعي بفلترة أي أخبار غير مرتبطة بالجامعة منعاً لخلط القنوات.\n\n" +
  "━━━━━━━━━━━━━━━━━━━\n";

for (var i = 0; i < univ_projects.length; i++) {
  var u = univ_projects[i];
  var st = u.enabled ? "🟢 نشطة" : "🔴 متوقفة";
  text += "**" + (i + 1) + ". " + u.name + "** (" + st + ")\n";
  text += "   📢 **قناة النشر المستهدفة:** `" + u.target_channel + "`\n";
  text += "   📡 **قنوات تيليجرام:** " + (u.telegram_sources && u.telegram_sources.length > 0 ? u.telegram_sources.join("، ") : "لا يوجد") + "\n";
  text += "   🐦 **حسابات X/تويتر:** " + (u.twitter_sources && u.twitter_sources.length > 0 ? u.twitter_sources.join("، ") : "لا يوجد") + "\n";
  text += "   🌐 **أخبار جوجل نيوز:** " + (u.google_news_enabled ? "مفعلة تلقائياً (" + u.google_news_query + ")" : "معطلة") + "\n";
  text += "   🔍 **معرف الجامعة للحذف/التحكم:** `" + u.id + "`\n";
  text += "───────────────────\n";
}

text += "\n👇 **اختر إجراءً للتحكم:**";

var inline_keyboard = [
  [
    { title: "➕ إضافة جامعة وقناة نشر جديدة", command: "/add_university" },
    { title: "🔄 فحص وسحب أخبار الجامعات", command: "/crawl_sources" }
  ],
  [
    { title: "🌐 بحث أخبار جوجل لجامعة", command: "/google_news" },
    { title: "🗑️ حذف جامعة من القائمة", command: "/del_university" }
  ],
  [
    { title: "📝 صياغة ونشر خبر فوري", command: "/new_post" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
