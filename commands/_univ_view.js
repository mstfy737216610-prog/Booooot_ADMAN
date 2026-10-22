/*CMD
  command: /univ_view
  help: لوحة التحكم المستقلة لكل جامعة مع أزرار تحكم وإدارة معزولة تماماً
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var univ_id = (params || "").trim();
var univ_projects = Bot.getProperty("university_projects", []);
if (!Array.isArray(univ_projects)) univ_projects = [];

var target_univ = null;
if (univ_id) {
  for (var i = 0; i < univ_projects.length; i++) {
    if (univ_projects[i].id === univ_id) {
      target_univ = univ_projects[i];
      break;
    }
  }
}

// إذا لم يتم تمرير المعرف أو لم يوجد، نأخذ أول جامعة
if (!target_univ && univ_projects.length > 0) {
  target_univ = univ_projects[0];
}

if (!target_univ) {
  Bot.sendMessage("⚠️ لم يتم العثور على الجامعة المحددة. يمكنك إضافة جامعة جديدة عبر المعالج:");
  Bot.runCommand("/add_university");
  return;
}

var is_active = target_univ.enabled !== false;
var st_badge = is_active ? "🟢 نشطة (النشر التلقائي يعمل)" : "🔴 متوقفة مؤقتاً";
var tg_sources = target_univ.telegram_sources || [];
var tw_sources = target_univ.twitter_sources || [];
var tg_disp = tg_sources.length > 0 ? tg_sources.join("، ") : "لا يوجد قنوات تيليجرام";
var tw_disp = tw_sources.length > 0 ? tw_sources.join("، ") : "لا يوجد حسابات تويتر";
var gnews_q = target_univ.google_news_query || target_univ.name;

var text = "🏛️ **لوحة التحكم المستقلة: " + target_univ.name + "**\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "📢 **قناة النشر الحصرية**: `" + target_univ.target_channel + "`\n" +
  "⚡ **الحالة الحالية**: " + st_badge + "\n" +
  "📡 **قنوات التليجرام المصدرة**: `" + tg_disp + "`\n" +
  "🐦 **حسابات تويتر (X) المصدرة**: `" + tw_disp + "`\n" +
  "🌐 **استعلام أخبار جوجل**: `\"" + gnews_q + "\"`\n" +
  "🔑 **معرف الجامعة في النظام**: `" + target_univ.id + "`\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "🛡️ **مبدأ العزل الصارم (Strict Relational Isolation)**:\n" +
  "جميع مصادر هذه الجامعة معزولة تماماً وتصب حصراً في قناة `" + target_univ.target_channel + "`. لن يتسرب أي منشور إلى أي قناة أخرى، ولن يدخل هذه القناة أي خبر خارجي.\n\n" +
  "👇 **تحكم بهذه الجامعة حصراً عبر الأزرار المستقلة أدناه:**";

var toggle_btn_title = is_active ? "⏸️ إيقاف النشر لهذه الجامعة" : "▶️ تفعيل واستئناف النشر";

var inline_keyboard = [
  [
    { title: "🔄 فحص وسحب الأخبار", command: "/univ_crawl " + target_univ.id },
    { title: toggle_btn_title, command: "/univ_toggle " + target_univ.id }
  ],
  [
    { title: "🌐 أخبار جوجل المباشرة", command: "/google_news " + target_univ.id },
    { title: "📝 صياغة ونشر خبر فوري", command: "/univ_post " + target_univ.id }
  ],
  [
    { title: "🗑️ حذف هذه الجامعة من النظام", command: "/del_university " + target_univ.id }
  ],
  [
    { title: "🔙 عودة لقائمة الجامعات", command: "/universities" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
