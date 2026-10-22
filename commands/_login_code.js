/*CMD
  command: /login_code
  help: استلام كود OTP وطلب التحقق بخطوتين 2FA
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

var code = message.trim().replace(/\s+/g, "");
Bot.setProperty("userbot_login_otp", code, "string");

var text = "🔐 **الخطوة (3/3)**: التحقق بخطوتين (2FA)\n\n" +
  "إذا كان حسابك محمياً بكلمة مرور سحابية إضافية (Two-Step Verification Password)، يرجى إرسالها الآن.\n\n" +
  "⚡ **إذا لم يكن حسابك محمياً برمز 2FA**:\n" +
  "أرسل كلمة `تخطي` أو `skip` لإتمام تسجيل الجلسة فوراً.\n\n" +
  "*(أرسل كلمة المرور أو كلمة 'تخطي' الآن، أو /cancel للإلغاء)*";

Bot.sendMessage(text);
Bot.run({
  command: "/login_2fa"
});
