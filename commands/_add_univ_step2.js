/*CMD
  command: /add_univ_step2
  help: معالج الربط الهرمي - الخطوة 2 من 5 (استلام اسم الجامعة وتحديد قنوات التليجرام المصدرة)
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

var univ_name = message.trim();
if (univ_name.length < 3) {
  Bot.sendMessage("⚠️ اسم الجامعة قصير جداً! يرجى إرسال اسم الجامعة أو الكلية بوضوح مثل: `جامعة الشرق الأوسط الأمريكية AUM` أو `جامعة الملك سعود`");
  Bot.runCommand("/add_univ_step2");
  return;
}

Bot.setProperty("temp_univ_name", univ_name, "string");

var prompt_step3 = "✅ **تم حفظ اسم الجامعة / القسم**: `" + univ_name + "`\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "📡 **الخطوة 3 من 5: [ تحديد قنوات التليجرام المصدرة ]**:\n\n" +
  "أرسل معرفات قنوات التليجرام المصدرة الخاصة بهذه الجامعة لسحب الأخبار منها حصراً (مفصولة بمسافة أو فاصلة):\n" +
  "📌 **مثال**: `@AUM_News @AUM_Admission`\n\n" +
  "💡 *ملاحظة: إذا كنت ترغب فقط بالاعتماد على أخبار جوجل وحسابات X، اكتب كلمة*: `تخطي`\n\n" +
  "(أرسل القنوات الآن، أو اكتب `تخطي`، أو اكتب /cancel للإلغاء)";

Bot.sendMessage(prompt_step3);
Bot.runCommand("/add_univ_step3");
