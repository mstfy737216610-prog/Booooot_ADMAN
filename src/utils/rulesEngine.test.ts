import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeArabicText,
  validateBotToken,
  validateAdminId,
  matchKeywords,
  checkBlacklist,
  transformMessageText,
  simulateMessageForward,
  isCompetitorAd,
} from './rulesEngine.ts';
import type { ForwardRule, AdReplacementConfig } from '../types/index.ts';

const sampleRule: ForwardRule = {
  id: 'rule-1',
  name: 'قاعدة الأخبار التقنية',
  enabled: true,
  sourceChatId: '-100111111111',
  destinationChatId: '-100222222222',
  matchType: 'any',
  keywords: ['تيليجرام', 'تحديث', 'عاجل'],
  blacklistKeywords: ['إعلان ممول', 'سبام', 'اشترك الآن'],
  caseSensitive: false,
  replaceRules: [
    { find: 'قناة سابقة', replaceWith: 'قناتنا الرسمية' },
  ],
  removeLinks: true,
  removeUsernames: true,
  customSignature: '⚡️ تم النقل عبر بوت التوجيه الآلي',
  forwardMode: 'copy',
  delaySeconds: 1,
  mediaFilter: {
    allowText: true,
    allowPhotos: true,
    allowVideos: true,
    allowDocuments: true,
    allowAudio: true,
  },
};

const sampleAdConfig: AdReplacementConfig = {
  enabled: true,
  adDetectionKeywords: ['إعلان مدفوع', 'ترويج لخدمات طلابية', 'حل واجبات', 'بحوث تخرج'],
  customStudentAd: '🎓 خدمات طلابية معتمدة: نساعدكم في البحوث والمشاريع الأكاديمية بأعلى دقة! تواصل معنا عبر @M_S_F_G',
};

test('Arabic text normalization handles diacritics and Alef variations', () => {
  const raw = 'أَخْبَار تِيلِيجْرَام العَاجِلَة';
  const normalized = normalizeArabicText(raw);
  assert.equal(normalized.includes('تيل'), true);
  assert.equal(normalizeArabicText('إعلان'), 'اعلان');
  assert.equal(normalizeArabicText('آبل'), 'ابل');
});

test('Validates User Bot Token strictly', () => {
  const userToken = '8901693218:AAEOQmHMZLy-xaPbTUMq1KGhDwp1l0wFWP4';
  assert.equal(validateBotToken(userToken).valid, true);

  const invalidToken = '1234:short';
  assert.equal(validateBotToken(invalidToken).valid, false);
});

test('Validates User Admin ID (7607633343)', () => {
  const userAdminId = '7607633343';
  assert.equal(validateAdminId(userAdminId).valid, true);
  assert.equal(validateAdminId('abc').valid, false);
});

test('Detects competitor ads correctly', () => {
  const adMessage = 'نقدم لكم ترويج لخدمات طلابية وحل واجبات جامعية بأفضل الأسعار!';
  assert.equal(isCompetitorAd(adMessage, sampleAdConfig.adDetectionKeywords), true);

  const normalMessage = 'تعلن عمادة القبول والتسجيل عن نتائج الفصل الدراسي الأول.';
  assert.equal(isCompetitorAd(normalMessage, sampleAdConfig.adDetectionKeywords), false);
});

test('Replaces competitor ads with custom student services ad', () => {
  const adMessage = 'ترويج لخدمات طلابية وبحوث تخرج سريعة';
  const result = simulateMessageForward(adMessage, sampleRule, sampleAdConfig);

  assert.equal(result.accepted, true);
  assert.equal(result.isAdReplaced, true);
  assert.equal(result.transformedText.includes('خدمات طلابية معتمدة'), true);
  assert.equal(result.transformedText.includes('@M_S_F_G'), true);
});

test('Transforms message text: removes links, usernames, replaces text and adds signature', () => {
  const raw = 'تابعوا قناة سابقة عبر https://t.me/example ورابط @old_channel للمزيد!';
  const transformed = transformMessageText(raw, sampleRule);

  assert.equal(transformed.includes('https://t.me/example'), false);
  assert.equal(transformed.includes('@old_channel'), false);
  assert.equal(transformed.includes('قناتنا الرسمية'), true);
  assert.equal(transformed.includes('⚡️ تم النقل عبر بوت التوجيه الآلي'), true);
});
