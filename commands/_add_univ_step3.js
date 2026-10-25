/*CMD
  command: /add_univ_step3
  help: معالج الربط الهرمي - الخطوة 3 من 5 (استلام قنوات التليجرام وتحديد حسابات تويتر/X المصدرة)
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var raw_msg = (typeof message !== "undefined" && message) ? message.trim() : "";

function checkMenuButtonOrCommand(t) {
  if (!t) return null;
  if (t === "/cancel" || t === "إلغاء" || t === "الغاء" || t === "رجوع" || t === "العودة") return "/universities";
  if (t === "🏛️ إدارة الجامعات والمصادر" || t === "🏛️ إدارة الجامعات وقنوات النشر" || t === "🏛️ الجامعات وقنواتها" || t === "إدارة الجامعات" || t === "/universities" || t === "/univ") return "/universities";
  if (t === "➕ معالج ربط جامعة وقناة (5 خطوات)" || t === "➕ معالج ربط جامعة وقناة" || t === "➕ إضافة جامعة وقناة نشر" || t === "➕ إضافة جامعة جديدة" || t === "/add_university") return "/add_university";
  if (t === "🔄 فحص وسحب الأخبار فوراً" || t === "🔄 فحص وسحب أخبار الجامعات" || t === "🔄 فحص وسحب الأخبار" || t === "/crawl_sources" || t === "/crawl") return "/crawl_sources";
  if (t === "🌐 بحث أخبار جوجل الأكاديمية" || t === "🌐 بحث أخبار جوجل للجامعة" || t === "🌐 أخبار جوجل" || t === "/google_news" || t === "/gnews") return "/google_news";
  if (t === "📝 صياغة ونشر خبر فوري" || t === "نشر خبر" || t === "/new_post") return "/new_post";
  if (t === "🎯 إعلان خدماتي البديل" || t === "إعلان خدماتي" || t === "/ad") return "/ad";
  if (t === "⚙️ إعدادات الذكاء الاصطناعي" || t === "⚙️ إعدادات الذكاء" || t === "/ai") return "/ai";
  if (t === "💬 محادثة وبحث الذكاء" || t === "💬 محادثة الذكاء" || t === "/chat") return "/chat";
  if (t === "🔑 مفاتيح API والاعتمادات" || t === "/keys") return "/keys";
  if (t === "👤 إدارة اليوزربوت وجلسة الحساب" || t === "👤 إدارة اليوزربوت" || t === "/userbot") return "/userbot";
  if (t === "📝 تعليمات المحرر الأكاديمي" || t === "/instructions") return "/instructions";
  if (t === "🧪 تجربة الصياغة الفورية" || t === "/test") return "/test";
  if (t === "📊 حالة النظام والتقارير" || t === "/status") return "/status";
  if (t === "🟢 تشغيل / إيقاف البوت" || t === "/pause") return "/pause";
  if (t.indexOf("الدعم الفني") !== -1 || t.indexOf("M_S_F_G") !== -1 || t === "/support" || t === "/help") return "/support";
  if (t === "🌐 قنواتنا وروابط التواصل" || t === "/social") return "/social";
  if (t === "🎛 لوحة التحكم الرئيسية" || t === "/start" || t === "/menu") return "/start";
  return null;
}

var matched_btn = checkMenuButtonOrCommand(raw_msg);
if (matched_btn) {
  Bot.runCommand(matched_btn);
  return;
}

if (!raw_msg) {
  Bot.sendMessage("تم إلغاء معالج الربط الهرمي بنجاح ✅");
  Bot.runCommand("/universities");
  return;
}

var tg_input = raw_msg;
var tg_sources = [];
if (tg_input.toLowerCase() !== "تخطي" && tg_input.toLowerCase() !== "skip") {
  var parts = tg_input.split(/[\s,]+/);
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].trim();
    if (p) {
      if (!p.startsWith("@") && !p.startsWith("https://")) p = "@" + p;
      tg_sources.push(p);
    }
  }
}

Bot.setProperty("temp_univ_tg", tg_sources, "json");

var prompt_step4 = "✅ **تم حفظ قنوات التليجرام المصدرة (" + tg_sources.length + ")**: " + (tg_sources.length > 0 ? tg_sources.join("، ") : "تم التخطي") + "\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "🐦 **الخطوة 4 من 5: [ تحديد حسابات تويتر (X) المصدرة ]**:\n\n" +
  "أرسل معرفات حسابات تويتر/X المصدرة التابعة لهذه الجامعة (مفصولة بمسافة أو فاصلة):\n" +
  "📌 **مثال**: `@ksu_news @ksu_portal` أو `@aum_kuwait`\n\n" +
  "💡 *ملاحظة: يمكنك كتابة كلمة*: `تخطي`\n\n" +
  "(أرسل المعرفات الآن، أو اكتب `تخطي`، أو اكتب /cancel للإلغاء)";

Bot.sendMessage(prompt_step4);
Bot.runCommand("/add_univ_step4");
