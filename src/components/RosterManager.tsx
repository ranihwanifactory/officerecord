import React, { useState, useEffect } from 'react';
import { WorkerMaster, ClientSiteMaster, WorkerCategory } from '../types';
import { Users, Building, Plus, Edit, Trash2, Phone, Save, X, Search } from 'lucide-react';
import { Pagination } from './Pagination';

interface RosterManagerProps {
  workers: WorkerMaster[];
  clients: ClientSiteMaster[];
  onSaveWorker: (worker: WorkerMaster) => void;
  onDeleteWorker: (id: string) => void;
  onSaveClient: (client: ClientSiteMaster) => void;
  onDeleteClient: (id: string) => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  workers,
  clients,
  onSaveWorker,
  onDeleteWorker,
  onSaveClient,
  onDeleteClient,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'workers' | 'clients'>('workers');

  // Search & Pagination States
  const [workerSearch, setWorkerSearch] = useState('');
  const [workerPage, setWorkerPage] = useState(1);
  const [clientSearch, setClientSearch] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setWorkerPage(1);
  }, [workerSearch]);

  useEffect(() => {
    setClientPage(1);
  }, [clientSearch]);

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
      w.category.toLowerCase().includes(workerSearch.toLowerCase()) ||
      (w.phone && w.phone.includes(workerSearch))
  );

  const workerTotalPages = Math.ceil(filteredWorkers.length / ITEMS_PER_PAGE) || 1;
  const paginatedWorkers = filteredWorkers.slice(
    (workerPage - 1) * ITEMS_PER_PAGE,
    workerPage * ITEMS_PER_PAGE
  );

  const filteredClients = clients.filter(
    (c) =>
      c.clientName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.contactPhone && c.contactPhone.includes(clientSearch)) ||
      (c.address && c.address.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const clientTotalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE) || 1;
  const paginatedClients = filteredClients.slice(
    (clientPage - 1) * ITEMS_PER_PAGE,
    clientPage * ITEMS_PER_PAGE
  );

  // Worker Modal State
  const [editingWorker, setEditingWorker] = useState<WorkerMaster | null>(null);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);

  // Client Modal State
  const [editingClient, setEditingClient] = useState<ClientSiteMaster | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Worker Form Fields
  const [wName, setWName] = useState('');
  const [wCategory, setWCategory] = useState<WorkerCategory>('보통');
  const [wRate, setWRate] = useState(160000);
  const [wResidentId, setWResidentId] = useState('');
  const [wPhone, setWPhone] = useState('');

  // Client Form Fields
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cAddress, setCAddress] = useState('');

  // Open Worker Modal
  const handleOpenWorkerModal = (worker?: WorkerMaster) => {
    if (worker) {
      setEditingWorker(worker);
      setWName(worker.name);
      setWCategory(worker.category || '보통');
      setWRate(worker.defaultDailyRate);
      setWResidentId(worker.residentId || '');
      setWPhone(worker.phone || '');
    } else {
      setEditingWorker(null);
      setWName('');
      setWCategory('보통');
      setWRate(160000);
      setWResidentId('');
      setWPhone('');
    }
    setIsWorkerModalOpen(true);
  };

  // Submit Worker
  const handleWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wName.trim()) {
      alert('인부 이름을 입력해 주세요.');
      return;
    }
    const item: WorkerMaster = {
      id: editingWorker?.id || `worker-${Date.now()}`,
      name: wName.trim(),
      category: wCategory,
      defaultDailyRate: Number(wRate) || 160000,
      residentId: wResidentId.trim(),
      phone: wPhone.trim(),
      createdAt: editingWorker?.createdAt || new Date().toISOString(),
    };
    onSaveWorker(item);
    setIsWorkerModalOpen(false);
  };

  // Open Client Modal
  const handleOpenClientModal = (client?: ClientSiteMaster) => {
    if (client) {
      setEditingClient(client);
      setCName(client.clientName);
      setCPhone(client.contactPhone);
      setCAddress(client.address || '');
    } else {
      setEditingClient(null);
      setCName('');
      setCPhone('');
      setCAddress('');
    }
    setIsClientModalOpen(true);
  };

  // Submit Client
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) {
      alert('업체/현장명을 입력해 주세요.');
      return;
    }
    const item: ClientSiteMaster = {
      id: editingClient?.id || `client-${Date.now()}`,
      clientName: cName.trim(),
      contactPhone: cPhone.trim(),
      address: cAddress.trim(),
    };
    onSaveClient(item);
    setIsClientModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Navigation Sub-Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-2">
          <button
            onClick={() => setActiveSubTab('workers')}
            className={`flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'workers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">인부 ({workers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('clients')}
            className={`flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'clients'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Building className="w-4 h-4 shrink-0" />
            <span className="truncate">업체/현장 ({clients.length})</span>
          </button>
        </div>

        <div>
          {activeSubTab === 'workers' ? (
            <button
              onClick={() => handleOpenWorkerModal()}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>새 인부 등록</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenClientModal()}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>새 현장/업체 등록</span>
            </button>
          )}
        </div>
      </div>

      {/* Workers Roster SubTab */}
      {activeSubTab === 'workers' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="인부 이름, 직종, 연락처 검색..."
              value={workerSearch}
              onChange={(e) => setWorkerSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3">인부 이름</th>
                  <th className="p-3 text-center">구분</th>
                  <th className="p-3 text-right">기본 일단가</th>
                  <th className="p-3">주민등록번호</th>
                  <th className="p-3">연락처</th>
                  <th className="p-3 text-center w-28">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                      등록된 인부가 없거나 검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  paginatedWorkers.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-100">
                        {w.name}
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">
                          {w.category}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-blue-600 dark:text-blue-400 font-mono">
                        ₩{w.defaultDailyRate.toLocaleString()}원
                      </td>
                      <td className="p-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {w.residentId || <span className="text-slate-300 dark:text-slate-600">-</span>}
                      </td>
                      <td className="p-3">
                        {w.phone ? (
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-medium text-xs">{w.phone}</span>
                            <a
                              href={`tel:${w.phone.replace(/[^0-9+]/g, '')}`}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer"
                              title={`${w.name} 님에게 바로 전화걸기`}
                            >
                              <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-900" />
                              <span>전화</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenWorkerModal(w)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="수정"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`'${w.name}' 인부를 명단에서 삭제하시겠습니까?`)) {
                                onDeleteWorker(w.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Workers Cards View */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedWorkers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                등록된 인부가 없거나 검색 결과가 없습니다.
              </div>
            ) : (
              paginatedWorkers.map((w) => (
                <div key={w.id} className="py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{w.name}</span>
                      <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">
                        {w.category}
                      </span>
                    </div>
                    <div className="font-black text-blue-600 dark:text-blue-400 font-mono text-sm">
                      ₩{w.defaultDailyRate.toLocaleString()}원
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">주민번호</span>
                      <span className="font-mono">{w.residentId || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">연락처</span>
                      {w.phone ? (
                        <a href={`tel:${w.phone.replace(/[^0-9+]/g, '')}`} className="font-mono text-blue-600 dark:text-blue-400 font-bold hover:underline">
                          {w.phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    {w.phone && (
                      <a
                        href={`tel:${w.phone.replace(/[^0-9+]/g, '')}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 rounded-xl"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>전화</span>
                      </a>
                    )}
                    <button
                      onClick={() => handleOpenWorkerModal(w)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center space-x-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>수정</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`'${w.name}' 인부를 명단에서 삭제하시겠습니까?`)) {
                          onDeleteWorker(w.id);
                        }
                      }}
                      className="p-1.5 text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Pagination
            currentPage={workerPage}
            totalPages={workerTotalPages}
            onPageChange={setWorkerPage}
            totalItems={filteredWorkers.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      )}

      {/* Clients SubTab */}
      {activeSubTab === 'clients' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="업체/현장명, 연락처, 주소 검색..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3">업체 / 현장명</th>
                  <th className="p-3">구인자 연락처</th>
                  <th className="p-3">현장 주소</th>
                  <th className="p-3 text-center w-28">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                      등록된 업체/현장이 없거나 검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-100">
                        {c.clientName}
                      </td>
                      <td className="p-3">
                        {c.contactPhone ? (
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-medium text-xs">{c.contactPhone}</span>
                            <a
                              href={`tel:${c.contactPhone.replace(/[^0-9+]/g, '')}`}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer"
                              title={`${c.clientName} 담당자에게 전화 연결`}
                            >
                              <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-900" />
                              <span>전화</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">-</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 text-xs">
                        {c.address || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenClientModal(c)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="수정"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`'${c.clientName}' 현장을 목록에서 삭제하시겠습니까?`)) {
                                onDeleteClient(c.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Clients Cards View */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedClients.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                등록된 업체/현장이 없거나 검색 결과가 없습니다.
              </div>
            ) : (
              paginatedClients.map((c) => (
                <div key={c.id} className="py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{c.clientName}</span>
                    {c.contactPhone && (
                      <a href={`tel:${c.contactPhone.replace(/[^0-9+]/g, '')}`} className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline">
                        {c.contactPhone}
                      </a>
                    )}
                  </div>

                  {c.address && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      📍 {c.address}
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    {c.contactPhone && (
                      <a
                        href={`tel:${c.contactPhone.replace(/[^0-9+]/g, '')}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 rounded-xl"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>전화</span>
                      </a>
                    )}
                    <button
                      onClick={() => handleOpenClientModal(c)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center space-x-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>수정</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`'${c.clientName}' 현장을 목록에서 삭제하시겠습니까?`)) {
                          onDeleteClient(c.id);
                        }
                      }}
                      className="p-1.5 text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Pagination
            currentPage={clientPage}
            totalPages={clientTotalPages}
            onPageChange={setClientPage}
            totalItems={filteredClients.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      )}

      {/* Worker Edit Modal */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                {editingWorker ? '인부 정보 수정' : '새 인부 등록'}
              </h3>
              <button onClick={() => setIsWorkerModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWorkerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">인부 이름 *</label>
                <input
                  type="text"
                  required
                  value={wName}
                  onChange={(e) => setWName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">구분</label>
                <select
                  value={wCategory || '보통'}
                  onChange={(e) => setWCategory(e.target.value as WorkerCategory)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="보통">보통</option>
                  <option value="조공">조공</option>
                  <option value="기공">기공</option>
                  <option value="특별기공">특별기공</option>
                  <option value="신호수">신호수</option>
                  <option value="잡급">잡급</option>
                  <option value="반장">반장</option>
                  <option value="기타">기타</option>
                  {wCategory === '일반' && <option value="일반">일반 (보통)</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">기본 일단가 (원)</label>
                <input
                  type="number"
                  step={5000}
                  value={wRate}
                  onChange={(e) => setWRate(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold text-blue-600 dark:text-blue-400 font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  주민등록번호 (위임장 표기용)
                </label>
                <input
                  type="text"
                  value={wResidentId}
                  onChange={(e) => setWResidentId(e.target.value)}
                  placeholder="예: 750101-1234567"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">연락처</label>
                <input
                  type="text"
                  value={wPhone}
                  onChange={(e) => setWPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Edit Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                {editingClient ? '현장/업체 정보 수정' : '새 현장/업체 등록'}
              </h3>
              <button onClick={() => setIsClientModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClientSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">업체 / 현장명 *</label>
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="예: 신성에스엔티"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">구인자 연락처</label>
                <input
                  type="text"
                  value={cPhone}
                  onChange={(e) => setCPhone(e.target.value)}
                  placeholder="예: 010-2998-1757"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">현장 주소</label>
                <input
                  type="text"
                  value={cAddress}
                  onChange={(e) => setCAddress(e.target.value)}
                  placeholder="예: 경북 성주군 성주읍"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
