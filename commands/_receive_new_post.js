/*CMD
  command: /receive_new_post
  help: استقبال محتوى الخبر الجديد وتوجيهه للمعالجة
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (!message && (!request || (!request.photo && !request.video && !request.document && !request.caption))) {
  Bot.sendMessage("⚠️ لم يتم استلام أي نص أو وسائط. أرسل الخبر أو أرسل /cancel للإلغاء.");
  Bot.run({ command: "/receive_new_post" });
  return;
}

if (message && message.trim() == "/cancel") {
  Bot.sendMessage("تم إلغاء نشر الخبر بنجاح ✅");
  Bot.runCommand("/start");
  return;
}

Bot.sendMessage("⚡ **تم استلام الخبر بنجاح!**\nجاري المعالجة الفورية بالذكاء الاصطناعي وتجهيز النشر في القنوات المربوطة...");

Bot.runCommand("handle_user_post");
