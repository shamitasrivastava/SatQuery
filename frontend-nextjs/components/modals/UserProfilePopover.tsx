'use client';

import React from 'react';
import { KeyRound, ChevronRight, LogOut } from 'lucide-react';

interface UserProfilePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  agencyCode: string;
  userInitial: string;
  onNavigateResetPassword: () => void;
  onSignOut: () => void;
}

export default function UserProfilePopover({
  isOpen,
  onClose,
  email,
  agencyCode,
  userInitial,
  onNavigateResetPassword,
  onSignOut
}: UserProfilePopoverProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-2 left-16 z-50 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0284c7] to-cyan-400 text-white font-bold flex items-center justify-center text-sm shadow-sm">
          {userInitial}
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-bold text-slate-900 truncate">{email}</div>
          <div className="text-[10px] text-slate-500 font-mono uppercase">{agencyCode}</div>
        </div>
      </div>

      <div className="py-2.5 space-y-1">
        <button
          onClick={() => {
            onClose();
            onNavigateResetPassword();
          }}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition group cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#0284c7]" />
            <span>Change Password</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
        </button>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <button
          onClick={() => {
            onClose();
            onSignOut();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
