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

function cleanArabicText(txt) {
  if (!txt) return "";
  var s = txt;
  s = s.replace(/ߓ堙噈اعيد/g, "مواعيد");
  s = s.replace(/ߓꠙ嘰كرات/g, "مذكرات");
  s = s.replace(/ߎ㠘㙆ظمة/g, "أنظمة");
  s = s.replace(/ߓ/g, "• ");
  s = s.replace(/ߎ/g, "• ");
  s = s.replace(/ߌ/g, "");
  s = s.replace(/[\u07C0-\u07FF\u4E00-\u9FFF\uF000-\uFFFF]/g, "");
  return s.trim();
}

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

rephrased_text = cleanArabicText(rephrased_text);

// تنظيف الرد والتأكد من وجود عنوان أكاديمي بارز
if (rephrased_text.indexOf("📌") === -1 && rephrased_text.indexOf("📢") === -1 && rephrased_text.indexOf("🎓") === -1) {
  rephrased_text = "📌 " + rephrased_text;
}

// ضمان وجود الهاشتاجات الأكاديمية القوية دائماً
if (rephrased_text.indexOf("#") === -1) {
  var raw_lower = (Bot.getProperty("pending_raw_text", "") + " " + rephrased_text).toLowerCase();
  var extra_tags = [];
  extra_tags.push("#أخبار_التعليم");
  if (raw_lower.indexOf("سعود") !== -1 || raw_lower.indexOf("ksu") !== -1) extra_tags.push("#جامعة_الملك_سعود");
  else if (raw_lower.indexOf("عبدالعزيز") !== -1) extra_tags.push("#جامعة_الملك_عبدالعزيز");
  else if (raw_lower.indexOf("نورة") !== -1) extra_tags.push("#جامعة_الأميرة_نورة");
  else extra_tags.push("#التعليم_الجامعي");

  if (raw_lower.indexOf("قبول") !== -1 || raw_lower.indexOf("تسجيل") !== -1) {
    extra_tags.push("#القبول_الموحد");
    extra_tags.push("#تسجيل_الجامعات");
  } else if (raw_lower.indexOf("امتحان") !== -1 || raw_lower.indexOf("اختبار") !== -1) {
    extra_tags.push("#الاختبارات_النهائية");
  } else {
    extra_tags.push("#شؤون_الطلاب");
    extra_tags.push("#مواعيد");
  }
  rephrased_text += "\n\n" + extra_tags.join(" ");
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

// إذا كانت الميديا رابطاً نسبياً أو رمزاً تعبيرياً من الويب نحولها لنص، أما إذا كانت file_id نحافظ عليها
if (media_file_id && (media_file_id.indexOf("http") === 0 || media_file_id.indexOf("//") === 0)) {
  if (media_file_id.indexOf("emoji") !== -1 || media_file_id.indexOf("/img/") !== -1 || media_file_id.indexOf("website_icon") !== -1) {
    media_type = "text";
    media_file_id = "";
  }
}

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
  s = s.replace(/&/g, "&amp;");
  s = s.replace(/</g, "&lt;");
  s = s.replace(/>/g, "&gt;");
  s = s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  return s;
}

var safe_post_text = toSafeHtml(rephrased_text);
var safe_caption = safe_post_text;
if (safe_caption && safe_caption.length > 1024) {
  safe_caption = safe_caption.substring(0, 1020) + "...";
}

for (var i = 0; i < valid_targets.length; i++) {
  var ch = valid_targets[i];
  var sent_success = false;

  if ((media_type === "photo" || media_type === "photo_doc") && media_file_id) {
    var p_success = false;
    var clean_cap = rephrased_text.length > 1024 ? rephrased_text.substring(0, 1020) + "..." : rephrased_text;

    // 1. محاولة الإرسال المباشر بالصورة والشرح دون parse_mode لتفادي أخطاء الرموز مثل > و &
    try {
      if (media_type === "photo_doc") {
        Api.sendDocument({ chat_id: ch, document: media_file_id, caption: clean_cap });
      } else {
        Api.sendPhoto({ chat_id: ch, photo: media_file_id, caption: clean_cap });
      }
      p_success = true;
    } catch (e1) {
      // 2. محاولة ثانية مع HTML
      try {
        if (media_type === "photo_doc") {
          Api.sendDocument({ chat_id: ch, document: media_file_id, caption: safe_caption, parse_mode: "HTML" });
        } else {
          Api.sendPhoto({ chat_id: ch, photo: media_file_id, caption: safe_caption, parse_mode: "HTML" });
        }
        p_success = true;
      } catch (e2) {
        // 3. إرسال الصورة أولاً ثم إرسال النص لضمان ظهور الصورة دائماً للطلاب
        try {
          if (media_type === "photo_doc") {
            Api.sendDocument({ chat_id: ch, document: media_file_id });
          } else {
            Api.sendPhoto({ chat_id: ch, photo: media_file_id });
          }
          Api.sendMessage({ chat_id: ch, text: clean_cap });
          p_success = true;
        } catch (e3) {
          try {
            Api.sendMessage({ chat_id: ch, text: clean_cap });
            p_success = true;
          } catch (e4) {}
        }
      }
    }
    sent_success = p_success;
  } else if (media_type === "video" && media_file_id) {
    try {
      Api.sendVideo({ chat_id: ch, video: media_file_id, caption: safe_caption, parse_mode: "HTML" });
      sent_success = true;
    } catch (e1) {
      try {
        Api.sendVideo({ chat_id: ch, video: media_file_id });
        Api.sendMessage({ chat_id: ch, text: safe_post_text, parse_mode: "HTML" });
        sent_success = true;
      } catch (e2) {
        try {
          Api.sendMessage({ chat_id: ch, text: safe_post_text, parse_mode: "HTML" });
          sent_success = true;
        } catch (e3) {}
      }
    }
  } else if (media_type === "document" && media_file_id) {
    try {
      Api.sendDocument({ chat_id: ch, document: media_file_id, caption: safe_caption, parse_mode: "HTML" });
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
