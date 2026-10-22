/*CMD
  command: /add_source
  help: إضافة مصادر وقنوات خارجية لمراقبتها وسحب منشوراتها
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 📥 **إضافة مصادر وقنوات خارجية للمراقبة والسحب التلقائي**:\n\nأرسل الآن معرّف أو رابط القناة/القنوات الخارجية التي تريد سحب منشوراتها.\n\n📌 **أمثلة مقبولة**:\n• `@KSU_News`\n• `https://t.me/moe_gov_sa`\n• `@channel1 @channel2 @channel3` (عدة قنوات مفصولة بمسافة)\n\n(أرسل الآن، أو اكتب /cancel للإلغاء)
  keyboard: 
  aliases: ➕ إضافة مصادر خارجية, إضافة مصادر خارجية, إضافة مصدر خارجي, /add
CMD*/

if (!message || message.trim() === "" || message.trim() === "/cancel") {
  Bot.sendMessage("تم إلغاء عملية إضافة المصادر بنجاح ✅");
  Bot.runCommand("/sources");
  return;
}

// دالة تنظيف المعرّفات واستخراج أسماء القنوات
function cleanChannelHandle(raw) {
  var s = String(raw).trim();
  s = s.replace(/^https?:\/\/t\.me\//i, "");
  s = s.replace(/^t\.me\//i, "");
  s = s.replace(/^@/, "");
  s = s.replace(/\/.*$/, "");
  s = s.trim();
  if (s.length > 0) {
    return "@" + s;
  }
  return null;
}

// استخراج كافة المعرفات المدخلة
var raw_tokens = message.split(/[\s,;\n]+/);
var new_sources = [];

for (var i = 0; i < raw_tokens.length; i++) {
  var cleaned = cleanChannelHandle(raw_tokens[i]);
  if (cleaned && new_sources.indexOf(cleaned) === -1) {
    new_sources.push(cleaned);
  }
}

if (new_sources.length === 0) {
  Bot.sendMessage("❌ لم يتم التعرف على أي معرف قناة صالح!\nيرجى كتابة معرّف القناة مثل: `@KSU_News` أو رابط مثل `https://t.me/KSU_News`");
  Bot.runCommand("/sources");
  return;
}

// 1. تحديث قائمة المصادر الشاملة (monitored_sources)
var current_sources = Bot.getProperty("monitored_sources", ["@KSU_News", "@moe_gov_sa"]);
if (!Array.isArray(current_sources)) {
  current_sources = ["@KSU_News", "@moe_gov_sa"];
}

var added_to_general = [];
for (var j = 0; j < new_sources.length; j++) {
  var src = new_sources[j];
  var already_exists = false;
  for (var k = 0; k < current_sources.length; k++) {
    if (current_sources[k].toLowerCase() === src.toLowerCase()) {
      already_exists = true;
      break;
    }
  }
  if (!already_exists) {
    current_sources.push(src);
    added_to_general.push(src);
  }
}

Bot.setProperty("monitored_sources", current_sources, "json");

// 2. تحديث قنوات التوزيع والربط (channel_mappings)
var mappings = Bot.getProperty("channel_mappings");
if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
  var def_tgt = Bot.getProperty("target_channels") || "@jhdhhdcj";
  mappings = [
    {
      target: def_tgt,
      sources: ["@KSU_News", "@moe_gov_sa", "@mstfyuhhh"],
      enabled: true,
      name: "قناة النشر الرسمية (أ)"
    }
  ];
}

// إضافة المصادر الجديدة إلى القناة الأولى المفعلة تلقائياً
var target_channel = mappings[0].target || "@jhdhhdcj";
if (!mappings[0].sources || !Array.isArray(mappings[0].sources)) {
  mappings[0].sources = [];
}

for (var n = 0; n < new_sources.length; n++) {
  var n_src = new_sources[n];
  var found_in_map = false;
  for (var m = 0; m < mappings[0].sources.length; m++) {
    if (mappings[0].sources[m].toLowerCase() === n_src.toLowerCase()) {
      found_in_map = true;
      break;
    }
  }
  if (!found_in_map) {
    mappings[0].sources.push(n_src);
  }
}

Bot.setProperty("channel_mappings", mappings, "json");

var confirm_text = "✅ **تمت إضافة المصادر الخارجية بنجاح!**\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "📡 **المصادر المضافة حديثاً (" + new_sources.length + "):**\n" +
  "• " + new_sources.join("\n• ") + "\n\n" +
  "🎯 **قناة النشر التلقائي المربوطة**: `" + target_channel + "`\n" +
  "📊 **إجمالي مصادر المراقبة الحالية**: " + current_sources.length + " مصدر نشط\n\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "💡 **طريقة قراءة وسحب المنشورات من هذه القنوات داخل تيليجرام:**\n" +
  "  1️⃣ **السحب الآلي الكامل (Admin Mode)**:\n" +
  "     إذا كنت مالكاً أو مشرفاً في القناة المصدر، أضف هذا البوت كمشرف (Admin)، وسيقوم تلقائياً وفورياً بقراءة أي منشور يُنشر فيها وإعادة صياغته بالذكاء ونشره في `" + target_channel + "` دون أي تدخل منك!\n\n" +
  "  2️⃣ **السحب بالتوجيه الفوري (Forwarding Mode)**:\n" +
  "     لأي قناة خارجية عامة أو خاصة لست مشرفاً فيها: وجّه أي منشور منها إلى هذا الشات مع البوت، وسيقوم البوت فوراً بالتقاطه، وصياغته أكاديمياً عبر DeepSeek، ونشره في قناتك خلال ثوانٍ!\n\n" +
  "👇 **اختر الخطوة التالية من الأزرار أدناه:**";

var inline_keyboard = [
  [
    { title: "➕ إضافة مصدر خارجي آخر", command: "/add_source" },
    { title: "📋 قائمة كافة المصادر", command: "/sources" }
  ],
  [
    { title: "📝 صياغة ونشر خبر فوري", command: "/new_post" },
    { title: "🗺️ خريطة القنوات المستهدفة", command: "/mapping" }
  ],
  [
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, confirm_text);
