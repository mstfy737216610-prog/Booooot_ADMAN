/*CMD
  command: /univ_post
  help: نشر خبر فوري معزول لجامعة محددة
  need_reply: true
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

if (!target_univ && univ_projects.length > 0) {
  target_univ = univ_projects[0];
}

if (!target_univ) {
  Bot.sendMessage("⚠️ لم يتم العثور على الجامعة المحددة.");
  Bot.runCommand("/universities");
  return;
}

if (!message || message.trim() === "/cancel") {
  Bot.sendMessage("تم إلغاء النشر ✅");
  Bot.runCommand("/univ_view " + target_univ.id);
  return;
}

// حفظ القناة المستهدفة واسم الجامعة للمعالجة
Bot.setProperty("temp_publish_target", target_univ.target_channel, "string");
Bot.setProperty("temp_publish_univ", target_univ.name, "string");

Bot.sendMessage("⚡ **تم استلام المنشور لـ " + target_univ.name + "!**\nجاري معالجته بالذكاء الاصطناعي وإعادة صياغته والنشر حصراً في: `" + target_univ.target_channel + "`...");

// توجيه المنشور للمعالجة بالذكاء الاصطناعي
Bot.runCommand("/receive_new_post");
