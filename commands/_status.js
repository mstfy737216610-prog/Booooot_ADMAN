/*CMD
  command: /status
  help: حالة وإحصائيات البوت
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 📊 حالة البوت, الحالة
CMD*/

var text = "📊 **حالة البوت ومحرر المحتوى الأكاديمي:**\n" +
  "• البوت: @admiuin_bot (@ADMIN.p)\n" +
  "• المشرف: @M_S_F_G (7607633343)\n" +
  "• حالة النشر: 🟢 نشط على مدار الساعة 24/7\n" +
  "• النموذج: DeepSeek-V4.1-Flash\n" +
  "• استبدال إعلانات المنافسين: مفعل تلقائياً 🎯\n" +
  "• المستودع: متزامن مع مستودع Git";

Bot.sendMessage(text);
