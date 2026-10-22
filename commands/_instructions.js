/*CMD
  command: /instructions
  help: تعليمات المشرف للمحرر
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: ⚙️ تعليمات المحرر الأكاديمي, تعليمات المحرر الأكاديمي, ⚙️ تعليمات المحرر, تعليمات المحرر, التعليمات, /prompt
CMD*/

var ins = Bot.getProperty("custom_instructions");
if (!ins) {
  ins = "كن مثل مشرفين القروبات الذي يبحث عن الأخبار الجديدة ويعطيها للطلاب بوضوح";
}

var text = "⚙️ **تعليمات المشرف الحالية للمحرر الذكي:**\n\n" +
  "📌 *\"" + ins + "\"*\n\n" +
  "✏️ لتعديل التعليمات أرسل: `/set_instruction تعليماتك الجديدة هنا`";

Bot.sendMessage(text);
