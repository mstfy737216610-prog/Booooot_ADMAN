/*CMD
  command: /add_univ_step5
  help: معالج إضافة جامعة - الخطوة 5 (البحث التلقائي في أخبار جوجل وإنهاء الإعداد وحفظ العزل الصارم)
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

var gnews_input = message.trim();
var channel = Bot.getProperty("temp_univ_channel") || "@jhdhhdcj";
var name = Bot.getProperty("temp_univ_name") || "جامعة مستهدفة";
var tg_sources = Bot.getProperty("temp_univ_tg", []);
var tw_sources = Bot.getProperty("temp_univ_tw", []);

var gnews_query = name;
if (gnews_input.toLowerCase() !== "تلقائي" && gnews_input.toLowerCase() !== "auto" && gnews_input.toLowerCase() !== "نعم" && gnews_input.length > 2) {
  gnews_query = gnews_input;
}

// إنشاء معرف فريد للجامعة
var clean_id = "univ_" + channel.replace(/[^a-zA-Z0-9_]/g, "") + "_" + (new Date().getTime().toString().slice(-5));

// توليد الكلمات المفتاحية الذكية من اسم الجامعة
var keywords = [name];
var words = name.split(/\s+/);
for (var w = 0; w < words.length; w++) {
  var wd = words[w].trim();
  if (wd.length > 3 && wd !== "جامعة" && wd !== "كلية" && wd !== "عمادة" && wd !== "قسم") {
    keywords.push(wd);
  }
}
keywords.push("قبول");
keywords.push("تسجيل");
keywords.push("شؤون الطلاب");

var new_project = {
  id: clean_id,
  name: name,
  target_channel: channel,
  telegram_sources: tg_sources,
  twitter_sources: tw_sources,
  google_news_query: gnews_query,
  google_news_enabled: true,
  keywords: keywords,
  enabled: true,
  created_at: new Date().toISOString()
};

// حفظ في university_projects
var univ_projects = Bot.getProperty("university_projects", []);
if (!Array.isArray(univ_projects)) {
  univ_projects = [];
}

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

// مزامنة التعيين في channel_mappings و monitored_sources لضمان العزل الصارم
var mappings = Bot.getProperty("channel_mappings", []);
if (!Array.isArray(mappings)) {
  mappings = [];
}

var all_srcs = tg_sources.concat(tw_sources);
var map_found = false;
for (var m = 0; m < mappings.length; m++) {
  if (mappings[m].target && mappings[m].target.toLowerCase() === channel.toLowerCase()) {
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
if (!Array.isArray(monitored)) monitored = [];
for (var s = 0; s < all_srcs.length; s++) {
  if (monitored.indexOf(all_srcs[s]) === -1) {
    monitored.push(all_srcs[s]);
  }
}
Bot.setProperty("monitored_sources", monitored, "json");

// مسح المتغيرات المؤقتة
Bot.setProperty("temp_univ_channel", "", "string");
Bot.setProperty("temp_univ_name", "", "string");
Bot.setProperty("temp_univ_tg", [], "json");
Bot.setProperty("temp_univ_tw", [], "json");

var success_msg = "🎉 **تم اكتمال معالج الربط الهرمي بنجاح تام!**\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "🏛️ **اسم الجامعة / القسم**: " + name + "\n" +
  "📢 **قناة النشر الهدف (Destination)**: `" + channel + "`\n" +
  "📡 **قنوات التليجرام المصدرة**: " + (tg_sources.length > 0 ? tg_sources.join("، ") : "تم التخطي (لا يوجد)") + "\n" +
  "🐦 **حسابات تويتر (X) المصدرة**: " + (tw_sources.length > 0 ? tw_sources.join("، ") : "تم التخطي (لا يوجد)") + "\n" +
  "🌐 **البحث التلقائي في أخبار جوجل**: مفعل بنجاح للبحث عن (`" + gnews_query + "`)\n" +
  "🛡️ **جدول الربط الصارم والعزل (Strict Relational Isolation)**:\n" +
  "   └ تم ربط القناة الهدف حصرياً بمصادرها أعلاه.\n" +
  "   └ تفعيل وسم البيانات التعريفي (Source Metadata Tag) لمنع أي تداخل أو خلط بين القنوات.\n" +
  "   └ الذكاء الاصطناعي موجه الآن حصرياً لخدمة طلاب ومجتمع `" + name + "`.\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "👇 **اختر الإجراء التالي:**";

var inline_keyboard = [
  [
    { title: "🔄 فحص وسحب أخبار هذه الجامعة الآن", command: "/crawl_sources" },
    { title: "🌐 بحث أخبار جوجل الفوري", command: "/google_news " + name }
  ],
  [
    { title: "🏛️ إدارة كافة مشاريع الجامعات", command: "/universities" },
    { title: "🎛 العودة للوحة التحكم الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, success_msg);
