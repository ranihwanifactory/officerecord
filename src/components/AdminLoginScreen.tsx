import React from 'react';
import { ShieldCheck, Lock, LogIn, LogOut, CheckCircle2, FileSpreadsheet, Calendar, Image as ImageIcon } from 'lucide-react';
import { User } from 'firebase/auth';
import { OfficeSettings } from '../types';

interface AdminLoginScreenProps {
  user: User | null;
  officeSettings: OfficeSettings;
  onLogin: () => void;
  onLogout: () => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  user,
  officeSettings,
  onLogin,
  onLogout,
}) => {
  const isUserLoggedIn = Boolean(user);
  const userEmail = user?.email || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-between p-4 sm:p-6 font-sans text-slate-100">
      
      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/30">
            젊
          </div>
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
              {officeSettings.officeName}
            </h1>
            <p className="text-xs text-blue-300 font-medium">출력표 관리 시스템</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>보안 관리자 전용 시스템</span>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 text-center relative overflow-hidden">
          
          {/* Subtle Accent Glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Lock Badge Icon */}
          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/40 rounded-3xl flex items-center justify-center mx-auto mb-5 text-blue-400 shadow-inner">
            <Lock className="w-8 h-8 stroke-[2.2]" />
          </div>

          {/* App Title */}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            출력표 관리 시스템
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 font-medium leading-relaxed">
            본 시스템은 <strong className="text-blue-300 font-bold">{officeSettings.officeName}</strong> 관리자만 접근할 수 있는 승인 전용 업무용 플랫폼입니다.
          </p>

          {/* State Case 1: Logged in, but unauthorized email */}
          {isUserLoggedIn ? (
            <div className="bg-rose-950/60 border border-rose-500/40 rounded-2xl p-4 text-left mb-6 space-y-3">
              <div className="flex items-start space-x-2.5 text-rose-300">
                <div className="text-lg">🚫</div>
                <div>
                  <h4 className="font-bold text-sm text-rose-200">접근 권한 제한</h4>
                  <p className="text-xs text-rose-300/90 mt-1 leading-normal">
                    현재 로그인된 계정(<strong className="text-white underline">{userEmail}</strong>)은 등록된 관리자 목록에 포함되어 있지 않습니다.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-rose-900/50 flex flex-col space-y-2 text-xs text-slate-300">
                <div className="flex items-center space-x-1.5 text-amber-300">
                  <span>💡</span>
                  <span>관리자 계정: <strong>acehwan69@gmail.com</strong></span>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full mt-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃 후 다른 계정으로 로그인</span>
                </button>
              </div>
            </div>
          ) : (
            /* State Case 2: Not Logged In */
            <div className="space-y-4 mb-6">
              <button
                onClick={onLogin}
                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-extrabold py-3.5 px-5 rounded-2xl text-sm sm:text-base flex items-center justify-center space-x-3 transition-all cursor-pointer shadow-lg shadow-blue-600/30 border border-blue-400/30"
              >
                <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google 계정으로 관리자 로그인</span>
              </button>
            </div>
          )}

          {/* Key System Features Highlight */}
          <div className="pt-5 border-t border-slate-800 text-left space-y-2.5">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">주요 기능</h4>
            <div className="grid grid-cols-1 gap-2 text-xs text-slate-300 font-medium">
              <div className="flex items-center space-x-2 bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-700/40">
                <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                <span>달력형 출력 일지 작성 및 1~31일 출근 선택</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-700/40">
                <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>현장 출력표 양식 자동 생성 및 이미지(PNG) 저장</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-700/40">
                <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
                <span>월간 공수/단가 자동 계산 및 Excel CSV 다운로드</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center py-4 text-xs text-slate-500 font-medium border-t border-slate-800/60">
        © 2026 {officeSettings.officeName}. All rights reserved. (전화: {officeSettings.phone1} / {officeSettings.phone2})
      </footer>

    </div>
  );
};
