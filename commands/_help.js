/*CMD
  command: /help
  help: دليل المساعدة وقائمة الأوامر السريعة المنظمة
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: مساعدة, المساعدة, Help, help, /commands
CMD*/

var text = "📖 **دليل الأوامر ولوحة التحكم السريعة**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "🏛️ **إدارة الجامعات وقنوات النشر**:\n" +
  "• `/universities` - قائمة أزرار الجامعات المستقلة\n" +
  "• `/add_university` - معالج ربط جامعة جديدة (5 خطوات)\n" +
  "• `/crawl_sources` - فحص وسحب أخبار الجامعات فوراً\n" +
  "• `/google_news` - بحث أحدث أخبار جوجل لجامعتك\n\n" +
  "⚙️ **النشر والإعدادات الذكية**:\n" +
  "• `/new_post` - صياغة ونشر خبر فوري\n" +
  "• `/ad` - إدارة وتعديل إعلانك البديل (@M_S_F_G)\n" +
  "• `/ai` - إعدادات نماذج الذكاء الاصطناعي\n" +
  "• `/status` - حالة النظام والتقارير الإحصائية\n" +
  "• `/pause` - إيقاف أو استئناف النشر\n\n" +
  "👤 **الجلسة والدعم الفني**:\n" +
  "• `/userbot` - إدارة جلسة اليوزربوت وسحب X\n" +
  "• `/support` - الدعم الفني المباشر للمشرف @M_S_F_G\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "👇 **اختر القسم المطلوب مباشرة من الأزرار:**";

var inline_keyboard = [
  [
    { title: "🏛️ الجامعات وقنواتها", command: "/universities" },
    { title: "➕ إضافة جامعة", command: "/add_university" }
  ],
  [
    { title: "🔄 فحص وسحب الأخبار", command: "/crawl_sources" },
    { title: "🌐 أخبار جوجل", command: "/google_news" }
  ],
  [
    { title: "📞 مراسلة المشرف @M_S_F_G", url: "https://t.me/M_S_F_G" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
