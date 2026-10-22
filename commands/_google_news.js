/*CMD
  command: /google_news
  help: بحث وسحب أحدث الأخبار الأكاديمية الرسمية من جوجل نيوز لجامعة محددة
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🌐 بحث أخبار جوجل للجامعة, /gnews, /univ_gnews
CMD*/

var univ_projects = Bot.getProperty("university_projects", []);
if (!univ_projects || !Array.isArray(univ_projects) || univ_projects.length === 0) {
  Bot.sendMessage("⚠️ لا توجد جامعات مضافة بعد! يرجى إضافة جامعة أولاً عبر: /add_university");
  return;
}

var target_univ = null;
var input_param = (params || "").trim();

if (input_param) {
  for (var u = 0; u < univ_projects.length; u++) {
    if (univ_projects[u].id === input_param || univ_projects[u].name === input_param || univ_projects[u].target_channel === input_param) {
      target_univ = univ_projects[u];
      break;
    }
  }
}

if (!target_univ && input_param) {
  for (var u2 = 0; u2 < univ_projects.length; u2++) {
    if (univ_projects[u2].name.indexOf(input_param) !== -1) {
      target_univ = univ_projects[u2];
      break;
    }
  }
}

if (!target_univ) {
  target_univ = univ_projects[0];
}

var query = target_univ.google_news_query || target_univ.name;
var encoded_query = encodeURIComponent(query);
var rss_url = "https://news.google.com/rss/search?q=" + encoded_query + "&hl=ar&gl=SA&ceid=SA:ar";

Bot.sendMessage("🌐 **جاري البحث وسحب أحدث الأخبار الرسمية من جوجل نيوز لـ**: `" + target_univ.name + "`...\n🎯 **قناة النشر المستهدفة**: `" + target_univ.target_channel + "`");

HTTP.get({
  url: rss_url,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8"
  },
  success: "/on_google_news_success " + target_univ.id,
  error: "/on_crawl_error gnews_" + target_univ.id,
  background: true
});
