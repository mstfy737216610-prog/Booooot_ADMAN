/*CMD
  command: /on_crawl_success
  help: معالج استلام المنشور وتنظيفه وفلترته أكاديمياً للجامعة المستهدفة حصراً
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (!content) return;

// حماية الذاكرة - قراءة آخر 25000 بايت
var work_content = content;
if (work_content.length > 25000) {
  work_content = work_content.substring(work_content.length - 25000);
}

// استخراج المعاملات: قد تكون بالصيغة univ_id|channel_name أو channel_name فقط
var raw_params = (params || "").trim();
var bound_univ_id = "";
var channel_name = "";

if (raw_params.indexOf("|") !== -1) {
  var p_parts = raw_params.split("|");
  bound_univ_id = p_parts[0].trim();
  channel_name = p_parts[1].trim().toLowerCase();
} else {
  channel_name = raw_params.toLowerCase();
}

if (!channel_name) {
  var match_ch = work_content.match(/<meta property="al:android:url" content="tg:\/\/resolve\?domain=([^"]+)"/i);
  if (match_ch && match_ch[1]) {
    channel_name = match_ch[1].toLowerCase();
  }
}
if (!channel_name) return;

// 1. استخراج كتلة أحدث منشور بسرعة فائقة بدون حلقات تكرار
var last_post_marker = work_content.lastIndexOf('data-post="');
if (last_post_marker === -1) return;

var post_chunk = work_content.substring(last_post_marker, last_post_marker + 5000);
var id_match = post_chunk.match(/data-post="[^"]*\/(\d+)"/);
if (!id_match) return;

var max_id = parseInt(id_match[1], 10);
if (!max_id || max_id === 0) return;

var last_seen_id = Bot.getProperty("last_crawl_id_" + channel_name, 0);
if (!last_seen_id || last_seen_id === 0) {
  last_seen_id = max_id - 1;
}

if (max_id <= last_seen_id) return;

// 2. استخراج النص وتنظيفه المحكم دون تشويه المحتوى أو حذف الروابط والمعرفات
var text_match = post_chunk.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
var raw_html_text = text_match ? text_match[1] : "";

function deepCleanWebGarbage(html) {
  if (!html) return "";
  var s = html;
  // تحويل فواصل الأسطر
  s = s.replace(/<br\s*[\/]?>/gi, "\n");
  // استخراج الروابط مع الحفاظ التام عليها
  s = s.replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, function(match, link, anchor) {
    if (!anchor || anchor.indexOf("http") === 0 || anchor === link) return "\n" + link + "\n";
    return anchor + " (" + link + ")";
  });
  // حذف بقية وسوم html
  s = s.replace(/<[^>]+>/g, " ");
  // معالجة الكيانات
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#39;/g, "'");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&nbsp;/gi, " ");

  // تنظيف بقايا تويتر في نهاية النص فقط دون تشويه المحتوى
  s = s.replace(/\s+X\s*$/g, "");
  s = s.replace(/\bX\s*$/g, "");

  // تنظيف الأسطر مع الحفاظ على المحتوى الأكاديمي والروابط
  var lines = s.split("\n");
  var clean_lines = [];
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i].trim();
    if (!l || l === "•" || l === "-" || l === "*") continue;
    clean_lines.push(l);
  }
  return clean_lines.join("\n").trim();
}

var extracted_text = deepCleanWebGarbage(raw_html_text);

// استخراج الصورة الحقيقية
function extractValidPhoto(chunk) {
  if (!chunk) return null;
  var photoWrapMatch = chunk.match(/class="[^"]*tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:\s*url\('([^']+)'\)/i);
  if (photoWrapMatch && photoWrapMatch[1]) {
    var u = photoWrapMatch[1].trim();
    if (u.indexOf("emoji") === -1 && u.indexOf("telegram.org/img") === -1) {
      return u.indexOf("//") === 0 ? ("https:" + u) : u;
    }
  }
  var cdnMatch = chunk.match(/background-image:\s*url\('(https?:\/\/[^']*(?:telesco\.pe|cdn|telegram)[^']*)'\)/i);
  if (cdnMatch && cdnMatch[1] && cdnMatch[1].indexOf("emoji") === -1) {
    return cdnMatch[1].trim();
  }
  return null;
}

var image_url = extractValidPhoto(post_chunk);

// حفظ معرف المنشور لمنع التكرار
Bot.setProperty("last_crawl_id_" + channel_name, max_id, "integer");

// إذا كان النص بعد التنظيف فارغاً أو تافهاً، نتجاهله فوراً
if (!extracted_text || extracted_text.length < 25) {
  return;
}

// 4. مطابقة الجامعة المستهدفة وقناة النشر المخصصة لها حصراً
var univ_projects = Bot.getProperty("university_projects", []);
var target_univ = null;

// أولاً: البحث بالمعرف المربوط بالطلب
if (bound_univ_id) {
  for (var u1 = 0; u1 < univ_projects.length; u1++) {
    if (univ_projects[u1].id === bound_univ_id) {
      target_univ = univ_projects[u1];
      break;
    }
  }
}

// ثانياً: البحث بقناة المصدر
if (!target_univ) {
  var clean_at_ch = "@" + channel_name;
  for (var u2 = 0; u2 < univ_projects.length; u2++) {
    var tg_list = univ_projects[u2].telegram_sources || [];
    var tw_list = univ_projects[u2].twitter_sources || [];
    var combined_list = tg_list.concat(tw_list);
    for (var s = 0; s < combined_list.length; s++) {
      var s_cl = combined_list[s].replace(/^@/, "").toLowerCase();
      if (s_cl === channel_name) {
        target_univ = univ_projects[u2];
        break;
      }
    }
    if (target_univ) break;
  }
}

// إذا لم نجد جامعة، نأخذ الجامعة الأولى الافتراضية
if (!target_univ && univ_projects.length > 0) {
  target_univ = univ_projects[0];
}
if (!target_univ) return;

// 5. التوجيه الأكاديمي المباشر:
// كافة منشورات المصدر المعتمد (سواء تواريخ، مواعيد اختبارات، أو إعلانات طلابية) تُنشر مباشرة للجامعة المحددة
// ولا يشترط أبداً وجود اسم الجامعة في نص المنشور لضمان وصول المواعيد والجداول للطلاب كاملة

// 6. فحص إعلانات المنافسين واستبدالها (معطل افتراضياً لضمان نشر كافة أخبار المصدر مع صورها)
var ad_replacement_enabled = Bot.getProperty("ad_replacement_enabled", false);
var ad_keywords = ["حل واجبات بمقابل", "حل واجبات واختبارات", "حل كويزات", "حل فاينل", "حل اسايمنت", "كتابة بحوث بمقابل", "عمل بحوث ورسائل بمقابل", "إعلان مدفوع للخدمات"];
var is_ad = false;

if (ad_replacement_enabled && extracted_text) {
  for (var a = 0; a < ad_keywords.length; a++) {
    if (extracted_text.indexOf(ad_keywords[a]) !== -1) {
      is_ad = true;
      break;
    }
  }
}

function toSafeHtml(txt) {
  if (!txt) return "";
  var s = txt;
  s = s.replace(/&/g, "&amp;");
  s = s.replace(/</g, "&lt;");
  s = s.replace(/>/g, "&gt;");
  s = s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  return s;
}

var dest_target = target_univ.target_channel || "@jhdhhdcj";

if (is_ad) {
  var custom_ad = Bot.getProperty("custom_ad", "🎓 **خدمات طلابية وأكاديمية معتمدة ومتكاملة** 🎓\n\n" +
    "يسرنا تقديم الدعم الأكاديمي الشامل للطلبة والباحثين:\n" +
    "• مساعدة متخصصة في البحوث ومشاريع التخرج\n" +
    "• التدقيق اللغوي وتنسيق الرسائل العلمية\n" +
    "• تلخيص المقررات الدراسية وإعداد العروض\n\n" +
    "📞 **للتواصل والطلب المباشر عبر المشرف**: @M_S_F_G\n" +
    "✨ *جودة أكاديمية، دقة في المواعيد، وأسعار خاصة للطلاب!*");

  var safe_ad = toSafeHtml(custom_ad);
  try {
    if (image_url) {
      try {
        Api.sendPhoto({ chat_id: dest_target, photo: image_url, caption: safe_ad, parse_mode: "HTML" });
      } catch (e1) {
        Api.sendMessage({ chat_id: dest_target, text: safe_ad, parse_mode: "HTML" });
      }
    } else {
      Api.sendMessage({ chat_id: dest_target, text: safe_ad, parse_mode: "HTML" });
    }
  } catch (err) {}
  Bot.sendMessage("🎯 **تم سحب منشور إعلاني واستبداله بإعلان خدماتك في قناة (" + target_univ.name + ")**: " + dest_target);
  return;
}

// 7. إرسال إلى الذكاء الاصطناعي مع تعليمات صارمة مخصصة للجامعة
Bot.setProperty("pending_media_type", image_url ? "photo" : "text", "string");
Bot.setProperty("pending_media_id", image_url || "", "string");
Bot.setProperty("pending_raw_text", extracted_text, "string");
Bot.setProperty("pending_targets", [dest_target], "json");
Bot.setProperty("pending_target_univ", target_univ.name, "string");

var base_url = Bot.getProperty("ai_base_url", "https://api.hcnsec.cn/v1");
var api_key = Bot.getProperty("ai_api_key", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii");
var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");

var system_prompt = "أنت محرر محتوى أكاديمي رسمي مخصص حصراً لطلاب: (" + target_univ.name + ").\n" +
  "مهمتك قراءة المنشور وصياغته بأسلوب إخباري مميز ومباشر للطلاب:\n" +
  "1. عنوان بارز يوضح موضوع الخبر والجامعة (📌)\n" +
  "2. محتوى منظم في نقاط محددة وسهلة القراءة تبرز المواعيد والخطوات والشروط\n" +
  "3. ممنوع منعاً باتاً ذكر أسماء قنوات سابقة أو روابط دعائية أو إيموجيات فارغة\n" +
  "4. احذف أي رموز تشويش أو أحرف زائدة مثل &nbsp; أو X\n" +
  "5. دعوة تفاعلية قصيرة للطلاب (💬)\n" +
  "6. هاشتاجات الجامعة الرسمية (مثال: #" + target_univ.name.replace(/\s+/g, "_") + " #أخبار_الجامعة)\n" +
  "قاعدة صارمة: إذا كان الخبر لا يمت بصلة لهذه الجامعة أو طلابها، رد بكلمة واحدة فقط: [IGNORED]";

HTTP.post({
  url: base_url.replace(/\/+$/, "") + "/chat/completions",
  headers: {
    "Authorization": "Bearer " + api_key,
    "Content-Type": "application/json"
  },
  body: {
    model: current_model,
    messages: [
      { role: "system", content: system_prompt },
      { role: "user", content: extracted_text }
    ],
    temperature: 0.3,
    max_tokens: 450
  },
  success: "/on_ai_post_success",
  error: "/on_ai_post_error",
  background: true
});
