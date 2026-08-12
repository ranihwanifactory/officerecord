import React, { useState, useEffect } from 'react';
import { DispatchLog, DispatchWorkerItem, WorkerMaster, ClientSiteMaster, WorkerCategory } from '../types';
import { Plus, Trash2, Save, Copy, X, Users, Building, AlertCircle } from 'lucide-react';

interface DispatchLogFormModalProps {
  initialLog?: DispatchLog | null;
  selectedDate?: string;
  workersRoster: WorkerMaster[];
  clientsRoster: ClientSiteMaster[];
  onSave: (log: DispatchLog) => void;
  onClose: () => void;
  onDuplicateSave?: (log: DispatchLog) => void;
}

export const DispatchLogFormModal: React.FC<DispatchLogFormModalProps> = ({
  initialLog,
  selectedDate,
  workersRoster,
  clientsRoster,
  onSave,
  onClose,
  onDuplicateSave,
}) => {
  const todayStr = new Date().toISOString().substring(0, 10);
  
  const [date, setDate] = useState<string>(
    initialLog?.date || selectedDate || todayStr
  );
  const [startDate, setStartDate] = useState<string>(initialLog?.startDate || initialLog?.date || selectedDate || todayStr);
  const [endDate, setEndDate] = useState<string>(initialLog?.endDate || initialLog?.date || selectedDate || todayStr);
  const [clientName, setClientName] = useState<string>(initialLog?.clientName || '');
  const [clientContact, setClientContact] = useState<string>(initialLog?.clientContact || '');
  const [siteAddress, setSiteAddress] = useState<string>(initialLog?.siteAddress || '');
  const [memo, setMemo] = useState<string>(initialLog?.memo || '');

  // Workers list state
  const [workers, setWorkers] = useState<DispatchWorkerItem[]>(
    initialLog?.workers || [
      { id: 'item-1', name: '', category: '일반', dailyRate: 160000, gongsu: 1.0, remarks: '' },
      { id: 'item-2', name: '', category: '일반', dailyRate: 160000, gongsu: 1.0, remarks: '' },
    ]
  );

  // Duplicate target date state
  const [duplicateTargetDate, setDuplicateTargetDate] = useState<string>(
    selectedDate || todayStr
  );
  const [showDuplicateDialog, setShowDuplicateDialog] = useState<boolean>(false);

  // Auto-fill client contact and address when client name is picked from master list
  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const found = clientsRoster.find((c) => c.clientName === val);
    setClientName(val);
    if (found?.contactPhone) {
      setClientContact(found.contactPhone);
    }
    if (found?.address) {
      setSiteAddress(found.address);
    }
  };

  // Add empty worker row
  const handleAddWorkerRow = () => {
    setWorkers((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: '',
        category: '일반',
        dailyRate: 160000,
        gongsu: 1.0,
        remarks: '',
      },
    ]);
  };

  // Quick load default 2 workers from roster
  const handleQuickLoadDefault2 = () => {
    const top2 = workersRoster.slice(0, 2);
    if (top2.length === 0) return;
    const newItems: DispatchWorkerItem[] = top2.map((w, idx) => ({
      id: `item-load-${idx}-${Date.now()}`,
      workerId: w.id,
      name: w.name,
      category: w.category || '일반',
      dailyRate: w.defaultDailyRate || 160000,
      gongsu: 1.0,
      remarks: '',
    }));
    setWorkers(newItems);
  };

  // Update worker row
  const handleUpdateWorkerRow = (index: number, field: keyof DispatchWorkerItem, value: any) => {
    setWorkers((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // If worker name changed via dropdown, set default rate & category
      if (field === 'name') {
        const found = workersRoster.find((w) => w.name === value);
        if (found) {
          item.workerId = found.id;
          item.category = found.category || '일반';
          item.dailyRate = found.defaultDailyRate || 160000;
        }
      }

      updated[index] = item;
      return updated;
    });
  };

  // Toggle day number 1..31 for a worker
  const handleToggleWorkerDay = (workerIdx: number, dayNum: number) => {
    setWorkers((prev) => {
      const updated = [...prev];
      const worker = { ...updated[workerIdx] };
      const currentDays = worker.workDaysList ? [...worker.workDaysList] : [];

      let newDays: number[];
      if (currentDays.includes(dayNum)) {
        newDays = currentDays.filter((d) => d !== dayNum);
      } else {
        newDays = [...currentDays, dayNum].sort((a, b) => a - b);
      }

      worker.workDaysList = newDays;
      if (newDays.length > 0) {
        worker.gongsu = newDays.length;
      }
      updated[workerIdx] = worker;
      return updated;
    });
  };

  // Select all or clear all 1..31 days for a worker
  const handleClearWorkerDays = (workerIdx: number) => {
    setWorkers((prev) => {
      const updated = [...prev];
      updated[workerIdx] = { ...updated[workerIdx], workDaysList: [], gongsu: 1.0 };
      return updated;
    });
  };

  // Remove worker row
  const handleRemoveWorkerRow = (index: number) => {
    setWorkers((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate totals
  const validWorkers = workers.filter((w) => w.name.trim() !== '');
  const generalGongsuCount = validWorkers
    .filter((w) => w.category === '일반')
    .reduce((acc, w) => acc + (Number(w.gongsu) || 0), 0);
  const skillGongsuCount = validWorkers
    .filter((w) => w.category === '기공')
    .reduce((acc, w) => acc + (Number(w.gongsu) || 0), 0);
  const totalAmount = validWorkers.reduce(
    (acc, w) => acc + (Number(w.dailyRate) || 0) * (Number(w.gongsu) || 0),
    0
  );

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('업체/현장명을 입력해 주세요.');
      return;
    }
    if (validWorkers.length === 0) {
      alert('최소 1명 이상의 인부를 등록해 주세요.');
      return;
    }

    const logToSave: DispatchLog = {
      id: initialLog?.id || `log-${date}-${Date.now()}`,
      date,
      startDate: startDate || date,
      endDate: endDate || date,
      clientName: clientName.trim(),
      clientContact: clientContact.trim(),
      siteAddress: siteAddress.trim(),
      generalGongsuCount,
      skillGongsuCount,
      workers: validWorkers,
      totalAmount,
      memo: memo.trim(),
      createdAt: initialLog?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(logToSave);
  };

  // Duplicate Save Handler (Same log details, different date)
  const handleConfirmDuplicate = () => {
    if (!duplicateTargetDate) {
      alert('복사하여 저장할 날짜를 선택해 주세요.');
      return;
    }
    if (!clientName.trim()) {
      alert('업체/현장명을 입력해 주세요.');
      return;
    }

    const newLog: DispatchLog = {
      id: `log-${duplicateTargetDate}-${Date.now()}`,
      date: duplicateTargetDate,
      startDate: duplicateTargetDate,
      endDate: duplicateTargetDate,
      clientName: clientName.trim(),
      clientContact: clientContact.trim(),
      siteAddress: siteAddress.trim(),
      generalGongsuCount,
      skillGongsuCount,
      workers: validWorkers,
      totalAmount,
      memo: memo.trim() ? `${memo} (반복 복사)` : '반복 일정 등록',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (onDuplicateSave) {
      onDuplicateSave(newLog);
    } else {
      onSave(newLog);
    }
    setShowDuplicateDialog(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              출
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {initialLog ? '출력표 일지 수정' : '새 출력표 일지 등록'}
              </h2>
              <p className="text-xs text-slate-500">
                날짜, 현장명, 인부명과 단가를 기록하면 자동으로 정산됩니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Top Metadata Row */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  출력일 (기준일) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDate(v);
                    if (!startDate) setStartDate(v);
                    if (!endDate) setEndDate(v);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Work Period Range: Start Date ~ End Date */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  작업 기간 (시작일 ~ 종료일)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-slate-400 font-bold text-sm">~</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 border-t border-slate-200/60">
              {/* Client / Site Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    업체 / 현장명 <span className="text-rose-500">*</span>
                  </label>
                  {clientsRoster.length > 0 && (
                    <select
                      onChange={handleClientSelect}
                      defaultValue=""
                      className="text-[11px] text-blue-600 bg-transparent border-none outline-none font-semibold cursor-pointer"
                    >
                      <option value="" disabled>자주 쓰는 현장 선택</option>
                      {clientsRoster.map((c) => (
                        <option key={c.id} value={c.clientName}>
                          {c.clientName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="예: 신성에스엔티"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Client Contact Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  구인자 연락처
                </label>
                <input
                  type="text"
                  placeholder="예: 010-2998-1757"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Site Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  현장 주소
                </label>
                <input
                  type="text"
                  placeholder="예: 경북 성주군 성주읍 성주순환로 123"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Workers Table Section */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  출력 인부 명단 및 단가 설정
                </h3>
                <span className="text-xs bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-md border border-blue-100">
                  {validWorkers.length}명 등록 중
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {workersRoster.length > 0 && (
                  <button
                    type="button"
                    onClick={handleQuickLoadDefault2}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    ⚡ 기본 인부 2명 세트 자동 불러오기
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddWorkerRow}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>인부 줄 추가</span>
                </button>
              </div>
            </div>

            {/* Table Grid */}
            <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-3 w-12 text-center">NO</th>
                    <th className="p-3 w-40">인부 이름</th>
                    <th className="p-3 w-28">구분</th>
                    <th className="p-3 w-36">일단가 (원)</th>
                    <th className="p-3 w-24">공수</th>
                    <th className="p-3">비고</th>
                    <th className="p-3 w-12 text-center">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {workers.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-slate-50/80">
                        {/* NO */}
                        <td className="p-3 text-center text-xs font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Worker Name */}
                        <td className="p-2">
                          <div className="relative">
                            <input
                              type="text"
                              list={`workers-list-${idx}`}
                              placeholder="이름 입력 또는 선택"
                              value={item.name}
                              onChange={(e) => handleUpdateWorkerRow(idx, 'name', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <datalist id={`workers-list-${idx}`}>
                              {workersRoster.map((w) => (
                                <option key={w.id} value={w.name}>
                                  {w.name} ({w.category} - ₩{w.defaultDailyRate.toLocaleString()})
                                </option>
                              ))}
                            </datalist>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-2">
                          <select
                            value={item.category}
                            onChange={(e) => handleUpdateWorkerRow(idx, 'category', e.target.value as WorkerCategory)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="일반">일반</option>
                            <option value="기공">기공</option>
                          </select>
                        </td>

                        {/* Daily Rate */}
                        <td className="p-2">
                          <input
                            type="number"
                            step={5000}
                            value={item.dailyRate || ''}
                            onChange={(e) => handleUpdateWorkerRow(idx, 'dailyRate', Number(e.target.value))}
                            placeholder="160000"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-bold text-blue-600 font-mono outline-none text-right focus:ring-2 focus:ring-blue-500"
                          />
                        </td>

                        {/* Gongsu */}
                        <td className="p-2">
                          <input
                            type="number"
                            step={0.5}
                            min={0.5}
                            max={31}
                            value={item.gongsu || 1.0}
                            onChange={(e) => handleUpdateWorkerRow(idx, 'gongsu', Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-800 outline-none text-center focus:ring-2 focus:ring-blue-500"
                          />
                        </td>

                        {/* Remarks */}
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="특이사항 / 작업내용"
                            value={item.remarks || ''}
                            onChange={(e) => handleUpdateWorkerRow(idx, 'remarks', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>

                        {/* Remove Row */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveWorkerRow(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>

                      {/* 1~31 Day Grid Picker Cell Sub-Row */}
                      <tr className="bg-slate-50/70 border-b border-slate-200">
                        <td colSpan={7} className="px-3 py-2">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-700 gap-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-600 font-semibold">📅 비고란 1~31일 출근 선택:</span>
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                                  {item.workDaysList && item.workDaysList.length > 0
                                    ? `${item.workDaysList.length}일 선택 [${item.workDaysList.join(', ')}일]`
                                    : '일수 직접 지정 또는 클릭하여 선택'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-emerald-700 font-mono font-black text-xs">
                                  총임금: ₩{((item.dailyRate || 0) * (item.gongsu || 1)).toLocaleString()}원
                                  <span className="text-[10px] font-normal text-slate-500 ml-1">
                                    (단가 ₩{(item.dailyRate || 0).toLocaleString()} × {item.gongsu || 1}일)
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentDay = Number(date.substring(8, 10)) || 1;
                                    handleToggleWorkerDay(idx, currentDay);
                                  }}
                                  className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-0.5 rounded transition-colors cursor-pointer"
                                >
                                  당일({Number(date.substring(8, 10)) || 1}일) 선택
                                </button>
                                {item.workDaysList && item.workDaysList.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleClearWorkerDays(idx)}
                                    className="text-[10px] text-slate-500 hover:text-rose-600 underline cursor-pointer"
                                  >
                                    선택해제
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* 1 to 31 Mini Day Grid */}
                            <div className="flex flex-wrap items-center gap-1">
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((dNum) => {
                                const isSelected = item.workDaysList?.includes(dNum);
                                return (
                                  <button
                                    key={dNum}
                                    type="button"
                                    onClick={() => handleToggleWorkerDay(idx, dNum)}
                                    className={`w-6 h-6 text-[11px] font-bold rounded flex items-center justify-center transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-blue-600 text-white font-black scale-105 shadow-xs border border-blue-700'
                                        : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200'
                                    }`}
                                    title={`${dNum}일 출근 선택/해제`}
                                  >
                                    {dNum}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Realtime Auto Settlement Calculations Summary Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-blue-700">
                자동 정산 집계 (작업인원)
              </div>
              <div className="text-sm font-bold text-slate-800">
                일반: <span className="text-blue-600">{generalGongsuCount}공수</span> &nbsp;|&nbsp; 
                기공: <span className="text-blue-600">{skillGongsuCount}공수</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-slate-500">
                금일 합계 정산금액
              </div>
              <div className="text-2xl font-black text-blue-600 font-mono">
                ₩{totalAmount.toLocaleString()}원
              </div>
            </div>
          </div>

          {/* Memo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              메모 / 관리자 참고사항
            </label>
            <input
              type="text"
              placeholder="예: 8월 11일 신성에스엔티 4명 출력 완료"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Repeat Schedule Clone Option Trigger */}
          <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowDuplicateDialog(!showDuplicateDialog)}
              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-2 rounded-xl border border-emerald-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4 text-emerald-600" />
              <span>동일한 내용으로 다른 날짜에 반복 저장</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-sm flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>출력표 일지 저장</span>
              </button>
            </div>
          </div>

          {/* Quick Repeat Schedule Duplicate Modal Dialog Overlay */}
          {showDuplicateDialog && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>동일 일정 반복 복사 기능</span>
              </div>
              <p className="text-xs text-slate-600">
                현재 입력된 업체명, 인부 명단, 단가 정보를 그대로 유지하고 **날짜만 변경**하여 새 출력표로 즉시 저장합니다.
              </p>
              
              <div className="flex items-center space-x-3 pt-1">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    복사하여 저장할 목표 날짜
                  </label>
                  <input
                    type="date"
                    value={duplicateTargetDate}
                    onChange={(e) => setDuplicateTargetDate(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-800"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleConfirmDuplicate}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs cursor-pointer mt-5"
                >
                  선택한 날짜로 복사 저장하기
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};
