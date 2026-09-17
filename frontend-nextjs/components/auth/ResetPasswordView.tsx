'use client';

import React from 'react';
import { ArrowLeft, Lock, KeyRound, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

interface ResetPasswordViewProps {
  loginEmail: string;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showNewPassword: boolean;
  setShowNewPassword: (val: boolean) => void;
  resetError: string;
  resetSuccess: boolean;
  handlePasswordChangeSubmit: (e: React.FormEvent) => void;
  onNavigateBack: () => void;
}

export default function ResetPasswordView({
  loginEmail,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showNewPassword,
  setShowNewPassword,
  resetError,
  resetSuccess,
  handlePasswordChangeSubmit,
  onNavigateBack
}: ResetPasswordViewProps) {
  return (
    <div
      className="flex flex-col min-h-screen w-screen overflow-hidden font-sans select-none relative justify-center items-center p-4"
      style={{
        background: 'linear-gradient(135deg, #ffe3c2 0%, #fff1e0 22%, #f4f9ff 50%, #e2f0ff 72%, #d7ecff 100%)'
      }}
    >
      <div className="w-full max-w-[440px] bg-white rounded-[26px] border border-slate-200 shadow-2xl p-8 backdrop-blur-xl relative">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <button
            onClick={onNavigateBack}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
            title="Return"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">Change Security Passkey</h2>
            <p className="text-xs text-slate-500 font-mono truncate max-w-[280px]">For: {loginEmail}</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new passkey..."
                required
                className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pl-10 pr-10 outline-none focus:border-[#0284c7] focus:bg-white transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Re-type New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new passkey..."
                required
                className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pl-10 outline-none focus:border-[#0284c7] focus:bg-white transition"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {resetError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {resetError}
            </div>
          )}

          {resetSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Password updated successfully! Returning...</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-md active:scale-[0.98] transition mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Save & Update Passkey</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </form>
      </div>
    </div>
  );
}
