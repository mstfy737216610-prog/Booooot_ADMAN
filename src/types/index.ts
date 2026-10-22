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

export interface SourcesConfig {
  _info?: string;
  version?: string;
  lastUpdated?: string;
  target_channels?: string[];
  sources: SourceItem[];
}

export interface AIModelOption {
  id: string;
  name: string;
  desc: string;
  recommended?: boolean;
}

export const AVAILABLE_AI_MODELS: AIModelOption[] = [
  { id: 'DeepSeek-V4.1-Flash', name: 'DeepSeek-V4.1-Flash', desc: 'النموذج الأحدث والأسرع، فائق الدقة في صياغة المحتوى العربي والجامعي', recommended: true },
  { id: 'DeepSeek-V4-Flash', name: 'DeepSeek-V4-Flash', desc: 'استجابة فائقة السرعة للأخبار والتنبيهات المستعجلة' },
  { id: 'DeepSeek-V4-Pro', name: 'DeepSeek-V4-Pro', desc: 'قوة استدلال وتلخيص عميقة للمنشورات الطويلة والقرارات الرسمية' },
  { id: 'Qwen3.8-27B', name: 'Qwen3.8-27B', desc: 'فهم لغوي فائق للسياق العربي الأكاديمي' },
  { id: 'Qwen3.8-Flash-Next', name: 'Qwen3.8-Flash-Next', desc: 'نموذج سريع ومتطور لمعالجة التغذيات الحية' },
  { id: 'glm-5.3', name: 'glm-5.3', desc: 'صياغة جذابة ومتقنة مع تنظيم العناوين والنقاط' },
  { id: 'MiniMax-M3.1-Flash', name: 'MiniMax-M3.1-Flash', desc: 'استخراج سريع للبيانات والمواعيد الهامة' },
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
