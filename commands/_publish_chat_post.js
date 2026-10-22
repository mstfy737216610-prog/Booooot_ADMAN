/*CMD
  command: /publish_chat_post
  help: نشر رد الذكاء الاصطناعي الأخير مباشرة في القناة المعتمدة
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var text_to_publish = Bot.getProperty("pending_chat_reply", "");
if (!text_to_publish) {
  Bot.sendMessage("⚠️ لا يوجد نص منشور جاهز للنشر حالياً. يرجى إرسال النص أولاً عبر /chat أو /new_post.");
  return;
}

var target_channel = Bot.getProperty("target_channels", "@jhdhhdcj");
if (!target_channel) target_channel = "@jhdhhdcj";

function toSafeHtml(txt) {
  if (!txt) return "";
  var s = txt;
  s = s.replace(/&/g, "&amp;");
  s = s.replace(/</g, "&lt;");
  s = s.replace(/>/g, "&gt;");
  s = s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  return s;
}

var safe_txt = toSafeHtml(text_to_publish);

try {
  Api.sendMessage({
    chat_id: target_channel,
    text: safe_txt,
    parse_mode: "HTML"
  });
  Bot.sendMessage("✅ **تم بنجاح نشر المنشور في قناتك الرسمية (" + target_channel + ")!**\n\n👁️ **معاينة المنشور:**\n" + text_to_publish);
} catch (err) {
  try {
    Api.sendMessage({
      chat_id: target_channel,
      text: text_to_publish
    });
    Bot.sendMessage("✅ **تم بنجاح نشر المنشور في قناتك الرسمية (" + target_channel + ")!**");
  } catch (err2) {
    Bot.sendMessage("⚠️ تعذر النشر في القناة `" + target_channel + "`. تأكد من إضافة البوت كمشرف (Admin) مع صلاحية نشر الرسائل.");
  }
}
