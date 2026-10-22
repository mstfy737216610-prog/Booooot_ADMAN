/*CMD
  command: /on_crawl_success
  help: معالج استلام محتوى صفحة القناة المصدر واستخراج أحدث المنشورات والصور تلقائياً
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (!content) return;

// حماية فورية من تجاوز حجم الذاكرة والوقت (102,400 بايت وحد الـ 8 ثوانٍ)
// المنشورات الأحدث تقع دائماً في آخر صفحة تيليجرام
var work_content = content;
if (work_content.length > 25000) {
  work_content = work_content.substring(work_content.length - 25000);
}

var channel_name = (params || "").trim().toLowerCase();
if (!channel_name) {
  var match_ch = work_content.match(/<meta property="al:android:url" content="tg:\/\/resolve\?domain=([^"]+)"/i);
  if (match_ch && match_ch[1]) {
    channel_name = match_ch[1].toLowerCase();
  }
}
if (!channel_name) return;

// 1. استخراج معرفات كافة المنشورات الموجودة في ذيل الصفحة
var post_regex = /data-post="[^"]*\/(\d+)"/g;
var match;
var max_id = 0;
while ((match = post_regex.exec(work_content)) !== null) {
  var p_id = parseInt(match[1], 10);
  if (p_id > max_id) {
    max_id = p_id;
  }
}

if (max_id === 0) {
  return;
}

var last_seen_id = Bot.getProperty("last_crawl_id_" + channel_name, 0);

if (!last_seen_id || last_seen_id === 0) {
  last_seen_id = max_id - 1;
}

if (max_id <= last_seen_id) {
  return;
}

// 2. استخراج كتلة HTML الخاصة بأحدث منشور
var post_marker = 'data-post="' + channel_name + '/' + max_id + '"';
var marker_idx = work_content.indexOf(post_marker);
if (marker_idx === -1) {
  marker_idx = work_content.lastIndexOf('data-post=');
}

var post_chunk = "";
if (marker_idx !== -1) {
  post_chunk = work_content.substring(marker_idx, marker_idx + 6000);
} else {
  post_chunk = work_content;
}

// 3. استخراج النص وتنظيفه من وسوم HTML
var text_match = post_chunk.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
var raw_html_text = text_match ? text_match[1] : "";

function cleanHtml(html) {
  if (!html) return "";
  var s = html;
  s = s.replace(/<br\s*[\/]?>/gi, "\n");
  s = s.replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, function(match, link, anchor) {
    if (anchor.indexOf("http") === 0 || anchor === link) return link;
    return anchor + " (" + link + ")";
  });
  s = s.replace(/<b>([\s\S]*?)<\/b>/gi, "*$1*");
  s = s.replace(/<strong>([\s\S]*?)<\/strong>/gi, "*$1*");
  s = s.replace(/<i>([\s\S]*?)<\/i>/gi, "_$1_");
  s = s.replace(/<[^>]+>/g, "");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#39;/g, "'");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&nbsp;/g, " ");
  return s.trim();
}

var extracted_text = cleanHtml(raw_html_text);

// 4. استخراج الصورة الحقيقية وتجاهل الرموز التعبيرية (Emojis) والروابط النسبية
function extractValidPhoto(chunk) {
  if (!chunk) return null;
  // البحث عن وسم الصورة الحقيقي للمنشور في تيليجرام ويب
  var photoWrapMatch = chunk.match(/class="[^"]*tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:\s*url\('([^']+)'\)/i);
  if (photoWrapMatch && photoWrapMatch[1]) {
    var u = photoWrapMatch[1].trim();
    if (u.indexOf("emoji") === -1 && u.indexOf("telegram.org/img") === -1) {
      return u.indexOf("//") === 0 ? ("https:" + u) : u;
    }
  }
  // البحث عن أي رابط صورة من خوادم تيليجرام المعتمدة (telesco.pe أو cdn)
  var cdnMatch = chunk.match(/background-image:\s*url\('(https?:\/\/[^']*(?:telesco\.pe|cdn|telegram)[^']*)'\)/i);
  if (cdnMatch && cdnMatch[1] && cdnMatch[1].indexOf("emoji") === -1) {
    return cdnMatch[1].trim();
  }
  return null;
}

var image_url = extractValidPhoto(post_chunk);

if (!extracted_text && !image_url) {
  // منشور فارغ أو غير مدعوم
  Bot.setProperty("last_crawl_id_" + channel_name, max_id, "integer");
  return;
}

// 5. حفظ معرف المنشور لمنع تكراره
Bot.setProperty("last_crawl_id_" + channel_name, max_id, "integer");

// دالة تحويل الماركداون إلى HTML آمن 100% لمنع أخطاء تيليجرام 400 بسبب الشَرطات السفلية والهاشتاجات
function toSafeHtml(txt) {
  if (!txt) return "";
  var s = txt;
  s = s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  return s;
}

// 6. تحديد القنوات الهدف
var mappings = Bot.getProperty("channel_mappings", []);
var target_channels = [];

for (var m = 0; m < mappings.length; m++) {
  var item = mappings[m];
  if (!item.enabled || !item.target) continue;
  if (item.target === "@StudentServicesNews" || item.target === "@SecondTargetChannel") continue;
  
  if (item.sources && Array.isArray(item.sources)) {
    for (var s = 0; s < item.sources.length; s++) {
      var s_clean = item.sources[s].replace(/^@/, "").toLowerCase();
      if (s_clean === channel_name) {
        target_channels.push(item.target);
        break;
      }
    }
  }
}

if (target_channels.length === 0) {
  var saved_channel = Bot.getProperty("target_channels") || "@jhdhhdcj";
  target_channels.push(saved_channel);
}

// 7. فحص إعلانات المنافسين واستبدالها بإعلان المشرف
var ad_keywords = ["إعلان مدفوع", "حل واجبات", "بحوث تخرج", "خدمات طلابية", "مشاريع تخرج", "كتابة أبحاث", "إعلان ممول", "برعاية"];
var is_ad = false;
for (var a = 0; a < ad_keywords.length; a++) {
  if (extracted_text.indexOf(ad_keywords[a]) !== -1) {
    is_ad = true;
    break;
  }
}

if (is_ad) {
  var custom_ad = Bot.getProperty("custom_ad", "🎓 **خدمات طلابية وأكاديمية معتمدة ومتكاملة** 🎓\n\n" +
    "يسرنا تقديم الدعم الأكاديمي الشامل للطلبة والباحثين:\n" +
    "• مساعدة متخصصة في البحوث ومشاريع التخرج\n" +
    "• التدقيق اللغوي وتنسيق الرسائل العلمية\n" +
    "• إعداد العروض التقديمية وتلخيص المقررات الدراسية\n\n" +
    "📞 **للتواصل والطلب المباشر عبر المشرف**: @M_S_F_G\n" +
    "✨ *جودة أكاديمية موثوقة، دقة في المواعيد، وأسعار خاصة للطلاب!*");

  var safe_ad = toSafeHtml(custom_ad);

  for (var t = 0; t < target_channels.length; t++) {
    var target_ch = target_channels[t];
    try {
      if (image_url) {
        try {
          Api.sendPhoto({ chat_id: target_ch, photo: image_url, caption: safe_ad, parse_mode: "HTML" });
        } catch (img_e) {
          Api.sendMessage({ chat_id: target_ch, text: safe_ad, parse_mode: "HTML" });
        }
      } else {
        Api.sendMessage({ chat_id: target_ch, text: safe_ad, parse_mode: "HTML" });
      }
    } catch (e) {
      try {
        Api.sendMessage({ chat_id: target_ch, text: custom_ad });
      } catch (e2) {}
    }
  }
  Bot.sendMessage("🎯 **تم سحب منشور إعلاني من @" + channel_name + " واستبداله تلقائياً بإعلان خدماتك في:** " + target_channels.join("، "));
  return;
}

// 8. إرسال إلى الذكاء الاصطناعي لإعادة الصياغة
Bot.setProperty("pending_media_type", image_url ? "photo" : "text", "string");
Bot.setProperty("pending_media_id", image_url || "", "string");
Bot.setProperty("pending_raw_text", extracted_text, "string");
Bot.setProperty("pending_targets", target_channels, "json");

var ai_enabled = Bot.getProperty("ai_enabled", true);
var current_model = Bot.getProperty("ai_model", "auto");
var base_url = Bot.getProperty("ai_base_url", "https://api.hcnsec.cn/v1");
var api_key = Bot.getProperty("ai_api_key", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii");
var custom_ins = Bot.getProperty("custom_instructions", "");

if (!ai_enabled || !extracted_text) {
  var safe_extracted = toSafeHtml(extracted_text);
  var safe_crawl_caption = safe_extracted;
  if (safe_crawl_caption && safe_crawl_caption.length > 1024) {
    safe_crawl_caption = safe_crawl_caption.substring(0, 1020) + "...";
  }
  for (var p = 0; p < target_channels.length; p++) {
    var dest_ch = target_channels[p];
    try {
      if (image_url) {
        try {
          Api.sendPhoto({ chat_id: dest_ch, photo: image_url, caption: safe_crawl_caption, parse_mode: "HTML" });
        } catch (img_err2) {
          Api.sendMessage({ chat_id: dest_ch, text: safe_extracted, parse_mode: "HTML" });
        }
      } else {
        Api.sendMessage({ chat_id: dest_ch, text: safe_extracted, parse_mode: "HTML" });
      }
    } catch (e) {
      try {
        Api.sendMessage({ chat_id: dest_ch, text: extracted_text });
      } catch (e2) {}
    }
  }
  Bot.sendMessage("⚡ **تم سحب ونشر خبر مباشر من @" + channel_name + "** إلى: `" + target_channels.join("`، `") + "`");
  return;
}

var instruction_clause = custom_ins ? ("تعليمات المشرف المعتمدة: " + custom_ins + "\n\n") : "";
var system_prompt = "أنت محرر وكاتب محتوى تعليمي وجامعي رائد. مهمتك صياغة المنشور التالي بأسلوب إخباري راقٍ ومؤثر للطلاب:\n" +
  "1. عنوان بارز وقوي يسبقه إيموجي (📌)\n" +
  "2. محتوى منظم في نقاط محددة وسهلة القراءة تبرز المواعيد والخطوات والشروط\n" +
  "3. احذف نهائياً أي ذكر لأسماء القنوات السابقة أو الروابط أو الدعوات للاشتراك\n" +
  "4. دعوة تفاعلية قصيرة للطلاب (💬)\n" +
  "5. هاشتاجات أكاديمية قوية ومتطابقة مع موضوع المنشور (مثال: #جامعة_الملك_سعود #القبول_الموحد #تسجيل #امتحانات)\n" +
  instruction_clause;

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
      { role: "user", content: extracted_text }
    ],
    temperature: 0.3,
    max_tokens: 380
  },
  success: "/on_ai_post_success",
  error: "/on_ai_post_error",
  background: true
});
