import React, { useState, useEffect } from 'react';
import { DispatchLog } from '../types';
import { Search, Printer, Copy, Edit, Trash2, Calendar, Users, Building, Plus, CheckCircle2, Check, Clock } from 'lucide-react';
import { Pagination } from './Pagination';

interface DispatchLogListProps {
  logs: DispatchLog[];
  onNewLogClick: () => void;
  onEditLog: (log: DispatchLog) => void;
  onPrintLog: (log: DispatchLog) => void;
  onDuplicateLog: (log: DispatchLog) => void;
  onDeleteLog: (id: string) => void;
  onTogglePaidLog?: (log: DispatchLog) => void;
}

export const DispatchLogList: React.FC<DispatchLogListProps> = ({
  logs,
  onNewLogClick,
  onEditLog,
  onPrintLog,
  onDuplicateLog,
  onDeleteLog,
  onTogglePaidLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState(''); // YYYY-MM or empty
  const [filterPaidStatus, setFilterPaidStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.clientContact.includes(searchTerm) ||
      (log.siteAddress && log.siteAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.workers.some((w) => w.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.invoiceItems && log.invoiceItems.some((i) => i.workCategory.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesMonth = filterMonth ? log.date.startsWith(filterMonth) : true;

    const matchesPaid =
      filterPaidStatus === 'all'
        ? true
        : filterPaidStatus === 'paid'
        ? !!log.isPaid
        : !log.isPaid;

    return matchesSearch && matchesMonth && matchesPaid;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMonth, filterPaidStatus]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      
      {/* Top Filter & Action Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        
        {/* Search & Month Filter */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="업체명, 구인자 연락처, 인부 이름 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Month Filter */}
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Payment Status Filter */}
          <select
            value={filterPaidStatus}
            onChange={(e) => setFilterPaidStatus(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">전체 결제 상태</option>
            <option value="paid">✓ 결제 완료만</option>
            <option value="unpaid">미결제만 (입금대기)</option>
          </select>

          {(filterMonth || filterPaidStatus !== 'all') && (
            <button
              onClick={() => {
                setFilterMonth('');
                setFilterPaidStatus('all');
              }}
              className="text-xs font-bold text-blue-600 underline cursor-pointer"
            >
              전체 보기
            </button>
          )}
        </div>

        {/* New Log Button */}
        <button
          onClick={onNewLogClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>새 출력표 일지 작성</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">출력 날짜</th>
                <th className="p-3.5">업체 / 현장명</th>
                <th className="p-3.5">결제 상태</th>
                <th className="p-3.5">구인자 연락처</th>
                <th className="p-3.5">출력 인부</th>
                <th className="p-3.5 text-center">공수 (일반/기공)</th>
                <th className="p-3.5 text-right">총 정산액</th>
                <th className="p-3.5 text-center w-48">관리 및 인쇄</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 space-y-2">
                    <p className="text-sm font-medium">검색 조건에 일치하는 출력 일지가 없습니다.</p>
                    <button
                      onClick={onNewLogClick}
                      className="text-xs text-blue-600 font-bold underline"
                    >
                      + 새로 작성하기
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Date */}
                    <td className="p-3.5 font-bold text-slate-800 whitespace-nowrap">
                      {log.date}
                    </td>

                    {/* Client */}
                    <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span>{log.clientName}</span>
                        {log.formType === 'invoice_summary' ? (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                            양식 2 (용역수)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                            양식 1 (출근표)
                          </span>
                        )}
                      </div>
                      {log.siteAddress && (
                        <div className="text-[11px] font-normal text-slate-500 max-w-[180px] truncate">
                          📍 {log.siteAddress}
                        </div>
                      )}
                    </td>

                    {/* Payment Status Toggle Cell */}
                    <td className="p-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onTogglePaidLog?.(log)}
                        title={log.isPaid ? '클릭 시 미결제로 변경' : '클릭 시 결제완료로 변경'}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
                          log.isPaid
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 shadow-2xs'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {log.isPaid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                            <span>결제 완료</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>미결제 (대기)</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Contact */}
                    <td className="p-3.5 text-xs text-slate-500 font-medium whitespace-nowrap">
                      {log.clientContact || '-'}
                    </td>

                    {/* Workers list preview */}
                    <td className="p-3.5">
                      {log.workers && log.workers.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {log.workers.map((w, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                            >
                              {w.name}
                            </span>
                          ))}
                        </div>
                      ) : log.invoiceItems && log.invoiceItems.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1 max-w-xs">
                          <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                            총 {log.invoiceItems.reduce((acc, i) => acc + (Number(i.serviceCount) || 0), 0)}명/공수
                          </span>
                          {Array.from(new Set(log.invoiceItems.map((i) => i.workCategory).filter(Boolean))).map((cat, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">-</span>
                      )}
                    </td>

                    {/* Gongsu */}
                    <td className="p-3.5 text-center text-xs font-bold whitespace-nowrap text-slate-600">
                      {(() => {
                        let general = log.generalGongsuCount || 0;
                        let skill = log.skillGongsuCount || 0;
                        if (general === 0 && skill === 0 && log.invoiceItems && log.invoiceItems.length > 0) {
                          log.invoiceItems.forEach((i) => {
                            const count = Number(i.serviceCount) || 0;
                            if (i.workCategory && i.workCategory.includes('기공')) {
                              skill += count;
                            } else {
                              general += count;
                            }
                          });
                        }
                        return `일반 ${general} / 기공 ${skill}`;
                      })()}
                    </td>

                    {/* Total Amount */}
                    <td className="p-3.5 text-right font-black text-blue-600 text-base whitespace-nowrap font-mono">
                      ₩{log.totalAmount.toLocaleString()}원
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        
                        {/* Duplicate Copy Button */}
                        <button
                          onClick={() => onDuplicateLog(log)}
                          title="날짜 변경 후 반복 복사 저장"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center space-x-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>복사</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => onEditLog(log)}
                          title="수정"
                          className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>수정</span>
                        </button>

                        {/* Print Button */}
                        <button
                          onClick={() => onPrintLog(log)}
                          title="출력표 미리보기 및 인쇄"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-xs flex items-center space-x-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>출력표</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (confirm(`'${log.date} ${log.clientName}' 출력 일지를 삭제하시겠습니까?`)) {
                              onDeleteLog(log.id);
                            }
                          }}
                          className="text-rose-500 hover:text-rose-600 p-1 rounded-lg cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredLogs.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
};
