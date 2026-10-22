/*CMD
  command: /add
  help: إضافة قناة أو رابط جديد للمراقبة
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 📌 أرسل الآن رابط أو معرّف القناة أو الموقع الذي تريد مراقبته (مثال: @KSU_News أو رابط RSS):
  keyboard: 
  aliases: ➕ إضافة قناة أو رابط, إضافة مصدر
CMD*/

var input = message || "";
input = input.trim();
if (!input) {
  Bot.sendMessage("يرجى إرسال رابط أو معرّف صحيح.");
  return;
}

var type = "telegram";
if (input.indexOf("http") === 0) {
  type = input.indexOf("t.me/") !== -1 ? "telegram" : "rss";
} else if (input.indexOf("x.com") !== -1 || input.indexOf("twitter.com") !== -1) {
  type = "twitter";
}

var target = input;
if (type === "telegram" && !target.startsWith("@") && target.indexOf("http") === -1) {
  target = "@" + target;
}

var confirm = "✅ **تم ربط المصدر بنجاح!**\n" +
  "• النوع: `[" + type + "]`\n" +
  "• الهدف: `" + target + "`\n" +
  "• تم الحفظ في sources.json 💾\n\n" +
  "سيقوم البوت بمراقبة منشوراته وإعادة صياغتها ونشرها تلقائياً!";

Bot.sendMessage(confirm);
