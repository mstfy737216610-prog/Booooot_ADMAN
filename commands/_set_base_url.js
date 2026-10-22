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

if (!message || message.trim() == "/cancel") {
  Bot.sendMessage("تم إلغاء تعديل رابط الـ Base URL ✅");
  Bot.runCommand("/ai");
  return;
}

var url = message.trim();
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
