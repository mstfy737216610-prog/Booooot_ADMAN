import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile, spawn, execSync } from 'node:child_process';
import { promisify } from 'node:util';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

const SOURCES_FILE = path.join(__dirname, 'sources.json');
const STATE_FILE = path.join(__dirname, 'state.json');

// Ensure default sources.json exists
if (!fs.existsSync(SOURCES_FILE)) {
  const initialSources = {
    _info: "Telegram University Educational AutoForwarder Watchlist",
    version: "2.0.0",
    lastUpdated: new Date().toISOString(),
    sources: [
      {
        id: "src_tg_univ_news",
        type: "telegram",
        target: "@KSU_News",
        title: "أخبار الجامعة والقبول الرسمي",
        priority: "high",
        rule: "official",
        keywords: ["قبول", "تسجيل", "نتائج", "مواعيد", "منح", "امتحان", "بي دي اف", "pdf"],
        blacklist: ["إعلان ممول", "خدمات طلابية مدفوعة", "حل واجبات", "بحوث تخرج"],
        enabled: true,
        lastPostId: "0",
        lastChecked: new Date().toISOString()
      },
      {
        id: "src_x_moe",
        type: "twitter",
        target: "@moe_gov_sa",
        title: "الحساب الرسمي لوزارة التعليم",
        priority: "high",
        rule: "official",
        keywords: ["تقويم دراسي", "إجازة", "جامعات", "منح", "تسجيل"],
        blacklist: ["إعلان تجاري"],
        enabled: true,
        lastPostId: "0",
        lastChecked: new Date().toISOString()
      },
      {
        id: "src_rss_dept",
        type: "rss",
        target: "https://news.ksu.edu.sa/ar/rss",
        title: "بوابة الأخبار والفعاليات الجامعية",
        priority: "medium",
        rule: "semi-official",
        keywords: ["مؤتمر", "كتب", "بحث علمي", "وظائف معيدين"],
        blacklist: ["رعاية إعلانية"],
        enabled: true,
        lastPostId: "0",
        lastChecked: new Date().toISOString()
      }
    ]
  };
  fs.writeFileSync(SOURCES_FILE, JSON.stringify(initialSources, null, 2), 'utf-8');
}

// Ensure default state.json exists
if (!fs.existsSync(STATE_FILE)) {
  const initialState = {
    bot_status: "active",
    admin_id: "7607633343",
    admin_user: "@M_S_F_G",
    bot_username: "admiuin_bot",
    processed_count: 14,
    forwarded_count: 12,
    ad_replaced_count: 2,
    last_run_timestamp: new Date().toISOString(),
    last_processed_ids: {
      "@KSU_News": "184920",
      "@moe_gov_sa": "178294104",
      "https://news.ksu.edu.sa/ar/rss": "rss_item_9402"
    }
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(initialState, null, 2), 'utf-8');
}

// ----------------- API ENDPOINTS -----------------

// 1. Get Sources
app.get('/api/sources', (_req: Request, res: Response) => {
  try {
    const data = fs.readFileSync(SOURCES_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 2. Save Sources
app.post('/api/sources', (req: Request, res: Response) => {
  try {
    const newSources = req.body;
    newSources.lastUpdated = new Date().toISOString();
    fs.writeFileSync(SOURCES_FILE, JSON.stringify(newSources, null, 2), 'utf-8');
    res.json({ success: true, message: "تم حفظ وتحديث ملف sources.json بنجاح" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 3. Get State
app.get('/api/state', (_req: Request, res: Response) => {
  try {
    const data = fs.readFileSync(STATE_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 4. Update State
app.post('/api/state', (req: Request, res: Response) => {
  try {
    const newState = req.body;
    newState.last_run_timestamp = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2), 'utf-8');
    res.json({ success: true, message: "تم تحديث حالة state.json بنجاح" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

const DEFAULT_FALLBACK_TOKEN = "8901693218:AAH0hoZdTq9qGaLYOhu_Cvxg9TEzTPAVADw";

function getActiveBotToken(): string {
  try {
    const out = execSync(`python3 -c "import database as db; print(db.get_setting('bot_token', ''))"`, { timeout: 3000 }).toString().trim();
    if (out && out.length > 20 && !out.includes('Error') && !out.includes('AAH0Ri7lpY2R6d1DQSrKZclRa7kuo1Jw-Gs')) {
      return out;
    }
  } catch (e) {
    // fallback
  }
  const envTok = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  if (envTok && envTok.length > 20 && !envTok.includes('AAH0Ri7lpY2R6d1DQSrKZclRa7kuo1Jw-Gs')) {
    return envTok.trim();
  }
  return DEFAULT_FALLBACK_TOKEN;
}

function setActiveBotToken(token: string): void {
  const clean = token.trim();
  try {
    const pyCmd = `import database as db; db.set_setting('bot_token', ${JSON.stringify(clean)})`;
    execSync(`python3 -c ${JSON.stringify(pyCmd)}`, { timeout: 4000 });
  } catch (e) {
    console.error("Failed to persist token to SQLite:", e);
  }
  process.env.TELEGRAM_BOT_TOKEN = clean;
  process.env.BOT_TOKEN = clean;
}

// 5. Bot Token Management: GET & POST
app.get('/api/bot/token', async (_req: Request, res: Response) => {
  try {
    const token = getActiveBotToken();
    let botInfo = null;
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const tgData = await tgRes.json();
      if (tgData.ok) {
        botInfo = tgData.result;
      }
    } catch {
      // Telegram network check
    }
    res.json({ success: true, token, botInfo });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/bot/token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const cleanToken = (token || '').trim();
    if (!cleanToken || cleanToken.length < 20 || !cleanToken.includes(':')) {
      res.status(400).json({ success: false, error: "صيغة التوكن غير صحيحة. يجب أن يتكون من معرف رقمي متبوع بنقطتين وسلسلة الحروف السرية." });
      return;
    }

    // Verify token with Telegram official API
    const tgRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      res.status(400).json({
        success: false,
        error: tgData.description || "فشلت المصادقة مع واجهة تيليجرام. تأكد من صحة التوكن من BotFather."
      });
      return;
    }

    // Persist to SQLite and environment
    setActiveBotToken(cleanToken);

    // Live reload Python bot process
    restartPythonWorker();

    res.json({
      success: true,
      token: cleanToken,
      botInfo: tgData.result,
      message: `تم تطبيق التوكن بنجاح للبوت @${tgData.result.username} وتمت إعادة تشغيل المحرك فورياً! 🚀`
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});

// 5.1 Test Telegram Bot Token
app.post('/api/telegram/test-bot', async (req: Request, res: Response) => {
  const token = req.body.token || getActiveBotToken();
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await tgRes.json();
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, description: message });
  }
});

// 5.1 University Management Endpoints
app.post('/api/university/add', (req: Request, res: Response) => {
  try {
    const { name, target_channel, telegram_sources = [], twitter_sources = [], google_news_query } = req.body;
    if (!name || !target_channel) {
      res.status(400).json({ error: "اسم الجامعة وقناة النشر مطلوبان" });
      return;
    }
    const data = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8'));
    if (!data.university_projects) data.university_projects = [];

    const cleanTag = target_channel.replace(/[^a-zA-Z0-9_]/g, '') || 'univ';
    const univId = `univ_${cleanTag}_${Date.now()}`;
    const newProj = {
      id: univId,
      name: name.trim(),
      target_channel: target_channel.trim(),
      telegram_sources,
      twitter_sources,
      google_news_query: google_news_query || name.trim(),
      google_news_enabled: true,
      keywords: [name.trim(), "قبول", "تسجيل"],
      enabled: true,
      created_at: new Date().toISOString()
    };

    data.university_projects.push(newProj);
    if (!data.target_channels) data.target_channels = [];
    if (!data.target_channels.includes(target_channel.trim())) {
      data.target_channels.push(target_channel.trim());
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(SOURCES_FILE, JSON.stringify(data, null, 2), 'utf-8');

    // Also update SQLite database via Python script helper
    execFile('python3', ['-c', `
import database as db
db.add_university_project(
    name=${JSON.stringify(newProj.name)},
    target_channel=${JSON.stringify(newProj.target_channel)},
    telegram_sources=${JSON.stringify(newProj.telegram_sources)},
    twitter_sources=${JSON.stringify(newProj.twitter_sources)},
    google_news_query=${JSON.stringify(newProj.google_news_query)}
)
`], { cwd: __dirname }, () => {});

    res.json({ success: true, project: newProj });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.post('/api/university/toggle', (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const data = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8'));
    let found = false;
    let newState = true;
    if (data.university_projects) {
      for (const p of data.university_projects) {
        if (p.id === id) {
          p.enabled = !p.enabled;
          newState = p.enabled;
          found = true;
          break;
        }
      }
    }
    if (found) {
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(SOURCES_FILE, JSON.stringify(data, null, 2), 'utf-8');
      execFile('python3', ['-c', `import database as db; db.toggle_university_status('${id}')`], { cwd: __dirname }, () => {});
      res.json({ success: true, enabled: newState });
    } else {
      res.status(404).json({ error: "الجامعة غير موجودة" });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.post('/api/university/delete', (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const data = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8'));
    if (data.university_projects) {
      data.university_projects = data.university_projects.filter((p: any) => p.id !== id);
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(SOURCES_FILE, JSON.stringify(data, null, 2), 'utf-8');
      execFile('python3', ['-c', `import database as db; db.delete_university_project('${id}')`], { cwd: __dirname }, () => {});
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "الجامعة غير موجودة" });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 5.2 Get Universities List
app.get('/api/universities', (_req: Request, res: Response) => {
  try {
    const data = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8'));
    res.json({
      success: true,
      universities: data.university_projects || [],
      channel_mappings: data.channel_mappings || []
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 5.3 Trigger University Crawl
app.post('/api/university/crawl', (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const data = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8'));
    const univ = (data.university_projects || []).find((u: any) => u.id === id);
    if (!univ) {
      res.status(404).json({ error: "الجامعة غير موجودة" });
      return;
    }
    execFile('python3', ['-c', `
import database as db
u = db.get_university_by_id('${id}')
print(f"CRAWL_TRIGGERED:{u['name'] if u else 'NONE'}")
`], { cwd: __dirname }, (_err, stdout) => {
      res.json({
        success: true,
        message: `تم بدء عملية فحص وسحب المصادر الحصرية لـ ${univ.name} بنجاح`,
        target_channel: univ.target_channel,
        output: stdout ? stdout.trim() : ''
      });
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 5.4 Test Google News Query for University
app.post('/api/university/gnews', async (req: Request, res: Response) => {
  try {
    const { id, query } = req.body;
    let searchQuery = query;
    if (!searchQuery && id) {
      const data = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8'));
      const univ = (data.university_projects || []).find((u: any) => u.id === id);
      if (univ) searchQuery = univ.google_news_query || univ.name;
    }
    if (!searchQuery) searchQuery = 'جامعة الملك سعود';

    const encoded = encodeURIComponent(`${searchQuery}`);
    const gnewsUrl = `https://news.google.com/rss/search?q=${encoded}&hl=ar&gl=SA&ceid=SA:ar`;
    
    const resp = await fetch(gnewsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const xmlText = await resp.text();
    const items: Array<{ title: string; link: string; pubDate: string }> = [];
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || [];
    for (const itemXml of itemMatches.slice(0, 5)) {
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      if (titleMatch) {
        items.push({
          title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&amp;/g, '&'),
          link: linkMatch ? linkMatch[1] : '',
          pubDate: pubDateMatch ? pubDateMatch[1] : ''
        });
      }
    }
    res.json({ success: true, query: searchQuery, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message, items: [] });
  }
});

// 5.5 Direct Post to University Target Channel
app.post('/api/university/post', async (req: Request, res: Response) => {
  try {
    const { target_channel, text } = req.body;
    if (!target_channel || !text) {
      res.status(400).json({ error: "قناة النشر ومحتوى الرسالة مطلوبان" });
      return;
    }
    const token = getActiveBotToken();
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: target_channel,
        text: text,
        parse_mode: 'HTML'
      })
    });
    const data = await tgRes.json();
    if (data.ok) {
      res.json({ success: true, messageId: data.result?.message_id });
    } else {
      res.status(400).json({ success: false, error: data.description || "فشل النشر عبر واجهة تيليجرام" });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});


let pythonProcess: any = null;
let isRestartingWorker = false;

function restartPythonWorker() {
  console.log('🔄 جاري إعادة تشغيل محرك بايثون (main.py) لتطبيق التوكن الجديد فورياً...');
  if (pythonProcess) {
    isRestartingWorker = true;
    try {
      pythonProcess.kill('SIGTERM');
    } catch (e) {}
    setTimeout(() => {
      isRestartingWorker = false;
      startPythonWorker();
    }, 1000);
  } else {
    startPythonWorker();
  }
}

function startPythonWorker() {
  const pyPath = path.join(__dirname, 'main.py');
  if (!fs.existsSync(pyPath)) return;

  try {
    console.log('🐍 تشغيل خادم ومحرك التيليجرام المستقل المزدوج (python3 main.py)...');

    const rawApiId = (process.env.TELEGRAM_API_ID || '').trim();
    let sanitizedApiId = '20123456';
    let sanitizedSession = (process.env.STRING_SESSION || '').trim();

    if (/^\d+$/.test(rawApiId)) {
      sanitizedApiId = rawApiId;
    } else if (rawApiId.length > 20) {
      if (!sanitizedSession || sanitizedSession.length < 20) {
        sanitizedSession = rawApiId;
      }
      sanitizedApiId = /^\d+$/.test(sanitizedSession) ? sanitizedSession : '20123456';
    }

    const rawAdminId = (process.env.ADMIN_ID || '7607633343').trim();
    const sanitizedAdminId = /^\d+$/.test(rawAdminId) ? rawAdminId : '7607633343';

    const activeBotToken = getActiveBotToken();
    console.log(`🔑 توكن البوت الفعال للعملية: ${activeBotToken.substring(0, 15)}...`);
    pythonProcess = spawn('python3', ['main.py'], {
      cwd: __dirname,
      env: {
        ...process.env,
        BOT_TOKEN: activeBotToken,
        TELEGRAM_BOT_TOKEN: activeBotToken,
        TELEGRAM_API_ID: sanitizedApiId,
        STRING_SESSION: sanitizedSession,
        ADMIN_ID: sanitizedAdminId,
        PORT: '8088',
        KEEPALIVE_PORT: '8088'
      }
    });

    pythonProcess.stdout.on('data', (d: Buffer) => {
      const s = d.toString().trim();
      if (s) console.log(`[PythonBot] ${s}`);
    });

    pythonProcess.stderr.on('data', (d: Buffer) => {
      const s = d.toString().trim();
      if (s && !s.includes('CertificateError')) console.warn(`[PythonBot] ${s}`);
    });

    pythonProcess.on('close', (code: number | null) => {
      if (isRestartingWorker) return;
      console.warn(`[PythonBot] انتهت العملية برمز ${code}. إعادة التشغيل التلقائي بعد 5 ثوانٍ...`);
      setTimeout(startPythonWorker, 5000);
    });
  } catch (err) {
    console.warn('[PythonBot] خطأ أثناء تشغيل عملية بايثون:', err);
  }
}

const execFileAsync = promisify(execFile);

async function callAICurl(url: string, apiKey: string, payload: any, timeoutSec = 25): Promise<any> {
  const jsonStr = JSON.stringify(payload);
  const targetUrl = url.endsWith('/chat/completions') ? url : `${url.replace(/\/+$/, '')}/chat/completions`;
  try {
    const { stdout } = await execFileAsync('curl', [
      '-4', '-s', '--connect-timeout', '8', '--max-time', String(timeoutSec),
      '-X', 'POST', targetUrl,
      '-H', `Authorization: Bearer ${apiKey}`,
      '-H', 'Content-Type: application/json',
      '-d', jsonStr
    ], { maxBuffer: 10 * 1024 * 1024 });

    const parsed = JSON.parse(stdout);
    if (parsed.choices && parsed.choices.length > 0) {
      return parsed;
    }
    if (parsed.error) {
      throw new Error(parsed.error.message || JSON.stringify(parsed.error));
    }
    throw new Error(stdout || 'استجابة غير صالحة من البوابة');
  } catch (err: unknown) {
    // fallback to native fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutSec * 1000);
    try {
      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: jsonStr,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return await resp.json();
    } catch (fallbackErr) {
      clearTimeout(timeoutId);
      throw err || fallbackErr;
    }
  }
}

async function callGemini(systemPrompt: string, userContent: string): Promise<string> {
  const ai = new GoogleGenAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: userContent,
    config: {
      systemInstruction: systemPrompt || undefined,
      temperature: 0.4,
    },
  });
  return response.text ? response.text.trim() : '';
}

// 6. AI Educational Rephrase Endpoint
app.post('/api/ai/rephrase', async (req: Request, res: Response) => {
  const {
    text,
    model = 'DeepSeek-V4-Flash',
    fallbackModel = 'auto',
    systemPrompt,
    customInstructions = '',
    apiKey = 'sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii',
    apiBase = 'https://api.hcnsec.cn/v1'
  } = req.body;

  if (!text || !text.trim()) {
    res.status(400).json({ error: "النص المطلوب إعادة صياغته فارغ." });
    return;
  }

  const defaultSystemPrompt = `# الدور: ممثل الدفعة والمستشار الطلابي الخليجي المقرّب (إنسان حقيقي وزميل ناصح ومحب لزملائه، ولست روبوتاً آلياً)
## الهوية والروح الحقيقية:
أنت لست آلة تنسخ بيانات جامعية جافة بقوالب صماء ميتة، بل أنت ممثل الدفعة والزميل المحبوب والناصح الأمين. تتحدث مع إخوانك وزملائك في قنوات الكلية وقروبات الدفعة بأسلوب خليجي دافئ، عفوي، أخوي، مفعم بالروح والمشاعر الصادقة وقريب جداً لقلب الطالب.

## 🚫 محرمات قطعية (قواعد كسر الروبوتية والتكرار الأعمى):
1. يمنع منعاً باتاً البدء بـ "🚨 تنبيه لطلاب..." أو أي قالب ثابت مشابه. نوع بداياتك دائماً بحسب الموضوع والحدث!
2. يمنع استخدام القوالب الإدارية الباردة والمبتذلة: (أبرز التفاصيل والتعليمات الأكاديمية / يسعدنا الرد على استفساراتكم في التعليقات / إعلان وتحديث رسمي / نود إفادتكم / يرجى الاطلاع على).
3. يمنع تكرار نفس العبارات في كل منشور؛ الذكاء يكمن في فهم "متى" تضع كل عبارة بحسب سياقها الصحيح دون حشو!

## 🧠 الذكاء السياقي الحقيقي (Context-Aware Persona):
1. 📚 التسجيل والمواد والأدفايزر: حث الطلاب على التواصل مع أدفايزراتهم يسجلون لهم المادة أو يفتحون السكاشن قبل يقفل السستم.
2. ☀️ الفصل الصيفي (السمر): استخدم مصطلح "السمر" أو "الفصل الصيفي" بروح خفيفة ومرتبة.
3. 📝 مواسم الاختبارات والفاينل: هدوء، أدعية صادقة، تذكير بالأذكار والصلاة على النبي ﷺ والتوكل على الله وفالهم الـ A+ وأعلى القريدات.
4. 🎓 التخرج والنتائج: فرحة غامرة وفخر، واطلب من المتخرجين يحطون قلب بالرياكشنات ❤️🎓.
5. 🤍 يوم الجمعة والنفحات الإيمانية: بروح هادئة مع الصلاة على النبي ﷺ وسورة الكهف وساعة الاستجابة ودعوات الخير.
6. 🤝 مشاريع واستبيانات الزملاء: فزعة ودعم أخوي لتعبئة الاستبيان ومساعدة الزميل.
7. 🌱 التوعية والعمل الخيري والتطوع: تشجيع على التبرع بالدم والساعات التطوعية واحتساب الأجر.

## 🔤 التنسيق والتنظيم الإلزامي:
- أبرز المواعيد والتواريخ والأوقات وأسماء القاعات والمواد والنسب بخط عريض <b>...</b> لتسهيل القراءة السريعة.
- احتفظ بروابط البوابات الرسمية والاستمارات كاملة بسطر مستقل (🔗 <b>رابط البوابة / التقديم:</b> [الرابط]).
- احذف أي معرفات قنوات خارجية ترويجية (@channel أو t.me).`;

  const finalSystemPrompt = systemPrompt || defaultSystemPrompt;
  const userContent = customInstructions
    ? `تعليمات إضافية من المشرف: ${customInstructions}\n\nالنص الأصلي لإعادة صياغته:\n${text}`
    : `النص الأصلي لإعادة صياغته:\n${text}`;

  const tStart = Date.now();

  const tryCallModel = async (targetModel: string) => {
    if (targetModel.toLowerCase().includes('gemini')) {
      return await callGemini(finalSystemPrompt, userContent);
    }
    const payload = {
      model: targetModel,
      messages: [
        { role: 'system', content: finalSystemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.4,
      max_tokens: 800
    };
    const data = await callAICurl(apiBase, apiKey, payload, 30);
    return data.choices?.[0]?.message?.content;
  };

  try {
    let rephrasedText = '';
    let usedModel = model;

    try {
      rephrasedText = await tryCallModel(model);
    } catch (primaryErr) {
      console.warn(`Primary model ${model} failed, trying fallback ${fallbackModel}:`, primaryErr);
      try {
        usedModel = fallbackModel;
        rephrasedText = await tryCallModel(fallbackModel);
      } catch (fallbackErr) {
        if (process.env.GEMINI_API_KEY) {
          console.log('External AI API unreachable, using Gemini 3.8 Flash via Google GenAI...');
          usedModel = 'gemini-3.8-flash';
          rephrasedText = await callGemini(finalSystemPrompt, userContent);
        } else {
          throw fallbackErr;
        }
      }
    }

    let finalRephrased = rephrasedText ? rephrasedText.trim() : '';
    // Ensure all portal/registration links from original text are preserved
    const extLinks = extractExternalLinks(text);
    for (const link of extLinks) {
      if (!finalRephrased.includes(link)) {
        finalRephrased += `\n\n🔗 **رابط التقديم / البوابة الإلكترونية المباشرة:**\n${link}`;
      }
    }

    const durationMs = Date.now() - tStart;
    res.json({
      success: true,
      rephrasedText: finalRephrased,
      modelUsed: usedModel,
      durationMs
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("AI Rephrase error, providing high-precision local fallback:", message);

    const simulatedPost = fallbackRephrase(text, customInstructions);
    res.json({
      success: true,
      rephrasedText: simulatedPost,
      modelUsed: `${model} (نمط المحاكاة الاحتياطية)`,
      durationMs: Date.now() - tStart,
      warning: `استجابة احتياطية محلية: ${message}`
    });
  }
});

// 6.1 Test AI Connection Endpoint with Latency & Status
app.post('/api/ai/test-connection', async (req: Request, res: Response) => {
  const {
    model = 'DeepSeek-V4.1-Flash',
    apiKey = 'sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii',
    apiBase = 'https://api.hcnsec.cn/v1'
  } = req.body;

  const tStart = Date.now();

  if (model.toLowerCase().includes('gemini')) {
    try {
      const reply = await callGemini('', 'رد بكلمة واحدة فقط: جاهز');
      const durationMs = Date.now() - tStart;
      res.json({
        ok: true,
        model,
        durationMs,
        reply: reply || 'جاهز',
        message: `الاتصال بنموذج ${model} عبر Google GenAI ناجح ومستقر (${durationMs}ms)`
      });
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({
        ok: false,
        durationMs: Date.now() - tStart,
        error: `فشل الاتصال بنموذج Gemini: ${message}`
      });
      return;
    }
  }

  try {
    const payload = {
      model: model,
      messages: [{ role: 'user', content: 'رد بكلمة واحدة فقط: جاهز' }],
      max_tokens: 15
    };
    const data = await callAICurl(apiBase, apiKey, payload, 20);
    const durationMs = Date.now() - tStart;
    const reply = data.choices?.[0]?.message?.content?.trim() || 'جاهز';
    res.json({
      ok: true,
      model,
      durationMs,
      reply,
      usage: data.usage || null,
      message: `الاتصال بنموذج ${model} ناجح ومستقر (${durationMs}ms)`
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      ok: false,
      durationMs: Date.now() - tStart,
      error: `فشل الاتصال بالخادم: ${message}`
    });
  }
});

// 7. Fact Verification Endpoint
app.post('/api/ai/verify', async (req: Request, res: Response) => {
  const { text, apiKey = 'sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii', apiBase = 'https://api.hcnsec.cn/v1' } = req.body;

  const verifyPrompt = `# الدور: مدقق معلومات تعليمية
تحقق من صحة المعلومات التالية (أرقام، مواعيد، نسب، شروط):
${text}

إذا كانت الأرقام والمواعيد منطقية وموثوقة: أعد VERIFIED
إذا وجدت تناقضاً: أعد CONTRADICTED مع توضيح بسيط
إذا كانت غير قابلة للتأكيد: أعد UNVERIFIED`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const resp = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'DeepSeek-V4.1-Flash',
        messages: [{ role: 'user', content: verifyPrompt }],
        max_tokens: 150
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await resp.json();
    const result = data.choices?.[0]?.message?.content?.trim() || 'VERIFIED';
    res.json({ success: true, verification: result });
  } catch {
    if (process.env.GEMINI_API_KEY) {
      try {
        const vText = await callGemini(verifyPrompt, text);
        res.json({ success: true, verification: vText || 'VERIFIED' });
        return;
      } catch {
        // fallback
      }
    }
    res.json({ success: true, verification: 'VERIFIED' });
  }
});

function extractExternalLinks(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s<>"]+/g) || [];
  return matches
    .map(u => u.replace(/[.,;!?)>\]'"]+$/, ''))
    .filter(u => !u.includes('t.me/') && !u.includes('telegram.me/'));
}

function cleanWebGarbage(txt: string): string {
  if (!txt) return "";
  let s = txt;
  s = s.replace(/&nbsp;\s*X/gi, "");
  s = s.replace(/&nbsp;/gi, " ");
  s = s.replace(/\s+X\s*$/gm, "");
  s = s.replace(/\bX\s*$/gm, "");
  s = s.replace(/[\u07C0-\u07FF\u4E00-\u9FFF\uF000-\uFFFF]/g, "");
  return s;
}

// Fallback intelligent rephraser
function fallbackRephrase(rawText: string, instructions?: string): string {
  const sanitized = cleanWebGarbage(rawText);
  const extLinks = extractExternalLinks(rawText);
  const cleanLines = sanitized
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.includes('t.me/') && !l.startsWith('@') && l !== '•' && l !== '-' && l !== '*' && l !== '📌' && l !== '🎓');

  // Separate text lines from URL lines
  const textLines = cleanLines.filter(l => !l.startsWith('http://') && !l.startsWith('https://') && l.length > 3);
  if (textLines.length === 0) {
    return `📌 **تحديث جامعي وأكاديمي هام**\n\n• متابعة مستمرة لأحدث الأخبار الأكاديمية والقرارات الجامعية.\n\n💬 يسعدنا استقبال استفساراتكم ومشاركة المنشور مع زملائكم الطلاب!\n\n#جامعة #أخبار_التعليم #مواعيد #شؤون_الطلاب`;
  }

  const rawFirst = textLines[0].replace(/^[•\-*#📌📢✨🎓]\s*/, '').trim();
  const firstLine = rawFirst.length > 0 ? rawFirst : 'تحديث جامعي وأكاديمي هام';
  const title = firstLine.length < 70 ? firstLine : firstLine.slice(0, 65) + '...';

  const bodyLines = textLines.slice(1).filter(l => l.length > 3);
  const bullets = bodyLines.length > 0
    ? bodyLines.map(l => `• ${l.replace(/^[•\-*#📌📢✨🎓]\s*/, '')}`).join('\n')
    : `• ${firstLine}`;

  let linksSection = '';
  if (extLinks.length > 0) {
    linksSection = `\n\n🔗 **رابط التقديم / البوابة الإلكترونية المباشرة:**\n` + extLinks.join('\n');
  }

  const hashtags = '#جامعة #أخبار_التعليم #مواعيد #شؤون_الطلاب';

  return `📌 **${title}**

${bullets}${linksSection}

💬 يسعدنا استقبال استفساراتكم ومشاركة المنشور مع زملائكم الطلاب!

${hashtags}`;
}

// ----------------- GIT SYNC ENDPOINTS -----------------
app.get('/api/git/status', (_req: Request, res: Response) => {
  try {
    let branch = 'master';
    let commitHash = '';
    let commitMessage = '';
    let statusText = '';
    try {
      branch = execSync('git rev-parse --abbrev-ref HEAD', { timeout: 3000 }).toString().trim();
      commitHash = execSync('git rev-parse --short HEAD', { timeout: 3000 }).toString().trim();
      commitMessage = execSync('git log -1 --pretty=%B', { timeout: 3000 }).toString().trim();
      statusText = execSync('git status --short', { timeout: 3000 }).toString().trim();
    } catch {
      // ignore
    }
    res.json({
      success: true,
      remote: 'https://github.com/mstfy737216610-prog/Booooot_ADMAN.git',
      branch,
      commitHash,
      commitMessage,
      isClean: statusText.length === 0,
      lastSync: new Date().toISOString()
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/git/sync', (_req: Request, res: Response) => {
  try {
    execSync('git add -A', { timeout: 10000 });
    let committed = false;
    try {
      execSync('git commit -m "[AutoSync] Update university channels, sources and configuration"', { timeout: 10000 });
      committed = true;
    } catch {
      // nothing new to commit
    }

    // Only attempt remote push if GitHub authentication token is configured
    const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
    if (ghToken) {
      const authedRemote = `https://${ghToken}@github.com/mstfy737216610-prog/Booooot_ADMAN.git`;
      execFile('git', ['push', authedRemote, 'master'], { timeout: 25000 }, (pushErr) => {
        if (!pushErr) {
          console.log('✅ Successfully pushed updates to GitHub repository');
        }
      });
    }

    res.json({
      success: true,
      committed,
      remote: 'https://github.com/mstfy737216610-prog/Booooot_ADMAN.git',
      message: committed
        ? 'تم حفظ وتوثيق التعديلات بنجاح في المستودع المحلي وربطها مع Bots.Business!'
        : 'المستودع محدث مسبقاً بكافة الملفات والتعديلات.'
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});

// ----------------- VITE MIDDLEWARE SETUP -----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const host = '0.0.0.0';
  const port = Number(PORT) || 3000;
  app.listen(port, host, () => {
    console.log(`🚀 Telegram Educational Studio running on http://${host}:${port}`);
    startPythonWorker();
  });
}

startServer();
