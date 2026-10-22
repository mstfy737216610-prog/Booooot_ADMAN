/*CMD
  command: /receive_chat
  help: استقبال رسالة المستخدم ومعالجة التعليمات أو السؤال عبر الذكاء
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (!message || message.trim() === "" || message.trim() === "/cancel") {
  Bot.sendMessage("تم إلغاء المحادثة والعودة للوحة الرئيسية ✅");
  Bot.runCommand("/start");
  return;
}

var raw_msg = message.trim();

// 1. فحص هل الرسالة عبارة عن تعليمات جديدة للمحرر
var is_instruction_command = false;
var new_instruction_text = "";

if (raw_msg.indexOf("تعليمات:") === 0) {
  is_instruction_command = true;
  new_instruction_text = raw_msg.replace("تعليمات:", "").trim();
} else if (raw_msg.indexOf("تعليمات ") === 0) {
  is_instruction_command = true;
  new_instruction_text = raw_msg.replace("تعليمات ", "").trim();
} else if (raw_msg.indexOf("اعتمد:") === 0 || raw_msg.indexOf("اعتمد ") === 0) {
  is_instruction_command = true;
  new_instruction_text = raw_msg.replace(/^اعتمد:?\s*/, "").trim();
} else if (raw_msg.indexOf("أريدك أن تركز") !== -1 || raw_msg.indexOf("كن مثل") !== -1 || raw_msg.indexOf("ركز على") === 0) {
  is_instruction_command = true;
  new_instruction_text = raw_msg;
}

if (is_instruction_command && new_instruction_text.length > 5) {
  Bot.setProperty("custom_instructions", new_instruction_text, "string");
  
  var success_text = "🎉 **تم بنجاح تحديث واعتماد تعليمات المشرف الأكاديمية!**\n" +
    "━━━━━━━━━━━━━━━━━━━\n\n" +
    "📌 **نص التعليمات الجديد المعتمد**:\n" +
    "*\"" + new_instruction_text + "\"*\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "✅ تم حفظ وتثبيت التعليمات فوراً في النظام والمستودع.\n" +
    "⚡ سيقوم الذكاء الاصطناعي بتطبيقها في كافة عمليات إعادة الصياغة والنشر القادمة.";

  var kb = [
    [
      { title: "💬 محادثة أخرى مع الذكاء", command: "/chat" },
      { title: "🧪 تجربة الصياغة بالتعليمات الجديدة", command: "/test" }
    ],
    [
      { title: "⚙️ إعدادات الذكاء الاصطناعي", command: "/ai" },
      { title: "🎛 اللوحة الرئيسية", command: "/start" }
    ]
  ];
  Bot.sendInlineKeyboard(kb, success_text);
  return;
}

// 2. إذا كانت الرسالة سؤالاً أو استفساراً، نرسلها لخادم الذكاء الاصطناعي
Bot.setProperty("last_user_query", raw_msg, "string");
Bot.sendMessage("🔍 **جاري البحث والمعالجة الذكية لسؤالك عبر خوارزميات الذكاء الأكاديمي...**\n`" + raw_msg + "`");

var current_model = Bot.getProperty("ai_model", "auto");
var base_url = Bot.getProperty("ai_base_url", "https://api.hcnsec.cn/v1");
var api_key = Bot.getProperty("ai_api_key", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii");
var saved_ins = Bot.getProperty("custom_instructions", "");

var system_chat_prompt = "أنت مستشار ومساعد أكاديمي ذكي متخصص في الجامعات ونظم التعليم في المملكة العربية السعودية والوطن العربي. أجب بدقة وموثوقية عالية وبأسلوب راقٍ منظم بنقاط واضحة ومباشرة مع إيموجي مناسب وهاشتاجات ذات صلة. إذا طلب المشرف معلومة ابحث وقدم أحدث التفاصيل المعتمدة.";
if (saved_ins) {
  system_chat_prompt += "\nملاحظة تعليمات المشرف: " + saved_ins;
}

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
      { role: "system", content: system_chat_prompt },
      { role: "user", content: raw_msg }
    ],
    temperature: 0.35,
    max_tokens: 500
  },
  success: "/on_chat_success",
  error: "/on_chat_error",
  background: true
});
