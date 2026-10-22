/*CMD
  command: /users
  help: إدارة المستخدمين والصلاحيات ورتب المشرفين
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 👥 إدارة المستخدمين, إدارة المستخدمين, /members, /user_management
CMD*/

var ADMIN_ID = 7607633343;
var user_id = user ? user.telegramid : null;

var text = "👥 **لوحة إدارة المستخدمين والمشرفين (User & Access Control)**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "👑 **المشرف العام المعتمد**: `@M_S_F_G` (ID: `" + ADMIN_ID + "`)\n" +
  "• **الصلاحيات**: تحكم كامل 100% (إضافة مصادر، تعديل قنوات، تغيير نماذج الذكاء، إيقاف وتشغيل)\n" +
  "• **الخطة الحالية**: `VIP الأكاديمية (غير محدودة)` 🌟\n\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "📌 **أوامر الإشراف السريعة**:\n" +
  "• لترقية مستخدم لمشرف: `/set_role USER_ID admin`\n" +
  "• لحظر مستخدم: `/ban USER_ID`\n" +
  "• لإلغاء حظر مستخدم: `/unban USER_ID`\n\n" +
  "👇 **اختر إجراءً من الأزرار التفاعلية أدناه:**";

var inline_keyboard = [
  [
    { title: "👤 فحص حسابي والاشتراك", command: "/userbot" },
    { title: "📊 تقارير القنوات والمصادر", command: "/status" }
  ],
  [
    { title: "📢 قنوات النشر المعتمدة", command: "/set_channel" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
