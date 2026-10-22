/*CMD
  command: /add_univ_step3
  help: معالج الربط الهرمي - الخطوة 3 من 5 (استلام قنوات التليجرام وتحديد حسابات تويتر/X المصدرة)
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (!message || message.trim() === "/cancel") {
  Bot.sendMessage("تم إلغاء معالج الربط الهرمي بنجاح ✅");
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

var prompt_step4 = "✅ **تم حفظ قنوات التليجرام المصدرة (" + tg_sources.length + ")**: " + (tg_sources.length > 0 ? tg_sources.join("، ") : "تم التخطي") + "\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "🐦 **الخطوة 4 من 5: [ تحديد حسابات تويتر (X) المصدرة ]**:\n\n" +
  "أرسل معرفات حسابات تويتر/X المصدرة التابعة لهذه الجامعة (مفصولة بمسافة أو فاصلة):\n" +
  "📌 **مثال**: `@ksu_news @ksu_portal` أو `@aum_kuwait`\n\n" +
  "💡 *ملاحظة: يمكنك كتابة كلمة*: `تخطي`\n\n" +
  "(أرسل المعرفات الآن، أو اكتب `تخطي`، أو اكتب /cancel للإلغاء)";

Bot.sendMessage(prompt_step4);
Bot.runCommand("/add_univ_step4");
