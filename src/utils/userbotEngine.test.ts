import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateApiId,
  validateApiHash,
  validateStringSession,
  getBotVsUserBotComparison,
  generateTelethonUserBotCode,
  generateStringSessionScript,
} from './userbotEngine.ts';
import type { BotConfig, SourceItem } from '../types/index.ts';

const mockConfig: BotConfig = {
  botToken: '8901693218:AAEOQmHMZLy-xaPbTUMq1KGhDwp1l0wFWP4',
  adminId: '7607633343',
  adminUsername: 'M_S_F_G',
  additionalAdminIds: [],
  targetChannels: ['@MyUniversityChannel', '@SecondTargetChannel'],
  notifyAdminOnForward: true,
  enableTelegramAdminCommands: true,
  preferredEngine: 'userbot',
  ai: {
    apiBase: 'https://api.hcnsec.cn/v1',
    apiKey: 'sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii',
    primaryModel: 'DeepSeek-V4.1-Flash',
    fallbackModel: 'auto',
    systemPrompt: 'أنت محرر محتوى طلابي',
    customInstructions: 'نسق المنشور بنقاط',
    enableWebSearch: true,
  },
  adReplacement: {
    enabled: true,
    adDetectionKeywords: ['حل واجبات', 'بحوث تخرج'],
    customStudentAd: 'تواصل مع @M_S_F_G لخدمات الطلاب',
  },
  telethon: {
    apiId: '20123456',
    apiHash: 'abcdef0123456789abcdef0123456789',
    phoneNumber: '+966501234567',
    sessionName: 'session_userbot',
    stringSession: '1BVtsOHMBux4k6Fm...sampleStringSessionLongValueAbove50Chars...',
    library: 'telethon',
  },
  mediaHandling: {
    downloadPhotos: true,
    downloadVideos: true,
    downloadDocuments: true,
  },
};

const mockSources: SourceItem[] = [
  {
    id: 's1',
    type: 'telegram',
    target: '@KSU_News',
    title: 'أخبار جامعة الملك سعود',
    priority: 'high',
    rule: 'official',
    keywords: ['قبول'],
    blacklist: [],
    enabled: true,
    lastPostId: '100',
  },
];

test('validateApiId checks valid and invalid numbers', () => {
  assert.equal(validateApiId('20123456').valid, true);
  assert.equal(validateApiId('').valid, false);
  assert.equal(validateApiId('abc').valid, false);
  assert.equal(validateApiId('12').valid, false);
});

test('validateApiHash checks 32-character hexadecimal', () => {
  assert.equal(validateApiHash('abcdef0123456789abcdef0123456789').valid, true);
  assert.equal(validateApiHash('ABCDEF0123456789ABCDEF0123456789').valid, true);
  assert.equal(validateApiHash('too_short').valid, false);
  assert.equal(validateApiHash('not_hex_0123456789abcdef0123456789zz').valid, false);
});

test('validateStringSession validates session strings', () => {
  const longTelethonSession = '1' + 'A'.repeat(320);
  assert.equal(validateStringSession(longTelethonSession).valid, true);
  assert.equal(validateStringSession(longTelethonSession).library, 'telethon');
  assert.equal(validateStringSession('short').valid, false);
});

test('getBotVsUserBotComparison explains why bots cannot read channels', () => {
  const comp = getBotVsUserBotComparison();
  assert.equal(comp.botApiReasons.length >= 3, true);
  assert.equal(comp.userBotAdvantages.length >= 4, true);
  assert.equal(comp.widgetExplanation.includes('Telegram Widget'), true);
});

test('generateTelethonUserBotCode generates complete script with exact AI credentials and models', () => {
  const code = generateTelethonUserBotCode(mockConfig, mockSources);
  assert.equal(code.includes('https://api.hcnsec.cn/v1/chat/completions'), true);
  assert.equal(code.includes('sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii'), true);
  assert.equal(code.includes('DeepSeek-V4.1-Flash'), true);
  assert.equal(code.includes('@KSU_News'), true);
  assert.equal(code.includes('@MyUniversityChannel'), true);
  assert.equal(code.includes('TelegramClient'), true);
  assert.equal(code.includes('StringSession'), true);
  assert.equal(code.includes('send_file'), true);
});

test('generateStringSessionScript produces helper generator', () => {
  const script = generateStringSessionScript();
  assert.equal(script.includes('client.session.save()'), true);
  assert.equal(script.includes('StringSession'), true);
});
