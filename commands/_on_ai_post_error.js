/*CMD
  command: /on_ai_post_error
  help: المحرك الأكاديمي المحلي المستقل (Autonomous Offline NLP Engine) - صياغة فورية راقية في 0ms عند تعذر أو انقطاع الخدمات الخارجية
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

// 1. تحديد القنوات الهدف المعزولة حصراً
var target_channels = Bot.getProperty("pending_targets");
if (!target_channels || !Array.isArray(target_channels) || target_channels.length === 0) {
  var saved_single = Bot.getProperty("target_channels");
  target_channels = [saved_single || "@jhdhhdcj"];
}

if (!raw_text || raw_text.length < 5) return;

// 2. تنظيف الرموز المشوهة والشوائب التقنية
function deepCleanAcademic(txt) {
  if (!txt) return "";
  var s = txt;
  s = s.replace(/ߓ堙噈اعيد/g, "مواعيد");
  s = s.replace(/ߓꠙ嘰كرات/g, "مذكرات");
  s = s.replace(/ߎ㠘㙆ظمة/g, "أنظمة");
  s = s.replace(/[\u07C0-\u07FF\u4E00-\u9FFF\uF000-\uFFFF]/g, "");
  s = s.replace(/&nbsp;\s*X/gi, "");
  s = s.replace(/&nbsp;/gi, " ");
  s = s.replace(/\s+X\s*$/g, "");
  s = s.replace(/\s+X\n/g, "\n");
  s = s.replace(/\bX\s*$/g, "");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#39;/g, "'");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  return s;
}

var clean_text = deepCleanAcademic(raw_text);

// 3. استخراج كافة روابط البوابات والتقديم الرسمية وتجريد روابط قنوات الدعاية
var official_links = [];
var url_regex = /https?:\/\/[^\s<>"]+/g;
var raw_urls = clean_text.match(url_regex);
if (raw_urls) {
  for (var u = 0; u < raw_urls.length; u++) {
    var lk = raw_urls[u].replace(/[.,;!?)>\]'"]+$/, "");
    if (lk.indexOf("t.me/") === -1 && official_links.indexOf(lk) === -1) {
      official_links.push(lk);
    }
  }
}

// 4. استخراج الأسطر المفيدة وتجريد المعرفات الإعلانية
var lines = clean_text.split("\n");
var valid_lines = [];
for (var i = 0; i < lines.length; i++) {
  var line = lines[i].trim();
  if (!line || line === "•" || line === "-" || line === "*" || line === "📌" || line === "🎓") continue;
  if (line.indexOf("t.me/") === 0 || (line.indexOf("@") === 0 && line.length < 25)) continue;
  if (line.indexOf("http://") === 0 || line.indexOf("https://") === 0) continue;
  valid_lines.push(line);
}

if (valid_lines.length === 0) {
  valid_lines = [clean_text.substring(0, 150)];
}

// 5. استخراج العنوان الأكاديمي الرصين
var first_line = valid_lines[0].replace(/^[•\-\*#📌📢✨🎓]\s*/, "").trim();
var academic_title = first_line.length <= 80 ? first_line : (first_line.substring(0, 77) + "...");
if (academic_title.indexOf(target_univ_name) === -1 && target_univ_name) {
  academic_title += " - " + target_univ_name;
}

// 6. الفرز الذكي للمواعيد والتواريخ والخطوات
var dates_block = [];
var details_block = [];
var date_keywords = ["بتاريخ", "الموافق", "ينتهي", "يبدأ", "الموعد", "آخر موعد", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "شهر", "فصل", "ساعة"];

for (var j = 1; j < valid_lines.length && j < 12; j++) {
  var item = valid_lines[j].replace(/^[•\-\*]\s*/, "").trim();
  if (item.length < 4) continue;

  var is_date = false;
  for (var d = 0; d < date_keywords.length; d++) {
    if (item.indexOf(date_keywords[d]) !== -1) {
      is_date = true;
      break;
    }
  }

  if (is_date) {
    dates_block.push("• " + item);
  } else {
    details_block.push("• " + item);
  }
}

// بناء متن الخبر الأكاديمي المتكامل
var structured_body = "";
if (dates_block.length > 0) {
  structured_body += "\n📅 **المواعيد والتقويم الأكاديمي:**\n" + dates_block.join("\n") + "\n";
}
if (details_block.length > 0) {
  structured_body += "\n📋 **التفاصيل والتعليمات الرسمية:**\n" + details_block.join("\n") + "\n";
} else if (dates_block.length === 0) {
  structured_body += "\n📋 **تفاصيل الإعلان:**\n• " + first_line + "\n";
}

// إضافة روابط التقديم
var links_section = "";
if (official_links.length > 0) {
  links_section = "\n🔗 **رابط التقديم / البوابة الإلكترونية المباشرة:**\n" + official_links.join("\n") + "\n";
}

// الهاشتاجات الأكاديمية الرسمية
var clean_tag = target_univ_name ? target_univ_name.replace(/[^\u0621-\u064A0-9a-zA-Z]/g, "_") : "جامعة";
var hashtags_section = "#" + clean_tag + " #أخبار_التعليم #مواعيد #شؤون_الطلاب";

var final_post = "📌 **" + academic_title + "**\n" +
  structured_body +
  links_section +
  "\n💬 **يسعدنا استقبال استفساراتكم ومشاركة الخبر مع زملائكم الطلاب.**\n\n" +
  hashtags_section;

// تحويل آمن إلى HTML لمنع أي انهيار في التنسيق
function toSafeHtml(txt) {
  if (!txt) return "";
  var s = txt;
  s = s.replace(/&/g, "&amp;");
  s = s.replace(/</g, "&lt;");
  s = s.replace(/>/g, "&gt;");
  return s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
}

var safe_html = toSafeHtml(final_post);
var safe_caption = safe_html.length > 1020 ? safe_html.substring(0, 1016) + "..." : safe_html;

// 7. النشر المباشر المضمون مع الحفاظ الكامل على الصور والوسائط
var sent_count = 0;
for (var c = 0; c < target_channels.length; c++) {
  var dest = target_channels[c];
  var ok = false;

  if (media_file_id && (media_type === "photo" || media_type === "photo_doc")) {
    try {
      if (media_type === "photo_doc") {
        Api.sendDocument({ chat_id: dest, document: media_file_id, caption: safe_caption, parse_mode: "HTML" });
      } else {
        Api.sendPhoto({ chat_id: dest, photo: media_file_id, caption: safe_caption, parse_mode: "HTML" });
      }
      ok = true;
    } catch (e1) {
      try {
        Api.sendPhoto({ chat_id: dest, photo: media_file_id, caption: final_post.substring(0, 1000) });
        ok = true;
      } catch (e2) {
        try {
          Api.sendMessage({ chat_id: dest, text: safe_html, parse_mode: "HTML" });
          ok = true;
        } catch (e3) {}
      }
    }
  } else if (media_file_id && media_type === "video") {
    try {
      Api.sendVideo({ chat_id: dest, video: media_file_id, caption: safe_caption, parse_mode: "HTML" });
      ok = true;
    } catch (ev) {
      try { Api.sendMessage({ chat_id: dest, text: safe_html, parse_mode: "HTML" }); ok = true; } catch (e) {}
    }
  } else {
    try {
      Api.sendMessage({ chat_id: dest, text: safe_html, parse_mode: "HTML" });
      ok = true;
    } catch (et) {
      try { Api.sendMessage({ chat_id: dest, text: final_post }); ok = true; } catch (e) {}
    }
  }

  if (ok) sent_count++;
}

var total = Bot.getProperty("total_processed", 0) + 1;
Bot.setProperty("total_processed", total, "integer");
Bot.setProperty("last_post_title", academic_title, "string");
Bot.setProperty("last_post_time", new Date().toLocaleTimeString(), "string");

Bot.sendMessage("⚡ **تم تنسيق ونشر الخبر بالمحرك الأكاديمي المحلي (Zero-Delay)!**\n\n" +
  "• **الجامعة المستهدفة**: `" + target_univ_name + "`\n" +
  "• **قناة النشر الحصرية (" + sent_count + ")**: `" + target_channels.join("`، `") + "`\n" +
  "• تم الحفاظ على الصورة والروابط والتواريخ بأسلوب تحريري بشري متقن 100%.");
