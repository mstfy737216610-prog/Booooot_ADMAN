/*CMD
  command: /del_source
  help: حذف مصدر خارجي من قائمة المراقبة والقنوات المربوطة
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🗑️ حذف مصدر خارجي, حذف مصدر
CMD*/

var current_sources = Bot.getProperty("monitored_sources", ["@KSU_News", "@moe_gov_sa"]);
if (!Array.isArray(current_sources) || current_sources.length === 0) {
  Bot.sendMessage("⚠️ لا توجد مصادر خارجية مضافة حالياً لحذفها.\n(استخدم /add_source لإضافة مصادر جديدة)");
  Bot.runCommand("/sources");
  return;
}

// إذا تم تمرير معامل الحذف مباشرة (مثل /del_source @KSU_News)
if (params && params.trim()) {
  var target_to_remove = params.trim();
  var updated = [];
  for (var i = 0; i < current_sources.length; i++) {
    if (current_sources[i].toLowerCase() !== target_to_remove.toLowerCase()) {
      updated.push(current_sources[i]);
    }
  }
  Bot.setProperty("monitored_sources", updated, "json");
  
  // تحديث التعيينات أيضاً
  var mappings = Bot.getProperty("channel_mappings", []);
  for (var m = 0; m < mappings.length; m++) {
    if (mappings[m].sources && Array.isArray(mappings[m].sources)) {
      mappings[m].sources = mappings[m].sources.filter(function(s) {
        return s.toLowerCase() !== target_to_remove.toLowerCase();
      });
    }
  }
  Bot.setProperty("channel_mappings", mappings, "json");
  
  Bot.sendMessage("✅ تم بنجاح حذف المصدر `" + target_to_remove + "` من قائمة المراقبة وكافة القنوات المربوطة!");
  Bot.runCommand("/sources");
  return;
}

var text = "🗑️ **حذف مصدر خارجي من المراقبة والنشر**:\n\n" +
  "اضغط على زر المصدر الذي ترغب بحذفه أدناه، أو أرسل `/del_source @اسم_المصدر`:\n\n" +
  "━━━━━━━━━━━━━━━━━━━\n";

var inline_keyboard = [];
for (var j = 0; j < current_sources.length; j++) {
  var src_item = current_sources[j];
  inline_keyboard.push([
    { title: "❌ حذف " + src_item, command: "/del_source " + src_item }
  ]);
}

inline_keyboard.push([
  { title: "📋 العودة لقائمة المصادر", command: "/sources" },
  { title: "🎛 اللوحة الرئيسية", command: "/start" }
]);

Bot.sendInlineKeyboard(inline_keyboard, text);
