import React, { useState, useEffect } from 'react';
import { DispatchLog, OfficeSettings } from '../types';
import { DollarSign, Users, Building, Download, Printer, Calendar, FileSpreadsheet } from 'lucide-react';
import { Pagination } from './Pagination';

interface SettlementSummaryProps {
  logs: DispatchLog[];
  officeSettings: OfficeSettings;
}

export const SettlementSummary: React.FC<SettlementSummaryProps> = ({ logs, officeSettings }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12

  // Pagination states
  const [matrixPage, setMatrixPage] = useState(1);
  const [clientPage, setClientPage] = useState(1);
  const [workerSummaryPage, setWorkerSummaryPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setMatrixPage(1);
    setClientPage(1);
    setWorkerSummaryPage(1);
  }, [selectedYear, selectedMonth]);

  // Filter logs for selected year and month
  const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const filteredLogs = logs.filter((l) => l.date.startsWith(monthPrefix));

  // Overall totals
  const totalLogsCount = filteredLogs.length;
  const totalGongsu = filteredLogs.reduce(
    (acc, l) => acc + l.workers.reduce((wAcc, w) => wAcc + (w.gongsu || 1), 0),
    0
  );
  const totalAmount = filteredLogs.reduce((acc, l) => acc + l.totalAmount, 0);

  // Client Breakdown
  const clientMap: {
    [key: string]: {
      clientName: string;
      contact: string;
      logsCount: number;
      gongsuSum: number;
      amountSum: number;
    };
  } = {};

  filteredLogs.forEach((log) => {
    const key = log.clientName.trim();
    if (!clientMap[key]) {
      clientMap[key] = {
        clientName: log.clientName,
        contact: log.clientContact,
        logsCount: 0,
        gongsuSum: 0,
        amountSum: 0,
      };
    }
    clientMap[key].logsCount += 1;
    const logGongsu = log.workers && log.workers.length > 0
      ? log.workers.reduce((acc, w) => acc + (w.gongsu || 1), 0)
      : log.invoiceItems && log.invoiceItems.length > 0
      ? log.invoiceItems.reduce((acc, i) => acc + (Number(i.serviceCount) || 0), 0)
      : (log.generalGongsuCount || 0) + (log.skillGongsuCount || 0);
    clientMap[key].gongsuSum += logGongsu;
    clientMap[key].amountSum += log.totalAmount;
  });

  const clientList = Object.values(clientMap).sort((a, b) => b.amountSum - a.amountSum);

  // Worker Breakdown & 1~31 Day Matrix
  interface DayLogDetail {
    gongsu: number;
    siteName: string;
  }

  interface MonthlyWorkerMatrixItem {
    name: string;
    category: string;
    dailyRate: number;
    daysMap: { [day: number]: DayLogDetail };
    totalDaysWorked: number;
    totalGongsu: number;
    totalCalculatedWage: number;
  }

  const monthlyMatrixMap: { [workerName: string]: MonthlyWorkerMatrixItem } = {};

  filteredLogs.forEach((log) => {
    const logDay = Number(log.date.substring(8, 10)) || 1;
    log.workers.forEach((w) => {
      const name = w.name.trim();
      if (!name) return;

      if (!monthlyMatrixMap[name]) {
        monthlyMatrixMap[name] = {
          name,
          category: w.category || '일반',
          dailyRate: w.dailyRate || 160000,
          daysMap: {},
          totalDaysWorked: 0,
          totalGongsu: 0,
          totalCalculatedWage: 0,
        };
      }

      const item = monthlyMatrixMap[name];
      if (w.dailyRate) item.dailyRate = w.dailyRate;

      if (w.workDaysList && w.workDaysList.length > 0) {
        w.workDaysList.forEach((dNum) => {
          if (!item.daysMap[dNum]) {
            item.daysMap[dNum] = { gongsu: 1.0, siteName: log.clientName };
          }
        });
      } else {
        item.daysMap[logDay] = { gongsu: w.gongsu || 1.0, siteName: log.clientName };
      }
    });
  });

  const monthlyMatrixList = Object.values(monthlyMatrixMap).map((item) => {
    const activeDays = Object.keys(item.daysMap).map(Number);
    const totalDaysWorked = activeDays.length;
    const totalGongsu = Object.values(item.daysMap).reduce((acc, d) => acc + d.gongsu, 0);
    const totalCalculatedWage = item.dailyRate * totalGongsu;

    return {
      ...item,
      totalDaysWorked,
      totalGongsu,
      totalCalculatedWage,
    };
  }).sort((a, b) => b.totalCalculatedWage - a.totalCalculatedWage);

  const grandTotalMatrixGongsu = monthlyMatrixList.reduce((acc, m) => acc + m.totalGongsu, 0);
  const grandTotalMatrixWage = monthlyMatrixList.reduce((acc, m) => acc + m.totalCalculatedWage, 0);

  // Paginated Lists
  const matrixTotalPages = Math.ceil(monthlyMatrixList.length / ITEMS_PER_PAGE) || 1;
  const paginatedMatrixList = monthlyMatrixList.slice(
    (matrixPage - 1) * ITEMS_PER_PAGE,
    matrixPage * ITEMS_PER_PAGE
  );

  const clientTotalPages = Math.ceil(clientList.length / ITEMS_PER_PAGE) || 1;
  const paginatedClientList = clientList.slice(
    (clientPage - 1) * ITEMS_PER_PAGE,
    clientPage * ITEMS_PER_PAGE
  );

  const workerSummaryTotalPages = Math.ceil(monthlyMatrixList.length / ITEMS_PER_PAGE) || 1;
  const paginatedWorkerSummaryList = monthlyMatrixList.slice(
    (workerSummaryPage - 1) * ITEMS_PER_PAGE,
    workerSummaryPage * ITEMS_PER_PAGE
  );

  // CSV Export Helper
  const handleExportCSV = () => {
    let csvContent = `data:text/csv;charset=utf-8,\uFEFF`;
    csvContent += `[${selectedYear}년 ${selectedMonth}월 자동 정산 보고서]\n`;
    csvContent += `사무소: ${officeSettings.officeName}\n`;
    csvContent += `총 출력건수: ${totalLogsCount}건, 총 인원: ${totalGongsu}공수, 총 정산금액: ${totalAmount}원\n\n`;

    csvContent += `--- 1~31일 인부별 출근 및 임금 대장 ---\n`;
    csvContent += `인부 이름,구분,일단가(원),`;
    for (let d = 1; d <= 31; d++) {
      csvContent += `${d}일,`;
    }
    csvContent += `출력일수,총공수,총임금(원)\n`;

    monthlyMatrixList.forEach((m) => {
      csvContent += `"${m.name}","${m.category}",${m.dailyRate},`;
      for (let d = 1; d <= 31; d++) {
        csvContent += m.daysMap[d] ? `${m.daysMap[d].gongsu},` : `,`;
      }
      csvContent += `${m.totalDaysWorked},${m.totalGongsu},${m.totalCalculatedWage}\n`;
    });

    csvContent += `\n--- 업체별 정산 내역 ---\n`;
    csvContent += `업체/현장명,구인자연락처,출력건수,총 공수,정산금액(원)\n`;
    clientList.forEach((c) => {
      csvContent += `"${c.clientName}","${c.contact}",${c.logsCount},${c.gongsuSum},${c.amountSum}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `출력정산_${selectedYear}년_${selectedMonth}월.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span>월간 자동 정산 및 통계 보고서</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            기간별 총 출력 공수, 업체별 정산액 및 인부별 지급액을 한눈에 집계합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>엑셀(CSV) 다운로드</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid (Bento Grid Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            총 출력 일지 건수
          </div>
          <div className="text-2xl font-black text-slate-800">
            {totalLogsCount} <span className="text-xs font-semibold text-slate-400">건</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            총 출력 인원 (공수)
          </div>
          <div className="text-2xl font-black text-blue-600">
            {totalGongsu} <span className="text-xs font-semibold text-slate-400">공수</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            총 정산 금액 (합계)
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            ₩{totalAmount.toLocaleString()} <span className="text-xs font-semibold text-slate-400">원</span>
          </div>
        </div>

      </div>

      {/* 1~31일 인부별 월간 출근 및 공수/임금 관리 대장 (Interactive Grid) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-800 flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>{selectedYear}년 {selectedMonth}월 1~31일 인부별 출근 및 임금 관리 대장</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              각 인부의 1일~31일 출력 여부를 한눈에 파악하며, 일한 날수(공수)와 단가를 곱한 총임금이 자동 계산됩니다.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg border border-blue-100">
              총 {monthlyMatrixList.length}명 집계
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5 min-w-[100px] border-r border-slate-200 sticky left-0 bg-slate-50 z-10">인부 이름</th>
                <th className="p-2 text-center min-w-[50px] border-r border-slate-200">구분</th>
                <th className="p-2 text-right min-w-[90px] border-r border-slate-200">일단가</th>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((dNum) => (
                  <th key={dNum} className="p-1 text-center w-7 border-r border-slate-200 text-[11px] font-mono">
                    {dNum}
                  </th>
                ))}
                <th className="p-2 text-center min-w-[90px] border-r border-slate-200 text-blue-700 font-bold bg-blue-50/50">
                  출력일수(공수)
                </th>
                <th className="p-2.5 text-right min-w-[120px] text-emerald-700 font-bold bg-emerald-50/50">
                  총임금 (단가×일수)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedMatrixList.length === 0 ? (
                <tr>
                  <td colSpan={36} className="p-8 text-center text-slate-400 font-medium">
                    해당 월에 등록된 인부 출력 일지 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedMatrixList.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="p-2.5 font-bold text-slate-800 border-r border-slate-200 sticky left-0 bg-white z-10 shadow-xs">
                      {m.name}
                    </td>
                    <td className="p-2 text-center border-r border-slate-200">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {m.category}
                      </span>
                    </td>
                    <td className="p-2 text-right font-bold text-slate-700 border-r border-slate-200 font-mono">
                      ₩{m.dailyRate.toLocaleString()}
                    </td>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((dNum) => {
                      const dayDetail = m.daysMap[dNum];
                      return (
                        <td
                          key={dNum}
                          className={`p-1 text-center border-r border-slate-200 text-[10px] font-bold ${
                            dayDetail
                              ? 'bg-blue-600 text-white font-black'
                              : 'text-slate-200'
                          }`}
                          title={dayDetail ? `${dNum}일: ${dayDetail.siteName} (${dayDetail.gongsu}공수)` : `${dNum}일: 미출력`}
                        >
                          {dayDetail ? (dayDetail.gongsu === 1 ? '1' : dayDetail.gongsu) : ''}
                        </td>
                      );
                    })}
                    <td className="p-2 text-center font-black text-blue-600 border-r border-slate-200 bg-blue-50/30">
                      {m.totalDaysWorked}일 ({m.totalGongsu}공수)
                    </td>
                    <td className="p-2.5 text-right font-black text-emerald-600 font-mono bg-emerald-50/30 text-sm">
                      ₩{m.totalCalculatedWage.toLocaleString()}원
                    </td>
                  </tr>
                ))
              )}

              {/* Total Summary Row */}
              {monthlyMatrixList.length > 0 && (
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <td className="p-2.5 text-slate-900 border-r border-slate-300 sticky left-0 bg-slate-100 z-10">
                    총 합 계
                  </td>
                  <td className="border-r border-slate-300"></td>
                  <td className="border-r border-slate-300"></td>
                  <td colSpan={31} className="p-2 text-center text-xs text-slate-500 border-r border-slate-300">
                    월간 출력 일수 및 임금 정산 집계
                  </td>
                  <td className="p-2 text-center font-black text-blue-700 border-r border-slate-300 bg-blue-100/50">
                    {grandTotalMatrixGongsu}공수
                  </td>
                  <td className="p-2.5 text-right font-black text-emerald-700 font-mono text-base bg-emerald-100/50">
                    ₩{grandTotalMatrixWage.toLocaleString()}원
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={matrixPage}
          totalPages={matrixTotalPages}
          onPageChange={setMatrixPage}
          totalItems={monthlyMatrixList.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>

      {/* Two Columns Tables: Client Summary & Worker Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Table 1: Client / Site Settlement */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-800 flex items-center space-x-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>업체/현장별 정산 집계</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">{clientList.length}개 업체</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-2.5">업체/현장명</th>
                  <th className="p-2.5 text-center">출력건수</th>
                  <th className="p-2.5 text-center">총 공수</th>
                  <th className="p-2.5 text-right">정산금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedClientList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-xs text-slate-400">
                      해당 월의 업체 정산 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  paginatedClientList.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-bold text-slate-800">
                        {c.clientName}
                        {c.contact && <div className="text-[11px] font-normal text-slate-400">{c.contact}</div>}
                      </td>
                      <td className="p-2.5 text-center font-semibold text-slate-600">
                        {c.logsCount}건
                      </td>
                      <td className="p-2.5 text-center font-bold text-blue-600">
                        {c.gongsuSum}공수
                      </td>
                      <td className="p-2.5 text-right font-black text-slate-900 font-mono">
                        ₩{c.amountSum.toLocaleString()}원
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={clientPage}
            totalPages={clientTotalPages}
            onPageChange={setClientPage}
            totalItems={clientList.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>

        {/* Table 2: Worker Earnings Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-800 flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>인부별 출력 및 총임금 정산 집계</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">{monthlyMatrixList.length}명 인부</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-2.5">인부 이름</th>
                  <th className="p-2.5 text-center">구분</th>
                  <th className="p-2.5 text-center">출력공수 (일수)</th>
                  <th className="p-2.5 text-right">총 임금 (단가×일수)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedWorkerSummaryList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-xs text-slate-400">
                      해당 월의 인부 지급 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  paginatedWorkerSummaryList.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-bold text-slate-800">
                        {m.name}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {m.category}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-bold text-blue-600">
                        {m.totalGongsu}공수 ({m.totalDaysWorked}일)
                      </td>
                      <td className="p-2.5 text-right font-black text-emerald-600 font-mono">
                        ₩{m.totalCalculatedWage.toLocaleString()}원
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={workerSummaryPage}
            totalPages={workerSummaryTotalPages}
            onPageChange={setWorkerSummaryPage}
            totalItems={monthlyMatrixList.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>

      </div>
    </div>
  );
};
