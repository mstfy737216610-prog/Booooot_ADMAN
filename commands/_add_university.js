/*CMD
  command: /add_university
  help: معالج الربط الهرمي - الخطوة 1 من 5 (تحديد قناة النشر الهدف)
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 🏛️ **معالج الربط الهرمي الشامل لمشروع جامعة وقناة نشر (الخطوة 1 من 5)**:\n━━━━━━━━━━━━━━━━━━━\n\n🎯 **الخطوة الأولى: [ تحديد قناة النشر الهدف ]**\n\nأرسل معرف قناة النشر المستهدفة على تيليجرام التي ترغب بربطها ليتم النشر فيها حصراً:\n📌 **مثال**: `@jhdhhdcj` أو `-1001234567890`\n\n💡 *(تأكد من إضافة البوت مشرفاً Admin فيها مع صلاحية النشر وإرسال الرسائل)*\n\n(أرسل المعرف الآن، أو اكتب /cancel للإلغاء)
  keyboard: 
  aliases: ➕ معالج ربط جامعة وقناة (5 خطوات), ➕ معالج ربط جامعة وقناة, ➕ إضافة جامعة وقناة نشر, /new_univ, ➕ إضافة جامعة وقناة نشر جديدة, إضافة جامعة
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

var raw_channel = raw_msg;
if (!raw_channel.startsWith("@") && !raw_channel.startsWith("-100")) {
  raw_channel = "@" + raw_channel;
}

// حفظ القناة المستهدفة مؤقتاً والانتقال للخطوة 2
Bot.setProperty("temp_univ_channel", raw_channel, "string");

var prompt_step2 = "✅ **تم تعيين قناة النشر الهدف**: `" + raw_channel + "`\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "🎓 **الخطوة 2 من 5: [ تحديد اسم الجامعة / القسم بالتفصيل ]**:\n\n" +
  "أرسل الاسم الرسمي والواضح للجامعة أو الكلية أو القسم بالتفصيل لتوجيه سياق الذكاء الاصطناعي بدقة:\n" +
  "📌 **أمثلة**:\n" +
  "• `جامعة الشرق الأوسط الأمريكية (AUM)`\n" +
  "• `جامعة الملك سعود - كلية الهندسة`\n" +
  "• `جامعة الكويت - عمادة القبول والتسجيل`\n\n" +
  "💡 *(هذا الاسم سيستخدمه الذكاء الاصطناعي لعزل الأخبار ومنع خلطها مع أي جامعة أخرى)*\n\n" +
  "(أرسل الاسم الآن، أو اكتب /cancel للإلغاء)";

Bot.sendMessage(prompt_step2);
Bot.runCommand("/add_univ_step2");
