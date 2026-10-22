/*CMD
  command: /crawl_sources
  help: فحص وسحب المنشورات وتوزيعها على كل جامعة وقناتها المستهدفة حصراً V3.1
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🔄 سحب وفحص المصادر, سحب المنشورات, /crawl, فحص المصادر, 🔄 سحب وقراءة المنشورات الآن, 🔄 فحص وسحب أخبار الجامعات
CMD*/

var is_paused = Bot.getProperty("bot_paused", false);
if (is_paused) {
  Bot.sendMessage("⏸️ البوت متوقف حالياً. لتشغيل النشر، اضغط زر التشغيل في /start");
  return;
}

// 1. جلب مشاريع الجامعات
var univ_projects = Bot.getProperty("university_projects");
if (!univ_projects || !Array.isArray(univ_projects) || univ_projects.length === 0) {
  var target_ch = Bot.getProperty("target_channels") || "@jhdhhdcj";
  univ_projects = [
    {
      id: "univ_ksu",
      name: "جامعة الملك سعود",
      target_channel: target_ch,
      telegram_sources: ["@KSU_News"],
      twitter_sources: ["@ksu_news"],
      google_news_query: "جامعة الملك سعود",
      google_news_enabled: true,
      keywords: ["جامعة الملك سعود", "الملك سعود", "KSU", "قبول", "تسجيل"],
      enabled: true
    }
  ];
  Bot.setProperty("university_projects", univ_projects, "json");
}

var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");
Bot.setProperty("auto_crawl_enabled", false, "boolean");

function cleanChannel(ch) {
  if (!ch) return "";
  var s = String(ch).trim();
  s = s.replace(/^https?:\/\/t\.me\/s\//i, "");
  s = s.replace(/^https?:\/\/t\.me\//i, "");
  s = s.replace(/^t\.me\//i, "");
  s = s.replace(/^@/, "");
  s = s.replace(/\/.*$/, "");
  return s.trim();
}

var checked_count = 0;
var status_msg = "🔄 **تم بدء فحص وسحب أخبار الجامعات ومصادرها المعزولة (" + univ_projects.length + " جامعة)**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n";

for (var u = 0; u < univ_projects.length; u++) {
  var univ = univ_projects[u];
  if (!univ.enabled) continue;

  status_msg += "🏛️ **" + univ.name + "** ➔ `" + univ.target_channel + "`\n";

  // فحص قنوات تيليجرام التابعة لهذه الجامعة حصراً
  if (univ.telegram_sources && Array.isArray(univ.telegram_sources)) {
    for (var t = 0; t < univ.telegram_sources.length; t++) {
      var ch_name = cleanChannel(univ.telegram_sources[t]);
      if (!ch_name) continue;

      status_msg += "   └ 📡 تيليجرام: @" + ch_name + " (جاري الجلب)\n";
      HTTP.get({
        url: "https://t.me/s/" + ch_name,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ar,en-US;q=0.9,en;q=0.8"
        },
        success: "/on_crawl_success " + univ.id + "|" + ch_name,
        error: "/on_crawl_error " + ch_name,
        background: true
      });
      checked_count++;
    }
  }

  // فحص أخبار جوجل لهذه الجامعة
  if (univ.google_news_enabled) {
    status_msg += "   └ 🌐 جوجل نيوز: بحث عن '" + (univ.google_news_query || univ.name) + "'\n";
    var enc_q = encodeURIComponent(univ.google_news_query || univ.name);
    HTTP.get({
      url: "https://news.google.com/rss/search?q=" + enc_q + "&hl=ar&gl=SA&ceid=SA:ar",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      success: "/on_google_news_success " + univ.id,
      error: "/on_crawl_error gnews_" + univ.id,
      background: true
    });
    checked_count++;
  }

  status_msg += "───────────────────\n";
}

status_msg += "\n🛡️ **نظام الفلترة والعزل الذكي**: المنشورات تُنشر في قناة الجامعة فقط إذا كانت تخصها 100%، وتم حظر الخلط وإزالة شوائب الويب وX و&nbsp; نهائياً.";

var kb = [
  [
    { title: "🏛️ إدارة الجامعات وقنوات النشر", command: "/universities" },
    { title: "➕ إضافة جامعة جديدة", command: "/add_university" }
  ],
  [
    { title: "📝 صياغة ونشر خبر فوري", command: "/new_post" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(kb, status_msg);
