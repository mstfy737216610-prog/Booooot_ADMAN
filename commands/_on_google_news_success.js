/*CMD
  command: /on_google_news_success
  help: معالج استلام أخبار جوجل نيوز RSS وصياغتها ونشرها في قناة الجامعة المخصصة
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (!content) return;

var univ_id = (params || "").trim();
var univ_projects = Bot.getProperty("university_projects", []);
var target_univ = null;

for (var u = 0; u < univ_projects.length; u++) {
  if (univ_projects[u].id === univ_id) {
    target_univ = univ_projects[u];
    break;
  }
}
if (!target_univ && univ_projects.length > 0) {
  target_univ = univ_projects[0];
}
if (!target_univ) return;

function cleanHtml(html) {
  if (!html) return "";
  var s = html;
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#39;/g, "'");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&nbsp;/g, " ");
  s = s.replace(/\s+/g, " ");
  return s.trim();
}

// استخراج عناصر الأخبار بسرعة فائقة وتفادي انتهاء المهلة (Execution Timeout)
var safe_content = content.length > 10000 ? content.substring(0, 10000) : content;
var item_chunks = safe_content.split("<item>");
var found_article = null;

for (var idx = 1; idx < item_chunks.length && idx <= 4; idx++) {
  var item_str = item_chunks[idx].split("</item>")[0];

  var title_start = item_str.indexOf("<title>");
  var title_end = item_str.indexOf("</title>");
  var raw_title = "";
  if (title_start !== -1 && title_end !== -1) {
    raw_title = cleanHtml(item_str.substring(title_start + 7, title_end));
  }

  var desc_start = item_str.indexOf("<description>");
  var desc_end = item_str.indexOf("</description>");
  var raw_desc = "";
  if (desc_start !== -1 && desc_end !== -1) {
    raw_desc = cleanHtml(item_str.substring(desc_start + 13, desc_end));
  }

  var link_start = item_str.indexOf("<link>");
  var link_end = item_str.indexOf("</link>");
  var raw_link = "";
  if (link_start !== -1 && link_end !== -1) {
    raw_link = cleanHtml(item_str.substring(link_start + 6, link_end));
  }

  if (!raw_title || raw_title.length < 15) continue;

  // تنظيف المصدر الخارجي من نهاية العنوان (مثل "- جريدة الرياض" أو "- الوطن")
  raw_title = raw_title.replace(/\s*-\s*[^-]+$/, "").trim();

  // فحص الصلة بالجامعة
  var combined = (raw_title + " " + raw_desc).toLowerCase();
  var is_relevant = (combined.indexOf(target_univ.name.toLowerCase()) !== -1);
  if (!is_relevant) {
    for (var k = 0; k < (target_univ.keywords || []).length; k++) {
      if (combined.indexOf(target_univ.keywords[k].toLowerCase()) !== -1) {
        is_relevant = true;
        break;
      }
    }
  }

  if (!is_relevant) continue;

  var seen_key = "seen_gnews_" + encodeURIComponent(raw_title.slice(0, 25));
  if (Bot.getProperty(seen_key)) continue;

  Bot.setProperty(seen_key, true, "boolean");
  found_article = {
    title: raw_title,
    desc: raw_desc,
    link: raw_link
  };
  break;
}

if (!found_article) {
  Bot.sendMessage("ℹ️ **أخبار جوجل لـ " + target_univ.name + "**: لا توجد أخبار جديدة حالياً.");
  return;
}

var article_text = "عنوان الخبر: " + found_article.title + "\n\n" +
  "تفاصيل الخبر من المصادر الرسمية: " + found_article.desc;

if (found_article.link) {
  article_text += "\n\nرابط المصدر الإخباري: " + found_article.link;
}

// حفظ بيانات الإرسال والتوجيه لقناة هذه الجامعة حصراً
Bot.setProperty("pending_media_type", "text", "string");
Bot.setProperty("pending_media_id", "", "string");
Bot.setProperty("pending_raw_text", article_text, "string");
Bot.setProperty("pending_targets", [target_univ.target_channel], "json");
Bot.setProperty("pending_target_univ", target_univ.name, "string");

var base_url = Bot.getProperty("ai_base_url", "https://api.hcnsec.cn/v1");
var api_key = Bot.getProperty("ai_api_key", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii");
var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");

var system_prompt = "أنت محرر محتوى أكاديمي رسمي مخصص حصراً لطلاب: (" + target_univ.name + ").\n" +
  "مهمتك صياغة الخبر التالي بأسلوب إخباري راقٍ ومباشر:\n" +
  "1. عنوان بارز يذكر اسم الجامعة أو كليتها بوضوح (📌)\n" +
  "2. تفاصيل منظمة في نقاط محددة\n" +
  "3. دعوة تفاعلية قصيرة للطلاب (💬)\n" +
  "4. هاشتاجات الجامعة الرسمية (مثال: #" + target_univ.name.replace(/\s+/g, "_") + " #أخبار_التعليم)\n" +
  "قاعدة صارمة: لا تذكر مصادر خارجية، واكتب بأسلوبك الأصيل.";

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
      { role: "user", content: article_text }
    ],
    temperature: 0.3,
    max_tokens: 450
  },
  success: "/on_ai_post_success",
  error: "/on_ai_post_error",
  background: true
});
