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

// استخراج عناصر <item> من الـ XML
var item_regex = /<item>([\s\S]*?)<\/item>/gi;
var match;
var found_article = null;

while ((match = item_regex.exec(content)) !== null) {
  var item_str = match[1];

  var title_m = item_str.match(/<title>([\s\S]*?)<\/title>/i);
  var link_m = item_str.match(/<link>([\s\S]*?)<\/link>/i);
  var desc_m = item_str.match(/<description>([\s\S]*?)<\/description>/i);
  var guid_m = item_str.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);

  var raw_title = title_m ? cleanHtml(title_m[1]) : "";
  var raw_desc = desc_m ? cleanHtml(desc_m[1]) : "";
  var raw_link = link_m ? link_m[1].trim() : "";
  var raw_guid = guid_m ? guid_m[1].trim() : raw_title;

  if (!raw_title || raw_title.length < 15) continue;

  // فحص صلة الخبر بالجامعة المستهدفة
  var combined = (raw_title + " " + raw_desc).toLowerCase();
  var is_relevant = false;
  if (combined.indexOf(target_univ.name.toLowerCase()) !== -1) {
    is_relevant = true;
  } else {
    for (var k = 0; k < (target_univ.keywords || []).length; k++) {
      if (combined.indexOf(target_univ.keywords[k].toLowerCase()) !== -1) {
        is_relevant = true;
        break;
      }
    }
  }

  if (!is_relevant) {
    continue; // تجاهل الخبر إذا لم يذكر الجامعة
  }

  // فحص منع التكرار
  var seen_key = "seen_gnews_" + encodeURIComponent(raw_guid.slice(-30));
  if (Bot.getProperty(seen_key)) {
    continue;
  }

  Bot.setProperty(seen_key, true, "boolean");
  found_article = {
    title: raw_title,
    desc: raw_desc,
    link: raw_link
  };
  break; // معالجة الخبر الأحدث غير المكرر
}

if (!found_article) {
  Bot.sendMessage("ℹ️ **أخبار جوجل نيوز لـ " + target_univ.name + "**: لا توجد أخبار جديدة غير مكررة حالياً.");
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
