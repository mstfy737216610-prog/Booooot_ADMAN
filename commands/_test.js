/*CMD
  command: /test
  help: تجربة صياغة منشور
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: ✍️ أرسل أو وجه الآن أي خبر أو إعلان أو منشور جامعي وسأقوم بصياغته فوراً!
  keyboard: 
  aliases: 🧪 تجربة صياغة منشور, تجربة
CMD*/

// إعادة توجيه الرد إلى معالج المنشورات
Bot.runCommand("handle_user_post");
