/*CMD
  command: handle_user_post
  help: محرك النشر التلقائي الذكي ومعالج الوسائط والذكاء الاصطناعي والتوزيع
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

// دالة تحويل الماركداون إلى HTML آمن لمنع أخطاء تيليجرام 400 بسبب الشَرطات السفلية مثل @M_S_F_G و @Next_Plus_BOT0
function toSafeHtml(txt) {
  if (!txt) return "";
  var s = txt;
  s = s.replace(/&/g, "&amp;");
  s = s.replace(/</g, "&lt;");
  s = s.replace(/>/g, "&gt;");
  s = s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  return s;
}

// 1. استخراج كائن الرسالة سواء كان منشور قناة (channel_post) أو رسالة خاصة/توجيه (message)
var msg_obj = null;
if (typeof request !== "undefined" && request) {
  if (request.channel_post) {
    msg_obj = request.channel_post;
  } else if (request.message) {
    msg_obj = request.message;
  } else if (request.edited_channel_post) {
    msg_obj = request.edited_channel_post;
  } else if (request.edited_message) {
    msg_obj = request.edited_message;
  } else {
    msg_obj = request;
  }
}

// 2. استخراج النص أو الشرح (Caption)
var raw_text = "";
if (msg_obj) {
  if (msg_obj.caption) {
    raw_text = msg_obj.caption;
  } else if (msg_obj.text) {
    raw_text = msg_obj.text;
  }
}
if (!raw_text && typeof message !== "undefined" && message) {
  raw_text = message;
}

// 3. استخراج الوسائط بدقة فائقة وبأعلى جودة
var media_type = null;
var media_file_id = null;

var photo_arr = null;
if (msg_obj && msg_obj.photo) photo_arr = msg_obj.photo;
else if (typeof request !== "undefined" && request && request.photo) photo_arr = request.photo;
else if (typeof request !== "undefined" && request && request.message && request.message.photo) photo_arr = request.message.photo;
else if (typeof request !== "undefined" && request && request.channel_post && request.channel_post.photo) photo_arr = request.channel_post.photo;
else if (typeof options !== "undefined" && options && options.photo) photo_arr = options.photo;

if (photo_arr) {
  if (Array.isArray(photo_arr) && photo_arr.length > 0) {
    media_type = "photo";
    media_file_id = photo_arr[photo_arr.length - 1].file_id;
  } else if (typeof photo_arr === "object" && photo_arr.file_id) {
    media_type = "photo";
    media_file_id = photo_arr.file_id;
  } else if (typeof photo_arr === "string") {
    media_type = "photo";
    media_file_id = photo_arr;
  }
}

if (!media_type) {
  var vid = (msg_obj && msg_obj.video) || (typeof request !== "undefined" && request && (request.video || (request.message && request.message.video) || (request.channel_post && request.channel_post.video)));
  if (vid && vid.file_id) {
    media_type = "video";
    media_file_id = vid.file_id;
  }
}

if (!media_type) {
  var doc = (msg_obj && msg_obj.document) || (typeof request !== "undefined" && request && (request.document || (request.message && request.message.document) || (request.channel_post && request.channel_post.document)));
  if (doc && doc.file_id) {
    var mime = (doc.mime_type || "").toLowerCase();
    if (mime.indexOf("image/") === 0) {
      media_type = "photo_doc";
    } else {
      media_type = "document";
    }
    media_file_id = doc.file_id;
  }
}

if (!media_type) {
  var aud = (msg_obj && msg_obj.audio) || (typeof request !== "undefined" && request && (request.audio || (request.message && request.message.audio)));
  if (aud && aud.file_id) {
    media_type = "audio";
    media_file_id = aud.file_id;
  }
}

if (!media_type) {
  var vce = (msg_obj && msg_obj.voice) || (typeof request !== "undefined" && request && (request.voice || (request.message && request.message.voice)));
  if (vce && vce.file_id) {
    media_type = "voice";
    media_file_id = vce.file_id;
  }
}

// إذا كانت الرسالة أمراً برمجياً (Command) مثل /start دون ميديا، لا تعالجها كمنشور
if (raw_text && raw_text.indexOf("/") === 0 && !media_file_id) {
  return;
}

// إذا لم يتوفر نص ولا وسائط، لا يوجد منشور للمعالجة
if (!raw_text && !media_file_id) {
  return;
}

// 4. فحص حالة إيقاف البوت
var is_paused = Bot.getProperty("bot_paused", false);
if (is_paused) {
  Bot.sendMessage("⏸️ **تنبيه**: تم التقاط منشور جديد، لكن النشر التلقائي متوقف حالياً بأمر المشرف.\n(استخدم /pause أو الزر في /start لإعادة التشغيل)");
  return;
}

// 5. استخراج المصدر بدقة (قنوات، بوتات مثل @Next_Plus_BOT0، مستخدمين، توجيه)
var source_origin = null;
var source_title = null;

if (msg_obj && msg_obj.chat && (msg_obj.chat.type === "channel" || msg_obj.chat.type === "supergroup")) {
  source_origin = msg_obj.chat.username ? ("@" + msg_obj.chat.username) : ("" + msg_obj.chat.id);
  source_title = msg_obj.chat.title || source_origin;
} else if (msg_obj && msg_obj.forward_from_chat) {
  source_origin = msg_obj.forward_from_chat.username ? ("@" + msg_obj.forward_from_chat.username) : ("" + msg_obj.forward_from_chat.id);
  source_title = msg_obj.forward_from_chat.title || source_origin;
} else if (msg_obj && msg_obj.forward_origin) {
  if (msg_obj.forward_origin.chat) {
    source_origin = msg_obj.forward_origin.chat.username ? ("@" + msg_obj.forward_origin.chat.username) : ("" + msg_obj.forward_origin.chat.id);
    source_title = msg_obj.forward_origin.chat.title || source_origin;
  } else if (msg_obj.forward_origin.sender_chat) {
    source_origin = msg_obj.forward_origin.sender_chat.username ? ("@" + msg_obj.forward_origin.sender_chat.username) : ("" + msg_obj.forward_origin.sender_chat.id);
    source_title = msg_obj.forward_origin.sender_chat.title || source_origin;
  } else if (msg_obj.forward_origin.sender_user) {
    source_origin = msg_obj.forward_origin.sender_user.username ? ("@" + msg_obj.forward_origin.sender_user.username) : ("" + msg_obj.forward_origin.sender_user.id);
    source_title = msg_obj.forward_origin.sender_user.first_name || source_origin;
  } else if (msg_obj.forward_origin.sender_user_name) {
    source_origin = "@" + msg_obj.forward_origin.sender_user_name;
    source_title = msg_obj.forward_origin.sender_user_name;
  }
} else if (msg_obj && msg_obj.forward_from) {
  source_origin = msg_obj.forward_from.username ? ("@" + msg_obj.forward_from.username) : ("" + msg_obj.forward_from.id);
  source_title = msg_obj.forward_from.first_name || source_origin;
} else if (msg_obj && msg_obj.forward_sender_name) {
  source_origin = msg_obj.forward_sender_name;
  source_title = msg_obj.forward_sender_name;
} else if (typeof request !== "undefined" && request && request.forward_from_chat) {
  source_origin = request.forward_from_chat.username ? ("@" + request.forward_from_chat.username) : ("" + request.forward_from_chat.id);
  source_title = request.forward_from_chat.title || source_origin;
}

var is_private_chat = (msg_obj && msg_obj.chat && msg_obj.chat.type === "private") || (typeof chat !== "undefined" && chat && chat.chat_type === "private");
var is_forwarded = !!(source_origin || (msg_obj && (msg_obj.forward_date || msg_obj.forward_from_chat || msg_obj.forward_origin)));

// توجيه نصوص أزرار الكيبورد إلى الأوامر المخصصة لمنع صياغتها كمنشورات
if (is_private_chat && !is_forwarded && !media_file_id && raw_text) {
  var t = raw_text.trim();
  if (t === "💬 محادثة الذكاء والبحث" || t === "محادثة الذكاء والبحث" || t === "💬 محادثة الذكاء" || t === "محادثة الذكاء" || t === "محادثة" || t === "بحث الذكاء") {
    Bot.runCommand("/chat");
    return;
  }
  if (t === "🔄 فحص وسحب المنشورات" || t === "فحص وسحب المنشورات" || t === "🔄 سحب وفحص المصادر" || t === "🔄 فحص وسحب المنشورات الآن") {
    Bot.runCommand("/crawl_sources");
    return;
  }
  if (t === "➕ إضافة مصادر خارجية" || t === "إضافة مصادر خارجية" || t === "إضافة مصدر") {
    Bot.runCommand("/add_source");
    return;
  }
  if (t === "📢 تحديد قناة النشر" || t === "تحديد قناة النشر" || t === "📢 قنوات النشر" || t === "📢 تحديد قناة النشر الهدف") {
    Bot.runCommand("/set_channel");
    return;
  }
  if (t === "📝 صياغة ونشر خبر فوري" || t === "صياغة ونشر خبر فوري" || t === "نشر خبر فوري") {
    Bot.runCommand("/new_post");
    return;
  }
  if (t === "📋 قائمة المصادر" || t === "قائمة المصادر" || t === "المصادر") {
    Bot.runCommand("/sources");
    return;
  }
  if (t === "⚙️ إعدادات الذكاء الاصطناعي" || t === "إعدادات الذكاء الاصطناعي" || t === "الذكاء الاصطناعي") {
    Bot.runCommand("/ai");
    return;
  }
  if (t === "🔗 ربط القنوات والأهداف" || t === "ربط القنوات والأهداف" || t === "خريطة القنوات") {
    Bot.runCommand("/mapping");
    return;
  }
  if (t === "🎯 إعلان خدماتي البديل" || t === "إعلان خدماتي البديل" || t === "الإعلان البديل") {
    Bot.runCommand("/ad");
    return;
  }
  if (t === "👤 إدارة اليوزربوت وجلسة الحساب" || t === "إدارة اليوزربوت" || t === "اليوزربوت" || t === "👤 إدارة اليوزربوت") {
    Bot.runCommand("/userbot");
    return;
  }
  if (t === "📊 حالة النظام والتقارير" || t === "حالة النظام" || t === "تقارير النشر" || t === "📊 تقارير النشر") {
    Bot.runCommand("/status");
    return;
  }
  if (t === "⚙️ تعليمات المحرر الأكاديمي" || t === "تعليمات المحرر الأكاديمي" || t === "التعليمات") {
    Bot.runCommand("/instructions");
    return;
  }
  if (t === "🔑 المفاتيح والاعتمادات" || t === "المفاتيح والاعتمادات" || t === "المفاتيح" || t === "🔑 المفاتيح والبيانات") {
    Bot.runCommand("/keys");
    return;
  }
  if (t === "👥 إدارة المستخدمين" || t === "إدارة المستخدمين والصلاحيات" || t === "👥 إدارة المستخدمين والصلاحيات") {
    Bot.runCommand("/users");
    return;
  }
  if (t === "🟢 تشغيل / إيقاف البوت" || t === "تشغيل / إيقاف البوت" || t === "إيقاف / تشغيل" || t === "⏸️ تشغيل / إيقاف البوت") {
    Bot.runCommand("/pause");
    return;
  }
  if (t === "🧪 تجربة الصياغة الفورية" || t === "تجربة الصياغة") {
    Bot.runCommand("/test");
    return;
  }
  if (t === "🎛 لوحة التحكم الرئيسية" || t === "لوحة التحكم" || t === "الرئيسية") {
    Bot.runCommand("/start");
    return;
  }
}

// تجنب الكلمات الترحيبية المفردة في الخاص
var short_greetings = ["مرحبا", "سلام", "الو", "هلا", "hi", "hello"];
if (is_private_chat && !is_forwarded && !media_file_id && short_greetings.indexOf(raw_text.toLowerCase()) !== -1) {
  Bot.sendMessage("👋 **أهلاً بك يا مديرنا!**\nوجّه أي منشور أو أرسل نص الخبر كاملاً وسأقوم بإعادة صياغته ونشره فوراً في قناتك @jhdhhdcj.");
  Bot.runCommand("/start");
  return;
}

// 6. تحديد القنوات المستهدفة للنشر (دائماً تضمن @jhdhhdcj)
var target_channels = ["@jhdhhdcj"];
var custom_saved_target = Bot.getProperty("target_channels");
if (custom_saved_target && custom_saved_target !== "@MyUniversityChannel" && target_channels.indexOf(custom_saved_target) === -1) {
  target_channels.push(custom_saved_target);
}

// 7. إشعار فوري في المحادثة بأن المنشور تم استلامه وقراءته بنجاح
if (is_private_chat) {
  var display_src = source_origin ? ("من المصدر `" + source_origin + "`") : "المباشر";
  Bot.sendMessage("📥 **تم استلام المنشور " + display_src + " بنجاح!**\n⚡ جاري المعالجة بالذكاء الاصطناعي (DeepSeek-V4.1-Flash) والنشر فوراً في: `" + target_channels.join("`، `") + "`...");
}

// 8. كشف إعلانات المنافسين واستبدالها بإعلان خدمات المشرف @M_S_F_G
var ad_keywords = [
  "إعلان مدفوع", "حل واجبات", "بحوث تخرج", "خدمات طلابية", "مشاريع تخرج", "كتابة أبحاث", "إعلان ممول", "برعاية", "للتواصل تليجرام"
];

var is_ad = false;
for (var i = 0; i < ad_keywords.length; i++) {
  if (raw_text.indexOf(ad_keywords[i]) !== -1) {
    is_ad = true;
    break;
  }
}

if (is_ad) {
  var custom_ad = Bot.getProperty("custom_ad", "🎓 **خدمات طلابية وأكاديمية معتمدة ومتكاملة** 🎓\n\n" +
    "يسرنا تقديم الدعم الأكاديمي الشامل لجميع الطلاب والباحثين:\n" +
    "• مساعدة متخصصة في البحوث ومشاريع التخرج\n" +
    "• التدقيق اللغوي وتنسيق الرسائل العلمية\n" +
    "• إعداد العروض التقديمية وتلخيص المقررات الدراسية\n\n" +
    "📞 **للتواصل والطلب المباشر عبر المشرف**: @M_S_F_G\n" +
    "✨ *جودة أكاديمية موثوقة، دقة في المواعيد، وأسعار خاصة للطلاب!*");

  var safe_ad = toSafeHtml(custom_ad);
  var total_ads = Bot.getProperty("total_ads_replaced", 0) + 1;
  Bot.setProperty("total_ads_replaced", total_ads, "integer");

  // نشر الإعلان البديل عبر HTML لمنع أخطاء @M_S_F_G
  for (var k = 0; k < target_channels.length; k++) {
    var ch_target = target_channels[k];
    try {
      if ((media_type === "photo" || media_type === "photo_doc") && media_file_id) {
        var ad_cap = safe_ad.length > 1024 ? safe_ad.substring(0, 1020) + "..." : safe_ad;
        try {
          if (media_type === "photo_doc") {
            Api.sendDocument({ chat_id: ch_target, document: media_file_id, caption: ad_cap, parse_mode: "HTML" });
          } else {
            Api.sendPhoto({ chat_id: ch_target, photo: media_file_id, caption: ad_cap, parse_mode: "HTML" });
          }
        } catch (photo_err) {
          try {
            if (media_type === "photo_doc") {
              Api.sendDocument({ chat_id: ch_target, document: media_file_id });
            } else {
              Api.sendPhoto({ chat_id: ch_target, photo: media_file_id });
            }
            Api.sendMessage({ chat_id: ch_target, text: safe_ad, parse_mode: "HTML" });
          } catch (photo_err2) {
            Api.sendMessage({ chat_id: ch_target, text: safe_ad, parse_mode: "HTML" });
          }
        }
      } else if (media_type === "video") {
        Api.sendVideo({ chat_id: ch_target, video: media_file_id, caption: safe_ad, parse_mode: "HTML" });
      } else if (media_type === "document") {
        Api.sendDocument({ chat_id: ch_target, document: media_file_id, caption: safe_ad, parse_mode: "HTML" });
      } else {
        Api.sendMessage({ chat_id: ch_target, text: safe_ad, parse_mode: "HTML" });
      }
    } catch (e) {
      try {
        Api.sendMessage({ chat_id: ch_target, text: custom_ad });
      } catch (e2) {}
    }
  }

  Bot.sendMessage("🎯 **تم كشف إعلان منافس واستبداله تلقائياً!**\nتم نشر إعلان خدماتك في: `" + target_channels.join("`، `") + "`");
  return;
}

// 9. حفظ بيانات المنشور والوسائط والقنوات المستهدفة
Bot.setProperty("pending_media_type", media_type || "text", "string");
Bot.setProperty("pending_media_id", media_file_id || "", "string");
Bot.setProperty("pending_raw_text", raw_text, "string");
Bot.setProperty("pending_targets", target_channels, "json");

// 10. فحص حالة الذكاء الاصطناعي والإعدادات الديناميكية
var ai_enabled = Bot.getProperty("ai_enabled", true);
var current_model = Bot.getProperty("ai_model", "DeepSeek-V4.1-Flash");
var base_url = Bot.getProperty("ai_base_url", "https://api.hcnsec.cn/v1");
var api_key = Bot.getProperty("ai_api_key", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii");

if (!ai_enabled || !raw_text) {
  // نشر مباشر دون إعادة صياغة عبر HTML الآمن
  var safe_raw = toSafeHtml(raw_text);
  var safe_raw_caption = safe_raw ? (safe_raw.length > 1024 ? safe_raw.substring(0, 1020) + "..." : safe_raw) : "";
  for (var p = 0; p < target_channels.length; p++) {
    var dest = target_channels[p];
    try {
      if ((media_type === "photo" || media_type === "photo_doc") && media_file_id) {
        try {
          if (media_type === "photo_doc") {
            var doc_p = { chat_id: dest, document: media_file_id };
            if (safe_raw_caption) { doc_p.caption = safe_raw_caption; doc_p.parse_mode = "HTML"; }
            Api.sendDocument(doc_p);
          } else {
            var pho_p = { chat_id: dest, photo: media_file_id };
            if (safe_raw_caption) { pho_p.caption = safe_raw_caption; pho_p.parse_mode = "HTML"; }
            Api.sendPhoto(pho_p);
          }
        } catch (photo_err1) {
          try {
            if (media_type === "photo_doc") {
              Api.sendDocument({ chat_id: dest, document: media_file_id });
            } else {
              Api.sendPhoto({ chat_id: dest, photo: media_file_id });
            }
            if (safe_raw) Api.sendMessage({ chat_id: dest, text: safe_raw, parse_mode: "HTML" });
          } catch (photo_err2) {
            if (safe_raw) Api.sendMessage({ chat_id: dest, text: safe_raw, parse_mode: "HTML" });
          }
        }
      } else if (media_type === "video") {
        Api.sendVideo({ chat_id: dest, video: media_file_id, caption: safe_raw_caption, parse_mode: "HTML" });
      } else if (media_type === "document") {
        Api.sendDocument({ chat_id: dest, document: media_file_id, caption: safe_raw_caption, parse_mode: "HTML" });
      } else {
        if (safe_raw) Api.sendMessage({ chat_id: dest, text: safe_raw, parse_mode: "HTML" });
      }
    } catch (err) {
      try {
        if (raw_text) Api.sendMessage({ chat_id: dest, text: raw_text });
      } catch (err2) {}
    }
  }
  var total = Bot.getProperty("total_processed", 0) + 1;
  Bot.setProperty("total_processed", total, "integer");
  Bot.sendMessage("⚡ **تم النشر المباشر** في: `" + target_channels.join("`، `") + "`");
  return;
}

// 11. صياغة الموجه الذكي وتنفيذ الاستدعاء لـ API الذكاء الاصطناعي (سرعة فائقة لمنع الـ Timeout)
var system_prompt = "أنت محرر محتوى تعليمي وجامعي محترف. صِغ هذا الخبر بأسلوب إخباري راقٍ وأصيل مع عنوان بارز (📌) ونقاط واضحة للمواعيد والخطوات، مع حذف معرفات وروابط قنوات تيليجرام الأخرى فقط، مع الاحتفاظ التام بكافة روابط المواقع الخارجية وبوابات الجامعات والأنظمة الإلكترونية لتظل قابلة للفتح، وبدون مقدمات حوارية وبدون إيموجي رسومية مشوهة. اختم بدعوة للمشاركة وهاشتاجات مناسبة.";

var endpoint_url = base_url.replace(/\/+$/, "") + "/chat/completions";

HTTP.post({
  url: endpoint_url,
  headers: {
    "Authorization": "Bearer " + api_key,
    "Content-Type": "application/json"
  },
  body: {
    model: current_model,
    messages: [
      { role: "system", content: system_prompt },
      { role: "user", content: raw_text }
    ],
    temperature: 0.25,
    max_tokens: 280
  },
  success: "/on_ai_post_success",
  error: "/on_ai_post_error",
  background: true
});
