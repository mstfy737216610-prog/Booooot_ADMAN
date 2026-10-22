/*CMD
  command: /on_ai_post_error
  help: المعالج الاحتياطي الذكي في حال بطء البوابة الخارجية
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var raw_text = Bot.getProperty("pending_raw_text", "");
var media_type = Bot.getProperty("pending_media_type", "text");
var media_file_id = Bot.getProperty("pending_media_id", "");
var mappings = Bot.getProperty("channel_mappings", []);

// تنظيف وتنسيق أكاديمي محلي فوري
var cleaned = raw_text.replace(/@[a-zA-Z0-9_]+/g, "");
cleaned = cleaned.replace(/https?:\/\/t\.me\/[^\s]+/g, "");
var lines = cleaned.split("\n");
var valid_lines = [];
for (var k = 0; k < lines.length; k++) {
  var l = lines[k].trim();
  if (l && l.indexOf("http") !== 0) {
    valid_lines.push(l);
  }
}

var title = valid_lines.length > 0 ? valid_lines[0] : "تحديث أكاديمي وجامعي هام";
var bullets = "";
for (var j = 1; j < Math.min(valid_lines.length, 6); j++) {
  bullets += "• " + valid_lines[j] + "\n";
}
if (!bullets) {
  bullets = "• " + cleaned;
}

var fallback_text = "📌 **" + title + "**\n\n" +
  bullets + "\n" +
  "💬 يرجى مراجعة الموقع الرسمي للتحقق من المواعيد، وشارك المنشور مع زملائك!\n\n" +
  "#أخبار_الجامعة #التعليم #شؤون_الطلاب #مواعيد";

var sent_count = 0;
for (var i = 0; i < mappings.length; i++) {
  var ch = mappings[i];
  if (ch.enabled && ch.target) {
    try {
      if (media_type == "photo" && media_file_id) {
        Api.sendPhoto({ chat_id: ch.target, photo: media_file_id, caption: fallback_text, parse_mode: "Markdown" });
      } else if (media_type == "video" && media_file_id) {
        Api.sendVideo({ chat_id: ch.target, video: media_file_id, caption: fallback_text, parse_mode: "Markdown" });
      } else if (media_type == "document" && media_file_id) {
        Api.sendDocument({ chat_id: ch.target, document: media_file_id, caption: fallback_text, parse_mode: "Markdown" });
      } else {
        Api.sendMessage({ chat_id: ch.target, text: fallback_text, parse_mode: "Markdown" });
      }
      sent_count++;
    } catch (e) {}
  }
}

var total = Bot.getProperty("total_processed", 0) + 1;
Bot.setProperty("total_processed", total, "integer");

Bot.sendMessage("⚡ **تم النشر بنجاح عبر محرك التنسيق الأكاديمي السريع!**\nتم توزيع المنشور في " + sent_count + " قنوات.");
