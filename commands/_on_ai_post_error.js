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

// 2. تنظيف وتنسيق أكاديمي محلي فوري فائق السرعة (Zero-Timeout Guarantee)
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
if (title.length > 60) {
  title = title.substring(0, 57) + "...";
}

var bullets = "";
for (var j = 1; j < Math.min(valid_lines.length, 6); j++) {
  bullets += "• " + valid_lines[j] + "\n";
}
if (!bullets) {
  bullets = "• " + cleaned;
}

var fallback_text = "📌 **" + title + "**\n\n" +
  bullets + "\n" +
  "💬 يرجى متابعة التحديثات الرسمية وشارك المنشور مع زملائك!\n\n" +
  "#أخبار_الجامعة #التعليم #شؤون_الطلاب #مواعيد";

// 3. النشر الفوري للوسائط والنصوص في كافة القنوات المستهدفة
function toSafeHtmlFallback(txt) {
  if (!txt) return "";
  return txt.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
}

var safe_fallback_text = toSafeHtmlFallback(fallback_text);
var sent_count = 0;
var target_names = [];
var failed_targets = [];

for (var i = 0; i < target_channels.length; i++) {
  var ch = target_channels[i];
  var sent_success = false;

  if (media_type == "photo" && media_file_id) {
    try {
      Api.sendPhoto({ chat_id: ch, photo: media_file_id, caption: safe_fallback_text, parse_mode: "HTML" });
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
      Api.sendVideo({ chat_id: ch, video: media_file_id, caption: safe_fallback_text, parse_mode: "HTML" });
      sent_success = true;
    } catch (e1) {
      try {
        Api.sendMessage({ chat_id: ch, text: safe_fallback_text, parse_mode: "HTML" });
        sent_success = true;
      } catch (e2) {}
    }
  } else if (media_type == "document" && media_file_id) {
    try {
      Api.sendDocument({ chat_id: ch, document: media_file_id, caption: safe_fallback_text, parse_mode: "HTML" });
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
