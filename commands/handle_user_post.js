/*CMD
  command: handle_user_post
  help: محرك النشر التلقائي الذكي ومعالج الوسائط والربط الصارم والعزل التام للمشاريع الجامعية
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

// دالة تحويل الماركداون إلى HTML آمن
function toSafeHtml(txt) {
  if (!txt) return "";
  var s = txt;
  s = s.replace(/&/g, "&amp;");
  s = s.replace(/</g, "&lt;");
  s = s.replace(/>/g, "&gt;");
  s = s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  return s;
}

// دالة تنظيف شوائب الويب وX و&nbsp; والنقاط الفارغة
function cleanWebAndTwitterGarbage(txt) {
  if (!txt) return "";
  var s = txt;
  s = s.replace(/&nbsp;\s*X/gi, "");
  s = s.replace(/&nbsp;/gi, " ");
  s = s.replace(/\s+X\s*$/g, "");
  s = s.replace(/\s+X\n/g, "\n");
  s = s.replace(/\bX\s*$/g, "");
  s = s.replace(/ߓ堙噈اعيد/g, "مواعيد");
  s = s.replace(/ߓꠙ嘰كرات/g, "مذكرات");
  s = s.replace(/ߎ㠘㙆ظمة/g, "أنظمة");
  s = s.replace(/[\u07C0-\u07FF\u4E00-\u9FFF\uF000-\uFFFF]/g, "");

  var lines = s.split("\n");
  var clean_lines = [];
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i].trim();
    if (!l) {
      clean_lines.push("");
      continue;
    }
    if (l === "•" || l === "-" || l === "*" || l === "• " || l === "- " || l === "* " || l === "📌" || l === "🎓") {
      continue;
    }
    clean_lines.push(l);
  }
  return clean_lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// 1. استخراج كائن الرسالة
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

// 3. استخراج الوسائط
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

// إذا كانت الرسالة أمراً برمجياً مثل /start
if (raw_text && raw_text.indexOf("/") === 0 && !media_file_id) {
  return;
}

// إذا لم يتوفر نص ولا وسائط
if (!raw_text && !media_file_id) {
  return;
}

// 4. استخراج مصدر الرسالة بدقة فائقة
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
  }
} else if (typeof request !== "undefined" && request && request.forward_from_chat) {
  source_origin = request.forward_from_chat.username ? ("@" + request.forward_from_chat.username) : ("" + request.forward_from_chat.id);
  source_title = request.forward_from_chat.title || source_origin;
}

var is_private_chat = (msg_obj && msg_obj.chat && msg_obj.chat.type === "private") || (typeof chat !== "undefined" && chat && chat.chat_type === "private");
var is_forwarded = !!(source_origin || (msg_obj && (msg_obj.forward_date || msg_obj.forward_from_chat || msg_obj.forward_origin)));

// 5. حماية وتوجيه أزرار لوحة التحكم لمنع معالجتها كمنشورات
if (is_private_chat && !is_forwarded && !media_file_id && raw_text) {
  var t = raw_text.trim();
  if (t === "🏛️ إدارة الجامعات والمصادر" || t === "🏛️ إدارة الجامعات وقنوات النشر") { Bot.runCommand("/universities"); return; }
  if (t === "➕ معالج ربط جامعة وقناة (5 خطوات)" || t === "➕ معالج ربط جامعة وقناة") { Bot.runCommand("/add_university"); return; }
  if (t === "🔄 فحص وسحب الأخبار فوراً" || t === "🔄 فحص وسحب أخبار الجامعات") { Bot.runCommand("/crawl_sources"); return; }
  if (t === "🌐 بحث أخبار جوجل الأكاديمية" || t === "🌐 بحث أخبار جوجل للجامعة") { Bot.runCommand("/google_news"); return; }
  if (t === "📝 صياغة ونشر خبر فوري") { Bot.runCommand("/new_post"); return; }
  if (t === "🎯 إعلان خدماتي البديل") { Bot.runCommand("/ad"); return; }
  if (t === "⚙️ إعدادات الذكاء الاصطناعي") { Bot.runCommand("/ai"); return; }
  if (t === "💬 محادثة وبحث الذكاء") { Bot.runCommand("/chat"); return; }
  if (t === "🔑 مفاتيح API والاعتمادات") { Bot.runCommand("/keys"); return; }
  if (t === "👤 إدارة اليوزربوت وجلسة الحساب") { Bot.runCommand("/userbot"); return; }
  if (t === "📝 تعليمات المحرر الأكاديمي") { Bot.runCommand("/instructions"); return; }
  if (t === "🧪 تجربة الصياغة الفورية") { Bot.runCommand("/test"); return; }
  if (t === "📊 حالة النظام والتقارير") { Bot.runCommand("/status"); return; }
  if (t === "🟢 تشغيل / إيقاف البوت") { Bot.runCommand("/pause"); return; }
  if (t === "📞 الدعم الفني والمساعدة") { Bot.runCommand("/support"); return; }
  if (t === "🌐 قنواتنا وروابط التواصل") { Bot.runCommand("/social"); return; }
  if (t === "🎛 لوحة التحكم الرئيسية") { Bot.runCommand("/start"); return; }
  
  if (t.length < 25) {
    Bot.sendMessage("👋 **أهلاً بك يا مديرنا!**\nوجّه أي منشور من أي قناة أو أرسل نص الخبر كاملاً لإعادة صياغته ونشره.");
    return;
  }
}

// 6. فحص حالة إيقاف البوت
var is_paused = Bot.getProperty("bot_paused", false);
if (is_paused) {
  Bot.sendMessage("⏸️ **تنبيه**: تم التقاط المنشور، لكن النشر التلقائي متوقف حالياً.\n(استخدم زر التشغيل في /start للمتابعة)");
  return;
}

// 7. 🛡️ جدول الربط الصارم والعزل التام (Strict Relational Isolation):
// مطابقة المنشور بمشروع الجامعة وقناتها المحددة حصراً لمنع أي خلط بين القنوات
var univ_projects = Bot.getProperty("university_projects", []);
if (!univ_projects || !Array.isArray(univ_projects) || univ_projects.length === 0) {
  var def_target = Bot.getProperty("target_channels") || "@jhdhhdcj";
  univ_projects = [
    {
      id: "univ_ksu",
      name: "جامعة الملك سعود",
      target_channel: def_target,
      telegram_sources: ["@KSU_News"],
      twitter_sources: ["@ksu_news"],
      google_news_query: "جامعة الملك سعود",
      google_news_enabled: true,
      keywords: ["جامعة الملك سعود", "الملك سعود", "KSU", "قبول", "تسجيل"],
      enabled: true
    }
  ];
  Bot.setProperty("university_projects", univ_projects, "json");
}

var matched_univ = null;
var clean_origin = source_origin ? source_origin.toLowerCase().replace(/^@/, "").replace("https://t.me/s/", "").replace("https://t.me/", "") : "";

// أولاً: المطابقة الدقيقة عبر المصدر المربوط (قناة تليجرام أو حساب تويتر)
if (clean_origin) {
  for (var u1 = 0; u1 < univ_projects.length; u1++) {
    var p1 = univ_projects[u1];
    if (!p1.enabled) continue;
    var all_src = (p1.telegram_sources || []).concat(p1.twitter_sources || []);
    for (var s1 = 0; s1 < all_src.length; s1++) {
      var s_clean = all_src[s1].toLowerCase().replace(/^@/, "").replace("https://t.me/s/", "").replace("https://t.me/", "");
      if (s_clean === clean_origin) {
        matched_univ = p1;
        break;
      }
    }
    if (matched_univ) break;
  }
}

// ثانياً: إذا لم يتطابق المصدر، نبحث في متن النص عن اسم الجامعة أو كلماتها المفتاحية
if (!matched_univ && raw_text) {
  var lower_text = raw_text.toLowerCase();
  for (var u2 = 0; u2 < univ_projects.length; u2++) {
    var p2 = univ_projects[u2];
    if (!p2.enabled) continue;
    if (lower_text.indexOf(p2.name.toLowerCase()) !== -1) {
      matched_univ = p2;
      break;
    }
    for (var k = 0; k < (p2.keywords || []).length; k++) {
      var kw = p2.keywords[k].toLowerCase();
      if (kw.length >= 4 && lower_text.indexOf(kw) !== -1) {
        matched_univ = p2;
        break;
      }
    }
    if (matched_univ) break;
  }
}

// ثالثاً: إذا لم نجد تطابقاً صريحاً (مثل منشور مباشر أرسله المشرف)، نعتمد أول جامعة نشطة
if (!matched_univ) {
  for (var u3 = 0; u3 < univ_projects.length; u3++) {
    if (univ_projects[u3].enabled) {
      matched_univ = univ_projects[u3];
      break;
    }
  }
}
if (!matched_univ && univ_projects.length > 0) {
  matched_univ = univ_projects[0];
}

if (!matched_univ) {
  Bot.sendMessage("⚠️ لا يوجد مشروع جامعة نشط في النظام! أضف جامعة أولاً عبر /add_university");
  return;
}

// 🎯 قناة النشر الهدف المعزولة حصراً لهذه الجامعة (لا يتم النشر في أي قناة أخرى!)
var target_channels = [matched_univ.target_channel];

// وسم البيانات التعريفي الصارم (Source Metadata Tag)
var source_metadata = {
  source_origin: source_origin || "direct_admin",
  destination_channel: matched_univ.target_channel,
  university_name: matched_univ.name,
  university_id: matched_univ.id,
  timestamp: new Date().toISOString()
};

Bot.setProperty("pending_source_meta", source_metadata, "json");
Bot.setProperty("pending_target_univ", matched_univ.name, "string");
Bot.setProperty("pending_targets", target_channels, "json");

// تنقية النص الأصلي من شوائب الويب
var cleaned_raw_text = cleanWebAndTwitterGarbage(raw_text);

// 8. إشعار المشرف
if (is_private_chat) {
  var src_display = source_origin ? ("من المصدر: `" + source_origin + "`") : "المباشر";
  Bot.sendMessage("📥 **تم استلام المنشور " + src_display + " بنجاح!**\n" +
    "🏛️ **الجامعة المستهدفة**: `" + matched_univ.name + "`\n" +
    "📢 **قناة النشر الحصرية**: `" + matched_univ.target_channel + "`\n" +
    "⚡ جاري المعالجة بالذكاء الاصطناعي بنظام العزل الصارم...");
}

// 9. كشف إعلانات المنافسين واستبدالها بإعلان خدمات المشرف
// (معطل افتراضياً لحماية كافة أخبار ومنشورات الجامعات الرسمية ونشرها مع صورها الأصلية)
var ad_replacement_enabled = Bot.getProperty("ad_replacement_enabled", false);
var ad_keywords = ["حل واجبات بمقابل", "حل واجبات واختبارات", "حل كويزات", "حل فاينل", "حل اسايمنت", "كتابة بحوث بمقابل", "عمل بحوث ورسائل بمقابل", "إعلان مدفوع للخدمات"];
var is_ad = false;

if (ad_replacement_enabled && cleaned_raw_text) {
  for (var i = 0; i < ad_keywords.length; i++) {
    if (cleaned_raw_text.indexOf(ad_keywords[i]) !== -1) {
      is_ad = true;
      break;
    }
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

  var ch_target = matched_univ.target_channel;
  try {
    if ((media_type === "photo" || media_type === "photo_doc") && media_file_id) {
      if (media_type === "photo_doc") {
        Api.sendDocument({ chat_id: ch_target, document: media_file_id, caption: safe_ad, parse_mode: "HTML" });
      } else {
        Api.sendPhoto({ chat_id: ch_target, photo: media_file_id, caption: safe_ad, parse_mode: "HTML" });
      }
    } else if (media_type === "video") {
      Api.sendVideo({ chat_id: ch_target, video: media_file_id, caption: safe_ad, parse_mode: "HTML" });
    } else {
      Api.sendMessage({ chat_id: ch_target, text: safe_ad, parse_mode: "HTML" });
    }
  } catch (err) {
    try { Api.sendMessage({ chat_id: ch_target, text: custom_ad }); } catch (err2) {}
  }

  Bot.sendMessage("🎯 **تم كشف إعلان منافس واستبداله تلقائياً!**\nتم نشر إعلان خدماتك في قناة (" + matched_univ.name + "): `" + ch_target + "`");
  return;
}

// 10. حفظ تفاصيل المنشور للمعالجة بالذكاء الاصطناعي
Bot.setProperty("pending_media_type", media_type || "text", "string");
Bot.setProperty("pending_media_id", media_file_id || "", "string");
Bot.setProperty("pending_raw_text", cleaned_raw_text, "string");

var ai_enabled = Bot.getProperty("ai_enabled", true);
var current_model = Bot.getProperty("ai_model", "DeepSeek-V4.1-Flash");
var base_url = Bot.getProperty("ai_base_url", "https://api.hcnsec.cn/v1");
var api_key = Bot.getProperty("ai_api_key", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii");

if (!ai_enabled || !cleaned_raw_text) {
  var safe_raw = toSafeHtml(cleaned_raw_text);
  var dest = matched_univ.target_channel;
  try {
    if (media_file_id) {
      Api.sendPhoto({ chat_id: dest, photo: media_file_id, caption: safe_raw, parse_mode: "HTML" });
    } else {
      Api.sendMessage({ chat_id: dest, text: safe_raw, parse_mode: "HTML" });
    }
  } catch (err) {}
  Bot.sendMessage("⚡ **تم النشر المباشر في قناة (" + matched_univ.name + ")**: `" + dest + "`");
  return;
}

// 11. صياغة الموجه الذكي مع التخصيص الحصري للجامعة المستهدفة
var system_prompt = "أنت محرر محتوى أكاديمي ورسمي مخصص حصراً لطلاب: (" + matched_univ.name + ").\n" +
  "صِغ هذا الخبر بأسلوب إخباري راقٍ ومميز وأصيل كأنك الناشر الأول:\n" +
  "1. عنوان بارز يوضح موضوع الخبر والجامعة (📌)\n" +
  "2. نقاط محددة وسهلة القراءة تبرز المواعيد والخطوات والشروط بدقة تامة\n" +
  "3. احذف معرفات وروابط قنوات تيليجرام الترويجية السابقة، مع الاحتفاظ التام بكافة روابط البوابات والأنظمة والجامعات\n" +
  "4. احذف نهائياً أي شوائب مثل &nbsp; أو X أو نقاط فارغة\n" +
  "5. دعوة تفاعلية قصيرة للطلاب (💬)\n" +
  "6. هاشتاجات الجامعة الرسمية (مثال: #" + matched_univ.name.replace(/\s+/g, "_") + " #أخبار_التعليم)\n" +
  "قاعدة صارمة: إذا كان المنشور لا يمت بصلة لهذه الجامعة أو طلابها، رد بكلمة واحدة فقط: [IGNORED]";

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
      { role: "user", content: cleaned_raw_text }
    ],
    temperature: 0.28,
    max_tokens: 380
  },
  success: "/on_ai_post_success",
  error: "/on_ai_post_error",
  background: true
});
