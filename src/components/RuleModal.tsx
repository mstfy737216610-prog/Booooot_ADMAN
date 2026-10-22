import React, { useState, useEffect } from 'react';
import { ForwardRule } from '../types/index.ts';
import {
  X,
  Plus,
  Trash2,
  Sliders,
  Filter,
  FileText,
  ShieldAlert,
  Clock,
  Sparkles,
  Link,
  AtSign,
  Layers,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: ForwardRule) => void;
  initialRule?: ForwardRule | null;
}

export const RuleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialRule,
}) => {
  const [rule, setRule] = useState<ForwardRule>({
    id: '',
    name: 'قاعدة توجيه جديدة',
    enabled: true,
    sourceChatId: '',
    sourceChatTitle: '',
    destinationChatId: '',
    destinationChatTitle: '',
    matchType: 'any',
    keywords: [],
    blacklistKeywords: [],
    caseSensitive: false,
    replaceRules: [],
    removeLinks: false,
    removeUsernames: false,
    customSignature: '',
    forwardMode: 'copy',
    delaySeconds: 1,
    mediaFilter: {
      allowText: true,
      allowPhotos: true,
      allowVideos: true,
      allowDocuments: true,
      allowAudio: true,
    },
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [blacklistInput, setBlacklistInput] = useState('');
  const [newFind, setNewFind] = useState('');
  const [newReplace, setNewReplace] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRule) {
      setRule(initialRule);
    } else {
      setRule({
        id: 'rule_' + Date.now(),
        name: 'قاعدة توجيه جديدة',
        enabled: true,
        sourceChatId: '',
        destinationChatId: '',
        matchType: 'any',
        keywords: ['عاجل', 'هام'],
        blacklistKeywords: ['إعلان ممول', 'سبام'],
        caseSensitive: false,
        replaceRules: [],
        removeLinks: false,
        removeUsernames: false,
        customSignature: '⚡️ تم التوجيه عبر بوت النشر التلقائي',
        forwardMode: 'copy',
        delaySeconds: 1,
        mediaFilter: {
          allowText: true,
          allowPhotos: true,
          allowVideos: true,
          allowDocuments: true,
          allowAudio: true,
        },
      });
    }
    setError(null);
  }, [initialRule, isOpen]);

  if (!isOpen) return null;

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !rule.keywords.includes(trimmed)) {
      setRule({ ...rule, keywords: [...rule.keywords, trimmed] });
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setRule({
      ...rule,
      keywords: rule.keywords.filter((_, i) => i !== index),
    });
  };

  const handleAddBlacklist = () => {
    const trimmed = blacklistInput.trim();
    if (trimmed && !rule.blacklistKeywords.includes(trimmed)) {
      setRule({
        ...rule,
        blacklistKeywords: [...rule.blacklistKeywords, trimmed],
      });
      setBlacklistInput('');
    }
  };

  const handleRemoveBlacklist = (index: number) => {
    setRule({
      ...rule,
      blacklistKeywords: rule.blacklistKeywords.filter((_, i) => i !== index),
    });
  };

  const handleAddReplacement = () => {
    if (newFind.trim()) {
      setRule({
        ...rule,
        replaceRules: [
          ...rule.replaceRules,
          { find: newFind.trim(), replaceWith: newReplace.trim() },
        ],
      });
      setNewFind('');
      setNewReplace('');
    }
  };

  const handleRemoveReplacement = (index: number) => {
    setRule({
      ...rule,
      replaceRules: rule.replaceRules.filter((_, i) => i !== index),
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rule.sourceChatId.trim()) {
      setError('يرجى تحديد معرف القناة أو المجموعة المصدر');
      return;
    }
    if (!rule.destinationChatId.trim()) {
      setError('يرجى تحديد معرف القناة أو المجموعة الهدف');
      return;
    }
    onSave(rule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {initialRule ? 'تعديل قاعدة التوجيه' : 'إنشاء قاعدة توجيه ذكية جديدة'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديد المصدر والوجهة والكلمات المفتاحية والفلاتر والتوقيع
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Rule Name & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                اسم القاعدة
              </label>
              <input
                type="text"
                value={rule.name}
                onChange={(e) => setRule({ ...rule, name: e.target.value })}
                placeholder="مثال: توجيه الأخبار التقنية العاجلة"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                حالة التفعيل
              </label>
              <button
                type="button"
                onClick={() => setRule({ ...rule, enabled: !rule.enabled })}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  rule.enabled
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {rule.enabled ? '🟢 مفعلة ونشطة' : '⚪️ معطلة مؤقتاً'}
              </button>
            </div>
          </div>

          {/* Source and Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                القناة/المجموعة المصدر (Source Chat) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={rule.sourceChatId}
                onChange={(e) => setRule({ ...rule, sourceChatId: e.target.value.trim() })}
                placeholder="مثال: -1001234567890 أو @source_channel"
                dir="ltr"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                أدخل معرف القناة الرقمي مع -100 أو المعرف العام @
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                القناة/المجموعة الهدف (Destination) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={rule.destinationChatId}
                onChange={(e) => setRule({ ...rule, destinationChatId: e.target.value.trim() })}
                placeholder="مثال: -1009876543210 أو @target_channel"
                dir="ltr"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                القناة التي سيتم إرسال الرسائل المعاد توجيهها إليها
              </span>
            </div>
          </div>

          {/* Matching Strategy & Keywords */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-sky-400" />
                <span>الكلمات المفتاحية المطلوبة للتوجيه (Whitelist)</span>
              </label>

              {/* Match type pills */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setRule({ ...rule, matchType: 'any' })}
                  className={`px-2 py-0.5 rounded ${
                    rule.matchType === 'any' ? 'bg-sky-600 text-white' : 'text-slate-400'
                  }`}
                >
                  أي كلمة (Any)
                </button>
                <button
                  type="button"
                  onClick={() => setRule({ ...rule, matchType: 'all' })}
                  className={`px-2 py-0.5 rounded ${
                    rule.matchType === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400'
                  }`}
                >
                  جميع الكلمات (All)
                </button>
                <button
                  type="button"
                  onClick={() => setRule({ ...rule, matchType: 'none' })}
                  className={`px-2 py-0.5 rounded ${
                    rule.matchType === 'none' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  توجيه الكل
                </button>
              </div>
            </div>

            {rule.matchType !== 'none' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    placeholder="اكتب كلمة مفتاحية واضغط إضافة (مثل: عاجل، تخفيض، أندرويد)..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة</span>
                  </button>
                </div>

                {rule.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rule.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-950/70 border border-sky-800/60 text-sky-200 text-xs rounded-lg"
                      >
                        <span>{kw}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(i)}
                          className="text-sky-400 hover:text-rose-400 mr-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    لم تتم إضافة أي كلمات مفتاحية بعد. (إذا كانت القائمة فارغة سيتم توجيه جميع الرسائل).
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Blacklist Keywords */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>الكلمات المحظورة والمستبعدة (Blacklist - استبعاد الإعلانات)</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={blacklistInput}
                onChange={(e) => setBlacklistInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBlacklist();
                  }
                }}
                placeholder="اكتب كلمة محظورة لمنع توجيهها (مثل: إعلان، سبام، ممول)..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
              <button
                type="button"
                onClick={handleAddBlacklist}
                className="px-3 py-2 bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>حظر</span>
              </button>
            </div>

            {rule.blacklistKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {rule.blacklistKeywords.map((bw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs rounded-lg"
                  >
                    <span>{bw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlacklist(i)}
                      className="text-rose-400 hover:text-white mr-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Text Cleaners & Replacements */}
          <div className="space-y-3 p-4 bg-slate-950/40 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>تنظيف وتعديل محتوى الرسائل قبل التوجيه</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={rule.removeLinks}
                  onChange={(e) => setRule({ ...rule, removeLinks: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500"
                />
                <span className="flex items-center gap-1">
                  <Link className="w-3 h-3 text-slate-400" />
                  <span>حذف الروابط الخارجية (http://, t.me/)</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={rule.removeUsernames}
                  onChange={(e) => setRule({ ...rule, removeUsernames: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500"
                />
                <span className="flex items-center gap-1">
                  <AtSign className="w-3 h-3 text-slate-400" />
                  <span>حذف معرفات القنوات (@username)</span>
                </span>
              </label>
            </div>

            {/* Replacement Rules */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="block text-[11px] font-semibold text-slate-400">
                استبدال نصوص أو روابط محددة:
              </span>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newFind}
                  onChange={(e) => setNewFind(e.target.value)}
                  placeholder="ابحث عن نص (مثال: رابط القناة السابقة)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                />
                <input
                  type="text"
                  value={newReplace}
                  onChange={(e) => setNewReplace(e.target.value)}
                  placeholder="استبدله بـ (مثال: رابط قناتنا)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddReplacement}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
                >
                  إضافة استبدال
                </button>
              </div>

              {rule.replaceRules.length > 0 && (
                <div className="space-y-1 pt-1">
                  {rule.replaceRules.map((rep, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-rose-300 font-mono line-through">{rep.find}</span>
                        <span className="text-slate-500">➔</span>
                        <span className="text-emerald-300 font-mono">{rep.replaceWith || '(حذف)'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveReplacement(idx)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Custom Signature */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>التذييل والتوقيع المخصص (يضاف في نهاية كل رسالة معاد توجيهها)</span>
            </label>
            <textarea
              rows={2}
              value={rule.customSignature}
              onChange={(e) => setRule({ ...rule, customSignature: e.target.value })}
              placeholder="مثال: 📢 تابعوا قناتنا الرسمية: @MyChannel"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Advanced Mode: Copy vs Quote & Delay */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                طريقة التوجيه
              </label>
              <select
                value={rule.forwardMode}
                onChange={(e) => setRule({ ...rule, forwardMode: e.target.value as 'copy' | 'quote' })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              >
                <option value="copy">نسخ نظيف (Send as copy - بدون إظهار اسم المصدر)</option>
                <option value="quote">اقتباس رسمي (Forward with quote - يظهر من أين تم التوجيه)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>تأخير زمني بين الرسائل (بالثواني)</span>
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={rule.delaySeconds}
                onChange={(e) => setRule({ ...rule, delaySeconds: Number(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                موصى به: 1 - 3 ثواني لتفادي حظر التكرار (FloodWait)
              </span>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 rounded-b-2xl flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleFormSubmit}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20 transition-all flex items-center gap-1.5"
          >
            <span>حفظ وتفعيل القاعدة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
