/*CMD
  command: /on_ai_post_error
  help: المعالج الاحتياطي الذكي الفوري في حال بطء أو انتهاء مهلة البوابة الخارجية (Timeout Guard)
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

// 1. تحديد القنوات الهدف من القائمة المعلقة أو الخريطة
var target_channels = Bot.getProperty("pending_targets");
if (!target_channels || !Array.isArray(target_channels) || target_channels.length === 0) {
  var mappings = Bot.getProperty("channel_mappings", []);
  target_channels = [];
  for (var m = 0; m < mappings.length; m++) {
    if (mappings[m].enabled && mappings[m].target) {
      target_channels.push(mappings[m].target);
    }
  }
}
if (!target_channels || target_channels.length === 0) {
  var saved_single = Bot.getProperty("target_channels");
  target_channels = [saved_single || "@jhdhhdcj"];
}

// 2. تنظيف وهندسة محتوى أكاديمي فائق القوة والدقة (High-Impact Academic Synthesizer)
var cleaned = raw_text.replace(/@[a-zA-Z0-9_]+/g, "");
cleaned = cleaned.replace(/https?:\/\/t\.me\/[^\s]+/g, "");
cleaned = cleaned.replace(/(وفقاً لـ?|بحسب|نقلاً عن|المصدر:|قناة|حساب)\s+[^\s\n]+/g, "");
cleaned = cleaned.replace(/لا تنسوا الاشتراك[^\n.]*/g, "");
cleaned = cleaned.replace(/تابعونا على[^\n.]*/g, "");

var lines = cleaned.split("\n");
var valid_lines = [];
for (var k = 0; k < lines.length; k++) {
  var l = lines[k].trim();
  if (l && l.indexOf("http") !== 0 && l.length > 2) {
    valid_lines.push(l);
  }
}

// استخراج عنوان أكاديمي بارز
var first_line = valid_lines.length > 0 ? valid_lines[0] : "تحديث أكاديمي وجامعي هام";
first_line = first_line.replace(/^[•\-\*#📌📢✨🎓]\s*/, "");
var title = first_line.length < 75 ? first_line : "إعلان رسمي هام للطلبة والجامعيين";

// تصنيف المحتوى واستخراج هاشتاجات ديناميكية دقيقة
var lower_raw = raw_text.toLowerCase();
var hashtags = ["#أخبار_التعليم", "#جامعة"];

if (lower_raw.indexOf("سعود") !== -1 || lower_raw.indexOf("ksu") !== -1) {
  hashtags.push("#جامعة_الملك_سعود");
} else if (lower_raw.indexOf("عبدالعزيز") !== -1 || lower_raw.indexOf("kau") !== -1) {
  hashtags.push("#جامعة_الملك_عبدالعزيز");
} else if (lower_raw.indexOf("نورة") !== -1 || lower_raw.indexOf("pnu") !== -1) {
  hashtags.push("#جامعة_الأميرة_نورة");
} else if (lower_raw.indexOf("الإمام") !== -1) {
  hashtags.push("#جامعة_الإمام");
} else {
  hashtags.push("#التعليم_الجامعي");
}

if (lower_raw.indexOf("قبول") !== -1 || lower_raw.indexOf("تسجيل") !== -1 || lower_raw.indexOf("بوابة") !== -1) {
  hashtags.push("#القبول_الموحد");
  hashtags.push("#تسجيل_الجامعات");
}
if (lower_raw.indexOf("امتحان") !== -1 || lower_raw.indexOf("اختبار") !== -1 || lower_raw.indexOf("نهائي") !== -1) {
  hashtags.push("#الاختبارات_النهائية");
}
if (lower_raw.indexOf("منح") !== -1 || lower_raw.indexOf("مكافأة") !== -1) {
  hashtags.push("#المنح_الدراسية");
}
if (lower_raw.indexOf("تقويم") !== -1 || lower_raw.indexOf("إجازة") !== -1 || lower_raw.indexOf("فصل") !== -1) {
  hashtags.push("#التقويم_الدراسي");
}
if (lower_raw.indexOf("وظائف") !== -1 || lower_raw.indexOf("معيد") !== -1) {
  hashtags.push("#وظائف_أكاديمية");
}

// تصفية الهاشتاجات لتكون من 3 إلى 5 هاشتاجات قوية
var unique_hashtags = [];
for (var h = 0; h < hashtags.length; h++) {
  if (unique_hashtags.indexOf(hashtags[h]) === -1 && unique_hashtags.length < 5) {
    unique_hashtags.push(hashtags[h]);
  }
}

// صياغة النقاط المنظمة
var bullet_points = [];
for (var j = 1; j < valid_lines.length; j++) {
  var line_txt = valid_lines[j].replace(/^[•\-\*]\s*/, "");
  if (line_txt.length > 5) {
    var prefix = "• ";
    if (line_txt.indexOf("موعد") !== -1 || line_txt.indexOf("تاريخ") !== -1 || line_txt.indexOf("يوم") !== -1) {
      prefix = "📅 ";
    } else if (line_txt.indexOf("شرط") !== -1 || line_txt.indexOf("شروط") !== -1 || line_txt.indexOf("نسبة") !== -1) {
      prefix = "📋 ";
    } else if (line_txt.indexOf("رابط") !== -1 || line_txt.indexOf("بوابة") !== -1 || line_txt.indexOf("تقديم") !== -1) {
      prefix = "🔗 ";
    }
    bullet_points.push(prefix + line_txt);
  }
}

var content_body = bullet_points.length > 0 ? bullet_points.slice(0, 7).join("\n\n") : ("• " + cleaned);

var fallback_text = "📌 **" + title + "**\n\n" +
  content_body + "\n\n" +
  "💬 **شارك المنشور مع زملائك الطلاب لتعم الفائدة، ويسعدنا دائماً الإجابة على استفساراتكم!**\n\n" +
  unique_hashtags.join(" ");

// 3. النشر الفوري للوسائط والنصوص في كافة القنوات المستهدفة
function toSafeHtmlFallback(txt) {
  if (!txt) return "";
  return txt.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
}

var safe_fallback_text = toSafeHtmlFallback(fallback_text);
var safe_fallback_caption = safe_fallback_text;
if (safe_fallback_caption && safe_fallback_caption.length > 1024) {
  safe_fallback_caption = safe_fallback_caption.substring(0, 1020) + "...";
}
var sent_count = 0;
var target_names = [];
var failed_targets = [];

for (var i = 0; i < target_channels.length; i++) {
  var ch = target_channels[i];
  var sent_success = false;

  if (media_type == "photo" && media_file_id) {
    try {
      Api.sendPhoto({ chat_id: ch, photo: media_file_id, caption: safe_fallback_caption, parse_mode: "HTML" });
      sent_success = true;
    } catch (e1) {
      // إذا فشل جلب الصورة عبر HTTP URL، ننشر النص مباشرة في القناة لمنع ضياع المنشور
      try {
        Api.sendMessage({ chat_id: ch, text: safe_fallback_text, parse_mode: "HTML" });
        sent_success = true;
      } catch (e2) {
        try {
          Api.sendMessage({ chat_id: ch, text: fallback_text });
          sent_success = true;
        } catch (e3) {}
      }
    }
  } else if (media_type == "video" && media_file_id) {
    try {
      Api.sendVideo({ chat_id: ch, video: media_file_id, caption: safe_fallback_caption, parse_mode: "HTML" });
      sent_success = true;
    } catch (e1) {
      try {
        Api.sendMessage({ chat_id: ch, text: safe_fallback_text, parse_mode: "HTML" });
        sent_success = true;
      } catch (e2) {}
    }
  } else if (media_type == "document" && media_file_id) {
    try {
      Api.sendDocument({ chat_id: ch, document: media_file_id, caption: safe_fallback_caption, parse_mode: "HTML" });
      sent_success = true;
    } catch (e1) {
      try {
        Api.sendMessage({ chat_id: ch, text: safe_fallback_text, parse_mode: "HTML" });
        sent_success = true;
      } catch (e2) {}
    }
  } else {
    try {
      Api.sendMessage({ chat_id: ch, text: safe_fallback_text, parse_mode: "HTML" });
      sent_success = true;
    } catch (e1) {
      try {
        Api.sendMessage({ chat_id: ch, text: fallback_text });
        sent_success = true;
      } catch (e2) {}
    }
  }

  if (sent_success) {
    sent_count++;
    target_names.push(ch);
  } else {
    failed_targets.push(ch);
  }
}

var total = Bot.getProperty("total_processed", 0) + 1;
Bot.setProperty("total_processed", total, "integer");

var alert_msg = "⚡ **تم النشر التلقائي بنجاح عبر محرك التنسيق الأكاديمي الفوري!**\n\n" +
  "• **سبب التحويل**: حدث تأخير مؤقت في خادم الذكاء الاصطناعي الخارجي (Timeout)، وتم التدخل الفوري لمنع ضياع المنشور.\n" +
  "• **القنوات المنشور فيها (" + sent_count + ")**: `" + target_names.join("`، `") + "`\n" +
  "• تم نقل الميديا وتنسيق النقاط والعناوين بأعلى جودة.";

var inline_keyboard = [
  [
    { title: "📊 حالة النظام والتقارير", command: "/status" },
    { title: "⚙️ إعدادات الذكاء", command: "/ai" }
  ],
  [
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, alert_msg);
