import React from 'react';
import { Calendar, FileText, Users, Building, Settings, LogIn, LogOut, ShieldCheck, Printer, Plus, Sun, Moon, FileSpreadsheet } from 'lucide-react';
import { User } from 'firebase/auth';
import { OfficeSettings } from '../types';

interface NavbarProps {
  activeTab: 'calendar' | 'list' | 'settlement' | 'tax_invoice' | 'roster' | 'settings';
  setActiveTab: (tab: 'calendar' | 'list' | 'settlement' | 'tax_invoice' | 'roster' | 'settings') => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  officeSettings: OfficeSettings;
  officeProfiles?: OfficeSettings[];
  activeOfficeId?: string;
  onSelectActiveProfile?: (id: string) => void;
  onNewLogClick: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogin,
  onLogout,
  officeSettings,
  officeProfiles = [],
  activeOfficeId = 'default',
  onSelectActiveProfile,
  onNewLogClick,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const isAdmin = user && officeSettings.adminEmails.some(
    (e) => e.toLowerCase() === user.email?.toLowerCase()
  );

  return (
    <>
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 print:hidden transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* Logo & Office Title with Office Profile Switcher */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-base sm:text-lg shadow-sm cursor-pointer shrink-0"
                onClick={() => setActiveTab('calendar')}
                title="출력 달력으로 이동"
              >
                젊
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  {/* Office Profile Selector Dropdown */}
                  {officeProfiles.length > 1 && onSelectActiveProfile ? (
                    <div className="relative flex items-center min-w-0">
                      <select
                        value={activeOfficeId}
                        onChange={(e) => onSelectActiveProfile(e.target.value)}
                        className="font-extrabold text-sm sm:text-lg tracking-tight text-slate-800 dark:text-slate-100 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[130px] sm:max-w-[220px] truncate"
                      >
                        {officeProfiles.map((p) => (
                          <option key={p.id || p.officeName} value={p.id || 'default'} className="dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100">
                            {p.profileName || p.officeName}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <h1 className="font-extrabold text-sm sm:text-lg tracking-tight text-slate-800 dark:text-slate-100 truncate">
                      {officeSettings.officeName}
                    </h1>
                  )}

                  <span className="text-[10px] sm:text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/50 shrink-0">
                    Labor Flow
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden md:block font-medium">
                  {officeSettings.phone1} {officeSettings.phone2 ? `/ ${officeSettings.phone2}` : ''}
                </p>
              </div>
            </div>

            {/* Quick Action & Dark Mode & Auth Toggle */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              {/* Desktop New Log Button */}
              <button
                onClick={onNewLogClick}
                className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm items-center space-x-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>새 출력표 등록</span>
              </button>

              {/* Dark Mode Toggle Button */}
              <button
                type="button"
                onClick={onToggleDarkMode}
                title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
                className="p-2 sm:px-2.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center space-x-1 shadow-2xs"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold hidden sm:inline text-amber-300">라이트</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
                    <span className="text-xs font-bold hidden sm:inline text-slate-700">다크</span>
                  </>
                )}
              </button>

              {/* User Auth Info */}
              {user ? (
                <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">{user.displayName || user.email}</div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-end space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{isAdmin ? '관리자' : '인증'}</span>
                    </div>
                  </div>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white dark:border-slate-700 shadow-xs shrink-0" />
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                      {(user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={onLogout}
                    title="로그아웃"
                    className="text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 p-1 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLogin}
                  className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1 transition-all cursor-pointer shadow-sm border border-slate-800 dark:border-slate-700"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden xs:inline">로그인</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop & Tablet Top Navigation Tabs Bar */}
          <nav className="hidden md:flex space-x-1 border-t border-slate-100 dark:border-slate-800/80 pt-1.5 pb-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
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
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
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
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>자동 정산 및 통계</span>
            </button>

            <button
              onClick={() => setActiveTab('tax_invoice')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'tax_invoice'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>전자세금계산서</span>
            </button>

            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
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
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>사무소 설정</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb Friendly) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 print:hidden transition-colors shadow-lg">
        <div className="grid grid-cols-6 h-16 max-w-lg mx-auto px-1">
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer select-none ${
              activeTab === 'calendar'
                ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'calendar' ? 'bg-blue-50 dark:bg-blue-950/80' : ''}`}>
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[9px] tracking-tight">달력</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer select-none ${
              activeTab === 'list'
                ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'list' ? 'bg-blue-50 dark:bg-blue-950/80' : ''}`}>
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[9px] tracking-tight">일지</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settlement')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer select-none ${
              activeTab === 'settlement'
                ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'settlement' ? 'bg-blue-50 dark:bg-blue-950/80' : ''}`}>
              <Printer className="w-4 h-4" />
            </div>
            <span className="text-[9px] tracking-tight">정산</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tax_invoice')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer select-none ${
              activeTab === 'tax_invoice'
                ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'tax_invoice' ? 'bg-blue-50 dark:bg-blue-950/80' : ''}`}>
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-[9px] tracking-tight">세금계산서</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer select-none ${
              activeTab === 'roster'
                ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'roster' ? 'bg-blue-50 dark:bg-blue-950/80' : ''}`}>
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[9px] tracking-tight">인부/현장</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer select-none ${
              activeTab === 'settings'
                ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'settings' ? 'bg-blue-50 dark:bg-blue-950/80' : ''}`}>
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-[9px] tracking-tight">설정</span>
          </button>
        </div>
      </nav>
    </>
  );
};
