/*CMD
  command: /crawl_twitter
  help: زاحف حسابات تويتر (X) الرسمية للجامعات ومطابقتها أكاديمياً
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var raw_params = (params || "").trim();
if (!raw_params) return;

var univ_id = "";
var twitter_handle = "";

if (raw_params.indexOf("|") !== -1) {
  var parts = raw_params.split("|");
  univ_id = parts[0].trim();
  twitter_handle = parts[1].trim();
} else {
  twitter_handle = raw_params;
}

var clean_handle = twitter_handle.replace(/^@/, "").replace(/^https?:\/\/(?:twitter|x)\.com\//i, "").replace(/\/.*$/, "").trim();
if (!clean_handle) return;

// 1. جلب التغريدات عبر محرك النشر التزامني والتجميعي لتويتر (Syndication Timeline Gateway)
var syndication_url = "https://syndication.twitter.com/srv/timeline-profile/screen-name/" + clean_handle;

HTTP.get({
  url: syndication_url,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ar,en-US;q=0.9,en;q=0.8"
  },
  success: "/on_twitter_success " + univ_id + "|" + clean_handle,
  error: "/on_crawl_error twitter_" + clean_handle,
  background: true
});
