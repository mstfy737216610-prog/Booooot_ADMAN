import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Bot,
  ShieldCheck,
  Server,
  AlertCircle,
  Terminal,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export const DeploymentGuide: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const steps = [
    {
      title: '1. استخراج توكن البوت الجديد (Bot Token) من @BotFather',
      icon: <Bot className="w-4 h-4 text-sky-400" />,
      content: (
        <div className="space-y-2 text-xs leading-relaxed text-slate-300">
          <p>
            افتح تطبيق تيليجرام وابحث عن الحساب الرسمي لبوت الأب{' '}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 font-mono underline"
            >
              @BotFather
            </a>
            :
          </p>
          <ol className="list-decimal list-inside space-y-1 pr-2">
            <li>
              أرسل الأمر <code className="bg-slate-950 px-1.5 py-0.5 rounded text-sky-300 font-mono">/newbot</code>.
            </li>
            <li>أدخل اسماً لبوتك (مثال: Forwarder Bot).</li>
            <li>أدخل معرفاً ينتهي بكلمة bot (مثال: MyForwardPro_bot).</li>
            <li>
              سيعطيك BotFather التوكن بالصيغة: <code className="text-amber-300 font-mono">7123456789:ABCdefGhIJKlm...</code>.
            </li>
            <li>انسخ التوكن وضعه في خانة &quot;توكن البوت الجديد&quot; أعلاه.</li>
          </ol>
        </div>
      ),
    },
    {
      title: '2. معرفة الآدمن الجديد (Admin ID) لحمايتك ومنحك التحكم',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      content: (
        <div className="space-y-2 text-xs leading-relaxed text-slate-300">
          <p>معرف الآدمن هو رقم فريد يحدد هويتك في تيليجرام:</p>
          <ol className="list-decimal list-inside space-y-1 pr-2">
            <li>
              افتح بوت{' '}
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 font-mono underline"
              >
                @userinfobot
              </a>{' '}
              أو{' '}
              <a
                href="https://t.me/raw_data_bot"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 font-mono underline"
              >
                @raw_data_bot
              </a>
              .
            </li>
            <li>اضغط Start أو أرسل أي رسالة.</li>
            <li>
              سيرد البوت برقم هويتك (Id)، مثال: <code className="text-emerald-300 font-mono">542198762</code>.
            </li>
            <li>الصق هذا الرقم في خانة &quot;معرّف الآدمن الجديد&quot;.</li>
          </ol>
        </div>
      ),
    },
    {
      title: '3. تجهيز القنوات والمجموعات وإضافة البوت كمشرف (Admin)',
      icon: <HelpCircle className="w-4 h-4 text-indigo-400" />,
      content: (
        <div className="space-y-2 text-xs leading-relaxed text-slate-300">
          <p>لكي يتمكن البوت من قراءة الرسائل وإعادة نشرها في القنوات:</p>
          <ul className="list-disc list-inside space-y-1 pr-2">
            <li>
              <strong>القناة الهدف (Destination):</strong> أضف البوت إلى قناتك وامنحه صلاحية المشرف (Admin) مع إذن
              &quot;نشر الرسائل (Post Messages)&quot;.
            </li>
            <li>
              <strong>القناة المصدر (Source):</strong> إذا كانت قناتك أو تملك صلاحية، أضف البوت كمشرف ليتمكن من قراءة الرسائل.
            </li>
            <li>
              إذا كانت القناة المصدر عامة أو خاصة لا يمكنك إضافة بوت إليها، يمكنك استخدام{' '}
              <span className="text-indigo-400 font-semibold">وضع تليثون (حساب شخصي MTProto)</span> المتاح في التبويب أعلاه.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: '4. تشغيل السكريبت على سيرفر VPS يعمل 24/7 بدون انقطاع',
      icon: <Server className="w-4 h-4 text-purple-400" />,
      content: (
        <div className="space-y-2 text-xs leading-relaxed text-slate-300">
          <p>لتشغيل السكريبت بشكل دائم في الخلفية على خادم أوبونتو / لينكس:</p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 text-left" dir="ltr">
            <p className="text-slate-500"># تثبيت الشاشة والمكتبات</p>
            <p>sudo apt update && sudo apt install -y python3-pip screen</p>
            <p>pip install -r requirements.txt</p>
            <p className="text-slate-500 mt-2"># تشغيل السكريبت في جلسة خلفية منفصلة</p>
            <p className="text-emerald-400">screen -S telegram_forwarder</p>
            <p className="text-sky-300">python3 userbot_publisher.py</p>
            <p className="text-slate-500 mt-1"># اضغط Ctrl+A ثم D للخروج مع إبقاء السكريبت شغالاً</p>
          </div>
        </div>
      ),
    },
    {
      title: '5. تشغيل اليوزربوت على الهاتف عبر تطبيق Termux (خطوة بخطوة)',
      icon: <Terminal className="w-4 h-4 text-emerald-400" />,
      content: (
        <div className="space-y-2.5 text-xs leading-relaxed text-slate-300">
          <p>
            إذا كنت تريد تشغيل البوت مباشرة من هاتفك الأندرويد دون الحاجة لجهاز كمبيوتر أو سيرفر مدفوع:
          </p>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2 text-left" dir="ltr">
            <p className="text-slate-400 font-sans text-right">1. أمر التثبيت الشامل بضغطة واحدة في Termux:</p>
            <p className="text-emerald-400 bg-slate-900 p-2 rounded border border-slate-800">
              pkg update -y && pkg install -y python git && pip install telethon requests && termux-wake-lock
            </p>
            <p className="text-slate-400 font-sans text-right">2. سحب ملفات البوت:</p>
            <p className="text-sky-300 bg-slate-900 p-2 rounded border border-slate-800">
              git clone https://github.com/mstfy737216610-prog/Booooot_ADMAN.git && cd Booooot_ADMAN
            </p>
            <p className="text-slate-400 font-sans text-right">3. تشغيل اليوزربوت:</p>
            <p className="text-amber-300 bg-slate-900 p-2 rounded border border-slate-800">
              python userbot_publisher.py
            </p>
          </div>
          <p className="text-[11px] text-emerald-300 bg-emerald-950/20 p-2 rounded border border-emerald-800/40">
            ✓ عند أول تشغيل سيطلب رقم هاتفك وكود التأكيد، وسيتم حفظ الجلسة ويعمل البوت في الخلفية لسحب المنشورات وإعادة صياغتها ونشرها تلقائياً.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <BookOpen className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-white">دليل الإعداد والتشغيل السريع (خطوة بخطوة)</h2>
      </div>

      <div className="space-y-2.5">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full p-3.5 flex items-center justify-between text-right hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2.5 font-semibold text-xs sm:text-sm text-slate-200">
                {step.icon}
                <span>{step.title}</span>
              </div>
              {openIndex === idx ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openIndex === idx && (
              <div className="p-4 pt-1 border-t border-slate-800/80 bg-slate-950/70">
                {step.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
