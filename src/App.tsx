/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { DispatchLogList } from './components/DispatchLogList';
import { SettlementSummary } from './components/SettlementSummary';
import { RosterManager } from './components/RosterManager';
import { OfficeSettingsModal } from './components/OfficeSettingsModal';
import { DispatchLogFormModal } from './components/DispatchLogFormModal';
import { PrintableSheet } from './components/PrintableSheet';
import { AdminLoginScreen } from './components/AdminLoginScreen';
import { Loader2 } from 'lucide-react';

import { DispatchLog, WorkerMaster, ClientSiteMaster, OfficeSettings } from './types';
import {
  subscribeDispatchLogs,
  saveDispatchLog,
  deleteDispatchLog,
  subscribeWorkers,
  saveWorker,
  deleteWorker,
  subscribeClients,
  saveClient,
  deleteClient,
  subscribeOfficeSettings,
  saveOfficeSettings,
} from './services/dataService';
import {
  auth,
  onAuthStateChanged,
  loginWithGoogle,
  logoutFirebase,
  testFirestoreConnection,
  User,
} from './firebase';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'calendar' | 'list' | 'settlement' | 'roster' | 'settings'>('calendar');

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Modals & Active Log States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DispatchLog | null>(null);
  const [selectedDateForForm, setSelectedDateForForm] = useState<string>('');

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [logToPrint, setLogToPrint] = useState<DispatchLog | null>(null);

  // Sync activeTab & modal open state with URL hash and browser history (PopState)
  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      const hash = url.hash.replace('#', '').split('?')[0];
      const hasModalParam = url.hash.includes('modal=');

      // 1. Close modals if url hash no longer contains modal parameter
      if (!hasModalParam) {
        setIsFormModalOpen(false);
        setEditingLog(null);
        setIsPrintModalOpen(false);
        setLogToPrint(null);
      }

      // 2. Sync tab state from hash
      if (['calendar', 'list', 'settlement', 'roster', 'settings'].includes(hash)) {
        setActiveTab(hash as any);
      } else if (!hash) {
        setActiveTab('calendar');
      }
    };

    // Initial check on page mount
    if (window.location.hash) {
      const hash = window.location.hash.replace('#', '').split('?')[0];
      if (['calendar', 'list', 'settlement', 'roster', 'settings'].includes(hash)) {
        setActiveTab(hash as any);
      }
    } else {
      window.history.replaceState({ tab: 'calendar' }, '', '#calendar');
    }

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const handleTabChange = (tab: 'calendar' | 'list' | 'settlement' | 'roster' | 'settings') => {
    setActiveTab(tab);
    if (window.location.hash !== `#${tab}`) {
      window.history.pushState({ tab }, '', `#${tab}`);
    }
  };
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App Data State
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([]);
  const [workersRoster, setWorkersRoster] = useState<WorkerMaster[]>([]);
  const [clientsRoster, setClientsRoster] = useState<ClientSiteMaster[]>([]);
  const [officeSettings, setOfficeSettings] = useState<OfficeSettings>({
    officeName: '젊은인력사무소',
    phone1: '054-933-1566',
    phone2: '010-7545-0038',
    address: '경북 성주군 성주읍 성주순환로2길 69',
    bankAccount: '농협 302-65550038-11 손영란',
    adminEmails: ['acehwan69@gmail.com', 'hwanace@gmail.com'],
  });

  // Check Admin Permission
  const isAdmin = Boolean(
    user &&
    officeSettings.adminEmails.some(
      (e) => e.toLowerCase() === user.email?.toLowerCase()
    )
  );

  const checkAdminPermission = (): boolean => {
    if (!isAdmin) {
      alert('데이터 작성, 수정, 삭제 권한은 관리자(acehwan69@gmail.com) 계정으로 구글 로그인 한 사용자만 가능합니다.');
      return false;
    }
    return true;
  };

  // Firebase Auth Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    testFirestoreConnection();
    return () => unsubAuth();
  }, []);

  // Realtime Data Subscriptions
  useEffect(() => {
    const unsubLogs = subscribeDispatchLogs((logs) => setDispatchLogs(logs));
    const unsubWorkers = subscribeWorkers((workers) => setWorkersRoster(workers));
    const unsubClients = subscribeClients((clients) => setClientsRoster(clients));
    const unsubSettings = subscribeOfficeSettings((settings) => setOfficeSettings(settings));

    return () => {
      unsubLogs();
      unsubWorkers();
      unsubClients();
      unsubSettings();
    };
  }, []);

  // Login & Logout Handlers
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      alert(`로그인 오류: ${err?.message || err}`);
    }
  };

  const handleLogout = async () => {
    await logoutFirebase();
  };

  // Dispatch Log CRUD Actions
  const handleOpenNewLogModal = (dateStr?: string) => {
    if (!checkAdminPermission()) return;
    setEditingLog(null);
    setSelectedDateForForm(dateStr || new Date().toISOString().substring(0, 10));
    setIsFormModalOpen(true);
    if (!window.location.hash.includes('modal=')) {
      window.history.pushState({ modal: 'form', tab: activeTab }, '', `#${activeTab}?modal=form`);
    }
  };

  const handleOpenEditLogModal = (log: DispatchLog) => {
    if (!checkAdminPermission()) return;
    setEditingLog(log);
    setSelectedDateForForm(log.date);
    setIsFormModalOpen(true);
    if (!window.location.hash.includes('modal=')) {
      window.history.pushState({ modal: 'form', tab: activeTab }, '', `#${activeTab}?modal=form`);
    }
  };

  const handleSaveLog = async (log: DispatchLog) => {
    if (!checkAdminPermission()) return;
    await saveDispatchLog(log);
    setIsFormModalOpen(false);
    setEditingLog(null);
    if (window.location.hash.includes('modal=')) {
      window.history.pushState({ tab: activeTab }, '', `#${activeTab}`);
    }
  };

  const handleDuplicateLog = (log: DispatchLog) => {
    if (!checkAdminPermission()) return;
    setEditingLog(log);
    setSelectedDateForForm(log.date);
    setIsFormModalOpen(true);
    if (!window.location.hash.includes('modal=')) {
      window.history.pushState({ modal: 'form', tab: activeTab }, '', `#${activeTab}?modal=form`);
    }
  };

  const handleTogglePaidLog = async (log: DispatchLog) => {
    if (!checkAdminPermission()) return;
    const updatedLog: DispatchLog = {
      ...log,
      isPaid: !log.isPaid,
      paidAt: !log.isPaid ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };
    await saveDispatchLog(updatedLog);
    if (logToPrint?.id === log.id) {
      setLogToPrint(updatedLog);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!checkAdminPermission()) return;
    if (confirm('정말로 이 출력표 일지를 삭제하시겠습니까?')) {
      await deleteDispatchLog(id);
      if (logToPrint?.id === id) {
        setIsPrintModalOpen(false);
        setLogToPrint(null);
        if (window.location.hash.includes('modal=')) {
          window.history.pushState({ tab: activeTab }, '', `#${activeTab}`);
        }
      }
    }
  };

  const handleSaveWorker = async (worker: WorkerMaster) => {
    if (!checkAdminPermission()) return;
    await saveWorker(worker);
  };

  const handleDeleteWorker = async (id: string) => {
    if (!checkAdminPermission()) return;
    await deleteWorker(id);
  };

  const handleSaveClient = async (client: ClientSiteMaster) => {
    if (!checkAdminPermission()) return;
    await saveClient(client);
  };

  const handleDeleteClient = async (id: string) => {
    if (!checkAdminPermission()) return;
    await deleteClient(id);
  };

  const handleSaveOfficeSettings = async (settings: OfficeSettings) => {
    if (!checkAdminPermission()) return;
    await saveOfficeSettings(settings);
  };

  // Print Modal Trigger
  const handlePrintLog = (log: DispatchLog) => {
    setLogToPrint(log);
    setIsPrintModalOpen(true);
    if (!window.location.hash.includes('modal=')) {
      window.history.pushState({ modal: 'print', tab: activeTab }, '', `#${activeTab}?modal=print`);
    }
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingLog(null);
    if (window.location.hash.includes('modal=')) {
      window.history.pushState({ tab: activeTab }, '', `#${activeTab}`);
    }
  };

  const handleClosePrintModal = () => {
    setIsPrintModalOpen(false);
    setLogToPrint(null);
    if (window.location.hash.includes('modal=')) {
      window.history.pushState({ tab: activeTab }, '', `#${activeTab}`);
    }
  };

  // Loading Screen while Firebase Auth initializes
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-sm font-semibold text-slate-300">관리자 인증 상태 확인 중...</p>
      </div>
    );
  }

  // Strictly restrict access to Admin users only
  if (!isAdmin) {
    return (
      <AdminLoginScreen
        user={user}
        officeSettings={officeSettings}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        officeSettings={officeSettings}
        onNewLogClick={() => handleOpenNewLogModal()}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main App Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {activeTab === 'calendar' && (
          <CalendarView
            logs={dispatchLogs}
            officeSettings={officeSettings}
            onSelectDate={(dateStr) => setSelectedDateForForm(dateStr)}
            onNewLogForDate={(dateStr) => handleOpenNewLogModal(dateStr)}
            onEditLog={handleOpenEditLogModal}
            onPrintLog={handlePrintLog}
            onDuplicateLog={handleDuplicateLog}
            onDeleteLog={handleDeleteLog}
            onTogglePaidLog={handleTogglePaidLog}
          />
        )}

        {activeTab === 'list' && (
          <DispatchLogList
            logs={dispatchLogs}
            onNewLogClick={() => handleOpenNewLogModal()}
            onEditLog={handleOpenEditLogModal}
            onPrintLog={handlePrintLog}
            onDuplicateLog={handleDuplicateLog}
            onDeleteLog={handleDeleteLog}
            onTogglePaidLog={handleTogglePaidLog}
          />
        )}

        {activeTab === 'settlement' && (
          <SettlementSummary
            logs={dispatchLogs}
            officeSettings={officeSettings}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            workers={workersRoster}
            clients={clientsRoster}
            onSaveWorker={handleSaveWorker}
            onDeleteWorker={handleDeleteWorker}
            onSaveClient={handleSaveClient}
            onDeleteClient={handleDeleteClient}
          />
        )}

        {activeTab === 'settings' && (
          <OfficeSettingsModal
            officeSettings={officeSettings}
            onSave={handleSaveOfficeSettings}
          />
        )}
      </main>

      {/* Form Modal (Create / Edit / Duplicate Dispatch Log) */}
      {isFormModalOpen && (
        <DispatchLogFormModal
          initialLog={editingLog}
          selectedDate={selectedDateForForm}
          workersRoster={workersRoster}
          clientsRoster={clientsRoster}
          onSave={handleSaveLog}
          onDuplicateSave={handleSaveLog}
          onClose={handleCloseFormModal}
        />
      )}

      {/* Print Preview Sheet Modal */}
      {isPrintModalOpen && logToPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="max-w-4xl w-full my-auto">
            <PrintableSheet
              log={logToPrint}
              officeSettings={officeSettings}
              onClose={handleClosePrintModal}
              onDuplicateClick={(log) => {
                handleClosePrintModal();
                handleDuplicateLog(log);
              }}
              onTogglePaidLog={handleTogglePaidLog}
            />
          </div>
        </div>
      )}

    </div>
  );
}
