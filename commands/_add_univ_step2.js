/*CMD
  command: /add_univ_step2
  help: معالج الربط الهرمي - الخطوة 2 من 5 (استلام اسم الجامعة وتحديد قنوات التليجرام المصدرة)
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

var univ_name = raw_msg;
if (univ_name.length < 3) {
  Bot.sendMessage("⚠️ اسم الجامعة قصير جداً! يرجى إرسال اسم الجامعة أو الكلية بوضوح مثل: `جامعة الشرق الأوسط الأمريكية AUM` أو `جامعة الملك سعود`");
  Bot.run({ command: "/add_univ_step2" });
  return;
}

Bot.setProperty("temp_univ_name", univ_name, "string");

var prompt_step3 = "✅ **تم حفظ اسم الجامعة / القسم**: `" + univ_name + "`\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "📡 **الخطوة 3 من 5: [ تحديد قنوات التليجرام المصدرة ]**:\n\n" +
  "أرسل معرفات قنوات التليجرام المصدرة الخاصة بهذه الجامعة لسحب الأخبار منها حصراً (مفصولة بمسافة أو فاصلة):\n" +
  "📌 **مثال**: `@AUM_News @AUM_Admission`\n\n" +
  "💡 *ملاحظة: إذا كنت ترغب فقط بالاعتماد على أخبار جوجل وحسابات X، اكتب كلمة*: `تخطي`\n\n" +
  "(أرسل القنوات الآن، أو اكتب `تخطي`، أو اكتب /cancel للإلغاء)";

Bot.sendMessage(prompt_step3);
Bot.runCommand("/add_univ_step3");
