import React, { useState } from 'react';
import { WorkerMaster, ClientSiteMaster, WorkerCategory } from '../types';
import { Users, Building, Plus, Edit, Trash2, Phone, Save, X } from 'lucide-react';

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

  // Worker Modal State
  const [editingWorker, setEditingWorker] = useState<WorkerMaster | null>(null);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);

  // Client Modal State
  const [editingClient, setEditingClient] = useState<ClientSiteMaster | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Worker Form Fields
  const [wName, setWName] = useState('');
  const [wCategory, setWCategory] = useState<WorkerCategory>('일반');
  const [wRate, setWRate] = useState(160000);
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
      setWCategory(worker.category);
      setWRate(worker.defaultDailyRate);
      setWPhone(worker.phone || '');
    } else {
      setEditingWorker(null);
      setWName('');
      setWCategory('일반');
      setWRate(160000);
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
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('workers')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'workers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>등록 인부 명단 ({workers.length}명)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('clients')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'clients'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>등록 업체/현장 ({clients.length}개)</span>
          </button>
        </div>

        <div>
          {activeSubTab === 'workers' ? (
            <button
              onClick={() => handleOpenWorkerModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>새 인부 등록</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenClientModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>새 현장/업체 등록</span>
            </button>
          )}
        </div>
      </div>

      {/* Workers Roster SubTab */}
      {activeSubTab === 'workers' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-3">인부 이름</th>
                  <th className="p-3 text-center">구분</th>
                  <th className="p-3 text-right">기본 일단가</th>
                  <th className="p-3">연락처</th>
                  <th className="p-3 text-center w-28">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workers.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-800">
                      {w.name}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-100">
                        {w.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-blue-600 font-mono">
                      ₩{w.defaultDailyRate.toLocaleString()}원
                    </td>
                    <td className="p-3 text-slate-500 font-medium text-xs">
                      {w.phone || '-'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleOpenWorkerModal(w)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
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
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clients SubTab */}
      {activeSubTab === 'clients' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-3">업체 / 현장명</th>
                  <th className="p-3">구인자 연락처</th>
                  <th className="p-3">현장 주소</th>
                  <th className="p-3 text-center w-28">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-800">
                      {c.clientName}
                    </td>
                    <td className="p-3 font-semibold text-blue-600 font-mono text-xs">
                      {c.contactPhone || '-'}
                    </td>
                    <td className="p-3 text-slate-500 text-xs">
                      {c.address || '-'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleOpenClientModal(c)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`'${c.clientName}' 현장을 삭제하시겠습니까?`)) {
                              onDeleteClient(c.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Worker Edit Modal */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">
                {editingWorker ? '인부 정보 수정' : '새 인부 등록'}
              </h3>
              <button onClick={() => setIsWorkerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWorkerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">인부 이름 *</label>
                <input
                  type="text"
                  required
                  value={wName}
                  onChange={(e) => setWName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">구분</label>
                <select
                  value={wCategory}
                  onChange={(e) => setWCategory(e.target.value as WorkerCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="일반">일반</option>
                  <option value="기공">기공</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">기본 일단가 (원)</label>
                <input
                  type="number"
                  step={5000}
                  value={wRate}
                  onChange={(e) => setWRate(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-blue-600 font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">연락처</label>
                <input
                  type="text"
                  value={wPhone}
                  onChange={(e) => setWPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">
                {editingClient ? '현장/업체 정보 수정' : '새 현장/업체 등록'}
              </h3>
              <button onClick={() => setIsClientModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClientSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">업체 / 현장명 *</label>
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="예: 신성에스엔티"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">구인자 연락처</label>
                <input
                  type="text"
                  value={cPhone}
                  onChange={(e) => setCPhone(e.target.value)}
                  placeholder="예: 010-2998-1757"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">현장 주소</label>
                <input
                  type="text"
                  value={cAddress}
                  onChange={(e) => setCAddress(e.target.value)}
                  placeholder="예: 경북 성주군 성주읍"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
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
