/*CMD
  command: /reset_mapping
  help: استعادة ضبط المصادر الافتراضية
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var current_target = Bot.getProperty("target_channels") || "@jhdhhdcj";
var monitored = Bot.getProperty("monitored_sources", ["@KSU_News", "@moe_gov_sa"]);

var default_mappings = [
  {
    target: current_target,
    sources: monitored,
    enabled: true,
    name: "قناة النشر الرسمية الأساسية"
  }
];

Bot.setProperty("channel_mappings", default_mappings, "json");
Bot.sendMessage("🔄 **تمت استعادة خريطة القنوات بنجاح!**\nالقناة الهدف الحالية: `" + current_target + "`\nالمصادر المربوطة: " + monitored.join("، "));
Bot.runCommand("/mapping");
