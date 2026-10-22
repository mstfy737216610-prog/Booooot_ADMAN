/*CMD
  command: /add_univ_step4
  help: معالج إضافة جامعة - الخطوة 4 (إنهاء الإعداد وحفظ مشروع الجامعة وتفعيل بحث جوجل نيوز)
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (!message || message.trim() === "/cancel") {
  Bot.sendMessage("تم إلغاء عملية الإضافة بنجاح ✅");
  Bot.runCommand("/universities");
  return;
}

var tw_input = message.trim();
var tw_sources = [];
if (tw_input.toLowerCase() !== "تخطي" && tw_input.toLowerCase() !== "skip") {
  var parts = tw_input.split(/[\s,]+/);
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].trim();
    if (p) {
      if (!p.startsWith("@") && !p.startsWith("https://")) p = "@" + p;
      tw_sources.push(p);
    }
  }
}

var channel = Bot.getProperty("temp_univ_channel") || "@jhdhhdcj";
var name = Bot.getProperty("temp_univ_name") || "جامعة مستهدفة";
var tg_sources = Bot.getProperty("temp_univ_tg", []);

// إنشاء معرف فريد للجامعة
var clean_id = "univ_" + channel.replace(/[^a-zA-Z0-9_]/g, "") + "_" + (new Date().getTime().toString().slice(-5));

// توليد الكلمات المفتاحية الذكية من اسم الجامعة
var keywords = [name];
var words = name.split(/\s+/);
for (var w = 0; w < words.length; w++) {
  var wd = words[w].trim();
  if (wd.length > 3 && wd !== "جامعة" && wd !== "كلية" && wd !== "عمادة") {
    keywords.push(wd);
  }
}
keywords.push("قبول");
keywords.push("تسجيل");

var new_project = {
  id: clean_id,
  name: name,
  target_channel: channel,
  telegram_sources: tg_sources,
  twitter_sources: tw_sources,
  google_news_query: name,
  google_news_enabled: true,
  keywords: keywords,
  enabled: true,
  created_at: new Date().toISOString()
};

// حفظ في university_projects
var univ_projects = Bot.getProperty("university_projects", []);
// فحص إذا كانت موجودة وتحديثها
var replaced = false;
for (var u = 0; u < univ_projects.length; u++) {
  if (univ_projects[u].target_channel.toLowerCase() === channel.toLowerCase() && univ_projects[u].name === name) {
    univ_projects[u] = new_project;
    replaced = true;
    break;
  }
}
if (!replaced) {
  univ_projects.push(new_project);
}
Bot.setProperty("university_projects", univ_projects, "json");

// مزامنة التعيين في channel_mappings و monitored_sources
var mappings = Bot.getProperty("channel_mappings", []);
var all_srcs = tg_sources.concat(tw_sources);
var map_found = false;
for (var m = 0; m < mappings.length; m++) {
  if (mappings[m].target.toLowerCase() === channel.toLowerCase()) {
    mappings[m].sources = all_srcs;
    mappings[m].name = name;
    mappings[m].enabled = true;
    map_found = true;
    break;
  }
}
if (!map_found) {
  mappings.push({
    target: channel,
    sources: all_srcs,
    name: name,
    enabled: true
  });
}
Bot.setProperty("channel_mappings", mappings, "json");

// تحديث المصادر المراقبة العامة
var monitored = Bot.getProperty("monitored_sources", []);
for (var s = 0; s < all_srcs.length; s++) {
  if (monitored.indexOf(all_srcs[s]) === -1) {
    monitored.push(all_srcs[s]);
  }
}
Bot.setProperty("monitored_sources", monitored, "json");

var success_msg = "🎉 **تم بنجاح إضافة وتفعيل مشروع الجامعة وقناة النشر!**\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "🏛️ **اسم الجامعة**: " + name + "\n" +
  "📢 **قناة النشر المستهدفة**: `" + channel + "`\n" +
  "📡 **قنوات تيليجرام (" + tg_sources.length + ")**: " + (tg_sources.length > 0 ? tg_sources.join("، ") : "لا يوجد") + "\n" +
  "🐦 **حسابات X/تويتر (" + tw_sources.length + ")**: " + (tw_sources.length > 0 ? tw_sources.join("، ") : "لا يوجد") + "\n" +
  "🌐 **بحث أخبار جوجل**: مفعل تلقائياً بنجاح (" + name + ")\n" +
  "🛡️ **نظام العزل**: لن يُنشر في `" + channel + "` إلا ما يخص `" + name + "` حصراً!\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "👇 **اختر الإجراء التالي:**";

var inline_keyboard = [
  [
    { title: "🔄 فحص وسحب أخبار هذه الجامعة", command: "/crawl_sources" },
    { title: "🌐 بحث أخبار جوجل الآن", command: "/google_news " + name }
  ],
  [
    { title: "🏛️ قائمة كافة الجامعات", command: "/universities" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, success_msg);
