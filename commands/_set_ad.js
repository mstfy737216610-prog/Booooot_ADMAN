/*CMD
  command: /set_ad
  help: تعديل نص الإعلان البديل
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: ✏️ **أرسل الآن نص الإعلان البديل الجديد**:\n\n(اكتب النص بالكامل متضمناً رقمك أو معرفك @M_S_F_G، أو اكتب /cancel للإلغاء)
  keyboard: 
  aliases: 
CMD*/

if (!message || message.trim() == "/cancel") {
  Bot.sendMessage("تم إلغاء تعديل الإعلان ✅");
  Bot.runCommand("/ad");
  return;
}

Bot.setProperty("custom_ad", message, "string");
Bot.sendMessage("✅ **تم بنجاح حفظ نص الإعلان الجديد!**\nسيتم استخدامه فوراً عند رصد أي إعلان منافس.");
Bot.runCommand("/ad");
