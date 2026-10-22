/*CMD
  command: /toggle_ai
  help: تفعيل أو تعطيل معالجة الذكاء الاصطناعي
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var ai_enabled = Bot.getProperty("ai_enabled", true);
ai_enabled = !ai_enabled;
Bot.setProperty("ai_enabled", ai_enabled, "boolean");

if (ai_enabled) {
  Bot.sendMessage("🟢 **تم تفعيل محرك الذكاء الاصطناعي وإعادة الصياغة تلقائياً!**");
} else {
  Bot.sendMessage("🔴 **تم تعطيل الذكاء الاصطناعي!**\nسيتم الآن نقل وتوجيه المنشورات والوسائط كما هي دون إعادة صياغة.");
}

Bot.runCommand("/ai");
