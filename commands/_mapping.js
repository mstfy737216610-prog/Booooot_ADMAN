/*CMD
  command: /mapping
  help: إدارة ربط القنوات والمصادر المنفصلة (Multi-Source Mapping)
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🗺️ ربط القنوات والمصادر, /channels, 🔗 ربط القنوات والأهداف
CMD*/

var mappings = Bot.getProperty("channel_mappings");
if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
  var current_target = Bot.getProperty("target_channels") || "@jhdhhdcj";
  var sources = Bot.getProperty("monitored_sources", ["@KSU_News", "@moe_gov_sa", "@mstfyuhhh"]);
  mappings = [
    {
      target: current_target,
      sources: sources,
      enabled: true,
      name: "قناة النشر الرسمية (أ)"
    }
  ];
  Bot.setProperty("channel_mappings", mappings, "json");
}

var text = "🗺️ **إدارة وتوزيع القنوات والمصادر (Multi-Source Mapping)**:\n" +
  "تتيح لك هذه الميزة تخصيص مصادر محددة لكل قناة نشر، أو توجيه مصادر معينة لقناة خاصة!\n\n" +
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
    { title: "➕ إضافة مصادر خارجية للمراقبة", command: "/add_source" },
    { title: "➕ ربط قناة هدف جديدة", command: "/add_mapping" }
  ],
  [
    { title: "📋 قائمة كافة المصادر", command: "/sources" },
    { title: "🗑️ حذف ربط قناة", command: "/del_mapping" }
  ],
  [
    { title: "🔄 إعادة ضبط التعيينات الافتراضية", command: "/reset_mapping" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
