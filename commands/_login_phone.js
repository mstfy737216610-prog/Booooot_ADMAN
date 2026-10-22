/*CMD
  command: /login_phone
  help: استلام رقم الهاتف وطلب كود OTP
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (!message || message.trim() == "/cancel") {
  Bot.sendMessage("تم إلغاء عملية تسجيل الدخول بنجاح ✅");
  Bot.runCommand("/userbot");
  return;
}

var phone = message.trim().replace(/\s+/g, "");
if (phone.indexOf("+") !== 0 || phone.length < 9) {
  Bot.sendMessage("❌ **رقم هاتف غير صحيح!**\nيرجى كتابة رقم الهاتف مسبوقاً بمفتاح الدولة (مثال: `+966501234567` أو `+967xxxxxxxxx`):");
  Bot.run({ command: "/login_phone" });
  return;
}

Bot.setProperty("userbot_login_phone", phone, "string");

var text = "📩 **الخطوة (2/3)**: يرجى إرسال **كود التحقق (OTP)** الذي وصلك من تيليجرام\n\n" +
  "• الحساب: `" + phone + "`\n" +
  "• بصمة الجهاز المستهدفة: `(متصفّح: Chrome 154 on Android)`\n\n" +
  "📌 **ملاحظة**: أرسل كود التحقق كأرقام (مثال: `12345` أو ضع فراغاً بينها `1 2 3 4 5` في حال حجب تيليجرام للأكواد).\n\n" +
  "*(أرسل الكود الآن، أو أرسل /cancel للإلغاء)*";

Bot.sendMessage(text);
Bot.run({
  command: "/login_code"
});
