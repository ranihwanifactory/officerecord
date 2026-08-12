import React from 'react';
import { Calendar, FileText, Users, Building, Settings, LogIn, LogOut, ShieldCheck, Printer, Plus } from 'lucide-react';
import { User } from 'firebase/auth';
import { OfficeSettings } from '../types';

interface NavbarProps {
  activeTab: 'calendar' | 'list' | 'settlement' | 'roster' | 'settings';
  setActiveTab: (tab: 'calendar' | 'list' | 'settlement' | 'roster' | 'settings') => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  officeSettings: OfficeSettings;
  onNewLogClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogin,
  onLogout,
  officeSettings,
  onNewLogClick,
}) => {
  const isAdmin = user && officeSettings.adminEmails.some(
    (e) => e.toLowerCase() === user.email?.toLowerCase()
  );

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Office Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('calendar')}>
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-sm">
              젊
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-800">{officeSettings.officeName}</h1>
                <span className="text-xs bg-blue-50 text-blue-600 font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                  Labor Flow
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block font-medium">{officeSettings.phone1} / {officeSettings.phone2}</p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={onNewLogClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>새 출력표 등록</span>
            </button>
          </div>

          {/* User Auth & Admin Info */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-700">{user.displayName || user.email}</div>
                  <div className="text-[10px] text-blue-600 font-semibold flex items-center justify-end space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{isAdmin ? '관리자 (acehwan69)' : '인증 사용자'}</span>
                  </div>
                </div>
                {user.photoURL && (
                  <img src={user.photoURL} alt="User" className="w-7 h-7 rounded-full border-2 border-white shadow-sm" />
                )}
                <button
                  onClick={onLogout}
                  title="로그아웃"
                  className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-400" />
                <span>구글 로그인 (관리자)</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 border-t border-slate-100 pt-1.5 pb-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>출력 달력</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>출력일지 목록</span>
          </button>

          <button
            onClick={() => setActiveTab('settlement')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settlement'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>자동 정산 및 통계</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>인부 & 현장 관리</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>사무소 설정</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
