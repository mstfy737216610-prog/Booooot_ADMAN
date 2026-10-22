/*CMD
  command: /social
  help: قنواتنا الرسمية وروابط التواصل الاجتماعي والأكاديمي
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🌐 قنواتنا وروابط التواصل, قنواتنا وروابط التواصل, روابط التواصل, روابط التواصل الاجتماعي, /social, روابطنا, القنوات الرسمية
CMD*/

var ADMIN_USER = "M_S_F_G";
var univ_projects = Bot.getProperty("university_projects", []);

var text = "🌐 **قنواتنا الرسمية وشبكات التواصل الاجتماعي والأكاديمي**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "📌 **قنوات النشر الأكاديمية والجامعية النشطة**:\n";

if (univ_projects && Array.isArray(univ_projects) && univ_projects.length > 0) {
  for (var i = 0; i < univ_projects.length; i++) {
    var u = univ_projects[i];
    var ch = u.target_channel || "@jhdhhdcj";
    var clean_ch = ch.replace(/^@/, "");
    text += "• **" + u.name + "**: [" + ch + "](https://t.me/" + clean_ch + ")\n";
  }
} else {
  text += "• **قناة الخدمات والأخبار الأكاديمية**: [@jhdhhdcj](https://t.me/jhdhhdcj)\n";
}

text += "\n👤 **حساب المشرف العام والخدمات الطلابية**: [@" + ADMIN_USER + "](https://t.me/" + ADMIN_USER + ")\n" +
  "🤖 **بوت النشر والأتمتة الذكي**: [@admiuin_bot](https://t.me/admiuin_bot)\n" +
  "🎓 **مجتمع الطلاب والمناقشات**: متاح لجميع الطلبة للاستفسارات الأكاديمية ومشاريع التخرج\n\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "👇 **روابط سريعة ومباشرة:**";

var inline_keyboard = [
  [
    { title: "📢 قناة النشر المعتمدة @jhdhhdcj", url: "https://t.me/jhdhhdcj" },
    { title: "👤 تواصل مع المشرف @" + ADMIN_USER, url: "https://t.me/" + ADMIN_USER }
  ],
  [
    { title: "🏛️ إدارة قنوات الجامعات والمصادر", command: "/universities" },
    { title: "📞 الدعم الفني والمساعدة", command: "/support" }
  ],
  [
    { title: "🎛 العودة للوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
