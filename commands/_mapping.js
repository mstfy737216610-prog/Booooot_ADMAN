/*CMD
  command: /mapping
  help: إدارة ربط القنوات والمصادر المنفصلة (Multi-Source Mapping)
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🗺️ ربط القنوات والمصادر, /channels
CMD*/

var mappings = Bot.getProperty("channel_mappings");
if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
  mappings = [
    {
      target: "@MyUniversityChannel",
      sources: ["@KSU_News", "@moe_gov_sa"],
      enabled: true,
      name: "قناة النشر الرسمية (أ)"
    }
  ];
  Bot.setProperty("channel_mappings", mappings, "json");
}

var text = "🗺️ **إدارة القنوات والمصادر المنفصلة (Multi-Source Mapping)**:\n" +
  "تتيح لك هذه الميزة تحديد مصادر مخصصة لكل قناة نشر على حدة، بحيث تنشر القناة (أ) أخباراً مختلفة تماماً عن القناة (ب)!\n\n" +
  "━━━━━━━━━━━━━━━━━━━\n";

for (var i = 0; i < mappings.length; i++) {
  var m = mappings[i];
  var st = m.enabled ? "🟢 نشطة" : "🔴 متوقفة";
  text += "**" + (i + 1) + ". قناة النشر المستهدفة:** `" + m.target + "` (" + st + ")\n";
  text += "   📡 **المصادر المخصصة لها (" + (m.sources ? m.sources.length : 0) + "):**\n";
  if (m.sources && m.sources.length > 0) {
    for (var s = 0; s < m.sources.length; s++) {
      text += "   └ " + m.sources[s] + "\n";
    }
  } else {
    text += "   └ ⚠️ لم يتم ربط مصادر بعد.\n";
  }
  text += "───────────────────\n";
}

text += "\n👇 **اختر إجراءً للتحكم بالقنوات والمصادر:**";

var inline_keyboard = [
  [
    { title: "➕ إضافة ربط قناة نشر ومصادر جديدة", command: "/add_mapping" }
  ],
  [
    { title: "🗑️ حذف ربط قناة", command: "/del_mapping" },
    { title: "🔄 إعادة ضبط التعيينات الافتراضية", command: "/reset_mapping" }
  ],
  [
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
