/*CMD
  command: /universities
  help: إدارة وتوزيع مشاريع الجامعات وقنوات النشر المستقلة بنظام العزل التام
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🏛️ إدارة الجامعات والمصادر, 🏛️ إدارة الجامعات وقنوات النشر, إدارة الجامعات, الجامعات, /univ, /mapping, 🔗 ربط القنوات والأهداف
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

var text = "🏛️ **إدارة مشاريع الجامعات وقنوات النشر المعزولة (Multi-University Channels)**:\n\n" +
  "🛡️ **مبدأ العزل التام (Strict Relational Isolation)**:\n" +
  "كل قناة هدف مرتبطة حصرياً بمصادرها الخاصة (تليجرام + تويتر + جوجل نيوز)، مع وسم تعريفي للمنشورات، ويقوم الذكاء الاصطناعي بفلترة أي أخبار غير متعلقة بالجامعة منعاً لخلط القنوات نهائياً.\n\n" +
  "━━━━━━━━━━━━━━━━━━━\n";

var inline_keyboard = [];

for (var i = 0; i < univ_projects.length; i++) {
  var u = univ_projects[i];
  var st = u.enabled ? "🟢 نشطة" : "🔴 متوقفة";
  text += "**" + (i + 1) + ". " + u.name + "** (" + st + ")\n";
  text += "   📢 **قناة النشر الهدف**: `" + u.target_channel + "`\n";
  text += "   📡 **قنوات التليجرام**: " + (u.telegram_sources && u.telegram_sources.length > 0 ? u.telegram_sources.join("، ") : "لا يوجد") + "\n";
  text += "   🐦 **حسابات تويتر (X)**: " + (u.twitter_sources && u.twitter_sources.length > 0 ? u.twitter_sources.join("، ") : "لا يوجد") + "\n";
  text += "   🌐 **أخبار جوجل**: `\"" + (u.google_news_query || u.name) + "\"`\n";
  text += "───────────────────\n";

  // زر مستقل ومخصص لكل جامعة
  inline_keyboard.push([
    { title: "🎓 " + u.name + " (" + (u.enabled ? "نشطة" : "متوقفة") + ") ⮞ " + u.target_channel, command: "/univ_view " + u.id }
  ]);
}

text += "\n👇 **اضغط على زر أي جامعة أعلاه للتحكم بها حصراً، أو اختر أمراً عاماً:**";

inline_keyboard.push([
  { title: "➕ معالج ربط جامعة وقناة (5 خطوات)", command: "/add_university" },
  { title: "🔄 فحص وسحب أخبار الجامعات", command: "/crawl_sources" }
]);

inline_keyboard.push([
  { title: "🌐 بحث أخبار جوجل للجامعة", command: "/google_news" },
  { title: "🗑️ حذف جامعة من القائمة", command: "/del_university" }
]);

inline_keyboard.push([
  { title: "📞 الدعم الفني والمساعدة", command: "/support" },
  { title: "🎛 اللوحة الرئيسية", command: "/start" }
]);

Bot.sendInlineKeyboard(inline_keyboard, text);
