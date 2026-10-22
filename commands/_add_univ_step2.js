/*CMD
  command: /add_univ_step2
  help: معالج إضافة جامعة - الخطوة 2 (استلام اسم الجامعة وتحديد قنوات تيليجرام)
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

var univ_name = message.trim();
if (univ_name.length < 3) {
  Bot.sendMessage("⚠️ اسم الجامعة قصير جداً! يرجى إرسال اسم الجامعة بوضوح مثل: `جامعة الملك سعود`");
  Bot.runCommand("/add_univ_step2");
  return;
}

Bot.setProperty("temp_univ_name", univ_name, "string");

var prompt_step3 = "✅ **تم حفظ اسم الجامعة**: `" + univ_name + "`\n\n" +
  "📡 **الخطوة 3 من 4: قنوات تيليجرام المصدر لهذه الجامعة**:\n\n" +
  "أرسل معرفات قنوات تيليجرام الخاصة بهذه الجامعة (مفصولة بمسافة):\n" +
  "📌 **مثال**: `@KSU_News @KSU_admission`\n\n" +
  "💡 *ملاحظة: إن لم تكن لديك قنوات تيليجرام وترغب فقط بالاعتماد على أخبار جوجل وتويتر، اكتب كلمة*: `تخطي`\n\n" +
  "(أرسل القنوات الآن، أو اكتب /cancel للإلغاء)";

Bot.sendMessage(prompt_step3);
Bot.runCommand("/add_univ_step3");
