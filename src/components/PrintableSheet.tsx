import React, { useRef, useState } from 'react';
import { DispatchLog, OfficeSettings } from '../types';
import { Printer, Download, Copy, X, Image, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';

interface PrintableSheetProps {
  log: DispatchLog;
  officeSettings: OfficeSettings;
  onClose?: () => void;
  onDuplicateClick?: (log: DispatchLog) => void;
}

export const PrintableSheet: React.FC<PrintableSheetProps> = ({
  log,
  officeSettings,
  onClose,
  onDuplicateClick,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!sheetRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(sheetRef.current, {
        cacheBust: true,
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `출력표_${log.clientName}_${log.date}.png`;
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

  // General & Skill worker counts
  const generalCount = log.workers.filter(w => w.category === '일반').reduce((acc, w) => acc + (w.gongsu || 1), 0);
  const skillCount = log.workers.filter(w => w.category === '기공').reduce((acc, w) => acc + (w.gongsu || 1), 0);

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
    });
  }

  return (
    <div className="bg-slate-50 p-2 sm:p-6 rounded-2xl">
      
      {/* Top Controller Bar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-white p-3.5 rounded-2xl shadow-xs print:hidden border border-slate-200">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-800 text-sm sm:text-base">
            출력표 미리보기 ({log.clientName} - {fullDateKorean})
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {onDuplicateClick && (
            <button
              onClick={() => onDuplicateClick(log)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>날짜 변경 후 반복 저장</span>
            </button>
          )}

          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
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
            <span>출력표 인쇄 (A4)</span>
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

      {/* PRINT AREA CONTAINER (Strict styling matching uploaded image) */}
      <div ref={sheetRef} className="bg-white text-black p-6 sm:p-10 max-w-[800px] mx-auto shadow-xl print:shadow-none print:max-w-none print:w-full print:p-0 print:m-0 font-sans border border-slate-300 print:border-none">
        
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-widest border-b-2 border-black pb-2 inline-block px-8">
            출 력 표
          </h1>
        </div>

        {/* Top Header Grid Table */}
        <div className="border-2 border-black mb-0">
          <table className="w-full text-sm border-collapse">
            <tbody>
              {/* Row 1: 작업기간 & Seal Box */}
              <tr className="border-b border-black">
                <td className="w-24 bg-slate-100 font-bold text-center py-2 px-2 border-r border-black">작업기간</td>
                <td className="text-center font-bold text-sm sm:text-base py-2 px-3 border-r border-black">{workPeriodText}</td>
                {/* Stamp Seal Box on Right */}
                <td rowSpan={5} className="w-44 text-center align-middle p-2 bg-white relative">
                  <div className="font-bold text-base mb-1">{officeSettings.officeName}</div>
                  {/* Red Seal Stamp Image */}
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

              {/* Row 2: 업체/현장 */}
              <tr className="border-b border-black">
                <td className="bg-slate-100 font-bold text-center py-2 px-2 border-r border-black">업체/현장</td>
                <td className="text-center font-bold text-base py-2 px-3 border-r border-black">{log.clientName}</td>
              </tr>

              {/* Row 3: 현장주소 */}
              <tr className="border-b border-black">
                <td className="bg-slate-100 font-bold text-center py-2 px-2 border-r border-black">현장주소</td>
                <td className="text-center font-medium text-sm py-2 px-3 border-r border-black">{log.siteAddress || '-'}</td>
              </tr>

              {/* Row 4: 구인자연락처 */}
              <tr className="border-b border-black">
                <td className="bg-slate-100 font-bold text-center py-2 px-2 border-r border-black">구인자연락처</td>
                <td className="text-center font-bold text-base py-2 px-3 border-r border-black">{log.clientContact || '-'}</td>
              </tr>

              {/* Row 5: 작업인원 */}
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
                <th className="w-24 py-2 border-r border-black">날 짜</th>
                <th className="w-32 py-2 border-r border-black">인 원</th>
                <th className="w-36 py-2 border-r border-black">단 가</th>
                <th className="py-2">비 고</th>
              </tr>
            </thead>
            <tbody>
              {displayWorkers.map((worker, index) => {
                const isHasData = worker.name !== '';
                return (
                  <tr key={worker.id || index} className="border-b border-black/30 h-9">
                    <td className="text-center border-r border-black font-medium">
                      {isHasData ? shortDateKorean : ''}
                    </td>
                    <td className="text-center border-r border-black font-semibold text-base">
                      {worker.name}
                    </td>
                    <td className="text-center border-r border-black font-bold">
                      {isHasData ? `₩${worker.dailyRate.toLocaleString()}` : ''}
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
                          <div className="text-[11px] text-slate-800 flex items-center justify-center space-x-1.5 pt-0.5">
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
              <tr className="border-t-2 border-black font-bold text-base h-10">
                <td className="text-center border-r border-black bg-slate-100">합 계</td>
                <td className="border-r border-black"></td>
                <td className="text-center border-r border-black text-lg text-black">
                  ₩{log.totalAmount.toLocaleString()}
                </td>
                <td className="text-right px-4 text-xs font-semibold align-middle">
                  {officeSettings.bankAccount}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Office Footer Section */}
        <div className="mt-8 text-center space-y-1">
          <div className="text-2xl font-black tracking-tight text-black">
            {officeSettings.officeName}
          </div>
          <div className="text-sm font-semibold text-slate-800">
            ({officeSettings.phone1} / {officeSettings.phone2})
          </div>
          <div className="text-xs text-slate-700">
            {officeSettings.address}
          </div>
        </div>

      </div>
    </div>
  );
};
