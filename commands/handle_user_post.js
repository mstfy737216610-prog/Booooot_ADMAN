/*CMD
  command: handle_user_post
  help: محرك النشر التلقائي الذكي ومعالج الوسائط والذكاء الاصطناعي والتوزيع
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: *
CMD*/

// 1. التحقق من حالة إيقاف البوت
var is_paused = Bot.getProperty("bot_paused", false);
if (is_paused) {
  Bot.sendMessage("⏸️ **تنبيه**: تم التقاط منشور جديد، لكن النشر التلقائي متوقف حالياً بأمر المشرف.\n(استخدم /pause أو الزر في /start لإعادة التشغيل)");
  return;
}

// 2. استخراج النص والوسائط بدقة فائقة دون أي تشويه
var raw_text = (request && request.caption) ? request.caption : (message || "");
var media_type = null;
var media_file_id = null;

if (request && request.photo && request.photo.length > 0) {
  media_type = "photo";
  media_file_id = request.photo[request.photo.length - 1].file_id; // أعلى دقة متوفرة
} else if (request && request.video) {
  media_type = "video";
  media_file_id = request.video.file_id;
} else if (request && request.document) {
  media_type = "document";
  media_file_id = request.document.file_id;
}

if (!raw_text && !media_file_id) {
  return;
}

// 3. تحديد القناة المصدر إذا كانت الرسالة محولة من قناة عامة أو خاصة
var source_origin = null;
if (request && request.forward_from_chat) {
  source_origin = request.forward_from_chat.username ? ("@" + request.forward_from_chat.username) : ("" + request.forward_from_chat.id);
}

// 4. كشف إعلانات المنافسين واستبدالها بإعلان خدمات المشرف @M_S_F_G
var ad_keywords = [
  "إعلان مدفوع", "حل واجبات", "بحوث تخرج", "خدمات طلابية", "مشاريع تخرج", "كتابة أبحاث", "إعلان ممول", "برعاية"
];

var is_ad = false;
for (var i = 0; i < ad_keywords.length; i++) {
  if (raw_text.indexOf(ad_keywords[i]) !== -1) {
    is_ad = true;
    break;
  }
}

var mappings = Bot.getProperty("channel_mappings", []);

// دالة العثور على القنوات المستهدفة لهذا المصدر
function getTargetChannels(source) {
  var targets = [];
  if (!mappings || mappings.length === 0) return targets;
  
  for (var m = 0; m < mappings.length; m++) {
    var item = mappings[m];
    if (!item.enabled || !item.target) continue;
    
    // إذا لم يحدد مصدر محدد، أو إذا كان المصدر موجوداً في قائمة مصادر هذا الهدف
    if (!source) {
      targets.push(item.target);
    } else {
      var found_in_sources = false;
      if (item.sources && Array.isArray(item.sources)) {
        for (var s = 0; s < item.sources.length; s++) {
          if (item.sources[s].toLowerCase() === source.toLowerCase()) {
            found_in_sources = true;
            break;
          }
        }
      }
      if (found_in_sources) {
        targets.push(item.target);
      }
    }
  }
  
  // إذا لم يطابق مصدراً معيناً، يتم التوزيع على القنوات المتاحة
  if (targets.length === 0) {
    for (var d = 0; d < mappings.length; d++) {
      if (mappings[d].enabled && mappings[d].target) {
        targets.push(mappings[d].target);
      }
    }
  }
  return targets;
}

var target_channels = getTargetChannels(source_origin);

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

  // إرسال الإعلان البديل للقنوات المستهدفة
  for (var k = 0; k < target_channels.length; k++) {
    var ch_target = target_channels[k];
    try {
      if (media_type == "photo") {
        Api.sendPhoto({ chat_id: ch_target, photo: media_file_id, caption: custom_ad, parse_mode: "Markdown" });
      } else if (media_type == "video") {
        Api.sendVideo({ chat_id: ch_target, video: media_file_id, caption: custom_ad, parse_mode: "Markdown" });
      } else if (media_type == "document") {
        Api.sendDocument({ chat_id: ch_target, document: media_file_id, caption: custom_ad, parse_mode: "Markdown" });
      } else {
        Api.sendMessage({ chat_id: ch_target, text: custom_ad, parse_mode: "Markdown" });
      }
    } catch (e) {}
  }

  Bot.sendMessage("🎯 **تم كشف إعلان منافس واستبداله تلقائياً!**\nتم نشر إعلان خدماتك في: `" + target_channels.join("`، `") + "`");
  return;
}

// 5. حفظ بيانات المنشور والوسائط والقنوات المستهدفة في الذاكرة
Bot.setProperty("pending_media_type", media_type || "text", "string");
Bot.setProperty("pending_media_id", media_file_id || "", "string");
Bot.setProperty("pending_raw_text", raw_text, "string");
Bot.setProperty("pending_targets", target_channels, "json");

// 6. فحص حالة الذكاء الاصطناعي والإعدادات الديناميكية
var ai_enabled = Bot.getProperty("ai_enabled", true);
var current_model = Bot.getProperty("ai_model", "DeepSeek-V4.1-Flash");
var base_url = Bot.getProperty("ai_base_url", "https://api.hcnsec.cn/v1");
var api_key = Bot.getProperty("ai_api_key", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii");

if (!ai_enabled || !raw_text) {
  // نشر مباشر دون إعادة صياغة
  for (var p = 0; p < target_channels.length; p++) {
    var dest = target_channels[p];
    try {
      if (media_type == "photo") {
        Api.sendPhoto({ chat_id: dest, photo: media_file_id, caption: raw_text, parse_mode: "Markdown" });
      } else if (media_type == "video") {
        Api.sendVideo({ chat_id: dest, video: media_file_id, caption: raw_text, parse_mode: "Markdown" });
      } else if (media_type == "document") {
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

// 7. صياغة الموجه الذكي وتنفيذ الاستدعاء لـ API الذكاء الاصطناعي
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
    max_tokens: 900
  },
  success: "/on_ai_post_success",
  error: "/on_ai_post_error"
});
