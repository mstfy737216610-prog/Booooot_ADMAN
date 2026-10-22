/*CMD
  command: /del_mapping
  help: حذف ربط قناة نشر
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var mappings = Bot.getProperty("channel_mappings", []);

if (params) {
  var target_to_remove = params.trim().toLowerCase();
  var filtered = [];
  for (var i = 0; i < mappings.length; i++) {
    if (mappings[i].target.toLowerCase() !== target_to_remove) {
      filtered.push(mappings[i]);
    }
  }
  Bot.setProperty("channel_mappings", filtered, "json");
  Bot.sendMessage("✅ تم بنجاح حذف ربط القناة `" + params.trim() + "`!");
  Bot.runCommand("/mapping");
  return;
}

if (!mappings || mappings.length === 0) {
  Bot.sendMessage("⚠️ لا توجد قنوات مربوطة حالياً لحذفها.");
  Bot.runCommand("/mapping");
  return;
}

var inline_keyboard = [];
for (var j = 0; j < mappings.length; j++) {
  var tg = mappings[j].target;
  inline_keyboard.push([
    { title: "❌ حذف " + tg, command: "/del_mapping " + tg }
  ]);
}
inline_keyboard.push([
  { title: "🔙 إلغاء والعودة", command: "/mapping" }
]);

Bot.sendInlineKeyboard(inline_keyboard, "🗑️ **اختر القناة التي ترغب في إلغاء ربطها ومسح مصادرها:**");
