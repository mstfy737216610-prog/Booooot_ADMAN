/*CMD
  command: /add_university
  help: معالج إضافة جامعة وقناة نشر جديدة - الخطوة 1 (تحديد قناة النشر)
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 🏛️ **إضافة جامعة وقناة نشر جديدة (الخطوة 1 من 4)**:\n\nأرسل معرف قناة النشر المستهدفة على تيليجرام التي ترغب بالنشر إليها:\n📌 **مثال**: `@ksu_channel` أو `-1001234567890`\n\n*(تأكد من إضافة البوت مشرفاً Admin فيها مع صلاحية النشر)*\n\n(أرسل المعرف الآن، أو اكتب /cancel للإلغاء)
  keyboard: 
  aliases: ➕ إضافة جامعة وقناة نشر, /new_univ, ➕ إضافة جامعة وقناة نشر جديدة
CMD*/

if (!message || message.trim() === "/cancel") {
  Bot.sendMessage("تم إلغاء عملية الإضافة بنجاح ✅");
  Bot.runCommand("/universities");
  return;
}

var raw_channel = message.trim();
if (!raw_channel.startsWith("@") && !raw_channel.startsWith("-100")) {
  raw_channel = "@" + raw_channel;
}

// حفظ القناة مؤقتاً والانتقال للخطوة 2
Bot.setProperty("temp_univ_channel", raw_channel, "string");

var prompt_step2 = "✅ **تم تعيين قناة النشر المستهدفة**: `" + raw_channel + "`\n\n" +
  "🎓 **الخطوة 2 من 4: تحديد اسم الجامعة المستهدفة**:\n\n" +
  "أرسل الاسم الرسمي والواضح للجامعة:\n" +
  "📌 **مثال**: `جامعة الملك سعود` أو `جامعة الملك عبدالعزيز` أو `جامعة أم القرى`\n\n" +
  "*(هذا الاسم سيستخدمه الذكاء الاصطناعي بدقة تامة لفلترة الأخبار ومنع خلط أي قنوات أخرى بها)*\n\n" +
  "(أرسل الاسم الآن، أو اكتب /cancel للإلغاء)";

Bot.sendMessage(prompt_step2);
Bot.runCommand("/add_univ_step2");
