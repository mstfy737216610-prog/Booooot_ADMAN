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

var default_mappings = [
  {
    target: "@MyUniversityChannel",
    sources: ["@KSU_News", "@moe_gov_sa"],
    enabled: true,
    name: "القناة الأكاديمية الرسمية (أ)"
  },
  {
    target: "@StudentServicesNews",
    sources: ["@saudi_universities", "@kau_edu_sa"],
    enabled: true,
    name: "قناة الخدمات والإعلانات (ب)"
  }
];

Bot.setProperty("channel_mappings", default_mappings, "json");
Bot.sendMessage("🔄 **تمت استعادة خريطة القنوات والمصادر الافتراضية بنجاح!**");
Bot.runCommand("/mapping");
