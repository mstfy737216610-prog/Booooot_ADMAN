/*CMD
  command: /univ_toggle
  help: تفعيل أو إيقاف النشر التلقائي لجامعة محددة بشكل مستقل
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

var found = false;
var new_state = true;
var univ_name = "";

for (var i = 0; i < univ_projects.length; i++) {
  if (univ_projects[i].id === univ_id) {
    univ_projects[i].enabled = !univ_projects[i].enabled;
    new_state = univ_projects[i].enabled;
    univ_name = univ_projects[i].name;
    found = true;
    break;
  }
}

if (!found) {
  Bot.sendMessage("⚠️ لم يتم العثور على الجامعة المحددة لتعديل حالتها.");
  Bot.runCommand("/universities");
  return;
}

Bot.setProperty("university_projects", univ_projects, "json");

var alert_msg = new_state
  ? "🟢 تم تفعيل واستئناف النشر التلقائي لـ **" + univ_name + "** بنجاح!"
  : "⏸️ تم إيقاف النشر التلقائي لـ **" + univ_name + "** مؤقتاً.";

Bot.sendMessage(alert_msg);
Bot.runCommand("/univ_view " + univ_id);
