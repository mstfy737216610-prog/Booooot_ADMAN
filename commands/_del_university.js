/*CMD
  command: /del_university
  help: حذف مشروع جامعة وقناة نشر من النظام
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 🗑️ **حذف جامعة وقناة نشر**:\n\nأرسل اسم الجامعة أو معرفها أو قناة النشر الخاصة بها لحذفها من النظام:\n📌 **مثال**: `جامعة الملك سعود` أو `@jhdhhdcj`\n\n(أرسل الآن، أو اكتب /cancel للإلغاء)
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
  Bot.sendMessage("تم إلغاء عملية الحذف ✅");
  Bot.runCommand("/universities");
  return;
}

var query = raw_msg.toLowerCase();
var univ_projects = Bot.getProperty("university_projects", []);
var initial_len = univ_projects.length;

var new_projects = [];
var deleted_name = "";

for (var i = 0; i < univ_projects.length; i++) {
  var u = univ_projects[i];
  if (u.id.toLowerCase() === query || u.name.toLowerCase() === query || u.target_channel.toLowerCase() === query) {
    deleted_name = u.name + " (" + u.target_channel + ")";
  } else {
    new_projects.push(u);
  }
}

if (new_projects.length < initial_len) {
  Bot.setProperty("university_projects", new_projects, "json");
  Bot.sendMessage("✅ تم بنجاح حذف: " + deleted_name);
} else {
  Bot.sendMessage("⚠️ لم يتم العثور على جامعة مطابقة لـ: `" + raw_msg + "`");
}

Bot.runCommand("/universities");
