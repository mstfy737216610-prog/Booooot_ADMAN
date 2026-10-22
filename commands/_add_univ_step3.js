/*CMD
  command: /add_univ_step3
  help: معالج إضافة جامعة - الخطوة 3 (استلام قنوات تيليجرام وتحديد حسابات تويتر/X)
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (!message || message.trim() === "/cancel") {
  Bot.sendMessage("تم إلغاء عملية الإضافة بنجاح ✅");
  Bot.runCommand("/universities");
  return;
}

var tg_input = message.trim();
var tg_sources = [];
if (tg_input.toLowerCase() !== "تخطي" && tg_input.toLowerCase() !== "skip") {
  var parts = tg_input.split(/[\s,]+/);
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].trim();
    if (p) {
      if (!p.startsWith("@") && !p.startsWith("https://")) p = "@" + p;
      tg_sources.push(p);
    }
  }
}

Bot.setProperty("temp_univ_tg", tg_sources, "json");

var prompt_step4 = "✅ **تم حفظ قنوات تيليجرام (" + tg_sources.length + ")**: " + (tg_sources.length > 0 ? tg_sources.join("، ") : "تم التخطي") + "\n\n" +
  "🐦 **الخطوة 4 من 4: حسابات تويتر/X والمصادر الخارجية**:\n\n" +
  "أرسل معرفات حسابات تويتر/X التابعة لهذه الجامعة (مفصولة بمسافة):\n" +
  "📌 **مثال**: `@ksu_news @ksu_portal`\n\n" +
  "💡 *ملاحظة: يمكنك كتابة كلمة*: `تخطي`\n\n" +
  "(أرسل المعرفات الآن، أو اكتب /cancel للإلغاء)";

Bot.sendMessage(prompt_step4);
Bot.runCommand("/add_univ_step4");
