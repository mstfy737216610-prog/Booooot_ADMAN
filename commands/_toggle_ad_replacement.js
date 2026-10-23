/*CMD
  command: /toggle_ad_replacement
  help: تبديل حالة تفعيل أو إيقاف استبدال الإعلانات التجارية
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var cur = Bot.getProperty("ad_replacement_enabled", false);
var new_val = !cur;
Bot.setProperty("ad_replacement_enabled", new_val, "boolean");

if (new_val) {
  Bot.sendMessage("🟢 **تم تفعيل استبدال الإعلانات التجارية الصريحة!**\n(سيقوم البوت باستبدال إعلانات حل الواجبات التجارية فقط، مع استمرار نشر أخبار الجامعات والخدمات الطلابية الرسمية مع صورها).");
} else {
  Bot.sendMessage("🔴 **تم إيقاف استبدال الإعلانات بنجاح (الوضع الموصى به)!**\nالآن سيقوم البوت بنشر كافة أخبار ومصادر الجامعات الرسمية ومصادر الأخبار كما هي مع صورها الحقيقية دون أي استبدال.");
}

Bot.runCommand("/ad");
