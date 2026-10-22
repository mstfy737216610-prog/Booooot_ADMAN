/*CMD
  command: /add_univ_step4
  help: معالج إضافة جامعة - الخطوة 4 (استلام حسابات تويتر/X والانتقال للخطوة 5: بحث جوجل نيوز)
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

var tw_input = message.trim();
var tw_sources = [];
if (tw_input.toLowerCase() !== "تخطي" && tw_input.toLowerCase() !== "skip") {
  var parts = tw_input.split(/[\s,]+/);
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].trim();
    if (p) {
      if (!p.startsWith("@") && !p.startsWith("https://")) p = "@" + p;
      tw_sources.push(p);
    }
  }
}

Bot.setProperty("temp_univ_tw", tw_sources, "json");

var univ_name = Bot.getProperty("temp_univ_name") || "الجامعة المستهدفة";

var prompt_step5 = "✅ **تم حفظ حسابات تويتر/X (" + tw_sources.length + ")**: " + (tw_sources.length > 0 ? tw_sources.join("، ") : "تم التخطي") + "\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "🌐 **الخطوة 5 من 5: [ البحث التلقائي في أخبار جوجل (Google News) ]**:\n\n" +
  "حدد الكلمات المفتاحية للبحث التلقائي في أخبار جوجل لجلب أحدث المقالات والقرارات الأكاديمية الخاصة بهذه الجامعة لرفع كفاءة ومحتوى الذكاء الاصطناعي:\n\n" +
  "📌 **أمثلة على المدخلات المقبولة**:\n" +
  "• اكتب: `تلقائي` (ليتم اعتماد: `" + univ_name + "` تلقائياً)\n" +
  "• أو اكتب استعلام بحث مخصصاً، مثل: `" + univ_name + " قبول وتسجيل`\n\n" +
  "(أرسل الاستعلام الآن، أو اكتب `تلقائي`، أو اكتب /cancel للإلغاء)";

Bot.sendMessage(prompt_step5);
Bot.runCommand("/add_univ_step5");
