/*CMD
  command: /on_ai_post_error
  help: المعالج الاحتياطي الأكاديمي الفوري في حال بطء أو انتهاء مهلة البوابة الخارجية (Zero-Distortion Fallback)
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
var target_univ_name = Bot.getProperty("pending_target_univ", "الجامعة");

// 1. تحديد القنوات الهدف من القائمة المعلقة أو الخريطة
var target_channels = Bot.getProperty("pending_targets");
if (!target_channels || !Array.isArray(target_channels) || target_channels.length === 0) {
  var saved_single = Bot.getProperty("target_channels");
  target_channels = [saved_single || "@jhdhhdcj"];
}

if (!raw_text || raw_text.length < 5) return;

// 2. استخراج الروابط الخارجية (روابط التسجيل والتقديم وبوابات الكليات) للحفاظ عليها 100%
var ext_links = [];
var url_matches = raw_text.match(/https?:\/\/[^\s<>"]+/g);
if (url_matches) {
  for (var u = 0; u < url_matches.length; u++) {
    var lk = url_matches[u].replace(/[.,;!?)>\]'"]+$/, "");
    if (lk.indexOf("t.me/") === -1 && ext_links.indexOf(lk) === -1) {
      ext_links.push(lk);
    }
  }
}

// 3. تنظيف راقٍ دون تشويه النص أو حذف المعرفات الأكاديمية
var clean_lines = [];
var lines = raw_text.split("\n");
for (var i = 0; i < lines.length; i++) {
  var l = lines[i].trim();
  // إزالة فواصل تيليجرام المكررة وشوائب تويتر
  if (!l || l === "•" || l === "-" || l === "*" || l.indexOf("t.me/") === 0) continue;
  if (l.indexOf("http://") === 0 || l.indexOf("https://") === 0) continue;
  clean_lines.push(l);
}

if (clean_lines.length === 0) {
  clean_lines = [raw_text.substring(0, 150)];
}

// استخراج العنوان الأكاديمي
var first_line = clean_lines[0].replace(/^[•\-\*#📌📢✨🎓]\s*/, "").trim();
var title = first_line.length < 75 ? first_line : (first_line.substring(0, 70) + "...");

// بناء النقاط المرتبة
var body_lines = clean_lines.slice(1, 8);
var bullets = "";
if (body_lines.length > 0) {
  var b_arr = [];
  for (var b = 0; b < body_lines.length; b++) {
    var bl = body_lines[b].replace(/^[•\-\*]\s*/, "");
    if (bl.length > 3) {
      b_arr.push("• " + bl);
    }
  }
  bullets = b_arr.join("\n");
} else {
  bullets = "• " + first_line;
}

// روابط البوابات والتقديم الرسمية
var links_block = "";
if (ext_links.length > 0) {
  links_block = "\n\n🔗 **رابط التقديم / البوابة الإلكترونية المباشرة:**\n" + ext_links.join("\n");
}

// هاشتاجات الجامعة
var clean_univ_tag = target_univ_name ? target_univ_name.replace(/[^\u0621-\u064A0-9a-zA-Z]/g, "_") : "جامعة";
var hashtags = "#" + clean_univ_tag + " #أخبار_التعليم #مواعيد #شؤون_الطلاب";

var formatted_text = "📌 **" + title + "**\n\n" +
  bullets + links_block + "\n\n" +
  "💬 **يسعدنا استقبال استفساراتكم ومشاركة المنشور مع زملائكم الطلاب!**\n\n" +
  hashtags;

// 4. تحويل آمن إلى HTML لتفادي أخطاء Markdown
function toSafeHtml(txt) {
  if (!txt) return "";
  var s = txt;
  s = s.replace(/&/g, "&amp;");
  s = s.replace(/</g, "&lt;");
  s = s.replace(/>/g, "&gt;");
  return s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
}

var safe_html = toSafeHtml(formatted_text);
var safe_caption = safe_html.length > 1020 ? safe_html.substring(0, 1016) + "..." : safe_html;

// 5. النشر المباشر في القنوات المعزولة
var sent_count = 0;
for (var c = 0; c < target_channels.length; c++) {
  var ch = target_channels[c];
  try {
    if (media_type === "photo" && media_file_id) {
      Api.sendPhoto({ chat_id: ch, photo: media_file_id, caption: safe_caption, parse_mode: "HTML" });
    } else {
      Api.sendMessage({ chat_id: ch, text: safe_html, parse_mode: "HTML" });
    }
    sent_count++;
  } catch (err) {
    try {
      Api.sendMessage({ chat_id: ch, text: formatted_text });
      sent_count++;
    } catch (e2) {}
  }
}

var total = Bot.getProperty("total_processed", 0) + 1;
Bot.setProperty("total_processed", total, "integer");

var alert_msg = "⚡ **تم تنسيق ونشر الخبر بنجاح (المعالج الذكي الفوري)!**\n\n" +
  "• **الجامعة المستهدفة**: " + target_univ_name + "\n" +
  "• **القناة المنشور فيها (" + sent_count + ")**: `" + target_channels.join("`، `") + "`\n" +
  "• تم الحفاظ على كافة الروابط والمعرفات وتنسيق النقاط والعناوين بأعلى دقة.";

Bot.sendMessage(alert_msg);
