/*CMD
  command: /set_ad
  help: تعديل إعلان خدمات الطلاب
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var raw = message || "";
var new_ad = raw.replace("/set_ad", "").trim();
if (new_ad.length > 5) {
  Bot.setProperty("custom_ad", new_ad, "string");
  Bot.sendMessage("✅ تم حفظ وتحديث إعلان خدماتك الطلابية البديل بنجاح!");
} else {
  Bot.sendMessage("يرجى كتابة نص الإعلان بعد الأمر، مثال:\n`/set_ad إعلانك الجديد هنا`");
}
