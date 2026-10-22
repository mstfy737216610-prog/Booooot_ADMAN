/*CMD
  command: /set_channel
  help: تحديد أو إضافة قنوات النشر التلقائي
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 📢 إدارة قنوات النشر, قنوات النشر, /add_channel
CMD*/

var raw = message || "";
var arg = raw.replace("/set_channel", "").replace("/add_channel", "").trim();

if (!arg) {
  var current = Bot.getProperty("target_channels") || "";
  var text = "📢 **إدارة قنوات النشر التلقائي:**\n\n" +
    "القنوات المعتمدة حالياً: `" + (current || "لا توجد قنوات مضافة بعد") + "`\n\n" +
    "💡 **كيفية تحديد قناتك بسهولة:**\n" +
    "1. أرسل: `/set_channel @اسم_قناتك`\n" +
    "2. أو يمكنك إضافة عدة قنوات: `/set_channel @قناة1 @قناة2`\n\n" +
    "⚠️ *تأكد من إضافة البوت مشرفاً Admin في القناة مع تفعيل صلاحية نشر الرسائل.*";
  Bot.sendMessage(text);
  return;
}

Bot.setProperty("target_channels", arg, "string");
Bot.sendMessage("✅ تم حفظ واعتماد قنوات النشر بنجاح: `" + arg + "`\nسيقوم البوت بنشر كافة المنشورات الجديدة فيها تلقائياً!");
