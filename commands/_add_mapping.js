/*CMD
  command: /add_mapping
  help: إضافة ربط قناة هدف جديدة ومصادرها
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 📝 **إضافة قناة نشر ومصادرها المخصصة**:\n\nأرسل رسالة تحتوي على معرف القناة الهدف والمصادر المخصصة لها بالصيغة التالية:\n`@القناة_الهدف = @مصدر1 @مصدر2 @مصدر3`\n\n📌 **مثال واقعي**:\n`@MySecondChannel = @KSU_News @moe_gov_sa`\n\n(أرسل الآن، أو اكتب /cancel للإلغاء)
  keyboard: 
  aliases: 
CMD*/

if (!message || message.trim() == "/cancel") {
  Bot.sendMessage("تم إلغاء عملية الإضافة بنجاح ✅");
  Bot.runCommand("/mapping");
  return;
}

var parts = message.split("=");
if (parts.length < 2) {
  Bot.sendMessage("❌ صيغة غير صحيحة! يرجى استخدام علامة (=) بين القناة الهدف والمصادر:\nمثال: `@MyTarget = @Source1 @Source2`");
  Bot.runCommand("/mapping");
  return;
}

var target = parts[0].trim();
var sources_raw = parts[1].trim();
var sources_list = sources_raw.split(/[\s,]+/).filter(function(s) { return s.length > 0; });

if (!target) {
  Bot.sendMessage("❌ لم يتم تحديد القناة الهدف!");
  return;
}

var mappings = Bot.getProperty("channel_mappings", []);
// فحص إذا كانت القناة مضافة مسبقاً
var found = false;
for (var i = 0; i < mappings.length; i++) {
  if (mappings[i].target.toLowerCase() == target.toLowerCase()) {
    mappings[i].sources = sources_list;
    mappings[i].enabled = true;
    found = true;
    break;
  }
}

if (!found) {
  mappings.push({
    target: target,
    sources: sources_list,
    enabled: true,
    name: target
  });
}

Bot.setProperty("channel_mappings", mappings, "json");

var text = "✅ **تم بنجاح حفظ ربط القناة والمصادر!**\n\n" +
  "• **قناة النشر المستهدفة**: `" + target + "`\n" +
  "• **المصادر المخصصة لها**: " + sources_list.join("، ") + "\n\n" +
  "أي منشور جديد يُلتقط من هذه المصادر سيُعاد صياغته وينشر فوراً في `" + target + "`.";

var inline_keyboard = [
  [
    { title: "🗺️ عرض كافة التعيينات", command: "/mapping" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
