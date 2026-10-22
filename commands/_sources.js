/*CMD
  command: /sources
  help: عرض وإدارة مصادر المراقبة والقنوات
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 📋 إدارة المصادر, المصادر, /channels_list
CMD*/

var mappings = Bot.getProperty("channel_mappings", []);
var total_sources = 0;
for (var i = 0; i < mappings.length; i++) {
  if (mappings[i].sources) {
    total_sources += mappings[i].sources.length;
  }
}

var text = "📋 **قائمة ومصادر قنوات المراقبة والنشر:**\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "📡 **طرق قراءة وسحب المنشورات المتاحة 100% داخل تيليجرام:**\n" +
  "  1️⃣ **إضافة البوت كمشرف (Admin)**: عند إضافة البوت في أي قناة يقرأ كل منشوراتها تلقائياً.\n" +
  "  2️⃣ **التوجيه المباشر (Forward)**: وجّه أي رسالة من أي قناة (عامة أو خاصة) إلى البوت مباشرة وسيقوم بصياغتها ونشرها فوراً!\n" +
  "  3️⃣ **صانع الأخبار الفوري (/new_post)**: كتابة ونشر الأخبار بضغطة زر.\n\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "🎯 **القنوات المستهدفة حالياً (" + mappings.length + ") إجمالي المصادر (" + total_sources + "):**\n";

for (var j = 0; j < mappings.length; j++) {
  var m = mappings[j];
  text += "• **الهدف**: `" + m.target + "` (" + (m.enabled ? "🟢 نشط" : "🔴 متوقف") + ")\n";
  if (m.sources && m.sources.length > 0) {
    text += "   └ المصادر: " + m.sources.join("، ") + "\n";
  } else {
    text += "   └ المصادر: (كافة المنشورات الموجهة للبوت)\n";
  }
}

text += "\n👇 **اختر إجراءً من الأزرار التفاعلية أدناه:**";

var inline_keyboard = [
  [
    { title: "➕ إضافة ربط قناة جديدة", command: "/add_mapping" },
    { title: "🗺️ خريطة القنوات والمصادر", command: "/mapping" }
  ],
  [
    { title: "📝 صياغة ونشر خبر فوري", command: "/new_post" },
    { title: "🧪 تجربة الصياغة الفورية", command: "/test" }
  ],
  [
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
