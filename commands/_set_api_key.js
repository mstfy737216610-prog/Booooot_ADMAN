/*CMD
  command: /set_api_key
  help: تعديل مفتاح الـ API Key للذكاء الاصطناعي
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 🔑 **تعديل مفتاح الـ API Key الخاص بالذكاء الاصطناعي**:\n\nالمفتاح الافتراضي المعتمد:\n`sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii`\n\nأرسل مفتاح الـ API Key الجديد الآن:\n\n*(أرسل المفتاح كرسالة عادية، أو أرسل /cancel للإلغاء)*
  keyboard: 
  aliases: 
CMD*/

var raw_msg = (typeof message !== "undefined" && message) ? message.trim() : "";

function checkMenuButtonOrCommand(t) {
  if (!t) return null;
  if (t === "/cancel" || t === "إلغاء" || t === "الغاء" || t === "رجوع" || t === "العودة") return "/ai";
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
  Bot.sendMessage("تم إلغاء تعديل المفتاح ✅");
  Bot.runCommand("/ai");
  return;
}

var key = raw_msg;
if (key.length < 10) {
  Bot.sendMessage("❌ المفتاح المدخل قصير جداً وغير صالح! تأكد من نسخ المفتاح كاملاً.");
  Bot.runCommand("/ai");
  return;
}

Bot.setProperty("ai_api_key", key, "string");
var masked = key.substring(0, 8) + "..." + key.substring(key.length - 4);

var text = "✅ **تم بنجاح حفظ مفتاح الـ API Key الجديد!**\n\n" +
  "• المفتاح المعتمد: `" + masked + "`\n" +
  "تم تحديث بيانات الاعتماد لجميع عمليات إعادة الصياغة القادمة.";

var inline_keyboard = [
  [
    { title: "⚡ فحص سرعة الاتصال بالمفتاح الجديد", command: "/api_test" },
    { title: "⚙️ العودة لإعدادات الذكاء", command: "/ai" }
  ],
  [
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
