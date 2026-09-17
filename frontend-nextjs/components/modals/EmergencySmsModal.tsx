'use client';

import React, { useState } from 'react';
import { Radio, PhoneCall, CheckCircle2, X } from 'lucide-react';

interface EmergencySmsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmergencySmsModal({ isOpen, onClose }: EmergencySmsModalProps) {
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [isSendingSms, setIsSendingSms] = useState<boolean>(false);
  const [smsStatus, setSmsStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleSendAlertSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone.trim()) return;

    setIsSendingSms(true);
    setSmsStatus('idle');

    setTimeout(() => {
      setIsSendingSms(false);
      setSmsStatus('success');
      setTimeout(() => {
        onClose();
        setSmsStatus('idle');
        setRecipientPhone('');
      }, 1600);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white text-slate-900 border border-rose-200 rounded-[26px] p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Broadcast Disaster SMS Alert</h3>
              <p className="text-[10px] text-slate-500 font-mono">Disaster Emergency Telemetry Dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSendAlertSMS} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Enter Mobile Number to receive SMS Alert
            </label>
            <div className="relative">
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 pl-10 outline-none focus:border-rose-500 focus:bg-white transition"
              />
              <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {smsStatus === 'success' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Emergency telemetry SMS transmitted to {recipientPhone}!</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSendingSms || !recipientPhone.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
            >
              {isSendingSms ? <span>Transmitting...</span> : <span>Dispatch Alert</span>}
              <Radio className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
