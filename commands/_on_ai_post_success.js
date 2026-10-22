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

// كشف الردود الحوارية أو طلبات التزويد بالنص لمنع نشرها في القنوات كأخبار
var is_conversational_reply = (
  rephrased_text.indexOf("يرجى تزويدي") !== -1 ||
  rephrased_text.indexOf("أعد إرسال") !== -1 ||
  rephrased_text.indexOf("يسعدني إعادة صياغة") !== -1 ||
  rephrased_text.indexOf("أرسل لي نص الخبر") !== -1 ||
  rephrased_text.length < 25
);

if (is_conversational_reply) {
  Bot.sendMessage("💡 **رد الذكاء الاصطناعي (محادثة/توضيح)**:\n" + rephrased_text + "\n\n⚠️ *لم يتم نشر هذا الرد في القناة لأنه ليس خبراً مكتملاً.*");
  return;
}

var media_type = Bot.getProperty("pending_media_type", "text");
var media_file_id = Bot.getProperty("pending_media_id", "");
var target_channels = Bot.getProperty("pending_targets", []);
var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");

// تنقية القنوات من القنوات الوهمية أو الملغاة
var valid_targets = [];
if (target_channels && Array.isArray(target_channels)) {
  for (var t = 0; t < target_channels.length; t++) {
    var c = target_channels[t];
    if (c && c !== "@StudentServicesNews" && c !== "@SecondTargetChannel") {
      valid_targets.push(c);
    }
  }
}

if (valid_targets.length === 0) {
  var custom_target = Bot.getProperty("target_channels");
  if (custom_target) {
    valid_targets.push(custom_target);
  } else {
    valid_targets.push("@jhdhhdcj");
  }
}

var sent_count = 0;
var target_names = [];
var failed_targets = [];

function toSafeHtml(txt) {
  if (!txt) return "";
  var s = txt;
  s = s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  return s;
}

var safe_post_text = toSafeHtml(rephrased_text);

for (var i = 0; i < valid_targets.length; i++) {
  var ch = valid_targets[i];
  var sent_success = false;

  if (media_type === "photo" && media_file_id) {
    try {
      Api.sendPhoto({ chat_id: ch, photo: media_file_id, caption: safe_post_text, parse_mode: "HTML" });
      sent_success = true;
    } catch (e1) {
      // حماية فائقة: إذا تعذر على سيرفر تيليجرام جلب الصورة من الرابط الخارجي (failed to get HTTP URL content)، ننشر النص فوراً لمنع ضياع المنشور
      try {
        Api.sendMessage({ chat_id: ch, text: safe_post_text, parse_mode: "HTML" });
        sent_success = true;
      } catch (e2) {
        try {
          Api.sendMessage({ chat_id: ch, text: rephrased_text });
          sent_success = true;
        } catch (e3) {}
      }
    }
  } else if (media_type === "video" && media_file_id) {
    try {
      Api.sendVideo({ chat_id: ch, video: media_file_id, caption: safe_post_text, parse_mode: "HTML" });
      sent_success = true;
    } catch (e1) {
      try {
        Api.sendMessage({ chat_id: ch, text: safe_post_text, parse_mode: "HTML" });
        sent_success = true;
      } catch (e2) {}
    }
  } else if (media_type === "document" && media_file_id) {
    try {
      Api.sendDocument({ chat_id: ch, document: media_file_id, caption: safe_post_text, parse_mode: "HTML" });
      sent_success = true;
    } catch (e1) {
      try {
        Api.sendMessage({ chat_id: ch, text: safe_post_text, parse_mode: "HTML" });
        sent_success = true;
      } catch (e2) {}
    }
  } else {
    try {
      Api.sendMessage({ chat_id: ch, text: safe_post_text, parse_mode: "HTML" });
      sent_success = true;
    } catch (e1) {
      try {
        Api.sendMessage({ chat_id: ch, text: rephrased_text });
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

// تحديث الإحصائيات
var total = Bot.getProperty("total_processed", 0) + 1;
Bot.setProperty("total_processed", total, "integer");
Bot.setProperty("last_post_title", rephrased_text.split("\n")[0] || "تحديث أكاديمي جديد", "string");
Bot.setProperty("last_post_time", new Date().toLocaleTimeString(), "string");

var confirm_text = "✅ **تمت معالجة المنشور وصياغته بذكاء اصطناعي بنجاح!**\n\n" +
  "• **النموذج المستخدم**: `" + current_model + "`\n" +
  "• **نوع الوسائط**: " + (media_type !== "text" ? "مرفق (" + media_type + ") عالي الدقة" : "نص منسق") + "\n" +
  "• **القنوات المستهدفة المنشور فيها (" + sent_count + ")**: " + target_names.join("، ") + "\n\n";

if (failed_targets.length > 0) {
  confirm_text += "⚠️ **تنبيه بخصوص (" + failed_targets.join("، ") + ")**:\n" +
    "تعذر النشر التلقائي فيها! يرجى التأكد من إضافة البوت كمشرف (Admin) مع صلاحية نشر الرسائل، أو تغيير القناة عبر /set_channel.\n\n";
}

confirm_text += "👁️ **معاينة النص بعد الصياغة:**\n" +
  "───────────────────\n" +
  rephrased_text;

var inline_keyboard = [
  [
    { title: "🔄 فحص وسحب المصادر مجدداً", command: "/crawl_sources" },
    { title: "📢 تعديل قناة النشر", command: "/set_channel" }
  ],
  [
    { title: "📊 عرض تقرير النشر", command: "/status" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, confirm_text);
