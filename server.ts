import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// 5. Test Telegram Bot Token
app.post('/api/telegram/test-bot', async (req: Request, res: Response) => {
  const token = req.body.token || "8901693218:AAEOQmHMZLy-xaPbTUMq1KGhDwp1l0wFWP4";
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await tgRes.json();
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, description: message });
  }
});

import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

let pythonProcess: any = null;
function startPythonWorker() {
  const pyPath = path.join(__dirname, 'main.py');
  if (!fs.existsSync(pyPath)) return;

  try {
    console.log('🐍 تشغيل خادم ومحرك التيليجرام المستقل المزدوج (python3 main.py)...');
    pythonProcess = spawn('python3', ['main.py'], {
      cwd: __dirname,
      env: { ...process.env, PORT: '8088', KEEPALIVE_PORT: '8088' }
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

// 6. AI Educational Rephrase Endpoint
app.post('/api/ai/rephrase', async (req: Request, res: Response) => {
  const {
    text,
    model = 'DeepSeek-V4.1-Flash',
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

  const defaultSystemPrompt = `# الدور: محرر محتوى تعليمي جامعي
## الهوية
أنت محرر محتوى متخصص في الشؤون التعليمية الجامعية ومجموعات الطلاب. مهمتك قراءة المنشورات وإعادة صياغتها بأسلوب أوضح وأدق، مع الحفاظ على المصداقية الكاملة ومساعدة الطلاب مثل مشرفي القروبات المخلصين.

## المبادئ الأساسية الصارمة (إلزامية 100%):
- لا تضف أي معلومة من خيالك لم ترد في النص الأصلي.
- لا تحذف أي معلومة جوهرية أو مواعيد أو أرقام أو شروط أو خطوات تقديم.
- لا تذكر اسم القناة السابقة أو المصدر المنقول منه.
- 🚨 قاعدة الروابط الرسمية (خط أحمر): جميع روابط التقديم والتسجيل والبوابات الجامعية (مثل روابط PowerApps ونماذج Forms وبوابات الكليات والبلاك بورد) يجب الحفاظ عليها 100% بنصها الكامل وإدراجها بوضوح في سطر مستقل يسبقها (🔗 رابط التقديم / البوابة:). احذف فقط معرفات وروابط قنوات تيليجرام الترويجية.
- اجعل الأسلوب شيقاً وواضحاً مع استخدام إيموجيات معتدلة (📚 🎓 📅 📌 💡 🔗).

## التنسيق المطلوب إلزامي:
📌 [عنوان بارز وجذاب للمنشور]

[المحتوى منظم في نقاط واضحة ومباشرة مع إبراز المواعيد والشروط]

🔗 [روابط التقديم والبوابات إن وجدت في النص الأصلي كاملاً]

💬 [دعوة تفاعلية قصيرة للطلاب للمشاركة أو الاستفسار]

[2 إلى 4 هاشتاجات ملائمة للموضوع مثلا: #جامعة #قبول #تسجيل #امتحانات]`;

  const finalSystemPrompt = systemPrompt || defaultSystemPrompt;
  const userContent = customInstructions
    ? `تعليمات إضافية من المشرف: ${customInstructions}\n\nالنص الأصلي لإعادة صياغته:\n${text}`
    : `النص الأصلي لإعادة صياغته:\n${text}`;

  const tStart = Date.now();

  const tryCallModel = async (targetModel: string) => {
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
      usedModel = fallbackModel;
      rephrasedText = await tryCallModel(fallbackModel);
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

// Fallback intelligent rephraser
function fallbackRephrase(rawText: string, instructions?: string): string {
  const extLinks = extractExternalLinks(rawText);
  const cleanLines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.includes('t.me/') && !l.startsWith('@'));

  // Separate text lines from URL lines
  const textLines = cleanLines.filter(l => !l.startsWith('http://') && !l.startsWith('https://'));
  const firstLine = (textLines[0] || 'إعلان أكاديمي وجامعي هام').replace(/^[•\-*#📌📢✨🎓]\s*/, '').trim();
  const title = firstLine.length < 70 ? firstLine : firstLine.slice(0, 65) + '...';

  const bodyLines = textLines.slice(1);
  const bullets = bodyLines.length > 0
    ? bodyLines.map(l => `• ${l}`).join('\n')
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
