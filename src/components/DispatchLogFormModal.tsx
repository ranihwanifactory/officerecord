import React, { useState } from 'react';
import { DispatchLog, DispatchWorkerItem, InvoiceItem, WorkerMaster, ClientSiteMaster, WorkerCategory, OfficeSettings } from '../types';
import { Plus, Trash2, Save, Copy, X, Users, FileText, Calculator, AlertCircle, DollarSign, Clock, Utensils, Fuel, Check, CheckCircle2, Building } from 'lucide-react';

interface DispatchLogFormModalProps {
  initialLog?: DispatchLog | null;
  selectedDate?: string;
  workersRoster: WorkerMaster[];
  clientsRoster: ClientSiteMaster[];
  officeProfiles?: OfficeSettings[];
  activeOfficeId?: string;
  onSave: (log: DispatchLog) => void;
  onClose: () => void;
  onDuplicateSave?: (log: DispatchLog) => void;
}

export const DispatchLogFormModal: React.FC<DispatchLogFormModalProps> = ({
  initialLog,
  selectedDate,
  workersRoster,
  clientsRoster,
  officeProfiles = [],
  activeOfficeId = 'default',
  onSave,
  onClose,
  onDuplicateSave,
}) => {
  const todayStr = new Date().toISOString().substring(0, 10);

  const [officeProfileId, setOfficeProfileId] = useState<string>(
    initialLog?.officeProfileId || activeOfficeId || officeProfiles[0]?.id || 'default'
  );
  
  const [formType, setFormType] = useState<'worker_roster' | 'invoice_summary'>(
    initialLog?.formType || 'worker_roster'
  );

  const [date, setDate] = useState<string>(
    initialLog?.date || selectedDate || todayStr
  );
  const [startDate, setStartDate] = useState<string>(initialLog?.startDate || initialLog?.date || selectedDate || todayStr);
  const [endDate, setEndDate] = useState<string>(initialLog?.endDate || initialLog?.date || selectedDate || todayStr);
  const [clientName, setClientName] = useState<string>(initialLog?.clientName || '');
  const [clientContact, setClientContact] = useState<string>(initialLog?.clientContact || '');
  const [siteAddress, setSiteAddress] = useState<string>(initialLog?.siteAddress || '');
  const [memo, setMemo] = useState<string>(initialLog?.memo || '');
  const [isPaid, setIsPaid] = useState<boolean>(initialLog?.isPaid || false);

  // Form Mode 1: Workers list state
  const [workers, setWorkers] = useState<DispatchWorkerItem[]>(
    initialLog?.workers || [
      { id: 'item-1', name: '', category: '일반', dailyRate: 160000, gongsu: 1.0, remarks: '', overtimeFee: 0, mealFee: 0, fuelFee: 0, otherFee: 0, extraFeeRemarks: '' },
      { id: 'item-2', name: '', category: '일반', dailyRate: 160000, gongsu: 1.0, remarks: '', overtimeFee: 0, mealFee: 0, fuelFee: 0, otherFee: 0, extraFeeRemarks: '' },
    ]
  );

  // Form Mode 2: Invoice items state
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>(
    initialLog?.invoiceItems || [
      {
        id: 'inv-1',
        date: initialLog?.date || selectedDate || todayStr,
        workCategory: '보통인부',
        serviceCount: 2.0,
        unitPrice: 160000,
        laborCost: 320000,
        overtimeFee: 0,
        mealFee: 0,
        fuelFee: 0,
        otherFee: 0,
        totalItemAmount: 320000,
        remarks: '',
      },
      {
        id: 'inv-2',
        date: initialLog?.date || selectedDate || todayStr,
        workCategory: '특별기공',
        serviceCount: 1.0,
        unitPrice: 220000,
        laborCost: 220000,
        overtimeFee: 0,
        mealFee: 0,
        fuelFee: 0,
        otherFee: 0,
        totalItemAmount: 220000,
        remarks: '',
      },
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

  // --- FORM MODE 1 HANDLERS (Worker Roster) ---
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
        overtimeFee: 0,
        mealFee: 0,
        fuelFee: 0,
        otherFee: 0,
        extraFeeRemarks: '',
      },
    ]);
  };

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
      overtimeFee: 0,
      mealFee: 0,
      fuelFee: 0,
      otherFee: 0,
      extraFeeRemarks: '',
    }));
    setWorkers(newItems);
  };

  const handleUpdateWorkerRow = (index: number, field: keyof DispatchWorkerItem, value: any) => {
    setWorkers((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

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

  const handleClearWorkerDays = (workerIdx: number) => {
    setWorkers((prev) => {
      const updated = [...prev];
      updated[workerIdx] = { ...updated[workerIdx], workDaysList: [], gongsu: 1.0 };
      return updated;
    });
  };

  const handleRemoveWorkerRow = (index: number) => {
    setWorkers((prev) => prev.filter((_, i) => i !== index));
  };

  // --- FORM MODE 2 HANDLERS (Invoice Summary) ---
  const handleAddInvoiceRow = () => {
    setInvoiceItems((prev) => [
      ...prev,
      {
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: date,
        workCategory: '보통인부',
        serviceCount: 1.0,
        unitPrice: 160000,
        laborCost: 160000,
        overtimeFee: 0,
        mealFee: 0,
        fuelFee: 0,
        otherFee: 0,
        totalItemAmount: 160000,
        remarks: '',
      },
    ]);
  };

  const handleUpdateInvoiceRow = (index: number, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Recalculate labor cost and total item amount
      const count = Number(item.serviceCount) || 0;
      const price = Number(item.unitPrice) || 0;
      const ot = Number(item.overtimeFee) || 0;
      const meal = Number(item.mealFee) || 0;
      const fuel = Number(item.fuelFee) || 0;
      const other = Number(item.otherFee) || 0;

      item.laborCost = count * price;
      item.totalItemAmount = item.laborCost + ot + meal + fuel + other;

      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveInvoiceRow = (index: number) => {
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Sync workers to invoice items automatically if needed
  const handleSyncWorkersToInvoice = () => {
    const validW = workers.filter((w) => w.name.trim() !== '');
    if (validW.length === 0) {
      alert('변환할 인부 명단이 비어 있습니다.');
      return;
    }

    const newInvItems: InvoiceItem[] = validW.map((w, idx) => {
      const labor = (w.dailyRate || 0) * (w.gongsu || 1);
      const ot = w.overtimeFee || 0;
      const meal = w.mealFee || 0;
      const fuel = w.fuelFee || 0;
      const oth = w.otherFee || 0;
      const total = labor + ot + meal + fuel + oth;

      return {
        id: `inv-sync-${idx}-${Date.now()}`,
        date: date,
        workCategory: `${w.name} (${w.category || '용역'})`,
        serviceCount: w.gongsu || 1.0,
        unitPrice: w.dailyRate || 160000,
        laborCost: labor,
        overtimeFee: ot,
        mealFee: meal,
        fuelFee: fuel,
        otherFee: oth,
        totalItemAmount: total,
        remarks: w.remarks || w.extraFeeRemarks || '',
      };
    });

    setInvoiceItems(newInvItems);
    alert('인부 명단 데이터가 계산서 용역 항목으로 자동 변환되었습니다.');
  };

  // --- CALCULATION TOTALS ---
  const validWorkers = workers.filter((w) => w.name.trim() !== '');
  const workerLaborCostTotal = validWorkers.reduce(
    (acc, w) => acc + (Number(w.dailyRate) || 0) * (Number(w.gongsu) || 0),
    0
  );
  const workerExtraFeeTotal = validWorkers.reduce(
    (acc, w) =>
      acc +
      (Number(w.overtimeFee) || 0) +
      (Number(w.mealFee) || 0) +
      (Number(w.fuelFee) || 0) +
      (Number(w.otherFee) || 0),
    0
  );
  const workerGrandTotal = workerLaborCostTotal + workerExtraFeeTotal;

  const skillGongsuCount = validWorkers
    .filter((w) => w.category && w.category.includes('기공'))
    .reduce((acc, w) => acc + (Number(w.gongsu) || 0), 0);
  const generalGongsuCount = validWorkers
    .filter((w) => !w.category || !w.category.includes('기공'))
    .reduce((acc, w) => acc + (Number(w.gongsu) || 0), 0);

  // Invoice Totals
  const validInvoiceItems = invoiceItems.filter((i) => i.workCategory.trim() !== '');
  const invoiceTotalServiceCount = validInvoiceItems.reduce(
    (acc, i) => acc + (Number(i.serviceCount) || 0),
    0
  );
  const invoiceLaborCostTotal = validInvoiceItems.reduce(
    (acc, i) => acc + (Number(i.laborCost) || 0),
    0
  );
  const invoiceExtraFeeTotal = validInvoiceItems.reduce(
    (acc, i) =>
      acc +
      (Number(i.overtimeFee) || 0) +
      (Number(i.mealFee) || 0) +
      (Number(i.fuelFee) || 0) +
      (Number(i.otherFee) || 0),
    0
  );
  const invoiceGrandTotal = invoiceLaborCostTotal + invoiceExtraFeeTotal;

  // Final totals based on selected formType
  const activeLaborCost = formType === 'worker_roster' ? workerLaborCostTotal : invoiceLaborCostTotal;
  const activeExtraFee = formType === 'worker_roster' ? workerExtraFeeTotal : invoiceExtraFeeTotal;
  const activeGrandTotal = formType === 'worker_roster' ? workerGrandTotal : invoiceGrandTotal;

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('업체/현장명을 입력해 주세요.');
      return;
    }

    if (formType === 'worker_roster' && validWorkers.length === 0) {
      alert('최소 1명 이상의 인부를 등록해 주세요.');
      return;
    }

    if (formType === 'invoice_summary' && validInvoiceItems.length === 0) {
      alert('최소 1개 이상의 계산서 용역 항목을 등록해 주세요.');
      return;
    }

    let finalGeneralGongsu = generalGongsuCount;
    let finalSkillGongsu = skillGongsuCount;

    if (formType === 'invoice_summary' && validWorkers.length === 0) {
      finalGeneralGongsu = 0;
      finalSkillGongsu = 0;
      validInvoiceItems.forEach((i) => {
        const count = Number(i.serviceCount) || 0;
        if (i.workCategory && i.workCategory.includes('기공')) {
          finalSkillGongsu += count;
        } else {
          finalGeneralGongsu += count;
        }
      });
    }

    const logToSave: DispatchLog = {
      id: initialLog?.id || `log-${date}-${Date.now()}`,
      date,
      officeProfileId,
      startDate: startDate || date,
      endDate: endDate || date,
      clientName: clientName.trim(),
      clientContact: clientContact.trim(),
      siteAddress: siteAddress.trim(),
      generalGongsuCount: finalGeneralGongsu,
      skillGongsuCount: finalSkillGongsu,
      workers: validWorkers,
      formType,
      invoiceItems: validInvoiceItems,
      totalLaborCost: activeLaborCost,
      totalExtraFee: activeExtraFee,
      totalAmount: activeGrandTotal,
      grandTotalAmount: activeGrandTotal,
      memo: memo.trim(),
      isPaid,
      paidAt: isPaid ? (initialLog?.paidAt || new Date().toISOString()) : '',
      createdAt: initialLog?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(logToSave);
  };

  // Duplicate Save Handler
  const handleConfirmDuplicate = () => {
    if (!duplicateTargetDate) {
      alert('복사하여 저장할 날짜를 선택해 주세요.');
      return;
    }
    if (!clientName.trim()) {
      alert('업체/현장명을 입력해 주세요.');
      return;
    }

    let finalGeneralGongsu = generalGongsuCount;
    let finalSkillGongsu = skillGongsuCount;

    if (formType === 'invoice_summary' && validWorkers.length === 0) {
      finalGeneralGongsu = 0;
      finalSkillGongsu = 0;
      validInvoiceItems.forEach((i) => {
        const count = Number(i.serviceCount) || 0;
        if (i.workCategory && i.workCategory.includes('기공')) {
          finalSkillGongsu += count;
        } else {
          finalGeneralGongsu += count;
        }
      });
    }

    const newLog: DispatchLog = {
      id: `log-${duplicateTargetDate}-${Date.now()}`,
      date: duplicateTargetDate,
      officeProfileId,
      startDate: duplicateTargetDate,
      endDate: duplicateTargetDate,
      clientName: clientName.trim(),
      clientContact: clientContact.trim(),
      siteAddress: siteAddress.trim(),
      generalGongsuCount: finalGeneralGongsu,
      skillGongsuCount: finalSkillGongsu,
      workers: validWorkers,
      formType,
      invoiceItems: validInvoiceItems,
      totalLaborCost: activeLaborCost,
      totalExtraFee: activeExtraFee,
      totalAmount: activeGrandTotal,
      grandTotalAmount: activeGrandTotal,
      memo: memo.trim() ? `${memo} (반복 복사)` : '반복 일정 등록',
      isPaid,
      paidAt: isPaid ? new Date().toISOString() : '',
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-5xl max-h-[94vh] flex flex-col my-auto transition-colors">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80 rounded-t-2xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              출
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                {initialLog ? '출력표 일지 수정' : '새 출력표 일지 작성'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                인부별 출근표 작성 및 일별 용역수/인건비/기타비용을 기록합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Form Type Selector Tabs */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-3 pt-1 pb-1 uppercase tracking-wider">
              작업 양식 선택 (입력폼 모드)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormType('worker_roster')}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all cursor-pointer text-left ${
                  formType === 'worker_roster'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800 font-bold'
                    : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-semibold'
                }`}
              >
                <div className={`p-2 rounded-lg ${formType === 'worker_roster' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold">📋 [양식 1] 인부별 출근 출력표</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    인부별 출근일수(1~31일) 지정 + 단가 & 기타비용 기록
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormType('invoice_summary')}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all cursor-pointer text-left ${
                  formType === 'invoice_summary'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-emerald-800 font-bold'
                    : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-semibold'
                }`}
              >
                <div className={`p-2 rounded-lg ${formType === 'invoice_summary' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold">📋 [양식 2] 일별 용역수 & 인건비 출력표</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    일별 용역수(공수), 단가, 인건비 및 기타비용(잔업/식대/주유비) 정산
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Top Metadata Row */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
            {/* Issuing Office Profile Selector */}
            {officeProfiles.length > 0 && (
              <div className="pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                  <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>발행 사무소 선택 (출력표 표기 직인 / 계좌 / 연락처)</span>
                </label>
                <select
                  value={officeProfileId}
                  onChange={(e) => setOfficeProfileId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  {officeProfiles.map((p) => (
                    <option key={p.id || p.officeName} value={p.id || 'default'} className="dark:bg-slate-800">
                      {p.profileName || p.officeName} ({p.officeName} / {p.phone1 || '연락처'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  작성 기준일 <span className="text-rose-500">*</span>
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
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Work Period Range */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  작업 기간 (시작일 ~ 종료일)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-slate-400 font-bold text-sm">~</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              {/* Client / Site Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    업체 / 현장명 <span className="text-rose-500">*</span>
                  </label>
                  {clientsRoster.length > 0 && (
                    <select
                      onChange={handleClientSelect}
                      defaultValue=""
                      className="text-[11px] text-blue-600 dark:text-blue-400 bg-transparent border-none outline-none font-semibold cursor-pointer"
                    >
                      <option value="" disabled className="dark:bg-slate-800 dark:text-slate-200">자주 쓰는 현장 선택</option>
                      {clientsRoster.map((c) => (
                        <option key={c.id} value={c.clientName} className="dark:bg-slate-800 dark:text-slate-200">
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
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              {/* Client Contact Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  구인자 연락처
                </label>
                <input
                  type="text"
                  placeholder="예: 010-2998-1757"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              {/* Site Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  현장 주소
                </label>
                <input
                  type="text"
                  placeholder="예: 경북 성주군 성주읍 성주순환로 123"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            {/* Payment Status Check Control */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  결제(입금) 완료 상태
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  관리자가 체크하면 출력표 및 목록에 '결제완료' 도장/표시가 적용됩니다.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPaid(!isPaid)}
                className={`px-4 py-2 rounded-xl border flex items-center space-x-2 transition-all cursor-pointer font-bold text-xs sm:text-sm ${
                  isPaid
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                  isPaid ? 'bg-white text-emerald-600 border-white' : 'bg-slate-200 text-slate-400 border-slate-300'
                }`}>
                  {isPaid && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span>{isPaid ? '✓ 결제 완료 (입금 확인)' : '미결제 (입금 대기)'}</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* MODE 1: WORKER ROSTER FORM TABLE */}
          {/* ======================================================== */}
          {formType === 'worker_roster' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-800">
                    인부 명단 및 출근/기타비용 내역
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
                    <span>인부 추가</span>
                  </button>
                </div>
              </div>

              {/* Workers Table */}
              <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-2.5 w-10 text-center">NO</th>
                      <th className="p-2.5 w-36">인부 이름</th>
                      <th className="p-2.5 w-24">구분</th>
                      <th className="p-2.5 w-32">일단가 (원)</th>
                      <th className="p-2.5 w-20">공수</th>
                      <th className="p-2.5 w-72">기타비용 (잔업/식대/주유)</th>
                      <th className="p-2.5">비고</th>
                      <th className="p-2.5 w-10 text-center">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {workers.map((item, idx) => (
                      <React.Fragment key={item.id}>
                        <tr className="hover:bg-slate-50/80">
                          {/* NO */}
                          <td className="p-2.5 text-center text-xs font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Worker Name */}
                          <td className="p-2">
                            <input
                              type="text"
                              list={`workers-list-${idx}`}
                              placeholder="이름 입력/선택"
                              value={item.name}
                              onChange={(e) => handleUpdateWorkerRow(idx, 'name', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <datalist id={`workers-list-${idx}`}>
                              {workersRoster.map((w) => (
                                <option key={w.id} value={w.name}>
                                  {w.name} ({w.category} - ₩{w.defaultDailyRate.toLocaleString()})
                                </option>
                              ))}
                            </datalist>
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
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-blue-600 font-mono outline-none text-right focus:ring-2 focus:ring-blue-500"
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
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1.5 text-xs font-bold text-slate-800 outline-none text-center focus:ring-2 focus:ring-blue-500"
                            />
                          </td>

                          {/* Extra Fees Inline Inputs */}
                          <td className="p-2">
                            <div className="grid grid-cols-3 gap-1">
                              <input
                                type="number"
                                step={1000}
                                placeholder="잔업비"
                                value={item.overtimeFee || ''}
                                onChange={(e) => handleUpdateWorkerRow(idx, 'overtimeFee', Number(e.target.value))}
                                className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] font-mono font-bold text-amber-700 outline-none"
                                title="잔업비"
                              />
                              <input
                                type="number"
                                step={1000}
                                placeholder="식대"
                                value={item.mealFee || ''}
                                onChange={(e) => handleUpdateWorkerRow(idx, 'mealFee', Number(e.target.value))}
                                className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] font-mono font-bold text-emerald-700 outline-none"
                                title="식대"
                              />
                              <input
                                type="number"
                                step={1000}
                                placeholder="주유비"
                                value={item.fuelFee || ''}
                                onChange={(e) => handleUpdateWorkerRow(idx, 'fuelFee', Number(e.target.value))}
                                className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] font-mono font-bold text-sky-700 outline-none"
                                title="주유비"
                              />
                            </div>
                          </td>

                          {/* Remarks */}
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="비고 / 특이사항"
                              value={item.remarks || ''}
                              onChange={(e) => handleUpdateWorkerRow(idx, 'remarks', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>

                          {/* Delete */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveWorkerRow(idx)}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>

                        {/* 1~31 Day Grid & Extra Fee Remarks Sub-Row */}
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={8} className="px-3 py-2">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-700 gap-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-blue-600 font-semibold">📅 비고란 1~31일 출근 선택:</span>
                                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                                    {item.workDaysList && item.workDaysList.length > 0
                                      ? `${item.workDaysList.length}일 선택 [${item.workDaysList.join(', ')}일]`
                                      : '일수 클릭하여 선택'}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-3">
                                  <span className="text-slate-700 font-mono text-xs">
                                    인건비 ₩{((item.dailyRate || 0) * (item.gongsu || 1)).toLocaleString()}원
                                    {((item.overtimeFee || 0) + (item.mealFee || 0) + (item.fuelFee || 0) + (item.otherFee || 0)) > 0 && (
                                      <span className="text-amber-700 font-bold ml-1.5">
                                        + 기타비용 ₩{((item.overtimeFee || 0) + (item.mealFee || 0) + (item.fuelFee || 0) + (item.otherFee || 0)).toLocaleString()}원
                                      </span>
                                    )}
                                    <span className="text-blue-700 font-black ml-2 text-sm">
                                      = 총 ₩{(
                                        (item.dailyRate || 0) * (item.gongsu || 1) +
                                        (item.overtimeFee || 0) +
                                        (item.mealFee || 0) +
                                        (item.fuelFee || 0) +
                                        (item.otherFee || 0)
                                      ).toLocaleString()}원
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
          )}

          {/* ======================================================== */}
          {/* MODE 2: INVOICE SUMMARY FORM TABLE */}
          {/* ======================================================== */}
          {formType === 'invoice_summary' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-800">
                    일별 용역수, 인건비 & 기타비용 세부 항목
                  </h3>
                  <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                    {validInvoiceItems.length}개 항목 청구
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSyncWorkersToInvoice}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                  >
                    🔄 인부 명단 → 용역 항목 자동 전환
                  </button>
                  <button
                    type="button"
                    onClick={handleAddInvoiceRow}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>용역 항목 추가</span>
                  </button>
                </div>
              </div>

              {/* Invoice Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-2.5 w-10 text-center">NO</th>
                      <th className="p-2.5 w-28">일자</th>
                      <th className="p-2.5 w-40">용역 항목 (직종)</th>
                      <th className="p-2.5 w-24">용역수 (인원)</th>
                      <th className="p-2.5 w-32">단가 (원)</th>
                      <th className="p-2.5 w-32">인건비 소계</th>
                      <th className="p-2.5 w-64">기타비용 (잔업/식대/주유)</th>
                      <th className="p-2.5 w-32">항목 청구합계</th>
                      <th className="p-2.5">비고 / 세부내역</th>
                      <th className="p-2.5 w-10 text-center">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {invoiceItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        {/* NO */}
                        <td className="p-2.5 text-center text-xs font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Date */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.date}
                            onChange={(e) => handleUpdateInvoiceRow(idx, 'date', e.target.value)}
                            placeholder="08월 11일"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-800 outline-none"
                          />
                        </td>

                        {/* Work Category */}
                        <td className="p-2">
                          <input
                            type="text"
                            list={`category-list-${idx}`}
                            value={item.workCategory}
                            onChange={(e) => handleUpdateInvoiceRow(idx, 'workCategory', e.target.value)}
                            placeholder="보통인부 / 기공 / 잡급"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <datalist id={`category-list-${idx}`}>
                            <option value="보통인부" />
                            <option value="특별기공" />
                            <option value="잡급 / 단순노무" />
                            <option value="신호수 / 안전요원" />
                            <option value="철거 / 할차작업" />
                            <option value="미장 / 목수 / 타일" />
                          </datalist>
                        </td>

                        {/* Service Count */}
                        <td className="p-2">
                          <input
                            type="number"
                            step={0.5}
                            min={0.5}
                            value={item.serviceCount || ''}
                            onChange={(e) => handleUpdateInvoiceRow(idx, 'serviceCount', Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 outline-none text-center focus:ring-2 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="p-2">
                          <input
                            type="number"
                            step={5000}
                            value={item.unitPrice || ''}
                            onChange={(e) => handleUpdateInvoiceRow(idx, 'unitPrice', Number(e.target.value))}
                            placeholder="160000"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-emerald-700 font-mono outline-none text-right focus:ring-2 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Labor Cost Subtotal */}
                        <td className="p-2 font-mono font-bold text-xs text-slate-800 text-right">
                          ₩{(item.laborCost || 0).toLocaleString()}원
                        </td>

                        {/* Extra Fees */}
                        <td className="p-2">
                          <div className="grid grid-cols-3 gap-1">
                            <input
                              type="number"
                              step={1000}
                              placeholder="잔업"
                              value={item.overtimeFee || ''}
                              onChange={(e) => handleUpdateInvoiceRow(idx, 'overtimeFee', Number(e.target.value))}
                              className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] font-mono font-bold text-amber-700 outline-none"
                              title="잔업비"
                            />
                            <input
                              type="number"
                              step={1000}
                              placeholder="식대"
                              value={item.mealFee || ''}
                              onChange={(e) => handleUpdateInvoiceRow(idx, 'mealFee', Number(e.target.value))}
                              className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] font-mono font-bold text-emerald-700 outline-none"
                              title="식대"
                            />
                            <input
                              type="number"
                              step={1000}
                              placeholder="주유"
                              value={item.fuelFee || ''}
                              onChange={(e) => handleUpdateInvoiceRow(idx, 'fuelFee', Number(e.target.value))}
                              className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] font-mono font-bold text-sky-700 outline-none"
                              title="주유비"
                            />
                          </div>
                        </td>

                        {/* Total Item Amount */}
                        <td className="p-2 font-mono font-black text-xs text-emerald-700 text-right">
                          ₩{(item.totalItemAmount || 0).toLocaleString()}원
                        </td>

                        {/* Remarks */}
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="비고 / 세부사항"
                            value={item.remarks || ''}
                            onChange={(e) => handleUpdateInvoiceRow(idx, 'remarks', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Delete */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveInvoiceRow(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Realtime Auto Settlement Calculations Summary Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <span>실시간 정산 및 청구 금액 집계</span>
                {formType === 'invoice_summary' ? (
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">용역수 양식</span>
                ) : (
                  <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold">인부 출근 양식</span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-200">
                인건비 소계: <span className="font-bold text-white font-mono">₩{activeLaborCost.toLocaleString()}원</span> &nbsp;|&nbsp;
                기타비용 합계: <span className="font-bold text-amber-400 font-mono">₩{activeExtraFee.toLocaleString()}원</span>
                {formType === 'invoice_summary' && (
                  <span className="ml-2 text-emerald-400 font-bold">(총 용역수: {invoiceTotalServiceCount}명/공수)</span>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-400">
                최종 총 청구 금액 (인건비 + 기타비용)
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                ₩{activeGrandTotal.toLocaleString()}원
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
              placeholder="예: 8월 11일 출력표 작성 완료"
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
                <span>저장하기</span>
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
                현재 입력된 내용 및 단가/기타비용 정보를 그대로 유지하고 **목표 날짜만 변경**하여 즉시 복사 저장합니다.
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
