import React, { useState, useMemo } from 'react';
import { DispatchLog, DispatchWorkerItem, InvoiceItem, WorkerMaster, ClientSiteMaster, WorkerCategory, OfficeSettings } from '../types';
import { Plus, Trash2, Save, Copy, X, Users, FileText, Calculator, AlertCircle, DollarSign, Clock, Utensils, Fuel, Check, CheckCircle2, Building, Calendar, CalendarDays, ChevronLeft, ChevronRight, Ban, AlertTriangle } from 'lucide-react';
import { getTodayDateString, getNextDateString, getDaysInMonth, getNextMonth, getPrevMonth, formatDateKorean, formatShortDate, getDateRangeList, getMondayToSundayWeek, formatWorkDatesSummary, parseLocalDate } from '../utils/date';

export interface BusyDateAssignment {
  date: string; // 'YYYY-MM-DD'
  clientName: string;
  siteAddress?: string;
  logId: string;
  logDate: string;
  gongsu?: number;
  workerName: string;
}

interface DispatchLogFormModalProps {
  initialLog?: DispatchLog | null;
  selectedDate?: string;
  existingLogs?: DispatchLog[];
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
  existingLogs = [],
  workersRoster,
  clientsRoster,
  officeProfiles = [],
  activeOfficeId = 'default',
  onSave,
  onClose,
  onDuplicateSave,
}) => {
  const todayStr = getTodayDateString();

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
      { id: 'item-1', name: '', category: '보통', dailyRate: 160000, gongsu: 1.0, remarks: '', overtimeFee: 0, mealFee: 0, fuelFee: 0, otherFee: 0, extraFeeRemarks: '' },
      { id: 'item-2', name: '', category: '보통', dailyRate: 160000, gongsu: 1.0, remarks: '', overtimeFee: 0, mealFee: 0, fuelFee: 0, otherFee: 0, extraFeeRemarks: '' },
    ]
  );

  // Form Mode 2: Invoice items state
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>(
    initialLog?.invoiceItems || [
      {
        id: 'inv-1',
        date: initialLog?.date || selectedDate || todayStr,
        workCategory: '보통',
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
        workCategory: '보통',
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
        category: '보통',
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
      category: w.category || '보통',
      dailyRate: w.defaultDailyRate || 160000,
      residentId: w.residentId || '',
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
          item.category = found.category || '보통';
          item.dailyRate = found.defaultDailyRate || 160000;
          if (found.residentId) {
            item.residentId = found.residentId;
          }
        }
      }

      updated[index] = item;
      return updated;
    });
  };

  // Base date parsing for current month & next month calculation (for weekly cross-month dispatch)
  const baseDateObj = parseLocalDate(date || todayStr);
  const currYear = baseDateObj.getFullYear();
  const currMonth = baseDateObj.getMonth() + 1; // 1~12
  const daysInCurrMonth = getDaysInMonth(currYear, currMonth);

  const nextMonthObj = getNextMonth(currYear, currMonth);
  const daysInNextMonth = getDaysInMonth(nextMonthObj.year, nextMonthObj.month);

  // Month view display mode: 'both' | 'current' | 'next'
  const [monthViewMode, setMonthViewMode] = useState<'both' | 'current' | 'next'>('both');

  // Pre-calculate busy dates for all workers from existing logs (to prevent double dispatch)
  const busyAssignmentsMap = useMemo(() => {
    const map: Record<string, Record<string, BusyDateAssignment>> = {};
    if (!existingLogs || existingLogs.length === 0) return map;

    existingLogs.forEach((l) => {
      // Exclude current log being edited to avoid false-positive collision with itself
      if (initialLog?.id && l.id === initialLog.id) return;

      const logClientName = l.clientName || '타 현장';
      const logSiteAddress = l.siteAddress || '';

      if (l.workers && l.workers.length > 0) {
        l.workers.forEach((w) => {
          const wName = w.name?.trim();
          if (!wName) return;

          const normKey = wName.toLowerCase();
          if (!map[normKey]) {
            map[normKey] = {};
          }

          const addDate = (dStr: string) => {
            if (!dStr) return;
            map[normKey][dStr] = {
              date: dStr,
              clientName: logClientName,
              siteAddress: logSiteAddress,
              logId: l.id,
              logDate: l.date,
              gongsu: w.gongsu,
              workerName: wName,
            };
          };

          if (w.workDates && w.workDates.length > 0) {
            w.workDates.forEach((d) => addDate(d));
          } else if (w.workDaysList && w.workDaysList.length > 0) {
            const ym = l.date ? l.date.substring(0, 7) : '';
            if (ym) {
              w.workDaysList.forEach((dNum) => {
                addDate(`${ym}-${String(dNum).padStart(2, '0')}`);
              });
            }
          } else if (l.date) {
            addDate(l.date);
          }
        });
      }
    });

    return map;
  }, [existingLogs, initialLog?.id]);

  // Helper to check if a specific worker has a busy assignment on a given date
  const getBusyAssignment = (worker: DispatchWorkerItem, dateStr: string): BusyDateAssignment | null => {
    const name = worker.name?.trim();
    if (!name) return null;
    const normKey = name.toLowerCase();
    return busyAssignmentsMap[normKey]?.[dateStr] || null;
  };

  // Helper to get all busy assignments for a worker
  const getWorkerBusyList = (worker: DispatchWorkerItem): BusyDateAssignment[] => {
    const name = worker.name?.trim();
    if (!name) return [];
    const normKey = name.toLowerCase();
    const workerAssignments = busyAssignmentsMap[normKey];
    if (!workerAssignments) return [];
    return (Object.values(workerAssignments) as BusyDateAssignment[]).sort((a, b) => a.date.localeCompare(b.date));
  };

  // Quick preset for weekly work period
  const handleQuickSetWeekPeriod = (preset: 'today' | 'this_week' | 'month_end_next' | 'one_week') => {
    const base = date || todayStr;
    if (preset === 'today') {
      setStartDate(base);
      setEndDate(base);
    } else if (preset === 'this_week') {
      const { startDate: s, endDate: e } = getMondayToSundayWeek(base);
      setStartDate(s);
      setEndDate(e);
      if (s.substring(0, 7) !== e.substring(0, 7)) {
        setMonthViewMode('both');
      }
    } else if (preset === 'month_end_next') {
      const startDay = Math.max(1, daysInCurrMonth - 3); // e.g. 28th
      const s = `${currYear}-${String(currMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
      const e = `${nextMonthObj.year}-${String(nextMonthObj.month).padStart(2, '0')}-03`; // 3rd of next month (7 days total)
      setStartDate(s);
      setEndDate(e);
      setMonthViewMode('both');
    } else if (preset === 'one_week') {
      const s = parseLocalDate(base);
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      setStartDate(base);
      const endStr = getTodayDateString(e);
      setEndDate(endStr);
      if (base.substring(0, 7) !== endStr.substring(0, 7)) {
        setMonthViewMode('both');
      }
    }
  };

  // Helper to extract full date strings for a worker (handles workDates & workDaysList backwards compatibility)
  const getWorkerDates = (worker: DispatchWorkerItem): string[] => {
    if (worker.workDates && worker.workDates.length > 0) {
      return worker.workDates;
    }
    if (worker.workDaysList && worker.workDaysList.length > 0) {
      return worker.workDaysList.map((d) => {
        return `${currYear}-${String(currMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      });
    }
    return [];
  };

  const handleToggleWorkerDateStr = (workerIdx: number, dateStr: string) => {
    const worker = workers[workerIdx];
    const currentDates = getWorkerDates(worker);
    const isCurrentlySelected = currentDates.includes(dateStr);

    // If trying to select a date that is already busy, block it and notify user
    if (!isCurrentlySelected) {
      const busy = getBusyAssignment(worker, dateStr);
      if (busy) {
        alert(
          `[출근일 중복 배정 불가 안내]\n\n'${worker.name}' 인부는 ${formatShortDate(dateStr)}에 이미 다른 현장 [${busy.clientName}]에 출근 배정되어 있습니다.\n\n출근일이 중복되지 않도록 해당 날짜는 선택할 수 없습니다.`
        );
        return;
      }
    }

    setWorkers((prev) => {
      const updated = [...prev];
      const targetWorker = { ...updated[workerIdx] };

      let newDates: string[];
      if (isCurrentlySelected) {
        newDates = currentDates.filter((d) => d !== dateStr);
      } else {
        newDates = [...currentDates, dateStr].sort();
      }

      targetWorker.workDates = newDates;
      // Also sync workDaysList for backwards compatibility with legacy components
      targetWorker.workDaysList = newDates.map((d) => parseInt(d.split('-')[2], 10));
      if (newDates.length > 0) {
        targetWorker.gongsu = newDates.length;
      }
      updated[workerIdx] = targetWorker;
      return updated;
    });
  };

  const handleToggleWorkerDay = (workerIdx: number, dayNum: number) => {
    const dateStr = `${currYear}-${String(currMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    handleToggleWorkerDateStr(workerIdx, dateStr);
  };

  const handleSelectWorkerDateRange = (workerIdx: number) => {
    const range = getDateRangeList(startDate, endDate);
    if (range.length === 0) return;
    const worker = workers[workerIdx];

    const busyReports: string[] = [];
    const availableDates = range.filter((d) => {
      const busy = getBusyAssignment(worker, d);
      if (busy) {
        busyReports.push(`${formatShortDate(d)} (${busy.clientName})`);
        return false;
      }
      return true;
    });

    if (availableDates.length === 0 && range.length > 0) {
      alert(
        `[출근일 중복 배정 불가]\n\n'${worker.name || '인부'}'의 선택된 기간 전체(${range.length}일)가 이미 다른 현장에 출근 배정되어 있어 적용할 수 없습니다.\n\n배정된 내역:\n${busyReports.join('\n')}`
      );
      return;
    }

    if (busyReports.length > 0) {
      alert(
        `[출근일 중복 방지 자동 제외 안내]\n\n'${worker.name}' 인부의 타 현장 출근 배정일(${busyReports.length}일)을 제외하고, 남은 ${availableDates.length}일이 출근일로 설정되었습니다.\n\n제외된 날짜:\n${busyReports.join(', ')}`
      );
    }

    setWorkers((prev) => {
      const updated = [...prev];
      const targetWorker = { ...updated[workerIdx] };
      targetWorker.workDates = availableDates;
      targetWorker.workDaysList = availableDates.map((d) => parseInt(d.split('-')[2], 10));
      targetWorker.gongsu = availableDates.length > 0 ? availableDates.length : 1;
      updated[workerIdx] = targetWorker;
      return updated;
    });
  };

  const handleApplyDateRangeToAllWorkers = () => {
    const range = getDateRangeList(startDate, endDate);
    if (range.length === 0) {
      alert('작업 기간(시작일 ~ 종료일)을 먼저 확인해 주세요.');
      return;
    }

    const skippedReports: string[] = [];

    setWorkers((prev) =>
      prev.map((worker) => {
        if (!worker.name.trim()) return worker;

        const busyDates: string[] = [];
        const availableDates = range.filter((d) => {
          const busy = getBusyAssignment(worker, d);
          if (busy) {
            busyDates.push(`${formatShortDate(d)}(${busy.clientName})`);
            return false;
          }
          return true;
        });

        if (busyDates.length > 0) {
          skippedReports.push(`• ${worker.name}: ${busyDates.join(', ')} 제외 (${availableDates.length}일 배정)`);
        }

        return {
          ...worker,
          workDates: availableDates,
          workDaysList: availableDates.map((d) => parseInt(d.split('-')[2], 10)),
          gongsu: availableDates.length > 0 ? availableDates.length : 1,
        };
      })
    );

    if (skippedReports.length > 0) {
      alert(
        `[전원 기간출근 일괄 적용 완료]\n타 현장에 이미 출근 배정된 날짜는 중복 방지를 위해 자동으로 제외되었습니다:\n\n${skippedReports.join('\n')}`
      );
    }
  };

  const handleClearWorkerDays = (workerIdx: number) => {
    setWorkers((prev) => {
      const updated = [...prev];
      updated[workerIdx] = {
        ...updated[workerIdx],
        workDates: [],
        workDaysList: [],
        gongsu: 1.0,
      };
      return updated;
    });
  };

  const handleRemoveWorkerRow = (index: number) => {
    setWorkers((prev) => prev.filter((_, i) => i !== index));
  };

  // --- FORM MODE 2 HANDLERS (Invoice Summary) ---
  const handleAddInvoiceRow = () => {
    let nextDate = date || getTodayDateString();
    if (invoiceItems.length > 0) {
      const lastItem = invoiceItems[invoiceItems.length - 1];
      nextDate = getNextDateString(lastItem.date, nextDate);
    } else if (startDate) {
      nextDate = startDate;
    }

    setInvoiceItems((prev) => [
      ...prev,
      {
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: nextDate,
        workCategory: '보통',
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
      const categoryName = w.category === '일반' ? '보통' : (w.category || '보통');

      return {
        id: `inv-sync-${idx}-${Date.now()}`,
        date: date,
        workCategory: `${w.name} (${categoryName})`,
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
  const workerTotalGongsu = validWorkers.reduce(
    (acc, w) => acc + (Number(w.gongsu) || (w.workDaysList && w.workDaysList.length > 0 ? w.workDaysList.length : 1)),
    0
  );
  const workerLaborCostTotal = validWorkers.reduce(
    (acc, w) => acc + (Number(w.dailyRate) || 0) * (Number(w.gongsu) || (w.workDaysList && w.workDaysList.length > 0 ? w.workDaysList.length : 1)),
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
    .reduce((acc, w) => acc + (Number(w.gongsu) || (w.workDaysList && w.workDaysList.length > 0 ? w.workDaysList.length : 1)), 0);
  const generalGongsuCount = validWorkers
    .filter((w) => !w.category || !w.category.includes('기공'))
    .reduce((acc, w) => acc + (Number(w.gongsu) || (w.workDaysList && w.workDaysList.length > 0 ? w.workDaysList.length : 1)), 0);

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
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    작업 기간 (시작일 ~ 종료일)
                  </label>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickSetWeekPeriod('today')}
                      className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/60 dark:hover:text-blue-300 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      당일
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSetWeekPeriod('this_week')}
                      className="px-2 py-0.5 text-[11px] font-bold rounded bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                    >
                      이번주 (월~일)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSetWeekPeriod('month_end_next')}
                      className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                      title="월말~익월 초 7일간 주단위 설정 (월말 넘어가기)"
                    >
                      📅 월말~익월 주간 (7일)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSetWeekPeriod('one_week')}
                      className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 hover:text-blue-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      기준일+6일 (1주)
                    </button>
                  </div>
                </div>
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
                      <option value="" disabled className="dark:bg-slate-800 dark:text-slate-200">자주 쓰는 현장 선택 (가나다순)</option>
                      {[...clientsRoster]
                        .sort((a, b) => (a.clientName || '').localeCompare(b.clientName || '', 'ko-KR'))
                        .map((c) => (
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
                  <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md border border-blue-200">
                    {validWorkers.length}명 등록 중 (총 {workerTotalGongsu}공수)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {startDate && endDate && (
                    <button
                      type="button"
                      onClick={handleApplyDateRangeToAllWorkers}
                      className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1.5 rounded-lg border border-emerald-300 transition-colors cursor-pointer flex items-center space-x-1"
                      title={`등록된 모든 인부에게 작업기간(${formatShortDate(startDate)}~${formatShortDate(endDate)}) 출근일과 공수를 일괄 적용합니다`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>전원 기간출근 일괄 적용</span>
                    </button>
                  )}
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
                              {[...workersRoster]
                                .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko-KR'))
                                .map((w) => (
                                  <option key={w.id} value={w.name}>
                                    {w.name} ({[w.category, w.specialty].filter(Boolean).join(' / ')} - ₩{w.defaultDailyRate.toLocaleString()})
                                  </option>
                                ))}
                            </datalist>
                          </td>

                          {/* Category */}
                          {/* Category */}
                          <td className="p-2">
                            <select
                              value={item.category || '보통'}
                              onChange={(e) => handleUpdateWorkerRow(idx, 'category', e.target.value as WorkerCategory)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                              <option value="보통">보통</option>
                              <option value="조공">조공</option>
                              <option value="기공">기공</option>
                              <option value="특별기공">특별기공</option>
                              <option value="신호수">신호수</option>
                              <option value="잡급">잡급</option>
                              <option value="반장">반장</option>
                              <option value="철거작업">철거작업</option>
                              <option value="미장/목수/타일">미장/목수/타일</option>
                              <option value="기타">기타</option>
                              {item.category === '일반' && <option value="일반">일반 (보통)</option>}
                              {item.category && !['보통', '조공', '기공', '특별기공', '신호수', '잡급', '반장', '철거작업', '미장/목수/타일', '기타', '일반'].includes(item.category) && (
                                <option value={item.category}>{item.category}</option>
                              )}
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

                        {/* 1~31 Day Grid & Weekly Cross-Month Selector Sub-Row */}
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={8} className="px-3 py-2.5">
                            {(() => {
                                const workerDates = getWorkerDates(item);
                              const workerBusyList = getWorkerBusyList(item);
                              const todayBusy = getBusyAssignment(item, date);
                              const hasNextMonthDates = workerDates.some((d) =>
                                d.startsWith(`${nextMonthObj.year}-${String(nextMonthObj.month).padStart(2, '0')}`)
                              );
                              const isCrossMonthActive =
                                startDate.substring(0, 7) !== endDate.substring(0, 7) || hasNextMonthDates;

                              const itemWage = (item.dailyRate || 0) * (item.gongsu || 1);
                              const itemExtra =
                                (item.overtimeFee || 0) +
                                (item.mealFee || 0) +
                                (item.fuelFee || 0) +
                                (item.otherFee || 0);
                              const itemTotal = itemWage + itemExtra;

                              return (
                                <div className="space-y-2">
                                  {/* Top Bar: Summary, Wage, and Action Buttons */}
                                  <div className="flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-700 gap-1.5">
                                    <div className="flex items-center space-x-2 flex-wrap">
                                      <span className="text-blue-600 font-bold flex items-center">
                                        <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600" />
                                        출근일 선택:
                                      </span>
                                      <span className="bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded font-mono font-bold text-xs">
                                        {workerDates.length > 0
                                          ? `총 ${workerDates.length}일 출근 [${workerDates.map((d) => formatShortDate(d)).join(', ')}]`
                                          : '날짜를 클릭하여 선택'}
                                      </span>
                                      {isCrossMonthActive && (
                                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                                          월말~익월 주간 연계됨
                                        </span>
                                      )}

                                      {/* Alert for worker who has existing dispatch on other sites */}
                                      {workerBusyList.length > 0 && (
                                        <div className="flex items-center space-x-1 text-[11px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-lg border border-rose-200">
                                          <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                          <span className="font-bold shrink-0">타 현장 출근 배정({workerBusyList.length}건):</span>
                                          <div className="flex flex-wrap gap-1">
                                            {workerBusyList.map((b) => (
                                              <span
                                                key={b.date}
                                                className="bg-white text-rose-700 border border-rose-300 px-1.5 py-0.2 rounded font-mono font-bold text-[10px]"
                                                title={`[${b.date}] ${b.clientName} 현장에 출근 배정됨 (중복 선택 불가)`}
                                              >
                                                {formatShortDate(b.date)} ({b.clientName})
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center space-x-2 flex-wrap">
                                      <span className="text-slate-700 font-mono text-xs">
                                        인건비 ₩{itemWage.toLocaleString()}원
                                        {itemExtra > 0 && (
                                          <span className="text-amber-700 font-bold ml-1.5">
                                            + 기타 ₩{itemExtra.toLocaleString()}원
                                          </span>
                                        )}
                                        <span className="text-blue-700 font-black ml-1.5 text-sm">
                                          = 총 ₩{itemTotal.toLocaleString()}원
                                        </span>
                                      </span>

                                      {startDate && endDate && (
                                        <button
                                          type="button"
                                          onClick={() => handleSelectWorkerDateRange(idx)}
                                          className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded transition-colors cursor-pointer shadow-2xs"
                                          title={`설정된 작업기간(${formatShortDate(startDate)}~${formatShortDate(endDate)}) 출근 적용 (중복 배정일은 자동 제외)`}
                                        >
                                          기간전체({formatShortDate(startDate)}~{formatShortDate(endDate)}) 선택
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        disabled={!!todayBusy}
                                        onClick={() => {
                                          handleToggleWorkerDateStr(idx, date);
                                        }}
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors shadow-2xs ${
                                          todayBusy
                                            ? 'bg-rose-100 text-rose-400 border border-rose-200 cursor-not-allowed line-through'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                                        }`}
                                        title={
                                          todayBusy
                                            ? `당일(${formatShortDate(date)})은 이미 [${todayBusy.clientName}] 현장에 출근 배정되어 선택할 수 없습니다.`
                                            : `당일(${formatShortDate(date)}) 선택`
                                        }
                                      >
                                        당일({formatShortDate(date)}) 선택
                                      </button>
                                      {workerDates.length > 0 && (
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

                                  {/* Dual Month / Cross-Month Day Selector Container */}
                                  <div className="p-2 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                                    {/* Month Navigation Tab Bar & Legend */}
                                    <div className="flex flex-wrap items-center justify-between gap-1 pb-1.5 border-b border-slate-100 text-xs font-bold">
                                      <div className="flex items-center space-x-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setMonthViewMode('both')}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            monthViewMode === 'both'
                                              ? 'bg-blue-600 text-white shadow-2xs'
                                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                          }`}
                                        >
                                          📅 당월({currMonth}월) + 다음달({nextMonthObj.month}월) 함께 보기
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setMonthViewMode('current')}
                                          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            monthViewMode === 'current'
                                              ? 'bg-blue-600 text-white shadow-2xs'
                                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                          }`}
                                        >
                                          {currMonth}월만 보기
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setMonthViewMode('next')}
                                          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            monthViewMode === 'next'
                                              ? 'bg-emerald-600 text-white shadow-2xs'
                                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                          }`}
                                        >
                                          다음달({nextMonthObj.month}월) 넘어가기 ➔
                                        </button>
                                      </div>

                                      {/* Visual Legend for Date Status */}
                                      <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                                        <div className="flex items-center space-x-1">
                                          <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
                                          <span>선택됨</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block"></span>
                                          <span>선택가능</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <span className="w-3 h-3 rounded bg-rose-50 border border-rose-300 text-rose-500 font-bold flex items-center justify-center text-[9px] line-through">
                                            ✕
                                          </span>
                                          <span className="text-rose-600 font-bold">타현장 배정 (선택불가)</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Current Month Days Grid */}
                                    {(monthViewMode === 'both' || monthViewMode === 'current') && (
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-blue-700">
                                          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                                          <span>{currYear}년 {currMonth}월 (당월)</span>
                                          <span className="text-[10px] text-slate-400 font-normal">
                                            (1일 ~ {daysInCurrMonth}일)
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1">
                                          {Array.from({ length: daysInCurrMonth }, (_, i) => i + 1).map((dNum) => {
                                            const dateStr = `${currYear}-${String(currMonth).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
                                            const isSelected = workerDates.includes(dateStr);
                                            const busyInfo = getBusyAssignment(item, dateStr);
                                            const isBusy = !!busyInfo;

                                            return (
                                              <button
                                                key={`curr-${dNum}`}
                                                type="button"
                                                disabled={isBusy}
                                                onClick={() => handleToggleWorkerDateStr(idx, dateStr)}
                                                className={`w-6 h-6 text-[11px] font-bold rounded flex items-center justify-center transition-all relative select-none ${
                                                  isBusy
                                                    ? 'bg-rose-50 text-rose-400 border border-rose-200 line-through cursor-not-allowed opacity-80'
                                                    : isSelected
                                                    ? 'bg-blue-600 text-white font-black scale-105 shadow-2xs border border-blue-700 cursor-pointer'
                                                    : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 cursor-pointer'
                                                }`}
                                                title={
                                                  isBusy
                                                    ? `[선택불가 / 타현장 배정됨] ${currMonth}월 ${dNum}일은 이미 "${busyInfo.clientName}" 현장에 출근 배정되어 있습니다.`
                                                    : `${currMonth}월 ${dNum}일 출근 선택/해제`
                                                }
                                              >
                                                {dNum}
                                                {isBusy && (
                                                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Next Month Days Grid (Cross-Month / Weekly Dispatch) */}
                                    {(monthViewMode === 'both' || monthViewMode === 'next') && (
                                      <div className="space-y-1 pt-1.5 border-t border-slate-100">
                                        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-700">
                                          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                                          <span>{nextMonthObj.year}년 {nextMonthObj.month}월 (다음달 / 익월)</span>
                                          <span className="text-[10px] text-slate-400 font-normal">
                                            (1일 ~ {daysInNextMonth}일)
                                          </span>
                                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">
                                            주단위 익월 연계
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1">
                                          {Array.from({ length: daysInNextMonth }, (_, i) => i + 1).map((dNum) => {
                                            const dateStr = `${nextMonthObj.year}-${String(nextMonthObj.month).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
                                            const isSelected = workerDates.includes(dateStr);
                                            const busyInfo = getBusyAssignment(item, dateStr);
                                            const isBusy = !!busyInfo;

                                            return (
                                              <button
                                                key={`next-${dNum}`}
                                                type="button"
                                                disabled={isBusy}
                                                onClick={() => handleToggleWorkerDateStr(idx, dateStr)}
                                                className={`w-6 h-6 text-[11px] font-bold rounded flex items-center justify-center transition-all relative select-none ${
                                                  isBusy
                                                    ? 'bg-rose-50 text-rose-400 border border-rose-200 line-through cursor-not-allowed opacity-80'
                                                    : isSelected
                                                    ? 'bg-emerald-600 text-white font-black scale-105 shadow-2xs border border-emerald-700 cursor-pointer'
                                                    : 'bg-emerald-50/40 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200/80 cursor-pointer'
                                                }`}
                                                title={
                                                  isBusy
                                                    ? `[선택불가 / 타현장 배정됨] ${nextMonthObj.month}월 ${dNum}일은 이미 "${busyInfo.clientName}" 현장에 출근 배정되어 있습니다.`
                                                    : `${nextMonthObj.month}월 ${dNum}일 (다음달) 출근 선택/해제`
                                                }
                                              >
                                                {dNum}
                                                {isBusy && (
                                                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
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
                      <th className="p-2.5 w-36 min-w-[130px]">일자</th>
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
                        <td className="p-2 min-w-[130px]">
                          <input
                            type="text"
                            value={item.date}
                            onChange={(e) => handleUpdateInvoiceRow(idx, 'date', e.target.value)}
                            placeholder="2026-08-11"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                          />
                        </td>

                        {/* Work Category */}
                        <td className="p-2">
                          <select
                            value={item.workCategory || '보통'}
                            onChange={(e) => handleUpdateInvoiceRow(idx, 'workCategory', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                          >
                            <option value="보통">보통</option>
                            <option value="조공">조공</option>
                            <option value="기공">기공</option>
                            <option value="특별기공">특별기공</option>
                            <option value="신호수">신호수</option>
                            <option value="잡급">잡급</option>
                            <option value="반장">반장</option>
                            <option value="철거작업">철거작업</option>
                            <option value="미장/목수/타일">미장/목수/타일</option>
                            <option value="기타">기타</option>
                            {item.workCategory === '일반' && <option value="일반">일반 (보통)</option>}
                            {item.workCategory && !['보통', '조공', '기공', '특별기공', '신호수', '잡급', '반장', '철거작업', '미장/목수/타일', '기타', '일반'].includes(item.workCategory) && (
                              <option value={item.workCategory}>{item.workCategory}</option>
                            )}
                          </select>
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
                {formType === 'worker_roster' && (
                  <span className="ml-2 text-blue-300 font-bold">(총 인원: {validWorkers.length}명 / 총 {workerTotalGongsu}공수)</span>
                )}
                {formType === 'invoice_summary' && (
                  <span className="ml-2 text-emerald-400 font-bold">(총 용역수: {invoiceTotalServiceCount}공수)</span>
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
