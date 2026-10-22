export type SourceType = 'telegram' | 'twitter' | 'rss';
export type SourcePriority = 'high' | 'medium' | 'low';
export type SourceRule = 'official' | 'semi-official'; // [رسمي] أو [شبه رسمي]

export interface SourceItem {
  id: string;
  type: SourceType;
  target: string; // e.g. @KSU_News or https://site.edu/rss or user_id
  title: string;
  priority: SourcePriority;
  rule: SourceRule;
  keywords: string[];
  blacklist: string[];
  enabled: boolean;
  lastPostId: string;
  lastChecked?: string;
}

export interface UniversityProject {
  id: string;
  name: string;
  target_channel: string;
  telegram_sources: string[];
  twitter_sources: string[];
  google_news_query?: string;
  google_news_enabled?: boolean;
  keywords: string[];
  enabled: boolean;
  created_at?: string;
}

export interface SourcesConfig {
  _info?: string;
  version?: string;
  lastUpdated?: string;
  target_channels?: string[];
  university_projects?: UniversityProject[];
  sources: SourceItem[];
}

export interface AIModelOption {
  id: string;
  name: string;
  desc: string;
  category?: 'chat' | 'speed' | 'vision' | 'audio' | 'tools';
  recommended?: boolean;
}

export const AVAILABLE_AI_MODELS: AIModelOption[] = [
  { id: 'auto', name: 'auto (توجيه تلقائي ذكي)', desc: 'توجيه آلي ذكي يختار أسرع نموذج متاح لحظياً لتفادي المهلة', category: 'speed' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Google GenAI)', desc: 'نموذج جوجل الفائق بالسرعة والدقة والتوافق السحابي مع محرر المحتوى الأكاديمي', category: 'speed', recommended: true },
  { id: 'DeepSeek-V4-Flash', name: 'DeepSeek-V4-Flash (الأسرع - يمنع Timeout)', desc: 'استجابة فائقة السرعة للأخبار والتنبيهات، خفيف وسريع ويمنع أخطاء انتهاء المهلة', category: 'speed', recommended: true },
  { id: 'DeepSeek-V4.1-Flash', name: 'DeepSeek-V4.1-Flash (دقة أكاديمية فائقة)', desc: 'فائق الدقة في صياغة المحتوى العربي وتنسيق المنشورات الجامعية', category: 'chat', recommended: true },
  { id: 'DeepSeek-V4-Pro', name: 'DeepSeek-V4-Pro (استدلال متقدم)', desc: 'قوة استدلال وتلخيص عميقة للمنشورات الطويلة والقرارات الرسمية واللوائح', category: 'chat' },
  { id: 'Qwen3.8-27B', name: 'Qwen3.8-27B (لغة عربية متقدمة)', desc: 'فهم لغوي فائق للسياق العربي الأكاديمي والجامعي بدقة عالية', category: 'chat' },
  { id: 'Qwen3.8-Flash-Next', name: 'Qwen3.8-Flash-Next (الجيل الحديث)', desc: 'جيل كوين فلاش الحديث لمعالجة سريعة واستجابة آنية للنصوص', category: 'speed' },
  { id: 'glm-5.3', name: 'glm-5.3', desc: 'صياغة جذابة ومتقنة مع تنظيم العناوين والنقاط', category: 'chat' },
  { id: 'glm-5.3-flash', name: 'glm-5.3-flash', desc: 'نسخة فلاش فائقة السرعة للأخبار العاجلة والتنبيهات', category: 'speed' },
  { id: 'MiMo-V2.6-Flash', name: 'MiMo-V2.6-Flash', desc: 'معالجة سريعة وخفيفة لتدفقات الرسائل التلقائية', category: 'speed' },
  { id: 'MiniMax-M3.1-Flash', name: 'MiniMax-M3.1-Flash', desc: 'استخراج سريع للبيانات والمواعيد والجداول الهامة', category: 'speed' },
  { id: 'longcat-2.5', name: 'longcat-2.5 (سياق طويل)', desc: 'معالجة سياقات فائقة الطول للكتب والمذكرات واللوائح الموسعة', category: 'chat' },
  { id: 'MiniCPM-V-4.7-35B-A3B', name: 'MiniCPM-V-4.7-35B-A3B (رؤية بصرية)', desc: 'نموذج رؤية وفهم الصور والمستندات والشهادات المرفقة مع المنشورات', category: 'vision' },
  { id: 'sensenova-6.8-flash-lite', name: 'sensenova-6.8-flash-lite', desc: 'نموذج لايت سريع للاستجابة اللحظية للأخبار', category: 'speed' },
  { id: 'sensenova-u1.5-lite', name: 'sensenova-u1.5-lite', desc: 'معالجة خفيفة ومتعددة المهام للنصوص السريعة', category: 'speed' },
  { id: 'step-5-preview', name: 'step-5-preview', desc: 'نموذج استدلال متقدم للمعاينة والتفكير المنطقي العميق', category: 'chat' },
  { id: 'step-image-edit-2', name: 'step-image-edit-2 (تعديل صور)', desc: 'معالجة وتعديل الصور وإضافة العلامات المائية للوسائط', category: 'vision' },
  { id: 'stepaudio-2.5-chat', name: 'stepaudio-2.5-chat (محادثات صوتية)', desc: 'معالجة وتوليد المحادثات الصوتية والتفاعلية', category: 'audio' },
  { id: 'stepaudio-2.5-tts', name: 'stepaudio-2.5-tts (تحويل النص لصوت)', desc: 'تحويل النصوص الأكاديمية إلى قراءة صوتية واضحة ومخارج عربية سليمة', category: 'audio' },
  { id: 'stepaudio-2.5-asr', name: 'stepaudio-2.5-asr (تحويل الصوت لنص)', desc: 'التعرف على الصوت وتحويل المقاطع الصوتية والمحاضرات لنصوص', category: 'audio' },
  { id: 'stepaudio-2.5-realtime', name: 'stepaudio-2.5-realtime (صوتي لحظي)', desc: 'تفاعل صوتي فوري في الوقت الحقيقي', category: 'audio' },
  { id: 'Qwen3-Embedding-8B', name: 'Qwen3-Embedding-8B (تضمين متجهي)', desc: 'نموذج التضمين المتجهي والبحث الدلالي عن المنشورات المتشابهة', category: 'tools' },
];

export interface AIModelConfig {
  apiBase: string; // https://api.hcnsec.cn/v1
  apiKey: string; // sk-J2ky44F6...
  primaryModel: string; // DeepSeek-V4.1-Flash
  fallbackModel: string; // auto
  systemPrompt: string;
  customInstructions: string;
  enableWebSearch: boolean;
}

export interface AdReplacementConfig {
  enabled: boolean;
  adDetectionKeywords: string[];
  customStudentAd: string;
}

export interface UserBotTelethonConfig {
  apiId: string;
  apiHash: string;
  phoneNumber: string;
  sessionName: string;
  stringSession?: string;
  library: 'telethon' | 'pyrogram';
}

export interface BotConfig {
  botToken: string;
  adminId: string;
  adminUsername: string;
  additionalAdminIds: string[];
  targetChannels: string[];
  notifyAdminOnForward: boolean;
  enableTelegramAdminCommands: boolean;
  preferredEngine: 'userbot' | 'bot' | 'hybrid' | 'telethon';
  ai: AIModelConfig;
  adReplacement: AdReplacementConfig;
  telethon: UserBotTelethonConfig;
  mediaHandling: {
    downloadPhotos: boolean;
    downloadVideos: boolean;
    downloadDocuments: boolean;
  };
}

export interface BotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface ForwardRule {
  id: string;
  name: string;
  enabled: boolean;
  sourceChatId: string;
  sourceChatTitle?: string;
  destinationChatId: string;
  destinationChatTitle?: string;
  matchType: 'all' | 'any' | 'none';
  keywords: string[];
  blacklistKeywords: string[];
  caseSensitive: boolean;
  replaceRules: {
    find: string;
    replaceWith: string;
  }[];
  removeLinks: boolean;
  removeUsernames: boolean;
  customSignature: string;
  forwardMode: 'copy' | 'quote';
  delaySeconds: number;
  mediaFilter: {
    allowText: boolean;
    allowPhotos: boolean;
    allowVideos: boolean;
    allowDocuments: boolean;
    allowAudio: boolean;
  };
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  type: 'success' | 'filtered' | 'error' | 'info';
  messageText: string;
  source: string;
  destination: string;
  details: string;
  appliedRuleName?: string;
}

export interface MessageSimulationResult {
  accepted: boolean;
  reason: string;
  originalText: string;
  transformedText: string;
  matchedKeywords: string[];
  triggeredBlacklist: string[];
  mediaAllowed: boolean;
  isAdReplaced?: boolean;
}
