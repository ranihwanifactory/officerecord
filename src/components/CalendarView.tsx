import React, { useState } from 'react';
import { DispatchLog, OfficeSettings } from '../types';
import { ChevronLeft, ChevronRight, Plus, Printer, Copy, Edit, Trash2, Calendar as CalendarIcon, Users, DollarSign } from 'lucide-react';

interface CalendarViewProps {
  logs: DispatchLog[];
  officeSettings: OfficeSettings;
  onSelectDate: (dateStr: string) => void;
  onNewLogForDate: (dateStr: string) => void;
  onEditLog: (log: DispatchLog) => void;
  onPrintLog: (log: DispatchLog) => void;
  onDuplicateLog: (log: DispatchLog) => void;
  onDeleteLog: (id: string) => void;
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
  const monthlyTotalWorkers = monthlyLogs.reduce(
    (sum, l) => sum + l.workers.reduce((wSum, w) => wSum + (w.gongsu || 1), 0),
    0
  );
  const monthlyTotalAmount = monthlyLogs.reduce((sum, l) => sum + l.totalAmount, 0);

  // Selected Date logs
  const selectedDateLogs = logs.filter((l) => l.date === selectedDateStr);

  return (
    <div className="space-y-6">
      
      {/* Monthly Summary Banner (Bento Dark Stat Card) */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-widest">
            <CalendarIcon className="w-4 h-4" />
            <span>Monthly Insights ({year}년 {month + 1}월)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            누적 출력 현황 및 집계
          </h2>
          <div className="flex flex-wrap gap-3 pt-1">
            <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">총 출력 공수/인원</p>
              <p className="text-base sm:text-lg font-black text-blue-400">{monthlyTotalWorkers} 명 (공수)</p>
            </div>
            <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">총 정산 금액</p>
              <p className="text-base sm:text-lg font-black text-emerald-400">₩{monthlyTotalAmount.toLocaleString()}원</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToday}
            className="bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-white/10 transition-colors cursor-pointer"
          >
            오늘
          </button>
          <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white/20 rounded-lg text-slate-300 transition-colors cursor-pointer"
              title="이전 달"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm px-3 text-white">
              {year}년 {month + 1}월
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-white/20 rounded-lg text-slate-300 transition-colors cursor-pointer"
              title="다음 달"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid & Selected Day Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Grid (2 Cols wide on Desktop) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
          
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs py-2 text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-2">
            <div className="text-rose-500">일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div className="text-blue-500">토</div>
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return (
                  <div key={`empty-${idx}`} className="h-24 sm:h-28 bg-slate-50/50 rounded-xl border border-dashed border-slate-200" />
                );
              }

              const { day, dateStr } = cell;
              const dayLogs = logs.filter((l) => l.date === dateStr);
              const isSelected = dateStr === selectedDateStr;
              const dayOfWeek = new Date(year, month, day).getDay();
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;

              const totalDailyWorkers = dayLogs.reduce(
                (sum, l) => sum + l.workers.reduce((wS, w) => wS + (w.gongsu || 1), 0),
                0
              );
              const totalDailyAmount = dayLogs.reduce((sum, l) => sum + l.totalAmount, 0);

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    setSelectedDateStr(dateStr);
                    onSelectDate(dateStr);
                  }}
                  className={`h-24 sm:h-28 p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer group relative overflow-hidden ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/80 shadow-xs ring-2 ring-blue-500/30'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  {/* Top Day Number & Add Quick Button */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        isSunday
                          ? 'text-rose-500'
                          : isSaturday
                          ? 'text-blue-600'
                          : 'text-slate-700'
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
                      className="opacity-0 group-hover:opacity-100 bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-lg transition-opacity cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Day Log Badges */}
                  <div className="space-y-1 overflow-y-auto max-h-16 scrollbar-none my-0.5">
                    {dayLogs.map((log) => (
                      <div
                        key={log.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateStr(dateStr);
                          onPrintLog(log);
                        }}
                        className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold p-1 rounded-lg truncate hover:bg-blue-600 hover:text-white transition-colors"
                        title={`${log.clientName} (${log.workers.length}명 / ₩${log.totalAmount.toLocaleString()})`}
                      >
                        {log.clientName} ({log.workers.length}명)
                      </div>
                    ))}
                  </div>

                  {/* Bottom Daily Total */}
                  {dayLogs.length > 0 && (
                    <div className="text-[10px] font-black text-right text-blue-600 truncate pt-0.5 border-t border-slate-100">
                      ₩{(totalDailyAmount / 10000).toFixed(0)}만
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Detail Drawer Panel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Date</div>
              <h3 className="text-lg font-bold text-slate-800">
                {selectedDateStr}
              </h3>
            </div>

            <button
              onClick={() => onNewLogForDate(selectedDateStr)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>새 출력표</span>
            </button>
          </div>

          {/* Logs List for selected date */}
          <div className="py-4 space-y-4 flex-1 overflow-y-auto">
            {selectedDateLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
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
              selectedDateLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-blue-300 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md">
                        {log.clientContact || '연락처 미기재'}
                      </span>
                      <h4 className="text-base font-bold text-slate-800 mt-1">
                        {log.clientName}
                      </h4>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-blue-600">
                        ₩{log.totalAmount.toLocaleString()}원
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        일반 {log.generalGongsuCount}공수 / 기공 {log.skillGongsuCount}공수
                      </div>
                    </div>
                  </div>

                  {/* Workers List Preview */}
                  <div className="bg-white rounded-xl p-3 text-xs space-y-1 border border-slate-200">
                    <div className="font-bold text-slate-400 mb-1 flex justify-between uppercase text-[10px] tracking-wider">
                      <span>출력 인부 ({log.workers.length}명)</span>
                      <span>단가</span>
                    </div>
                    {log.workers.map((w, wIdx) => (
                      <div key={wIdx} className="flex justify-between font-semibold text-slate-700">
                        <span>• {w.name} <span className="text-[10px] text-slate-400">({w.category})</span></span>
                        <span className="font-mono">₩{w.dailyRate.toLocaleString()}원</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-1.5 border-t border-slate-200">
                    <button
                      onClick={() => onDuplicateLog(log)}
                      title="동일 내용 날짜만 변경 복사"
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center space-x-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>복사</span>
                    </button>

                    <button
                      onClick={() => onEditLog(log)}
                      className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit className="w-3 h-3" />
                      <span>수정</span>
                    </button>

                    <button
                      onClick={() => onPrintLog(log)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center space-x-1 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3 h-3" />
                      <span>출력표 보기</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('이 출력표를 삭제하시겠습니까?')) {
                          onDeleteLog(log.id);
                        }
                      }}
                      className="text-rose-500 hover:text-rose-600 p-1 rounded-lg cursor-pointer ml-1"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
