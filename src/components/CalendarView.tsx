import React, { useState, useEffect } from 'react';
import { DispatchLog, OfficeSettings } from '../types';
import { ChevronLeft, ChevronRight, Plus, Printer, Copy, Edit, Trash2, Calendar as CalendarIcon, Users, DollarSign, CheckCircle2, Clock, FileSignature } from 'lucide-react';
import { Pagination } from './Pagination';

interface CalendarViewProps {
  logs: DispatchLog[];
  officeSettings: OfficeSettings;
  onSelectDate: (dateStr: string) => void;
  onNewLogForDate: (dateStr: string) => void;
  onEditLog: (log: DispatchLog) => void;
  onPrintLog: (log: DispatchLog, initialFormType?: 'worker_roster' | 'invoice_summary' | 'delegation_letter') => void;
  onDuplicateLog: (log: DispatchLog) => void;
  onDeleteLog: (id: string) => void;
  onTogglePaidLog?: (log: DispatchLog) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  logs,
  officeSettings,
  onSelectDate,
  onNewLogForDate,
  onEditLog,
  onPrintLog,
  onDuplicateLog,
  onDeleteLog,
  onTogglePaidLog,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 1)); // August 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDateStr(new Date().toISOString().substring(0, 10));
  };

  // Calendar generation logic
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid cells
  const calendarCells = [];
  // Empty padding cells for previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const monthFormatted = String(month + 1).padStart(2, '0');
    const dayFormatted = String(d).padStart(2, '0');
    const dateStr = `${year}-${monthFormatted}-${dayFormatted}`;
    calendarCells.push({ day: d, dateStr });
  }

  // Filter logs for selected month
  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthlyLogs = logs.filter((l) => l.date.startsWith(currentMonthPrefix));
  
  // Calculate monthly summary
  const monthlyTotalWorkers = monthlyLogs.reduce((sum, l) => {
    if (l.formType === 'invoice_summary' && l.invoiceItems && l.invoiceItems.length > 0) {
      return sum + l.invoiceItems.reduce((iSum, i) => iSum + (Number(i.serviceCount) || 0), 0);
    }
    return sum + l.workers.reduce((wSum, w) => wSum + (Number(w.gongsu) || 1), 0);
  }, 0);
  const monthlyTotalAmount = monthlyLogs.reduce((sum, l) => sum + (l.grandTotalAmount || l.totalAmount || 0), 0);

  // Selected Date logs & pagination
  const selectedDateLogs = logs.filter((l) => l.date === selectedDateStr);
  const [selectedDatePage, setSelectedDatePage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    setSelectedDatePage(1);
  }, [selectedDateStr]);

  const selectedDateTotalPages = Math.ceil(selectedDateLogs.length / ITEMS_PER_PAGE) || 1;
  const paginatedSelectedDateLogs = selectedDateLogs.slice(
    (selectedDatePage - 1) * ITEMS_PER_PAGE,
    selectedDatePage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      
      {/* Monthly Summary Banner (Bento Dark Stat Card) */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-widest">
            <CalendarIcon className="w-4 h-4" />
            <span>Monthly Insights ({year}년 {month + 1}월)</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
            누적 출력 현황 및 집계
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 pt-1">
            <div className="bg-white/10 p-2.5 sm:px-3.5 sm:py-2 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">총 출력 인원</p>
              <p className="text-sm sm:text-lg font-black text-blue-400">{monthlyTotalWorkers} 명 (공수)</p>
            </div>
            <div className="bg-white/10 p-2.5 sm:px-3.5 sm:py-2 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">총 정산 금액</p>
              <p className="text-sm sm:text-lg font-black text-emerald-400 truncate">₩{monthlyTotalAmount.toLocaleString()}원</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end space-x-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
          <button
            onClick={handleToday}
            className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-white/10 transition-colors cursor-pointer"
          >
            오늘
          </button>
          <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white/20 active:bg-white/30 rounded-lg text-slate-300 transition-colors cursor-pointer"
              title="이전 달"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-xs sm:text-sm px-2 sm:px-3 text-white">
              {year}년 {month + 1}월
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white/20 active:bg-white/30 rounded-lg text-slate-300 transition-colors cursor-pointer"
              title="다음 달"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid & Selected Day Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Calendar Grid (2 Cols wide on Desktop) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs py-1.5 text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1.5 sm:mb-2">
            <div className="text-rose-500 dark:text-rose-400">일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div className="text-blue-500 dark:text-blue-400">토</div>
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return (
                  <div key={`empty-${idx}`} className="h-16 sm:h-28 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-850" />
                );
              }

              const { day, dateStr } = cell;
              const dayLogs = logs.filter((l) => l.date === dateStr);
              const isSelected = dateStr === selectedDateStr;
              const dayOfWeek = new Date(year, month, day).getDay();
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;

              const totalDailyWorkers = dayLogs.reduce((sum, l) => {
                if (l.formType === 'invoice_summary' && l.invoiceItems && l.invoiceItems.length > 0) {
                  return sum + l.invoiceItems.reduce((iS, i) => iS + (Number(i.serviceCount) || 0), 0);
                }
                return sum + l.workers.reduce((wS, w) => wS + (Number(w.gongsu) || 1), 0);
              }, 0);
              const totalDailyAmount = dayLogs.reduce((sum, l) => sum + (l.grandTotalAmount || l.totalAmount || 0), 0);

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    setSelectedDateStr(dateStr);
                    onSelectDate(dateStr);
                  }}
                  className={`h-16 sm:h-28 p-1 sm:p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer group relative overflow-hidden select-none active:scale-[0.98] ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 shadow-xs ring-2 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs'
                  }`}
                >
                  {/* Top Day Number & Add Quick Button */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-sm font-bold ${
                        isSunday
                          ? 'text-rose-500 dark:text-rose-400'
                          : isSaturday
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </span>

                    {/* Quick Add Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNewLogForDate(dateStr);
                      }}
                      title="이 날짜에 새 출력표 작성"
                      className="hidden sm:block opacity-0 group-hover:opacity-100 bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-lg transition-opacity cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>

                    {/* Mobile log count indicator dot */}
                    {dayLogs.length > 0 && (
                      <span className="sm:hidden w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </div>

                  {/* Day Log Badges */}
                  <div className="space-y-1 overflow-y-auto max-h-8 sm:max-h-16 scrollbar-none my-0.5">
                    {dayLogs.map((log) => {
                      const headcount = log.workers && log.workers.length > 0
                        ? log.workers.length
                        : (log.invoiceItems?.reduce((acc, i) => acc + (Number(i.serviceCount) || 0), 0) || 0);

                      return (
                        <div
                          key={log.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(dateStr);
                            onPrintLog(log);
                          }}
                          className={`text-[9px] sm:text-[10px] font-bold p-0.5 sm:p-1 rounded sm:rounded-lg truncate transition-colors flex items-center justify-between gap-1 ${
                            log.isPaid
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white'
                              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white'
                          }`}
                          title={`${log.clientName} (${headcount}명 / ₩${log.totalAmount.toLocaleString()}) ${log.isPaid ? '[결제완료]' : '[미결제]'}`}
                        >
                          <span className="truncate">{log.clientName}</span>
                          <span className="shrink-0 text-[8px] sm:text-[9px]">{headcount}명</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Daily Total */}
                  {dayLogs.length > 0 && (
                    <div className="text-[9px] sm:text-[10px] font-black text-right text-blue-600 dark:text-blue-400 truncate pt-0.5 border-t border-slate-100 dark:border-slate-800">
                      ₩{(totalDailyAmount / 10000).toFixed(0)}만
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Detail Drawer Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">선택한 날짜</div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                {selectedDateStr}
              </h3>
            </div>

            <button
              onClick={() => onNewLogForDate(selectedDateStr)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-xs transition-colors cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>새 출력표</span>
            </button>
          </div>

          {/* Logs List for selected date */}
          <div className="py-3 sm:py-4 space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
            {selectedDateLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <CalendarIcon className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
                <p className="text-sm font-medium text-slate-500">선택한 날짜에 등록된 출력일지가 없습니다.</p>
                <button
                  onClick={() => onNewLogForDate(selectedDateStr)}
                  className="mt-2 text-xs text-blue-600 font-bold underline hover:text-blue-700"
                >
                  + 이 날짜로 새 출력표 작성하기
                </button>
              </div>
            ) : (
              paginatedSelectedDateLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 rounded-xl p-3 sm:p-4 space-y-3 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/60 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                        {log.clientContact || '연락처 미기재'}
                      </span>
                      <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
                        {log.clientName}
                      </h4>
                    </div>

                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
                        ₩{log.totalAmount.toLocaleString()}원
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {(() => {
                          let general = log.generalGongsuCount || 0;
                          let skill = log.skillGongsuCount || 0;
                          if (general === 0 && skill === 0 && log.invoiceItems && log.invoiceItems.length > 0) {
                            log.invoiceItems.forEach((i) => {
                              const count = Number(i.serviceCount) || 0;
                              if (i.workCategory && i.workCategory.includes('기공')) skill += count;
                              else general += count;
                            });
                          }
                          return `일반 ${general}공수 / 기공 ${skill}공수`;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Workers List Preview */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 sm:p-3 text-xs space-y-1 border border-slate-200 dark:border-slate-800">
                    {log.workers && log.workers.length > 0 ? (
                      <>
                        <div className="font-bold text-slate-400 dark:text-slate-500 mb-1 flex justify-between uppercase text-[10px] tracking-wider">
                          <span>출력 인부 ({log.workers.length}명)</span>
                          <span>단가</span>
                        </div>
                        {log.workers.map((w, wIdx) => (
                          <div key={wIdx} className="flex justify-between font-semibold text-slate-700 dark:text-slate-200 text-xs">
                            <span className="truncate mr-2">• {w.name} <span className="text-[10px] text-slate-400 dark:text-slate-500">({w.category})</span></span>
                            <span className="font-mono shrink-0">₩{w.dailyRate.toLocaleString()}원</span>
                          </div>
                        ))}
                      </>
                    ) : log.invoiceItems && log.invoiceItems.length > 0 ? (
                      <>
                        <div className="font-bold text-slate-400 dark:text-slate-500 mb-1 flex justify-between uppercase text-[10px] tracking-wider">
                          <span>용역 항목 (총 {log.invoiceItems.reduce((acc, i) => acc + (Number(i.serviceCount) || 0), 0)}명/공수)</span>
                          <span>단가</span>
                        </div>
                        {log.invoiceItems.map((item, iIdx) => (
                          <div key={iIdx} className="flex justify-between font-semibold text-slate-700 dark:text-slate-200 text-xs">
                            <span className="truncate mr-2">• {item.workCategory || '용역'} ({item.serviceCount}명)</span>
                            <span className="font-mono shrink-0">₩{item.unitPrice.toLocaleString()}원</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-slate-400 text-xs">등록된 인부 또는 용역 항목이 없습니다.</div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => onTogglePaidLog?.(log)}
                      title={log.isPaid ? '클릭하여 미결제로 변경' : '클릭하여 결제완료로 변경'}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border flex items-center space-x-1 cursor-pointer transition-all ${
                        log.isPaid
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {log.isPaid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 stroke-[2.5]" />
                          <span>✓ 결제완료</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>미결제</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onDuplicateLog(log)}
                        title="동일 내용 날짜만 변경 복사"
                        className="bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span className="hidden xs:inline">복사</span>
                      </button>

                      <button
                        onClick={() => onEditLog(log)}
                        className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                        <span>수정</span>
                      </button>

                      <button
                        onClick={() => onPrintLog(log, 'worker_roster')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-2 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer shadow-xs"
                        title="출력표 보기 및 인쇄"
                      >
                        <Printer className="w-3 h-3" />
                        <span>출력표</span>
                      </button>

                      <button
                        onClick={() => onPrintLog(log, 'delegation_letter')}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-2 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer shadow-xs"
                        title="임금 수령 위임장 작성 및 서명 날인"
                      >
                        <FileSignature className="w-3 h-3" />
                        <span>위임장</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm('이 출력표를 삭제하시겠습니까?')) {
                            onDeleteLog(log.id);
                          }
                        }}
                        className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg cursor-pointer ml-0.5"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

          <Pagination
            currentPage={selectedDatePage}
            totalPages={selectedDateTotalPages}
            onPageChange={setSelectedDatePage}
            totalItems={selectedDateLogs.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>

      </div>
    </div>
  );
};
