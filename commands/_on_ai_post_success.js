/*CMD
  command: /on_ai_post_success
  help: معالج نجاح رد الذكاء الاصطناعي وتوزيع المنشور على القنوات الهدف المحددة
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var rephrased_text = "";
try {
  var data = JSON.parse(content);
  if (data.choices && data.choices[0] && data.choices[0].message) {
    rephrased_text = data.choices[0].message.content.trim();
  }
} catch (e) {}

if (!rephrased_text) {
  rephrased_text = Bot.getProperty("pending_raw_text", "");
}

var media_type = Bot.getProperty("pending_media_type", "text");
var media_file_id = Bot.getProperty("pending_media_id", "");
var target_channels = Bot.getProperty("pending_targets", []);
var current_model = Bot.getProperty("ai_model", "DeepSeek-V4.1-Flash");

if (!target_channels || target_channels.length === 0) {
  var mappings = Bot.getProperty("channel_mappings", []);
  target_channels = [];
  for (var m = 0; m < mappings.length; m++) {
    if (mappings[m].enabled && mappings[m].target) {
      target_channels.push(mappings[m].target);
    }
  }
}

var sent_count = 0;
var target_names = [];

for (var i = 0; i < target_channels.length; i++) {
  var ch = target_channels[i];
  try {
    if (media_type == "photo" && media_file_id) {
      Api.sendPhoto({ chat_id: ch, photo: media_file_id, caption: rephrased_text, parse_mode: "Markdown" });
    } else if (media_type == "video" && media_file_id) {
      Api.sendVideo({ chat_id: ch, video: media_file_id, caption: rephrased_text, parse_mode: "Markdown" });
    } else if (media_type == "document" && media_file_id) {
      Api.sendDocument({ chat_id: ch, document: media_file_id, caption: rephrased_text, parse_mode: "Markdown" });
    } else {
      Api.sendMessage({ chat_id: ch, text: rephrased_text, parse_mode: "Markdown" });
    }
    sent_count++;
    target_names.push(ch);
  } catch (send_err) {
    Bot.sendMessage("⚠️ **تنبيه نشر**: لم يتمكن البوت من النشر في `" + ch + "`، تأكد من إضافة البوت كمشرف (Admin) مع صلاحية النشر.");
  }
}

// تحديث الإحصائيات
var total = Bot.getProperty("total_processed", 0) + 1;
Bot.setProperty("total_processed", total, "integer");
Bot.setProperty("last_post_title", rephrased_text.split("\n")[0] || "تحديث أكاديمي جديد", "string");
Bot.setProperty("last_post_time", new Date().toLocaleTimeString(), "string");

var confirm_text = "✅ **تمت معالجة ونشر المنشور بنجاح!**\n\n" +
  "• **النموذج المستخدم**: `" + current_model + "`\n" +
  "• **نوع الوسائط**: " + (media_type != "text" ? "مرفق (" + media_type + ") عالي الدقة" : "نص منسق") + "\n" +
  "• **القنوات المستهدفة المنشور فيها (" + sent_count + ")**: " + target_names.join("، ") + "\n\n" +
  "👁️ **معاينة النص بعد المعالجة:**\n" +
  "───────────────────\n" +
  rephrased_text;

var inline_keyboard = [
  [
    { title: "📊 عرض تقرير النشر", command: "/status" },
    { title: "🔗 خريطة القنوات والمصادر", command: "/mapping" }
  ],
  [
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, confirm_text);
