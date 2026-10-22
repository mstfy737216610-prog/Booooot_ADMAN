/*CMD
  command: /api_test
  help: فحص الاتصال المباشر ببوابة الذكاء الاصطناعي
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: فحص الاتصال, ⚡ فحص سرعة الاستجابة
CMD*/

var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");
var base_url = Bot.getProperty("ai_base_url", "https://api.hcnsec.cn/v1");
var api_key = Bot.getProperty("ai_api_key", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii");

Bot.sendMessage("⏳ جاري إرسال اختبار فوري إلى خادم الذكاء الاصطناعي بنموذج `" + current_model + "`...");

var t_start = Date.now();
var endpoint_url = base_url.replace(/\/+$/, "") + "/chat/completions";

HTTP.post({
  url: endpoint_url,
  headers: {
    "Authorization": "Bearer " + api_key,
    "Content-Type": "application/json"
  },
  body: {
    model: current_model,
    messages: [
      { role: "user", content: "رد بكلمة واحدة فقط: جاهز" }
    ],
    max_tokens: 15
  },
  success: "/on_api_test_success " + t_start,
  error: "/on_api_test_error",
  background: true
});
