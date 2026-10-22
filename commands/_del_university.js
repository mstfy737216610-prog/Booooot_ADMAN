/*CMD
  command: /del_university
  help: حذف مشروع جامعة وقناة نشر من النظام
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 🗑️ **حذف جامعة وقناة نشر**:\n\nأرسل اسم الجامعة أو معرفها أو قناة النشر الخاصة بها لحذفها من النظام:\n📌 **مثال**: `جامعة الملك سعود` أو `@jhdhhdcj`\n\n(أرسل الآن، أو اكتب /cancel للإلغاء)
  keyboard: 
  aliases: 
CMD*/

if (!message || message.trim() === "/cancel") {
  Bot.sendMessage("تم إلغاء عملية الحذف ✅");
  Bot.runCommand("/universities");
  return;
}

var query = message.trim().toLowerCase();
var univ_projects = Bot.getProperty("university_projects", []);
var initial_len = univ_projects.length;

var new_projects = [];
var deleted_name = "";

for (var i = 0; i < univ_projects.length; i++) {
  var u = univ_projects[i];
  if (u.id.toLowerCase() === query || u.name.toLowerCase() === query || u.target_channel.toLowerCase() === query) {
    deleted_name = u.name + " (" + u.target_channel + ")";
  } else {
    new_projects.push(u);
  }
}

if (new_projects.length < initial_len) {
  Bot.setProperty("university_projects", new_projects, "json");
  Bot.sendMessage("✅ تم بنجاح حذف: " + deleted_name);
} else {
  Bot.sendMessage("⚠️ لم يتم العثور على جامعة مطابقة لـ: `" + message.trim() + "`");
}

Bot.runCommand("/universities");
