import React from 'react';
import { ShieldCheck, ExternalLink, Award, X, CheckCircle2, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseRightsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">وثيقة حماية الحقوق وترخيص البرمجية</h3>
              <p className="text-xs text-slate-400 mt-0.5">توثيق حقوق المطور الأصلي وترخيص الاستخدام والتطوير</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 my-5 text-sm leading-relaxed">
          {/* Main Attribution Notice */}
          <div className="p-4 bg-sky-950/40 border border-sky-800/50 rounded-xl">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sky-200 text-base mb-1">نسب العمل للمطور الأصلي (Original Attribution)</h4>
                <p className="text-slate-300 text-xs sm:text-sm">
                  تم بناء هذا النظام وتطويره استناداً إلى المشروع مفتوح المصدر 
                  <strong className="text-white mx-1 font-mono">Telegram-Autoforwarder</strong>
                  المطور بواسطة:
                  <strong className="text-sky-300 mx-1">Redian Marku</strong>.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <a
                    href="https://github.com/redianmarku/Telegram-Autoforwarder"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs rounded-lg border border-sky-500/40 font-mono transition-colors"
                  >
                    <span>github.com/redianmarku/Telegram-Autoforwarder</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Compliance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>حماية الترخيص المفتوح (MIT)</span>
              </div>
              <p className="text-xs text-slate-300">
                المشروع الأصلي مرخص تحت ترخيص MIT، والذي يمنح الحق القانوني الكامل للاستخدام، التعديل، الدمج، والنشر، شريطة تضمين إشعار حقوق النشر الأصلي.
              </p>
            </div>

            <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1 text-xs sm:text-sm">
                <Lock className="w-4 h-4 shrink-0" />
                <span>حماية الاعتمادات والأمان</span>
              </div>
              <p className="text-xs text-slate-300">
                بيانات توكن البوت والآدمن وAPI تيليجرام لا يتم تخزينها خارج متصفحك أو جهازك الشخصي، وتُحقن في السكريبت محلياً دون تسريب.
              </p>
            </div>
          </div>

          {/* Full Original MIT License */}
          <div>
            <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
              <span>نص ترخيص MIT الأصلي (The MIT License):</span>
            </h4>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-400 overflow-x-auto text-left" dir="ltr">
              <p className="font-semibold text-slate-300 mb-2">MIT License</p>
              <p className="text-slate-400 mb-2">Copyright (c) 2024 Redian Marku</p>
              <p className="mb-2">
                Permission is hereby granted, free of charge, to any person obtaining a copy
                of this software and associated documentation files (the &quot;Software&quot;), to deal
                in the Software without restriction, including without limitation the rights
                to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                copies of the Software, and to permit persons to whom the Software is
                furnished to do so, subject to the following conditions:
              </p>
              <p className="mb-2">
                The above copyright notice and this permission notice shall be included in all
                copies or substantial portions of the Software.
              </p>
              <p className="text-slate-500 italic">
                THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                SOFTWARE.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-sky-600/20"
          >
            فهمت وموافق
          </button>
        </div>
      </div>
    </div>
  );
};
