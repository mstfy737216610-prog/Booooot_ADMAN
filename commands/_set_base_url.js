/*CMD
  command: /set_base_url
  help: تعديل رابط بوابة الذكاء الاصطناعي Base URL
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 🌐 **تعديل رابط بوابة الذكاء الاصطناعي (Base URL)**:\n\nالرابط الحالي المعتمد: `https://api.hcnsec.cn/v1`\n\nأرسل رابط الـ Base URL الجديد الآن (مثال: `https://api.hcnsec.cn/v1` أو أي endpoint مخصص):\n\n*(أرسل الرابط كرسالة عادية، أو أرسل /cancel للإلغاء)*
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
  Bot.sendMessage("تم إلغاء تعديل رابط الـ Base URL ✅");
  Bot.runCommand("/ai");
  return;
}

var url = raw_msg;
if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
  Bot.sendMessage("❌ **رابط غير صالح!** يجب أن يبدأ بـ `https://` أو `http://`.\n(مثال: `https://api.hcnsec.cn/v1`)");
  Bot.runCommand("/ai");
  return;
}

// إزالة السلاش الزائد في النهاية
url = url.replace(/\/+$/, "");

Bot.setProperty("ai_base_url", url, "string");

var text = "✅ **تم بنجاح تحديث رابط الـ Base URL!**\n\n" +
  "• الرابط الجديد: `" + url + "`\n" +
  "جميع طلبات المعالجة القادمة ستوجه فوراً إلى هذا العنوان.";

var inline_keyboard = [
  [
    { title: "⚡ فحص سرعة الاتصال بالرابط الجديد", command: "/api_test" },
    { title: "⚙️ العودة لإعدادات الذكاء", command: "/ai" }
  ],
  [
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
