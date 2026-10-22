/*CMD
  command: /login_start
  help: بدء تسجيل الدخول المباشر لجلسة UserBot من الشات
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: تسجيل دخول جديد, /login
CMD*/

var text = "👤 **نظام تسجيل الدخول المباشر لجلسة الـ UserBot من داخل الشات**\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "📱 **بصمة الجهاز التلقائية**: `Chrome 154 on Android`\n" +
  "🛡️ **طريقة الربط**: جلسة مستخدم حقيقية (MTProto User Session)\n" +
  "🌐 **صلاحيات السحب**: القنوات العامة والخاصة، تويتر (X)، والوسائط عالية الدقة\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "📲 **الخطوة (1/3)**: يرجى إرسال **رقم الهاتف مع الرمز الدولي**\n" +
  "(مثال: `+96650xxxxxxx` أو `+967xxxxxxxxx`)\n\n" +
  "*(أرسل الرقم الآن كرسالة عادية، أو أرسل /cancel للإلغاء)*";

Bot.sendMessage(text);
Bot.run({
  command: "/login_phone"
});
