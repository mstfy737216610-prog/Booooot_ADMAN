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

var photo_arr = (msg_obj && msg_obj.photo) ? msg_obj.photo : (typeof request !== "undefined" && request ? request.photo : null);
if (photo_arr && photo_arr.length > 0) {
  media_type = "photo";
  media_file_id = photo_arr[photo_arr.length - 1].file_id;
} else if ((msg_obj && msg_obj.video) || (typeof request !== "undefined" && request && request.video)) {
  media_type = "video";
  var vid = (msg_obj && msg_obj.video) || request.video;
  media_file_id = vid.file_id;
} else if ((msg_obj && msg_obj.document) || (typeof request !== "undefined" && request && request.document)) {
  media_type = "document";
  var doc = (msg_obj && msg_obj.document) || request.document;
  media_file_id = doc.file_id;
} else if ((msg_obj && msg_obj.audio) || (typeof request !== "undefined" && request && request.audio)) {
  media_type = "audio";
  var aud = (msg_obj && msg_obj.audio) || request.audio;
  media_file_id = aud.file_id;
} else if ((msg_obj && msg_obj.voice) || (typeof request !== "undefined" && request && request.voice)) {
  media_type = "voice";
  var vce = (msg_obj && msg_obj.voice) || request.voice;
  media_file_id = vce.file_id;
}

// إذا كانت الرسالة أمراً برمجياً (Command) مثل /start أو /sources دون ميديا، لا تعالجها كمنشور
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

// 5. استخراج المصدر بدقة (قناة ناشرة، توجيه مباشر، أو Telegram 7.0+ Forward Origin)
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
  } else if (msg_obj.forward_origin.sender_user_name) {
    source_origin = "@" + msg_obj.forward_origin.sender_user_name;
  }
} else if (typeof request !== "undefined" && request && request.forward_from_chat) {
  source_origin = request.forward_from_chat.username ? ("@" + request.forward_from_chat.username) : ("" + request.forward_from_chat.id);
  source_title = request.forward_from_chat.title || source_origin;
}

// تجنب نشر المحادثات العادية أو الكلمات القصيرة المرسلة في الخاص كأخبار في القنوات
var is_private_chat = (msg_obj && msg_obj.chat && msg_obj.chat.type === "private") || (typeof chat !== "undefined" && chat && chat.chat_type === "private");
var is_forwarded = !!(source_origin || (msg_obj && (msg_obj.forward_date || msg_obj.forward_from_chat || msg_obj.forward_origin)));

if (is_private_chat && !is_forwarded && !media_file_id && raw_text.length < 20) {
  Bot.sendMessage("👋 **أهلاً بك في بوت النشر الأكاديمي واليوزربوت!**\n\n" +
    "💡 **كيفية استخدام البوت للنشر:**\n" +
    "• **توجيه مباشر**: وجّه (Forward) أي منشور من أي قناة إلى هنا ليقوم البوت بصياغته ونشره فوراً.\n" +
    "• **سحب آلي**: اضغط `🔄 سحب وفحص المصادر` لفحص وسحب آخر منشورات القنوات المراقبة.\n" +
    "• **خبر مخصص**: اكتب نص الخبر كاملاً (أكثر من 20 حرفاً) لإعادة صياغته.\n\n" +
    "👇 اختر من القائمة للتحكم:");
  Bot.runCommand("/start");
  return;
}

// دالة توحيد ومقارنة المعرفات
function normalizeSource(str) {
  if (!str) return "";
  var s = String(str).trim().toLowerCase();
  s = s.replace(/^https?:\/\/t\.me\//i, "");
  s = s.replace(/^t\.me\//i, "");
  s = s.replace(/^@/, "");
  s = s.replace(/\/.*$/, "");
  return s;
}

// 6. تحديد القنوات المستهدفة للنشر
var mappings = Bot.getProperty("channel_mappings");
if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
  var default_target = Bot.getProperty("target_channels") || "@MyUniversityChannel";
  mappings = [
    {
      target: default_target,
      sources: ["@KSU_News", "@moe_gov_sa"],
      enabled: true,
      name: "قناة النشر الرسمية المعتمدة"
    }
  ];
  Bot.setProperty("channel_mappings", mappings, "json");
}

function getTargetChannels(source) {
  var targets = [];
  var norm_src = normalizeSource(source);
  
  if (norm_src) {
    for (var m = 0; m < mappings.length; m++) {
      var item = mappings[m];
      if (!item.enabled || !item.target) continue;
      if (item.target === "@StudentServicesNews" || item.target === "@SecondTargetChannel") continue;
      if (item.sources && Array.isArray(item.sources)) {
        for (var s = 0; s < item.sources.length; s++) {
          if (normalizeSource(item.sources[s]) === norm_src) {
            targets.push(item.target);
            break;
          }
        }
      }
    }
  }
  
  // إذا لم يطابق مصدراً معيناً، يُنشر في كافة القنوات النشطة المربوطة
  if (targets.length === 0) {
    for (var d = 0; d < mappings.length; d++) {
      if (mappings[d].enabled && mappings[d].target) {
        if (mappings[d].target !== "@StudentServicesNews" && mappings[d].target !== "@SecondTargetChannel") {
          targets.push(mappings[d].target);
        }
      }
    }
  }
  if (targets.length === 0) {
    var saved_single = Bot.getProperty("target_channels");
    targets.push(saved_single || "@MyUniversityChannel");
  }
  return targets;
}

var target_channels = getTargetChannels(source_origin);

// 7. إشعار فوري في المحادثة بأن المنشور تم استلامه وقراءته بنجاح (Feedback Confirmation)
var is_private_chat = (msg_obj && msg_obj.chat && msg_obj.chat.type === "private") || (typeof chat !== "undefined" && chat && chat.chat_type === "private");
if (is_private_chat) {
  var display_src = source_origin ? ("من المصدر `" + source_origin + "`") : "المباشر";
  Bot.sendMessage("📥 **تم استلام المنشور " + display_src + " بنجاح!**\n⚡ جاري الفحص والمعالجة بالذكاء الاصطناعي (DeepSeek-V4-Flash) والنشر في: `" + target_channels.join("`، `") + "`...");
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

  var total_ads = Bot.getProperty("total_ads_replaced", 0) + 1;
  Bot.setProperty("total_ads_replaced", total_ads, "integer");

  // نشر الإعلان البديل في القنوات المستهدفة
  for (var k = 0; k < target_channels.length; k++) {
    var ch_target = target_channels[k];
    try {
      if (media_type === "photo") {
        Api.sendPhoto({ chat_id: ch_target, photo: media_file_id, caption: custom_ad, parse_mode: "Markdown" });
      } else if (media_type === "video") {
        Api.sendVideo({ chat_id: ch_target, video: media_file_id, caption: custom_ad, parse_mode: "Markdown" });
      } else if (media_type === "document") {
        Api.sendDocument({ chat_id: ch_target, document: media_file_id, caption: custom_ad, parse_mode: "Markdown" });
      } else {
        Api.sendMessage({ chat_id: ch_target, text: custom_ad, parse_mode: "Markdown" });
      }
    } catch (e) {}
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
var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");
var base_url = Bot.getProperty("ai_base_url", "https://api.hcnsec.cn/v1");
var api_key = Bot.getProperty("ai_api_key", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii");

if (!ai_enabled || !raw_text) {
  // نشر مباشر دون إعادة صياغة
  for (var p = 0; p < target_channels.length; p++) {
    var dest = target_channels[p];
    try {
      if (media_type === "photo") {
        Api.sendPhoto({ chat_id: dest, photo: media_file_id, caption: raw_text, parse_mode: "Markdown" });
      } else if (media_type === "video") {
        Api.sendVideo({ chat_id: dest, video: media_file_id, caption: raw_text, parse_mode: "Markdown" });
      } else if (media_type === "document") {
        Api.sendDocument({ chat_id: dest, document: media_file_id, caption: raw_text, parse_mode: "Markdown" });
      } else {
        Api.sendMessage({ chat_id: dest, text: raw_text, parse_mode: "Markdown" });
      }
    } catch (err) {}
  }
  var total = Bot.getProperty("total_processed", 0) + 1;
  Bot.setProperty("total_processed", total, "integer");
  Bot.sendMessage("⚡ **تم النشر المباشر (دون ذكاء اصطناعي)** في: `" + target_channels.join("`، `") + "`");
  return;
}

// 11. صياغة الموجه الذكي وتنفيذ الاستدعاء لـ API الذكاء الاصطناعي
var system_prompt = "أنت محرر محتوى تعليمي وجامعي محترف. أعد صياغة الخبر التالي بأسلوب إخباري راقٍ وجذاب، " +
  "مع عنوان مميز (📌)، وتنظيم المواعيد والتفاصيل الهامة بنقاط واضحة، " +
  "وحذف أي إشارة أو روابط للقنوات المصدرية أو أسماء ناشرين آخرين تماماً. " +
  "حافظ على الروابط الأكاديمية والوزارية الرسمية إن وجدت، واختم بدعوة تفاعلية (💬) وهاشتاجات مناسبة.";

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
    temperature: 0.35,
    max_tokens: 450
  },
  success: "/on_ai_post_success",
  error: "/on_ai_post_error",
  background: true
});
