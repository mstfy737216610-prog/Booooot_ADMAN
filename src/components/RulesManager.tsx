import React from 'react';
import { ForwardRule } from '../types/index.ts';
import {
  ListFilter,
  Plus,
  Play,
  Edit2,
  Trash2,
  Copy,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Tag,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  rules: ForwardRule[];
  onAddRule: () => void;
  onEditRule: (rule: ForwardRule) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string) => void;
  onTestRule: (rule: ForwardRule) => void;
}

export const RulesManager: React.FC<Props> = ({
  rules,
  onAddRule,
  onEditRule,
  onDeleteRule,
  onToggleRule,
  onTestRule,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-indigo-400" />
            <span>قواعد التوجيه الذكية (Forwarding Rules)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة مسارات نقل الرسائل بين القنوات والمجموعات مع شروط الفلترة
          </p>
        </div>

        <button
          onClick={onAddRule}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مسار توجيه جديد</span>
        </button>
      </div>

      {/* Rules List / Cards */}
      {rules.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl p-6">
          <ListFilter className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">لا توجد قواعد توجيه بعد</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            قم بإنشاء قاعدتك الأولى لتحديد القناة المصدر والوجهة والكلمات المفتاحية
          </p>
          <button
            onClick={onAddRule}
            className="px-4 py-2 bg-sky-600 text-white text-xs font-semibold rounded-xl"
          >
            إضافة قاعدة الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition-all ${
                rule.enabled
                  ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/30 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* Left/Right Route Flow */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      onClick={() => onToggleRule(rule.id)}
                      className={`cursor-pointer inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rule.enabled
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {rule.enabled ? 'نشط' : 'معطل'}
                    </span>
                    <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                  </div>

                  {/* Flow Route */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-sky-300">
                      المصدر: {rule.sourceChatId}
                    </span>
                    <ArrowLeft className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="font-mono px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-emerald-300">
                      الهدف: {rule.destinationChatId}
                    </span>
                  </div>

                  {/* Badges / summary */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                    {rule.matchType === 'none' ? (
                      <span className="px-2 py-0.5 bg-indigo-950/50 text-indigo-300 rounded border border-indigo-900/40">
                        توجيه كل الرسائل
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-sky-950/50 text-sky-300 rounded border border-sky-900/40">
                        <Tag className="w-3 h-3" />
                        <span>{rule.keywords.length} كلمات مطلوبة ({rule.matchType === 'all' ? 'الكل' : 'أي'})</span>
                      </span>
                    )}

                    {rule.blacklistKeywords.length > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-950/50 text-rose-300 rounded border border-rose-900/40">
                        <ShieldAlert className="w-3 h-3" />
                        <span>{rule.blacklistKeywords.length} كلمات محظورة</span>
                      </span>
                    )}

                    {rule.customSignature && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span>توقيع مخصص</span>
                      </span>
                    )}

                    <span className="text-slate-500 text-[10px]">
                      {rule.forwardMode === 'copy' ? 'نسخ نظيف' : 'اقتباس رسمي'} • تأخير: {rule.delaySeconds}ث
                    </span>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-1.5 self-end lg:self-center shrink-0">
                  {/* Test in Simulator */}
                  <button
                    onClick={() => onTestRule(rule)}
                    title="اختبار القاعدة في المحاكي المباشر"
                    aria-label="اختبار القاعدة في المحاكي"
                    className="flex items-center gap-1 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-semibold rounded-lg border border-sky-500/30 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-sky-400" />
                    <span>اختبار بالمحاكي</span>
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => onEditRule(rule)}
                    aria-label="تعديل القاعدة"
                    title="تعديل القاعدة"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onDeleteRule(rule.id)}
                    aria-label="حذف القاعدة"
                    title="حذف القاعدة"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
