/*CMD
  command: /on_twitter_success
  help: معالج استلام تغريدات تويتر (X) واستخراج الصور وتطبيق الفلترة الأكاديمية الصارمة
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (!content) return;

var raw_params = (params || "").trim();
var univ_id = "";
var twitter_handle = "";

if (raw_params.indexOf("|") !== -1) {
  var parts = raw_params.split("|");
  univ_id = parts[0].trim();
  twitter_handle = parts[1].trim();
} else {
  twitter_handle = raw_params;
}

var clean_handle = twitter_handle.replace(/^@/, "").toLowerCase();

// 1. استخراج الجامعة المستهدفة
var univ_projects = Bot.getProperty("university_projects", []);
var target_univ = null;

if (univ_id) {
  for (var u = 0; u < univ_projects.length; u++) {
    if (univ_projects[u].id === univ_id) {
      target_univ = univ_projects[u];
      break;
    }
  }
}

if (!target_univ) {
  for (var u2 = 0; u2 < univ_projects.length; u2++) {
    var tw_list = univ_projects[u2].twitter_sources || [];
    for (var t = 0; t < tw_list.length; t++) {
      var s_tw = tw_list[t].replace(/^@/, "").toLowerCase();
      if (s_tw === clean_handle) {
        target_univ = univ_projects[u2];
        break;
      }
    }
    if (target_univ) break;
  }
}

if (!target_univ && univ_projects.length > 0) {
  target_univ = univ_projects[0];
}

if (!target_univ) return;

// 2. تنظيف HTML وفك التشفير
function cleanHtml(html) {
  if (!html) return "";
  var s = html;
  s = s.replace(/<br\s*[\/]?>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#39;/g, "'");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&nbsp;/gi, " ");
  s = s.replace(/\s+X\s*$/g, "");
  s = s.replace(/\bX\s*$/g, "");
  return s.trim();
}

// 3. استخراج التغريدة الأحدث والوسائط من HTML التايم لاين
var tweet_text = "";
var tweet_media = null;
var tweet_id = "";

// طريقة 1: البحث في نصوص التغريدات timeline-Tweet-text
var tweet_match = content.match(/<p class="[^"]*timeline-Tweet-text[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
if (tweet_match && tweet_match[1]) {
  tweet_text = cleanHtml(tweet_match[1]);
}

// استخراج صورة التغريدة إن وجدت
var img_match = content.match(/data-image="([^"]+)"/i) || content.match(/src="([^"]*pbs\.twimg\.com\/media\/[^"]+)"/i);
if (img_match && img_match[1]) {
  tweet_media = img_match[1].replace(/&amp;/g, "&");
  if (tweet_media.indexOf("name=") === -1) {
    tweet_media += (tweet_media.indexOf("?") === -1 ? "?" : "&") + "name=medium";
  }
}

// طريقة 2: البحث في كائن JSON في حال توفره داخل الصفحة
if (!tweet_text) {
  var json_match = content.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (json_match && json_match[1]) {
    try {
      var nextData = JSON.parse(json_match[1]);
      var entries = nextData.props.pageProps.timeline.entries || [];
      if (entries.length > 0 && entries[0].content && entries[0].content.tweet) {
        var tw = entries[0].content.tweet;
        tweet_text = tw.full_text || tw.text || "";
        tweet_id = tw.id_str || "";
        if (tw.entities && tw.entities.media && tw.entities.media.length > 0) {
          tweet_media = tw.entities.media[0].media_url_https || tw.entities.media[0].media_url;
        }
      }
    } catch (e) {}
  }
}

// إذا لم يتم العثور على نص كافٍ
if (!tweet_text || tweet_text.length < 20) return;

// فحص التكرار عبر البصمة النصية
var snippet = tweet_text.substring(0, 45).replace(/\s+/g, "_");
var seen_key = "seen_tw_" + clean_handle + "_" + encodeURIComponent(snippet);
if (Bot.getProperty(seen_key)) return;
Bot.setProperty(seen_key, true, "boolean");

// 4. توجيه تغريدة المصدر المعتمد:
// حساب تويتر مربوط بهذه الجامعة، لذا يتم اعتماد ونشر كافة التغريدات والتنبيهات
// سواء ذُكر اسم الجامعة أو لم يُذكر، لضمان وصول المواعيد والجداول للطلاب كاملة.
var lower_text = tweet_text.toLowerCase();

// 5. فحص إعلانات المنافسين واستبعادها
var spam_keywords = ["حل واجبات", "حل واجب", "حل كويزات", "كتابة بحوث", "خدمات طلابية بمقابل", "قروب تليجرام للتسريب"];
for (var s = 0; s < spam_keywords.length; s++) {
  if (lower_text.indexOf(spam_keywords[s]) !== -1) {
    return; // إهمال الإعلانات التجارية غير الرسمية
  }
}

// 6. تجهيز المنشور وتمريره للنشر في قناة الجامعة المحددة حصراً
var dest_channel = target_univ.target_channel || "@jhdhhdcj";

Bot.setProperty("pending_media_type", tweet_media ? "photo" : "text", "string");
Bot.setProperty("pending_media_id", tweet_media || "", "string");
Bot.setProperty("pending_raw_text", tweet_text, "string");
Bot.setProperty("pending_targets", [dest_channel], "json");
Bot.setProperty("pending_target_univ", target_univ.name, "string");

var base_url = Bot.getProperty("ai_base_url", "https://api.hcnsec.cn/v1");
var api_key = Bot.getProperty("ai_api_key", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii");
var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");

var system_prompt = "أنت محرر محتوى أكاديمي رسمي مخصص حصراً لطلاب: (" + target_univ.name + ").\n" +
  "صِغ هذه التغريدة الرسمية كبيان أكاديمي راقٍ يليق بالجامعة:\n" +
  "1. عنوان بارز يوضح موضوع الخبر واسم الجامعة (📌)\n" +
  "2. نقاط واضحة تبرز المواعيد والتعليمات الرسمية والشروط بدقة\n" +
  "3. احذف أي رموز تشويش أو أحرف زائدة مثل &nbsp; أو X\n" +
  "4. دعوة تفاعلية قصيرة للطلاب (💬)\n" +
  "5. هاشتاجات الجامعة الرسمية (مثال: #" + target_univ.name.replace(/\s+/g, "_") + " #أخبار_التعليم)\n" +
  "قاعدة صارمة: ممنوع حذف روابط التسجيل الرسمية، وممنوع المقدمات الإنشائية المكررة.";

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
      { role: "user", content: tweet_text }
    ],
    temperature: 0.28,
    max_tokens: 400
  },
  success: "/on_ai_post_success",
  error: "/on_ai_post_error",
  background: true
});
