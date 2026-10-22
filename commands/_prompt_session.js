/*CMD
  command: /prompt_session
  help: طلب إدخال كود الجلسة
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var text = "🔑 **يرجى إرسال كود الـ String Session الحقيقي الآن:**\n\n" +
  "الصق كود الجلسة المشفر كاملاً هنا في الشات.\n\n" +
  "*(أرسل الكود الآن كرسالة عادية، أو أرسل /cancel للإلغاء)*";

Bot.sendMessage(text);
Bot.run({ command: "/set_session" });
