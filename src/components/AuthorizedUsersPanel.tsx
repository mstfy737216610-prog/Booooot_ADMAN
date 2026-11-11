import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Crown,
  KeyRound,
  Lock,
  Info
} from 'lucide-react';

interface AuthorizedUser {
  id: number;
  user_id: number;
  username: string;
  notes: string;
  added_by: number;
  created_at: string;
}

interface AuthorizedUsersPanelProps {
  onNotify?: (msg: string) => void;
}

export const AuthorizedUsersPanel: React.FC<AuthorizedUsersPanelProps> = ({ onNotify }) => {
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Form State
  const [userIdInput, setUserIdInput] = useState<string>('');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/authorized-users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch authorized users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanId = userIdInput.trim();
    if (!cleanId || !/^-?\d+$/.test(cleanId)) {
      setErrorMsg('يرجى إدخال معرف تيليجرام رقمي صحيح (User ID).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/authorized-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: cleanId,
          username: usernameInput.trim(),
          notes: notesInput.trim() || 'مشرف مصرح له'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`✅ تم بنجاح تصريح المستخدم (${cleanId}) وحفظه في القائمة البيضاء.`);
        if (onNotify) onNotify(`تم تصريح المستخدم ${cleanId}`);
        setUserIdInput('');
        setUsernameInput('');
        setNotesInput('');
        fetchUsers();
      } else {
        setErrorMsg(data.error || 'فشلت إضافة المصرح له.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`خطأ في الاتصال: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (userId === 7607633343) {
      alert('لا يمكن حذف المالك والمشرف الأساسي 👑');
      return;
    }

    if (!confirm(`هل أنت متأكد من إلغاء تصريح المستخدم (${name || userId}) وحظره فوراً من البوت؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/authorized-users/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        if (onNotify) onNotify(`تم إلغاء تصريح المستخدم ${userId}`);
        fetchUsers();
      } else {
        alert(data.error || 'فشل الحذف.');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const copyToClipboard = (id: number) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">إدارة المشرفين والمصرح لهم (Whitelist Security)</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                🔒 الحظر الشامل نشط
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              قفل أمان حديدي: لا يمكن لأي شخص غريب استخدام البوت أو رؤية مجموعاتك وقنواتك؛ يعمل البوت حصراً مع المشرفين المعتمدين هنا فقط.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-700 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          تحديث القائمة
        </button>
      </div>

      {/* Security Rule Alert Box */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-amber-200">
          <strong className="block text-amber-300 font-semibold mb-1">🛡️ كيف يعمل نظام الحظر المشدد؟</strong>
          إذا تواصل أي حساب تليجرام غريب مع البوت أو أرسل <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-300">/start</code>،
          يقوم البوت برفضه فوراً وحجب كافة الجامعات والقنوات والمصادر والأزرار عنه، ولن يعرض له أي معلومات خاصة بك نهائياً.
        </div>
      </div>

      {/* Primary Owner Card */}
      <div className="bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-purple-950/20 border border-sky-800/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">المشرف العام ومالك البوت الأساسي</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                المالك الدائم 👑
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span>المعرف الرقمي: <code className="text-sky-300 font-mono">7607633343</code></span>
              <span>اليوزر: <code className="text-sky-300 font-mono">@M_S_F_G</code></span>
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          🔒 محمي برمجياً من الحذف أو التعديل
        </div>
      </div>

      {/* Add Authorized User Form */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <UserPlus className="w-4 h-4 text-sky-400" />
          <span>➕ إضافة مصرح له جديد يدوياً إلى القائمة البيضاء:</span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              معرف المستخدم الرقمي (User ID) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="مثال: 123456789"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              اسم المستخدم (Username) <span className="text-slate-500">(اختياري)</span>
            </label>
            <input
              type="text"
              placeholder="@username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              الوصف أو الملاحظة <span className="text-slate-500">(اختياري)</span>
            </label>
            <input
              type="text"
              placeholder="مثال: مساعد نشر، مشرف جامعة الملك سعود"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-900/30"
            >
              <UserPlus className="w-4 h-4" />
              {submitting ? 'جاري الإضافة...' : '➕ حفظ وتصريح'}
            </button>
          </div>
        </form>
      </div>

      {/* Authorized Users Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>المشرفون المصرح لهم حالياً في قاعدة البيانات ({users.length}):</span>
          </h3>
          <span className="text-xs text-slate-500">مزامنة فورية مع ملف bot_database.db</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
            جاري قراءة المشرفين من قاعدة البيانات...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm bg-slate-800/40 rounded-xl border border-slate-800">
            لا يوجد مشرفون إضافيون مسجلون. يعمل البوت حالياً مع المشرف العام فقط.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">المعرف الرقمي (User ID)</th>
                  <th className="py-3 px-4">اسم الحساب</th>
                  <th className="py-3 px-4">الملاحظة / الصلاحية</th>
                  <th className="py-3 px-4">تاريخ الإضافة</th>
                  <th className="py-3 px-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u, idx) => {
                  const isOwner = (u.user_id === 7607633343);
                  return (
                    <tr
                      key={u.id || u.user_id}
                      className={isOwner ? 'bg-amber-950/10' : 'hover:bg-slate-800/40 transition'}
                    >
                      <td className="py-3 px-4 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{u.user_id}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(u.user_id)}
                            className="p-1 text-slate-500 hover:text-slate-300 rounded cursor-pointer"
                            title="نسخ المعرف"
                          >
                            {copiedId === u.user_id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-sky-400">
                        {u.username ? `@${u.username}` : <span className="text-slate-500">بدون</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {isOwner ? (
                          <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            المالك والمشرف العام 👑
                          </span>
                        ) : (
                          u.notes || 'مشرف مصرح له'
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {u.created_at ? u.created_at.replace('T', ' ').slice(0, 16) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOwner ? (
                          <span className="text-[11px] text-slate-600 font-semibold">محمي</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.user_id, u.username || String(u.user_id))}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition text-xs font-semibold cursor-pointer"
                            title="إلغاء التصريح وحظر المستخدم"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>حذف التصريح</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Helpful Instructions for Telegram Management */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs space-y-2 text-slate-400">
        <div className="flex items-center gap-2 font-bold text-slate-200">
          <Info className="w-4 h-4 text-sky-400" />
          <span>أوامر إدارة المشرفين مباشرة من داخل محادثة بوت تيليجرام:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-400 pr-1">
          <li>
            <code className="text-sky-300 font-mono">/admins</code> : عرض قائمة المشرفين والمصرح لهم مع أزرار الإلغاء السريعة.
          </li>
          <li>
            <code className="text-sky-300 font-mono">/add_admin 123456789 مساعد للنشر</code> : إضافة مصرح له جديد مباشرة بالمعرف.
          </li>
          <li>
            <code className="text-sky-300 font-mono">/del_admin 123456789</code> : حذف وإلغاء تصريح أي مستخدم وحظره من البوت فوراً.
          </li>
        </ul>
      </div>
    </div>
  );
};
