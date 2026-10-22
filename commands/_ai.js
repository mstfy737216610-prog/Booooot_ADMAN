/*CMD
  command: /ai
  help: إعدادات الذكاء الاصطناعي واختيار النموذج
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: ⚙️ إعدادات الذكاء الاصطناعي, /model
CMD*/

var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");
var base_url = Bot.getProperty("ai_base_url", "https://api.hcnsec.cn/v1");
var api_key = Bot.getProperty("ai_api_key", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii");
var ai_enabled = Bot.getProperty("ai_enabled", true);

var masked_key = api_key.substring(0, 8) + "..." + api_key.substring(api_key.length - 4);

var text = "🧠 **إعدادات الذكاء الاصطناعي التفاعلية (AI Configuration)**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "• **البوابة (Base URL)**: `" + base_url + "`\n" +
  "• **المفتاح (API Key)**: `" + masked_key + "`\n" +
  "• **النموذج النشط حالياً**: `" + current_model + "` ⚡ (سريع ومستقر)\n" +
  "• **حالة المعالجة التلقائية**: " + (ai_enabled ? "🟢 مفعلة (إعادة صياغة ذكية)" : "🔴 معطلة (نقل مباشر)") + "\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "👇 **اختر نموذجاً بالضغط على الزر لتبديله فورياً وبدون كتابة أكواد:**";

var inline_keyboard = [
  [
    { title: (current_model == "auto" ? "✅ " : "") + "🤖 auto (النموذج التلقائي الأسرع)", command: "/set_model auto" }
  ],
  [
    { title: (current_model == "DeepSeek-V4-Flash" ? "✅ " : "") + "⚡ DeepSeek-V4-Flash", command: "/set_model DeepSeek-V4-Flash" },
    { title: (current_model == "DeepSeek-V4.1-Flash" ? "✅ " : "") + "🚀 DeepSeek-V4.1-Flash", command: "/set_model DeepSeek-V4.1-Flash" }
  ],
  [
    { title: (current_model == "DeepSeek-V4-Pro" ? "✅ " : "") + "🧠 DeepSeek-V4-Pro", command: "/set_model DeepSeek-V4-Pro" },
    { title: (current_model == "Qwen3.8-27B" ? "✅ " : "") + "📚 Qwen3.8-27B", command: "/set_model Qwen3.8-27B" }
  ],
  [
    { title: (current_model == "glm-5.3" ? "✅ " : "") + "🌐 glm-5.3", command: "/set_model glm-5.3" },
    { title: (current_model == "glm-5.3-flash" ? "✅ " : "") + "⚡ glm-5.3-flash", command: "/set_model glm-5.3-flash" }
  ],
  [
    { title: (current_model == "MiniMax-M3.1-Flash" ? "✅ " : "") + "📊 MiniMax-M3.1-Flash", command: "/set_model MiniMax-M3.1-Flash" },
    { title: (current_model == "MiMo-V2.6-Flash" ? "✅ " : "") + "💫 MiMo-V2.6-Flash", command: "/set_model MiMo-V2.6-Flash" }
  ],
  [
    { title: (current_model == "MiniCPM-V-4.7-35B-A3B" ? "✅ " : "") + "👁️ MiniCPM-V (رؤية)", command: "/set_model MiniCPM-V-4.7-35B-A3B" },
    { title: (current_model == "stepaudio-2.5-tts" ? "✅ " : "") + "🎙️ stepaudio-tts", command: "/set_model stepaudio-2.5-tts" }
  ],
  [
    { title: "💬 محادثة الذكاء والبحث المباشر", command: "/chat" },
    { title: "📝 تعليمات الصياغة والهاشتاجات", command: "/instructions" }
  ],
  [
    { title: "🌐 تعديل الـ Base URL", command: "/set_base_url" },
    { title: "🔑 تعديل الـ API Key", command: "/set_api_key" }
  ],
  [
    { title: ai_enabled ? "🔴 تعطيل الذكاء مؤقتاً" : "🟢 تفعيل الذكاء الاصطناعي", command: "/toggle_ai" },
    { title: "⚡ فحص سرعة الاستجابة (Ping)", command: "/api_test" }
  ],
  [
    { title: "🎛 العودة للوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
