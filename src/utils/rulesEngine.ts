import type { ForwardRule, MessageSimulationResult, AdReplacementConfig } from '../types/index.ts';

/**
 * Removes Arabic diacritics (tashkeel) and normalizes common letter variations
 * to ensure accurate Arabic keyword matching.
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    // Remove diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Alef variants: أ, إ, آ, ٱ -> ا
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Ya: ى -> ي
    .replace(/ى/g, 'ي')
    .trim();
}

/**
 * Validates a Telegram Bot Token format:
 * Typically <number>:<35 characters of base64/url-safe alphanumeric>
 */
export function validateBotToken(token: string): { valid: boolean; error?: string } {
  const trimmed = token.trim();
  if (!trimmed) {
    return { valid: false, error: 'الرجاء إدخال توكن البوت' };
  }
  const tokenRegex = /^\d{8,12}:[A-Za-z0-9_-]{35}$/;
  if (!tokenRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'تنسيق التوكن غير صالح. يجب أن يكون بالصيغة: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ (رقم متبوع بنقطتين ثم 35 حرفاً)',
    };
  }
  return { valid: true };
}

/**
 * Validates Telegram Admin ID:
 * Usually a 6-12 digit integer (positive)
 */
export function validateAdminId(adminId: string): { valid: boolean; error?: string } {
  const trimmed = adminId.trim();
  if (!trimmed) {
    return { valid: false, error: 'الرجاء إدخال معرف الآدمن' };
  }
  const idRegex = /^\d{5,14}$/;
  if (!idRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'معرف الآدمن يجب أن يكون رقماً صحيحاً (مثل 7607633343)، يمكنك الحصول عليه عبر بوت @userinfobot',
    };
  }
  return { valid: true };
}

/**
 * Detects if a post is a competitor promotional ad
 */
export function isCompetitorAd(text: string, adKeywords: string[]): boolean {
  if (!text || adKeywords.length === 0) return false;
  const normalizedText = normalizeArabicText(text.toLowerCase());
  return adKeywords.some((keyword) => {
    const normKw = normalizeArabicText(keyword.toLowerCase());
    return normKw && normalizedText.includes(normKw);
  });
}

/**
 * Evaluates whether text matches the keywords specified in the rule
 */
export function matchKeywords(
  text: string,
  keywords: string[],
  matchType: 'all' | 'any' | 'none',
  caseSensitive: boolean = false
): { matched: boolean; matchedList: string[] } {
  if (matchType === 'none' || keywords.length === 0) {
    return { matched: true, matchedList: [] };
  }

  const cleanKeywords = keywords.map((k) => k.trim()).filter((k) => k.length > 0);
  if (cleanKeywords.length === 0) {
    return { matched: true, matchedList: [] };
  }

  const targetText = caseSensitive ? text : text.toLowerCase();
  const normalizedTarget = normalizeArabicText(targetText);

  const matchedList: string[] = [];

  for (const rawKw of cleanKeywords) {
    const kw = caseSensitive ? rawKw : rawKw.toLowerCase();
    const normalizedKw = normalizeArabicText(kw);

    const hit =
      targetText.includes(kw) ||
      (normalizedTarget && normalizedKw && normalizedTarget.includes(normalizedKw));

    if (hit) {
      matchedList.push(rawKw);
    }
  }

  if (matchType === 'all') {
    return {
      matched: matchedList.length === cleanKeywords.length,
      matchedList,
    };
  } else {
    return {
      matched: matchedList.length > 0,
      matchedList,
    };
  }
}

/**
 * Checks if any blacklisted keyword exists in the text
 */
export function checkBlacklist(
  text: string,
  blacklist: string[],
  caseSensitive: boolean = false
): { blocked: boolean; triggeredList: string[] } {
  const cleanBlacklist = blacklist.map((b) => b.trim()).filter((b) => b.length > 0);
  if (cleanBlacklist.length === 0) {
    return { blocked: false, triggeredList: [] };
  }

  const targetText = caseSensitive ? text : text.toLowerCase();
  const normalizedTarget = normalizeArabicText(targetText);
  const triggeredList: string[] = [];

  for (const rawWord of cleanBlacklist) {
    const word = caseSensitive ? rawWord : rawWord.toLowerCase();
    const normalizedWord = normalizeArabicText(word);

    const hit =
      targetText.includes(word) ||
      (normalizedTarget && normalizedWord && normalizedTarget.includes(normalizedWord));

    if (hit) {
      triggeredList.push(rawWord);
    }
  }

  return {
    blocked: triggeredList.length > 0,
    triggeredList,
  };
}

/**
 * Transforms text according to rule specifications:
 * - Link removals
 * - Username removals
 * - Custom find & replace
 * - Signature appending
 */
export function transformMessageText(text: string, rule: ForwardRule): string {
  let result = text;

  // 1. Remove URLs if requested
  if (rule.removeLinks) {
    result = result.replace(/(https?:\/\/[^\s]+|t\.me\/[^\s]+|telegram\.me\/[^\s]+)/gi, '').trim();
  }

  // 2. Remove @usernames if requested
  if (rule.removeUsernames) {
    result = result.replace(/@[a-zA-Z0-9_]{4,32}\b/g, '').trim();
  }

  // 3. Custom find & replace
  if (rule.replaceRules && rule.replaceRules.length > 0) {
    for (const item of rule.replaceRules) {
      if (item.find && item.find.trim()) {
        try {
          const findPattern = new RegExp(escapeRegExp(item.find), 'gi');
          result = result.replace(findPattern, item.replaceWith || '');
        } catch {
          result = result.split(item.find).join(item.replaceWith || '');
        }
      }
    }
  }

  // 4. Custom signature appending
  if (rule.customSignature && rule.customSignature.trim()) {
    result = result + '\n\n' + rule.customSignature.trim();
  }

  return result.trim();
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Simulates message forwarding with Smart Ad Replacement support
 */
export function simulateMessageForward(
  text: string,
  rule: ForwardRule,
  adConfig?: AdReplacementConfig,
  mediaType?: 'text' | 'photo' | 'video' | 'document' | 'audio'
): MessageSimulationResult {
  const currentMediaType = mediaType || 'text';

  // 1. Check if it's a competitor ad and replace with custom ad if enabled
  if (adConfig && adConfig.enabled) {
    const isAd = isCompetitorAd(text, adConfig.adDetectionKeywords);
    if (isAd) {
      const replacedAdText = adConfig.customStudentAd.trim();
      return {
        accepted: true,
        reason: 'تم رصد إعلان ترويجي في المصدر، وتم استبداله بنجاح بإعلان خدماتك الطلابية الخاصة بك! 🎯',
        originalText: text,
        transformedText: replacedAdText,
        matchedKeywords: ['إعلان تم استبداله'],
        triggeredBlacklist: [],
        mediaAllowed: true,
        isAdReplaced: true,
      };
    }
  }

  // 2. Media check
  let mediaAllowed = true;
  if (currentMediaType === 'text' && !rule.mediaFilter.allowText) mediaAllowed = false;
  if (currentMediaType === 'photo' && !rule.mediaFilter.allowPhotos) mediaAllowed = false;
  if (currentMediaType === 'video' && !rule.mediaFilter.allowVideos) mediaAllowed = false;
  if (currentMediaType === 'document' && !rule.mediaFilter.allowDocuments) mediaAllowed = false;
  if (currentMediaType === 'audio' && !rule.mediaFilter.allowAudio) mediaAllowed = false;

  if (!mediaAllowed) {
    return {
      accepted: false,
      reason: `نوع الوسائط (${currentMediaType}) غير مسموح به في إعدادات القاعدة`,
      originalText: text,
      transformedText: text,
      matchedKeywords: [],
      triggeredBlacklist: [],
      mediaAllowed: false,
    };
  }

  // 3. Blacklist check
  const blacklistResult = checkBlacklist(text, rule.blacklistKeywords, rule.caseSensitive);
  if (blacklistResult.blocked) {
    return {
      accepted: false,
      reason: `تم استبعاد الرسالة لاحتوائها على كلمات محظورة: [${blacklistResult.triggeredList.join(', ')}]`,
      originalText: text,
      transformedText: text,
      matchedKeywords: [],
      triggeredBlacklist: blacklistResult.triggeredList,
      mediaAllowed: true,
    };
  }

  // 4. Keywords check
  const keywordResult = matchKeywords(text, rule.keywords, rule.matchType, rule.caseSensitive);
  if (!keywordResult.matched) {
    return {
      accepted: false,
      reason:
        rule.matchType === 'all'
          ? 'الرسالة لا تحتوي على جميع الكلمات المفتاحية المطلوبة'
          : 'الرسالة لا تحتوي على أي من الكلمات المفتاحية المحددة',
      originalText: text,
      transformedText: text,
      matchedKeywords: keywordResult.matchedList,
      triggeredBlacklist: [],
      mediaAllowed: true,
    };
  }

  // 5. Message is accepted -> apply transformations
  const transformedText = transformMessageText(text, rule);

  return {
    accepted: true,
    reason:
      keywordResult.matchedList.length > 0
        ? `تم قبول الرسالة ومطابقة الكلمات: [${keywordResult.matchedList.join(', ')}]`
        : 'تم قبول الرسالة (توجيه عام دون شرط الكلمات)',
    originalText: text,
    transformedText,
    matchedKeywords: keywordResult.matchedList,
    triggeredBlacklist: [],
    mediaAllowed: true,
    isAdReplaced: false,
  };
}
