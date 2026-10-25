/*CMD
  command: /keys
  help: عرض المفاتيح والبيانات
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🔑 المفاتيح والاعتمادات, المفاتيح والاعتمادات, 🔑 المفاتيح والبيانات, المفاتيح, /credentials
CMD*/

var text = "🔑 **بيانات الاعتمادات والمفاتيح المعتمدة:**\n\n" +
  "• توكن البوت: `8901693218:AAH0hoZdTq9qGaLYOhu_Cvxg9TEzTPAVADw`\n" +
  "• اسم البوت: @admiuin_bot\n" +
  "• معرف المشرف: `7607633343` (@M_S_F_G)\n" +
  "• عنوان الذكاء الاصطناعي: `https://api.hcnsec.cn/v1`\n" +
  "• النموذج الأساسي: `DeepSeek-V4.1-Flash`\n" +
  "• مفتاح الذكاء الاصطناعي: `sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii`\n\n" +
  "🔒 جميع المفاتيح مفعلة ومثبتة في مستودع GitHub وتعمل بنجاح.";

Bot.sendMessage(text);
