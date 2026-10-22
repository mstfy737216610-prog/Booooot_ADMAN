/*CMD
  command: /set_channel
  help: تحديد أو تغيير قناة النشر التلقائي المعتمدة
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 📢 تحديد قناة النشر, تحديد قناة النشر, 📢 تحديد قناة النشر الهدف, 📢 إدارة قنوات النشر, قنوات النشر, /add_channel, تحديد القناة الهدف
CMD*/

var raw = message || "";
var arg = raw.replace("/set_channel", "").replace("/add_channel", "").replace("تحديد القناة الهدف", "").trim();

if (!arg) {
  var current = Bot.getProperty("target_channels") || "@jhdhhdcj";
  var text = "📢 **تحديد وتغيير قناة النشر المستهدفة:**\n" +
    "━━━━━━━━━━━━━━━━━━━\n\n" +
    "🎯 **القناة المعتمدة حالياً**: `" + current + "`\n\n" +
    "💡 **لتحديد قناتك الخاصة، أرسل الأمر متبوعاً بمعرف قناتك:**\n" +
    "👉 `/set_channel @اسم_قناتك_الحقيقي`\n\n" +
    "📌 **خطوات هامة لضمان النشر دون أخطاء (Chat Not Found):**\n" +
    "  1️⃣ ادخل إلى قناتك في تيليجرام وافتح إعدادات القناة (المشرفون).\n" +
    "  2️⃣ اضغط **إضافة مشرف (Add Administrator)** وابحث عن يوزر بوتك.\n" +
    "  3️⃣ فعّل صلاحية **نشر الرسائل (Post Messages)**.\n" +
    "  4️⃣ ثم أرسل هنا: `/set_channel @اسم_قناتك` وسيقوم البوت باعتمادها فوراً!";

  var inline_keyboard = [
    [
      { title: "🔗 خريطة توزيع القنوات", command: "/mapping" },
      { title: "🔄 فحص وسحب المصادر", command: "/crawl_sources" }
    ],
    [
      { title: "🎛 اللوحة الرئيسية", command: "/start" }
    ]
  ];
  Bot.sendInlineKeyboard(inline_keyboard, text);
  return;
}

// تنظيف المعرف والتأكد من البدء بـ @
var clean_ch = arg.trim();
if (clean_ch.indexOf("@") !== 0 && clean_ch.indexOf("-100") !== 0) {
  clean_ch = "@" + clean_ch;
}

// حفظ القناة المستهدفة
Bot.setProperty("target_channels", clean_ch, "string");

// تحديث جدول الربط (channel_mappings) فوراً ليوجه كافة المصادر إلى هذه القناة
var monitored = Bot.getProperty("monitored_sources", ["@KSU_News", "@moe_gov_sa", "@mstfyuhhh"]);
var mappings = [
  {
    target: clean_ch,
    sources: monitored,
    enabled: true,
    name: "القناة الرسمية المعتمدة"
  }
];
Bot.setProperty("channel_mappings", mappings, "json");

var success_text = "✅ **تم بنجاح اعتماد وتثبيت قناة النشر الرسمية!**\n\n" +
  "🎯 **القناة الهدف الجديدة**: `" + clean_ch + "`\n" +
  "📡 **المصادر المربوطة بها**: " + monitored.join("، ") + "\n\n" +
  "⚡ **ملاحظة تمنع أخطاء تيليجرام:**\n" +
  "تأكد من أنك رفعت البوت مشرفاً (Admin) في `" + clean_ch + "` ولديه صلاحية نشر الرسائل.";

var kb = [
  [
    { title: "🧪 تجربة النشر الآن", command: "/test" },
    { title: "🔄 سحب من المصادر", command: "/crawl_sources" }
  ],
  [
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(kb, success_text);
