/*CMD
  command: /test
  help: تجربة صياغة منشور أكاديمي فوري
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🧪 تجربة الصياغة الفورية, 🧪 تجربة صياغة منشور, /demo
CMD*/

var sample_text = "تعلن عمادة القبول والتسجيل عن بدء استقبال طلبات الالتحاق لبرامج البكالوريوس والدبلوم للفصل الدراسي القادم ابتداءً من يوم الأحد القادم ويستمر حتى نهاية الشهر عبر البوابة الإلكترونية، ويشترط ألا يقل المعدل التراكمي عن 80% واجتياز اختبار القدرات والتحصيلي.";

Bot.sendMessage("🧪 **جاري إرسال عينة خبر جامعي إلى API الذكاء الاصطناعي لإعادة صياغته وعرض النتيجة:**\n`" + sample_text + "`");

var current_model = Bot.getProperty("ai_model", "DeepSeek-V4.1-Flash");

HTTP.post({
  url: "https://api.hcnsec.cn/v1/chat/completions",
  headers: {
    "Authorization": "Bearer sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii",
    "Content-Type": "application/json"
  },
  body: {
    model: current_model,
    messages: [
      {
        role: "system",
        content: "أنت محرر محتوى تعليمي جامعي متميز. أعد صياغة الخبر التالي بأسلوب شيق وجذاب مع عنوان بارز (📌) ونقاط واضحة ودعوة تفاعلية (💬) وهاشتاجات مناسبة بدون ذكر أي قنوات منافسة."
      },
      {
        role: "user",
        content: sample_text
      }
    ],
    temperature: 0.4,
    max_tokens: 800
  },
  success: "/on_test_success",
  error: "/on_api_test_error"
});
