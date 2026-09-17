'use client';

import React from 'react';
import {
  ShieldCheck,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';

interface AuthViewProps {
  authTab: 'signin' | 'signup';
  setAuthTab: (tab: 'signin' | 'signup') => void;
  signupUsername: string;
  setSignupUsername: (val: string) => void;
  signupFullName: string;
  setSignupFullName: (val: string) => void;
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  agencyCode: string;
  setAgencyCode: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  authError: string | null;
  setAuthError: (val: string | null) => void;
  authLoading: boolean;
  handleAuthSubmit: (e: React.FormEvent) => void;
  onNavigateResetPassword: () => void;
}

export default function AuthView({
  authTab,
  setAuthTab,
  signupUsername,
  setSignupUsername,
  signupFullName,
  setSignupFullName,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  agencyCode,
  setAgencyCode,
  showPassword,
  setShowPassword,
  authError,
  setAuthError,
  authLoading,
  handleAuthSubmit,
  onNavigateResetPassword
}: AuthViewProps) {
  return (
    <div
      className="flex flex-col min-h-screen w-screen overflow-hidden font-sans select-none relative justify-between scale-100 origin-top animated-gradient-bg"
      style={{ height: '100vh' }}
    >
      <div className="absolute -top-[6%] -left-[6%] w-[34rem] h-[34rem] rounded-full bg-[#f97316] blur-[95px] pointer-events-none opacity-30 blob-wave-orange" />
      <div className="absolute -bottom-[8%] -right-[6%] w-[36rem] h-[36rem] rounded-full bg-[#0284c7] blur-[100px] pointer-events-none opacity-30 blob-wave-blue" />

      {/* Official Government Header */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm z-30 relative">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5">
            <img src="/isro-logo.png" alt="ISRO Logo" className="h-11 w-auto object-contain" />
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[11px] font-bold text-slate-900 tracking-tight uppercase">DEPARTMENT OF SPACE</span>
              <span className="text-[10px] font-medium text-slate-500">Government of India</span>
            </div>
          </div>
          <div className="h-7 w-[1px] bg-slate-300 ml-1.5 mr-0.5 hidden sm:block" />
          <div className="flex items-center gap-2 ml-1">
            <img src="/logo.png" alt="BhuViksana Logo" className="h-9 w-auto object-contain drop-shadow-sm scale-105" />
            <span className="text-base font-extrabold text-[#0284c7] tracking-tight leading-none">
              BhuViksana
            </span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 relative z-20">
        <div className="w-full max-w-[460px] bg-white/95 rounded-[26px] border border-white/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] p-8 sm:p-10 backdrop-blur-xl relative">
          <div className="text-center mb-5">
            <div className="w-14 h-14 mx-auto mb-3.5 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm">
              <img src="/logo.png" alt="BhuViksana" className="w-9 h-9 object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {authTab === 'signin' ? 'Sign in to your account' : 'Register New Officer Account'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {authTab === 'signin'
                ? 'Enter official credentials to access the geospatial workstation.'
                : 'Create official credentials to access Earth observation tools.'}
            </p>
          </div>

          {/* Switcher Tab */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-5 border border-slate-200/80">
            <button
              type="button"
              onClick={() => { setAuthTab('signin'); setAuthError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                authTab === 'signin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab('signup'); setAuthError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                authTab === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Alert */}
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authTab === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left">User ID / Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      placeholder="e.g. officer_sharma"
                      required
                      className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pl-10 outline-none focus:border-[#0284c7] focus:bg-white transition"
                    />
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left">Full Name (Optional)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      placeholder="e.g. Aditya Sharma"
                      className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#0284c7] focus:bg-white transition"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 text-left">Designated Command Unit</label>
              <div className="relative">
                <select
                  value={agencyCode}
                  onChange={(e) => setAgencyCode(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#0284c7] focus:bg-white transition appearance-none cursor-pointer"
                >
                  <option value="ISRO-SAC">ISRO — Space Applications Centre (SAC)</option>
                  <option value="ISRO-NRSC">ISRO — National Remote Sensing Centre (NRSC)</option>
                  <option value="NDRF-HQ">NDRF — Disaster Response Command</option>
                  <option value="STATE-DMA">State Disaster Management Authority (SDMA)</option>
                  <option value="SIH-JURY">SIH2026 Evaluation Panel / Auditor</option>
                </select>
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 text-left">Official Government Email ID</label>
              <div className="relative">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="officer.name@isro.gov.in / @nic.in"
                  required
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Security Passkey</label>
                {authTab === 'signin' && (
                  <button
                    type="button"
                    onClick={onNavigateResetPassword}
                    className="text-[11px] font-medium text-[#0284c7] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 pr-9 outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-md active:scale-[0.98] transition mt-2 disabled:opacity-60 cursor-pointer"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Processing Authentication...</span>
                </>
              ) : (
                <>
                  <span>{authTab === 'signin' ? 'Sign In with Gov Auth' : 'Create Officer Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 italic font-medium leading-relaxed">
              "Bridging Conversational AI with Sub-Meter Earth Observation for National Remote Sensing & Disaster Resilience."
            </p>
          </div>
        </div>
      </main>

      {/* Footer Notice */}
      <footer className="w-full bg-[#070b13] text-slate-300 py-2.5 px-6 text-center text-[10px] font-medium border-t border-slate-800 z-30 relative">
        Official Notice: Authorized access only for ISRO, NRSC, and State Disaster Command personnel under the Information Technology Act, 2000. All access activities and telemetry queries are monitored and audited.
      </footer>

      <style jsx>{`
        .animated-gradient-bg {
          background: linear-gradient(135deg, #ffe3c2 0%, #fff1e0 22%, #f4f9ff 50%, #e2f0ff 72%, #d7ecff 100%);
          background-size: 260% 260%;
          animation: gradientShift 14s ease-in-out infinite;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 40%; }
          50% { background-position: 100% 60%; }
          100% { background-position: 0% 40%; }
        }
        .blob-wave-orange { animation: waveOrange 9s ease-in-out infinite; }
        .blob-wave-blue { animation: waveBlue 10s ease-in-out infinite; }
        @keyframes waveOrange {
          0%   { transform: translate(0, 0) scale(1); }
          25%  { transform: translate(40px, 20px) scale(1.06); }
          50%  { transform: translate(15px, 45px) scale(1); }
          75%  { transform: translate(-25px, 15px) scale(0.96); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes waveBlue {
          0%   { transform: translate(0, 0) scale(1); }
          25%  { transform: translate(-40px, -20px) scale(1.06); }
          50%  { transform: translate(-15px, -45px) scale(1); }
          75%  { transform: translate(25px, -15px) scale(0.96); }
          100% { transform: translate(0, 0) scale(1); }
        }
      `}</style>
    </div>
  );
}
