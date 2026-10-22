/*CMD
  command: /univ_crawl
  help: فحص وسحب مصادر جامعة محددة حصراً ونشرها في قناتها المعزولة
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
for (var i = 0; i < univ_projects.length; i++) {
  if (univ_projects[i].id === univ_id) {
    target_univ = univ_projects[i];
    break;
  }
}

if (!target_univ) {
  Bot.sendMessage("⚠️ لم يتم العثور على الجامعة المحددة.");
  Bot.runCommand("/universities");
  return;
}

var tg_srcs = target_univ.telegram_sources || [];
var tw_srcs = target_univ.twitter_sources || [];
var all_srcs = tg_srcs.concat(tw_srcs);

var start_msg = "🔄 **جاري فحص وسحب الأخبار الحصرية لـ " + target_univ.name + "...**\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "📢 **القناة الهدف**: `" + target_univ.target_channel + "`\n" +
  "📡 **المصادر المراقبة**: " + (all_srcs.length > 0 ? all_srcs.join("، ") : "أخبار جوجل الرسمية") + "\n" +
  "🌐 **أخبار جوجل**: `" + (target_univ.google_news_query || target_univ.name) + "`\n\n" +
  "🛡️ *يتم تطبيق العزل الصارم وإعادة الصياغة بالذكاء الاصطناعي.*";

Bot.sendMessage(start_msg);

// تشغيل الفحص عبر استعلام أخبار جوجل لهذه الجامعة
Bot.runCommand("/google_news " + (target_univ.google_news_query || target_univ.name));
