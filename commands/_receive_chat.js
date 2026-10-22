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

var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");
var base_url = Bot.getProperty("ai_base_url", "https://api.hcnsec.cn/v1");
var api_key = Bot.getProperty("ai_api_key", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii");
var saved_ins = Bot.getProperty("custom_instructions", "");

var system_chat_prompt = "أنت مساعد ومستشار ذكي ومحرر محتوى أكاديمي بارع. مهمتك التحدث مع المشرف بحرية كاملة ودون أي قيود أو قوالب نمطية جامدة.\n" +
  "• تفهم وتجيب بطلاقة ودقة عن أي استفسار يطرحه المشرف، سواء عن جامعات الكويت (مثل جامعة الشرق الأوسط الأمريكية AUM، جامعة الكويت، التطبيقي) ومكافآتها الاجتماعية، أو الجامعات السعودية والخليجية والعالمية، والجداول الدراسية (مثل جداول شهر رمضان وبورتل الطلبة)، والمذكرات والإعلانات.\n" +
  "• إذا سألك عن إعانة ومكافأة طلاب جامعة AUM الكويت: وضح أن المكافأة الاجتماعية (200 دينار كويتي) تصرف شهرياً عبر مجلس الجامعات الخاصة (PUC) ويتم إيداعها في حسابات البنوك عادة بين 20 إلى 26 من الشهر، ويمكن للطالب التأكد عبر تطبيق بنكه أو عبر My AUM Portal أو مراجعة شؤون الطلبة على هاتف 22260100.\n" +
  "• إذا كان بالرسالة رابط موقع خارجي أو بورتل: احتفظ به كاملاً لفتحه وتصفحه دون حذفه.\n" +
  "• تحدث بأسلوب عربي فصيح، راقٍ، مباشر، دون حشو، وبدون أي إيموجي رسومية مشوهة.\n" +
  "• لا تكرر قوالب جاهزة، وتجاوب مع كلام المشرف كشخص خبير ومخلص.";

if (saved_ins) {
  system_chat_prompt += "\nتعليمات المشرف الإضافية: " + saved_ins;
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
    temperature: 0.3,
    max_tokens: 350
  },
  success: "/on_chat_success",
  error: "/on_chat_error",
  background: true
});
