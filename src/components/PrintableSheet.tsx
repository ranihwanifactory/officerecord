import React, { useRef, useState } from 'react';
import { DispatchLog, OfficeSettings, InvoiceItem, WorkerMaster } from '../types';
import { Printer, Download, Copy, X, Image, Loader2, Calculator, Users, CheckCircle2, Clock, Check, FileSignature } from 'lucide-react';
import { toPng } from 'html-to-image';
import { DelegationSheet } from './DelegationSheet';

interface PrintableSheetProps {
  log: DispatchLog;
  officeSettings: OfficeSettings;
  officeProfiles?: OfficeSettings[];
  workersRoster?: WorkerMaster[];
  initialViewMode?: 'worker_roster' | 'invoice_summary' | 'delegation_letter';
  onUpdateLog?: (updatedLog: DispatchLog) => void;
  onClose?: () => void;
  onDuplicateClick?: (log: DispatchLog) => void;
  onTogglePaidLog?: (log: DispatchLog) => void;
}

export const PrintableSheet: React.FC<PrintableSheetProps> = ({
  log,
  officeSettings,
  officeProfiles = [],
  workersRoster = [],
  initialViewMode,
  onUpdateLog,
  onClose,
  onDuplicateClick,
  onTogglePaidLog,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(
    log.officeProfileId || officeSettings.id || 'default'
  );

  const activeOffice = (officeProfiles.length > 0
    ? (officeProfiles.find((p) => p.id === selectedOfficeId) || officeProfiles.find((p) => p.id === log.officeProfileId) || officeSettings)
    : officeSettings);
  
  // Allow switching view between Worker Roster Sheet, Invoice Summary Sheet, and Delegation Letter
  const [viewMode, setViewMode] = useState<'worker_roster' | 'invoice_summary' | 'delegation_letter'>(
    initialViewMode || log.formType || 'worker_roster'
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!sheetRef.current) return;
    try {
      setIsExporting(true);
      const element = sheetRef.current;
      
      const dataUrl = await toPng(element, {
        cacheBust: true,
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 800,
        height: element.offsetHeight,
        style: {
          margin: '0',
          transform: 'none',
          boxShadow: 'none',
        },
      });

      const link = document.createElement('a');
      const prefix = viewMode === 'delegation_letter' ? '위임장' : '출력표';
      link.download = `${prefix}_${log.clientName || '현장'}_${log.date}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export sheet image:', err);
      alert('이미지 저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsExporting(false);
    }
  };

  // Format Date strings (e.g., "2026-08-11" -> "2026년 08월 11일")
  const formatDateKorean = (dStr?: string) => {
    if (!dStr) return '';
    const y = dStr.substring(0, 4);
    const m = dStr.substring(5, 7);
    const d = dStr.substring(8, 10);
    return `${y}년 ${m}월 ${d}일`;
  };

  const fullDateKorean = formatDateKorean(log.date);
  const shortDateKorean = log.date ? `${log.date.substring(5, 7)}월 ${log.date.substring(8, 10)}일` : '';
  
  // Work period display text
  const workPeriodText = (log.startDate && log.endDate && (log.startDate !== log.date || log.endDate !== log.date))
    ? `${formatDateKorean(log.startDate)} ~ ${formatDateKorean(log.endDate)}`
    : (log.startDate && log.endDate)
      ? `${formatDateKorean(log.startDate)} ~ ${formatDateKorean(log.endDate)}`
      : fullDateKorean;

  // Worker counts & totals
  const skillCount = log.workers.filter(w => w.category && w.category.includes('기공')).reduce((acc, w) => acc + (w.gongsu || 1), 0);
  const generalCount = log.workers.filter(w => !w.category || !w.category.includes('기공')).reduce((acc, w) => acc + (w.gongsu || 1), 0);

  const workerLaborCostTotal = log.workers.reduce((acc, w) => acc + (w.dailyRate || 0) * (w.gongsu || 1), 0);
  const workerExtraFeeTotal = log.workers.reduce(
    (acc, w) => acc + (w.overtimeFee || 0) + (w.mealFee || 0) + (w.fuelFee || 0) + (w.otherFee || 0),
    0
  );
  const workerGrandTotal = workerLaborCostTotal + workerExtraFeeTotal;

  // Invoice items & totals
  const rawInvoiceItems: InvoiceItem[] = log.invoiceItems && log.invoiceItems.length > 0
    ? log.invoiceItems
    : log.workers.map((w, idx) => ({
        id: `inv-auto-${idx}`,
        date: log.date,
        workCategory: `${w.name} (${w.category || '보통인부'})`,
        serviceCount: w.gongsu || 1.0,
        unitPrice: w.dailyRate || 160000,
        laborCost: (w.dailyRate || 0) * (w.gongsu || 1),
        overtimeFee: w.overtimeFee || 0,
        mealFee: w.mealFee || 0,
        fuelFee: w.fuelFee || 0,
        otherFee: w.otherFee || 0,
        totalItemAmount:
          (w.dailyRate || 0) * (w.gongsu || 1) +
          (w.overtimeFee || 0) +
          (w.mealFee || 0) +
          (w.fuelFee || 0) +
          (w.otherFee || 0),
        remarks: w.remarks || w.extraFeeRemarks || '',
      }));

  const invoiceTotalServiceCount = rawInvoiceItems.reduce((acc, i) => acc + (i.serviceCount || 0), 0);
  const invoiceLaborCostTotal = rawInvoiceItems.reduce((acc, i) => acc + (i.laborCost || 0), 0);
  const invoiceExtraFeeTotal = rawInvoiceItems.reduce(
    (acc, i) => acc + (i.overtimeFee || 0) + (i.mealFee || 0) + (i.fuelFee || 0) + (i.otherFee || 0),
    0
  );
  const invoiceGrandTotal = invoiceLaborCostTotal + invoiceExtraFeeTotal;

  // Pad worker list to 10 rows for clean standardized print structure
  const minRows = 10;
  const displayWorkers = [...log.workers];
  while (displayWorkers.length < minRows) {
    displayWorkers.push({
      id: `empty-${displayWorkers.length}`,
      name: '',
      category: '일반',
      dailyRate: 0,
      gongsu: 0,
      remarks: '',
      overtimeFee: 0,
      mealFee: 0,
      fuelFee: 0,
      otherFee: 0,
    });
  }

  // Pad invoice items to 10 rows for clean standardized print structure
  const displayInvoiceItems = [...rawInvoiceItems];
  while (displayInvoiceItems.length < minRows) {
    displayInvoiceItems.push({
      id: `empty-inv-${displayInvoiceItems.length}`,
      date: '',
      workCategory: '',
      serviceCount: 0,
      unitPrice: 0,
      laborCost: 0,
      overtimeFee: 0,
      mealFee: 0,
      fuelFee: 0,
      otherFee: 0,
      totalItemAmount: 0,
      remarks: '',
    });
  }

  return (
    <div className="bg-slate-50 p-2 sm:p-6 rounded-2xl">
      
      {/* Top Controller Bar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white p-3.5 rounded-2xl shadow-xs print:hidden border border-slate-200">
        
        {/* Print Form Mode Toggle & Office Profile Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('worker_roster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'worker_roster'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>📋 [양식 1] 인부별 출근 출력표</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('invoice_summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'invoice_summary'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>📋 [양식 2] 일별 용역/인건비 출력표</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('delegation_letter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'delegation_letter'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>✍️ [양식 3] 임금 수령 위임장 (서명/날인)</span>
            </button>
          </div>

          {officeProfiles.length > 1 && (
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-600 px-1.5">발행 사무소:</span>
              <select
                value={selectedOfficeId}
                onChange={(e) => setSelectedOfficeId(e.target.value)}
                className="font-bold bg-white text-slate-800 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
              >
                {officeProfiles.map((p) => (
                  <option key={p.id || p.officeName} value={p.id || 'default'}>
                    {p.profileName || p.officeName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {onTogglePaidLog && (
            <button
              onClick={() => onTogglePaidLog(log)}
              className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1 shadow-xs transition-colors cursor-pointer border ${
                log.isPaid
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
              }`}
              title={log.isPaid ? '클릭 시 미결제로 변경' : '클릭 시 결제완료로 변경'}
            >
              {log.isPaid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>✓ 결제 완료 (입금 확인)</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  <span>미결제 (결제완료 처리)</span>
                </>
              )}
            </button>
          )}

          {onDuplicateClick && (
            <button
              onClick={() => onDuplicateClick(log)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>날짜 복사 저장</span>
            </button>
          )}

          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Image className="w-4 h-4" />
            )}
            <span>{isExporting ? '저장 중...' : '이미지(PNG) 저장'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>인쇄 (A4)</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* PRINT AREA CONTAINER */}
      <div className="w-full overflow-x-auto pb-4 print:overflow-visible flex flex-col items-center">
        <div className="text-[11px] text-slate-500 font-medium text-center pb-2 sm:hidden">
          💡 모바일에서는 좌우로 스크롤하여 A4 전체 서식을 확인할 수 있으며, 이미지(PNG) 저장은 PC와 동일한 고해상도 원본 양식으로 저장됩니다.
        </div>
        <div className="w-[800px] min-w-[800px] shadow-xl print:shadow-none print:w-full print:min-w-0">
          <div ref={sheetRef} className="bg-white text-black p-8 w-[800px] min-w-[800px] font-sans border border-slate-300 print:border-none print:w-full print:min-w-0 print:p-0">
          
          {/* ========================================================== */}
          {/* PRINT MODE 1: WORKER ATTENDANCE ROSTER SHEET */}
          {/* ========================================================== */}
          {viewMode === 'worker_roster' && (
            <>
              {/* Title */}
              <div className="relative text-center mb-6">
                <h1 className="text-3xl font-extrabold tracking-widest border-b-2 border-black pb-2 inline-block px-8">
                  출 력 표
                </h1>
                {log.isPaid && (
                  <div className="absolute right-0 top-0 border-2 border-emerald-600 text-emerald-800 bg-emerald-50 font-black text-xs px-3 py-1 rounded-lg flex items-center space-x-1 tracking-wider rotate-[-2deg] shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>결제 완료 (입금확인)</span>
                  </div>
                )}
              </div>

              {/* Top Header Grid Table */}
              <div className="border-2 border-black mb-0">
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="w-24 bg-slate-100 font-bold text-center py-2 px-2 border-r border-black">작업기간</td>
                      <td className="text-center font-bold text-sm py-2 px-3 border-r border-black">{workPeriodText}</td>
                    <td rowSpan={5} className="w-44 text-center align-middle p-2 bg-white relative">
                      <div className="font-bold text-base mb-1">{activeOffice.officeName}</div>
                      <div className="w-20 h-20 mx-auto relative flex items-center justify-center">
                        <img
                          src="/stamp.png"
                          alt="직인"
                          className="max-w-full max-h-full object-contain mx-auto"
                          crossOrigin="anonymous"
                        />
                      </div>
                    </td>
                  </tr>

                  <tr className="border-b border-black">
                    <td className="bg-slate-100 font-bold text-center py-2 px-2 border-r border-black">업체/현장</td>
                    <td className="text-center font-bold text-base py-2 px-3 border-r border-black">{log.clientName}</td>
                  </tr>

                  <tr className="border-b border-black">
                    <td className="bg-slate-100 font-bold text-center py-2 px-2 border-r border-black">현장주소</td>
                    <td className="text-center font-medium text-sm py-2 px-3 border-r border-black">{log.siteAddress || '-'}</td>
                  </tr>

                  <tr className="border-b border-black">
                    <td className="bg-slate-100 font-bold text-center py-2 px-2 border-r border-black">구인자연락처</td>
                    <td className="text-center font-bold text-base py-2 px-3 border-r border-black">{log.clientContact || '-'}</td>
                  </tr>

                  <tr>
                    <td className="bg-slate-100 font-bold text-center py-2 px-2 border-r border-black">작업인원</td>
                    <td className="text-center font-medium py-2 px-3 border-r border-black">
                      일반 : <span className="font-bold text-black">{generalCount}공수</span> &nbsp;&nbsp;&nbsp;&nbsp; 기공 : <span className="font-bold text-black">{skillCount}공수</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section Divider Subheader */}
            <div className="border-x-2 border-b-2 border-black bg-slate-50 py-1.5 px-3 text-center font-bold text-sm tracking-wider">
              인 부 사 역
            </div>

            {/* Main Workers Detail Table Grid */}
            <div className="border-x-2 border-b-2 border-black">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-black text-center font-bold">
                    <th className="w-20 py-2 border-r border-black">날 짜</th>
                    <th className="w-28 py-2 border-r border-black">인 원</th>
                    <th className="w-28 py-2 border-r border-black">단 가</th>
                    <th className="w-36 py-2 border-r border-black">기타비용 (잔업/식대)</th>
                    <th className="py-2">비 고</th>
                  </tr>
                </thead>
                <tbody>
                  {displayWorkers.map((worker, index) => {
                    const isHasData = worker.name !== '';
                    const extraTotal = (worker.overtimeFee || 0) + (worker.mealFee || 0) + (worker.fuelFee || 0) + (worker.otherFee || 0);

                    // Extra fee detail string
                    const extraList: string[] = [];
                    if (worker.overtimeFee) extraList.push(`잔업 ₩${worker.overtimeFee.toLocaleString()}`);
                    if (worker.mealFee) extraList.push(`식대 ₩${worker.mealFee.toLocaleString()}`);
                    if (worker.fuelFee) extraList.push(`주유 ₩${worker.fuelFee.toLocaleString()}`);
                    if (worker.otherFee) extraList.push(`기타 ₩${worker.otherFee.toLocaleString()}`);

                    return (
                      <tr key={worker.id || index} className="border-b border-black/30 h-9">
                        <td className="text-center border-r border-black font-medium text-xs">
                          {isHasData ? shortDateKorean : ''}
                        </td>
                        <td className="text-center border-r border-black font-semibold text-sm">
                          {worker.name}
                        </td>
                        <td className="text-center border-r border-black font-bold text-xs">
                          {isHasData ? `₩${worker.dailyRate.toLocaleString()}` : ''}
                        </td>
                        <td className="text-center border-r border-black px-1 text-[11px] font-mono">
                          {isHasData && extraTotal > 0 ? (
                            <div className="leading-tight">
                              <span className="font-bold text-black">₩{extraTotal.toLocaleString()}</span>
                              {extraList.length > 0 && (
                                <div className="text-[9px] text-slate-600 font-normal">
                                  ({extraList.join(' / ')})
                                </div>
                              )}
                            </div>
                          ) : isHasData ? (
                            '-'
                          ) : (
                            ''
                          )}
                        </td>
                        <td className="text-center px-1.5 py-1 text-xs text-slate-700">
                          {isHasData ? (
                            <div className="flex flex-col items-center justify-center space-y-0.5">
                              {/* 1 to 31 Calendar Grid Cells */}
                              <div className="flex flex-wrap items-center justify-center gap-[1.5px]">
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                                  const activeDays = (worker.workDaysList && worker.workDaysList.length > 0)
                                    ? worker.workDaysList
                                    : [Number(log.date.substring(8, 10)) || 1];
                                  const isWorked = activeDays.includes(dayNum);
                                  return (
                                    <span
                                      key={dayNum}
                                      className={`w-[16px] h-[16px] text-[9px] leading-none font-mono flex items-center justify-center border ${
                                        isWorked
                                          ? 'bg-slate-950 text-white border-black font-black shadow-xs'
                                          : 'bg-slate-50 text-slate-300 border-slate-200 font-normal'
                                      }`}
                                      title={`${dayNum}일 ${isWorked ? '출근' : ''}`}
                                    >
                                      {dayNum}
                                    </span>
                                  );
                                })}
                              </div>
                              {/* Total days summary & remarks */}
                              <div className="text-[10px] text-slate-800 flex items-center justify-center space-x-1.5 pt-0.5">
                                <span className="font-bold text-slate-900">
                                  [총 {((worker.workDaysList && worker.workDaysList.length > 0) ? worker.workDaysList.length : 1)}일 출근]
                                </span>
                                {worker.remarks ? (
                                  <span className="text-slate-600 font-medium">({worker.remarks})</span>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            ''
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Sum / Total Calculation Row */}
                  <tr className="border-t-2 border-black font-bold text-sm h-10">
                    <td className="text-center border-r border-black bg-slate-100">합 계</td>
                    <td className="border-r border-black text-center text-xs text-slate-600">
                      {log.workers.length}명
                    </td>
                    <td className="text-center border-r border-black font-mono font-bold">
                      ₩{workerLaborCostTotal.toLocaleString()}
                    </td>
                    <td className="text-center border-r border-black text-xs font-mono">
                      {workerExtraFeeTotal > 0 ? `+₩${workerExtraFeeTotal.toLocaleString()}` : '-'}
                    </td>
                    <td className="text-right px-4 text-xs font-black align-middle text-black">
                      총 청구금액: ₩{workerGrandTotal.toLocaleString()}원 &nbsp;
                      <span className="text-[11px] font-normal text-slate-700">({activeOffice.bankAccount})</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ========================================================== */}
        {/* PRINT MODE 2: INVOICE / SERVICE & LABOR SUMMARY SHEET */}
        {/* ========================================================== */}
        {viewMode === 'invoice_summary' && (
          <>
            {/* Title */}
            <div className="relative text-center mb-6">
              <h1 className="text-3xl font-extrabold tracking-widest border-b-2 border-black pb-2 inline-block px-8">
                출 력 표
              </h1>
              {log.isPaid && (
                <div className="absolute right-0 top-0 border-2 border-emerald-600 text-emerald-800 bg-emerald-50 font-black text-xs px-3 py-1 rounded-lg flex items-center space-x-1 tracking-wider rotate-[-2deg] shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>결제 완료 (입금확인)</span>
                </div>
              )}
            </div>

            {/* Top Header Grid Table */}
            <div className="border-2 border-black mb-0">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="w-28 bg-slate-100 font-bold text-center py-2 px-2 border-r border-black">작업기간</td>
                    <td className="text-center font-bold text-sm py-2 px-3 border-r border-black">{workPeriodText}</td>
                    <td rowSpan={5} className="w-44 text-center align-middle p-2 bg-white relative">
                      <div className="font-bold text-base mb-1">{activeOffice.officeName}</div>
                      <div className="w-20 h-20 mx-auto relative flex items-center justify-center">
                        <img
                          src="/stamp.png"
                          alt="직인"
                          className="max-w-full max-h-full object-contain mx-auto"
                          crossOrigin="anonymous"
                        />
                      </div>
                    </td>
                  </tr>

                  <tr className="border-b border-black">
                    <td className="bg-slate-100 font-bold text-center py-2 px-2 border-r border-black">청구업체/현장</td>
                    <td className="text-center font-bold text-base py-2 px-3 border-r border-black">{log.clientName}</td>
                  </tr>

                  <tr className="border-b border-black">
                    <td className="bg-slate-100 font-bold text-center py-2 px-2 border-r border-black">현장주소</td>
                    <td className="text-center font-medium text-sm py-2 px-3 border-r border-black">{log.siteAddress || '-'}</td>
                  </tr>

                  <tr className="border-b border-black">
                    <td className="bg-slate-100 font-bold text-center py-2 px-2 border-r border-black">구인자연락처</td>
                    <td className="text-center font-bold text-base py-2 px-3 border-r border-black">{log.clientContact || '-'}</td>
                  </tr>

                  <tr>
                    <td className="bg-slate-100 font-bold text-center py-2 px-2 border-r border-black">총 청구 용역수</td>
                    <td className="text-center font-bold text-black py-2 px-3 border-r border-black">
                      총 <span className="text-base font-black">{invoiceTotalServiceCount}</span> 명 / 공수
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section Divider Subheader */}
            <div className="border-x-2 border-b-2 border-black bg-slate-50 py-1.5 px-3 text-center font-bold text-sm tracking-wider">
              일 별 용 역 수 및 인 건 비 내 역
            </div>

            {/* Invoice Table Grid */}
            <div className="border-x-2 border-b-2 border-black">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-black text-center font-bold text-xs">
                    <th className="w-16 py-2 border-r border-black">일 자</th>
                    <th className="w-28 py-2 border-r border-black">용역 항목</th>
                    <th className="w-20 py-2 border-r border-black">용역수</th>
                    <th className="w-24 py-2 border-r border-black">단 가</th>
                    <th className="w-28 py-2 border-r border-black">인건비 소계</th>
                    <th className="w-32 py-2 border-r border-black">기타비용(잔업/식대)</th>
                    <th className="w-28 py-2 border-r border-black">청구 금액</th>
                    <th className="py-2">비 고</th>
                  </tr>
                </thead>
                <tbody>
                  {displayInvoiceItems.map((item, index) => {
                    const isHasData = item.workCategory !== '';
                    const extraTotal = (item.overtimeFee || 0) + (item.mealFee || 0) + (item.fuelFee || 0) + (item.otherFee || 0);

                    const extraList: string[] = [];
                    if (item.overtimeFee) extraList.push(`잔업 ₩${item.overtimeFee.toLocaleString()}`);
                    if (item.mealFee) extraList.push(`식대 ₩${item.mealFee.toLocaleString()}`);
                    if (item.fuelFee) extraList.push(`주유 ₩${item.fuelFee.toLocaleString()}`);
                    if (item.otherFee) extraList.push(`기타 ₩${item.otherFee.toLocaleString()}`);

                    return (
                      <tr key={item.id || index} className="border-b border-black/30 h-9 text-xs">
                        {/* Date */}
                        <td className="text-center border-r border-black font-medium">
                          {isHasData ? (item.date ? item.date.substring(5, 10) : shortDateKorean) : ''}
                        </td>

                        {/* Work Category */}
                        <td className="text-center border-r border-black font-bold">
                          {item.workCategory}
                        </td>

                        {/* Service Count */}
                        <td className="text-center border-r border-black font-bold">
                          {isHasData ? `${item.serviceCount}명` : ''}
                        </td>

                        {/* Unit Price */}
                        <td className="text-right pr-2 border-r border-black font-mono font-medium">
                          {isHasData ? `₩${(item.unitPrice || 0).toLocaleString()}` : ''}
                        </td>

                        {/* Labor Cost Subtotal */}
                        <td className="text-right pr-2 border-r border-black font-mono font-bold">
                          {isHasData ? `₩${(item.laborCost || 0).toLocaleString()}` : ''}
                        </td>

                        {/* Extra Fees */}
                        <td className="text-center border-r border-black px-1 font-mono text-[10px]">
                          {isHasData && extraTotal > 0 ? (
                            <div>
                              <span className="font-bold">₩{extraTotal.toLocaleString()}</span>
                              {extraList.length > 0 && (
                                <div className="text-[9px] text-slate-600 font-normal">
                                  ({extraList.join('/')})
                                </div>
                              )}
                            </div>
                          ) : isHasData ? (
                            '-'
                          ) : (
                            ''
                          )}
                        </td>

                        {/* Item Total Amount */}
                        <td className="text-right pr-2 border-r border-black font-mono font-black text-black">
                          {isHasData ? `₩${(item.totalItemAmount || 0).toLocaleString()}` : ''}
                        </td>

                        {/* Remarks */}
                        <td className="text-center px-1 text-[11px] text-slate-700">
                          {item.remarks || '-'}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Invoice Grand Total Row */}
                  <tr className="border-t-2 border-black font-bold text-sm h-11 bg-slate-50">
                    <td className="text-center border-r border-black bg-slate-100">합 계</td>
                    <td className="border-r border-black text-center text-xs">총계</td>
                    <td className="text-center border-r border-black font-bold">
                      {invoiceTotalServiceCount}명
                    </td>
                    <td className="border-r border-black"></td>
                    <td className="text-right pr-2 border-r border-black font-mono">
                      ₩{invoiceLaborCostTotal.toLocaleString()}
                    </td>
                    <td className="text-center border-r border-black font-mono text-xs">
                      {invoiceExtraFeeTotal > 0 ? `+₩${invoiceExtraFeeTotal.toLocaleString()}` : '-'}
                    </td>
                    <td colSpan={2} className="text-right pr-3 font-mono font-black text-base text-black">
                      최종 청구금액: ₩{invoiceGrandTotal.toLocaleString()}원
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ========================================================== */}
        {/* PRINT MODE 3: WAGE DELEGATION LETTER (임금 수령 위임장) */}
        {/* ========================================================== */}
        {viewMode === 'delegation_letter' && (
          <DelegationSheet
            log={log}
            officeSettings={officeSettings}
            activeOffice={activeOffice}
            workersRoster={workersRoster}
            onUpdateLog={onUpdateLog}
          />
        )}

        {/* Bank Account Banner Box & Office Footer (Only for Standard Dispatch Output Forms) */}
        {viewMode !== 'delegation_letter' && (
          <>
            {/* Bank Account Banner Box */}
            <div className="mt-4 border border-black p-2.5 bg-slate-50 text-center text-xs font-bold flex items-center justify-between">
              <span>입금 계좌 안내: {activeOffice.bankAccount}</span>
              <span>(청구/발행 담당: {activeOffice.officeName})</span>
            </div>

            {/* Bottom Office Footer Section */}
            <div className="mt-8 text-center space-y-1">
              <div className="text-2xl font-black tracking-tight text-black">
                {activeOffice.officeName}
              </div>
              <div className="text-sm font-semibold text-slate-800">
                ({activeOffice.phone1} / {activeOffice.phone2})
              </div>
              <div className="text-xs text-slate-700">
                {activeOffice.address}
              </div>
            </div>
          </>
        )}

        </div>
      </div>
    </div>
  </div>
);
};
