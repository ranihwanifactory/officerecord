import React, { useState } from 'react';
import { DispatchLog, OfficeSettings, DispatchWorkerItem, WorkerMaster } from '../types';
import { SignatureModal } from './SignatureModal';
import { PenTool, Edit2, Check, RefreshCw } from 'lucide-react';
import { maskResidentId } from '../utils/date';

interface DelegationSheetProps {
  log: DispatchLog;
  officeSettings: OfficeSettings;
  activeOffice: OfficeSettings;
  workersRoster?: WorkerMaster[];
  onUpdateLog?: (updatedLog: DispatchLog) => void;
  isPrintOnly?: boolean;
  maskResidentNumber?: boolean;
}

export const DelegationSheet: React.FC<DelegationSheetProps> = ({
  log,
  officeSettings,
  activeOffice,
  workersRoster = [],
  onUpdateLog,
  isPrintOnly = false,
  maskResidentNumber = false,
}) => {
  // Recipient (수임인) fields state (editable on the fly if needed)
  const [recipientName, setRecipientName] = useState<string>(
    log.delegationRecipientName || activeOffice.representativeName || '김진환'
  );
  const [recipientResidentId, setRecipientResidentId] = useState<string>(
    log.delegationRecipientResidentId || activeOffice.representativeResidentId || '801121-1795828'
  );
  const [recipientAddress, setRecipientAddress] = useState<string>(
    log.delegationRecipientAddress || activeOffice.address || '경북 성주군 성주읍 성주순환로2길 69 젊은인력사무소'
  );
  const [recipientAccount, setRecipientAccount] = useState<string>(
    log.delegationRecipientAccount || activeOffice.representativeAccount || activeOffice.bankAccount || '기업은행 69301137601015 김진환'
  );

  // Work Title (작업명)
  const [workTitle, setWorkTitle] = useState<string>(
    log.delegationWorkTitle || `${log.clientName || '현장'} 작업지원`
  );

  // Active Worker signing modal state
  const [signingWorkerIndex, setSigningWorkerIndex] = useState<number | null>(null);

  // Local Workers with resident ID & signatures
  const [workers, setWorkers] = useState<DispatchWorkerItem[]>(() => {
    return log.workers.map((w) => {
      // Find matching worker master for residentId if missing
      const matched = workersRoster.find((master) => master.id === w.workerId || master.name === w.name);
      return {
        ...w,
        residentId: w.residentId || matched?.residentId || '',
        signatureDataUrl: w.signatureDataUrl || '',
      };
    });
  });

  // Keep local workers synced if log changes
  React.useEffect(() => {
    setWorkers(
      log.workers.map((w) => {
        const matched = workersRoster.find((master) => master.id === w.workerId || master.name === w.name);
        return {
          ...w,
          residentId: w.residentId || matched?.residentId || '',
          signatureDataUrl: w.signatureDataUrl || '',
        };
      })
    );
  }, [log.workers, workersRoster]);

  // Calculate totals
  const totalWorkersCount = workers.length;
  const totalGongsu = workers.reduce((acc, w) => acc + (w.gongsu || 1), 0);
  const totalAmount = workers.reduce((acc, w) => {
    const base = (w.dailyRate || 0) * (w.gongsu || 1);
    const extra = (w.overtimeFee || 0) + (w.mealFee || 0) + (w.fuelFee || 0) + (w.otherFee || 0);
    return acc + base + extra;
  }, 0);

  // Format Dates
  const formatDateKorean = (dStr?: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[0]}/${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}일`;
    }
    return dStr;
  };

  // Work period text (e.g. "2026/5/4일 (1일간)" or "2026/8/11일 ~ 2026/8/13일 (3일간)")
  const workPeriodText = (() => {
    if (log.startDate && log.endDate && log.startDate !== log.endDate) {
      return `${formatDateKorean(log.startDate)} ~ ${formatDateKorean(log.endDate)} (${totalGongsu}공수)`;
    }
    return `${formatDateKorean(log.date)} (${totalGongsu}공수)`;
  })();

  // Handle saving signature for a worker
  const handleSaveSignature = (index: number, signatureDataUrl: string) => {
    const updated = [...workers];
    updated[index] = {
      ...updated[index],
      signatureDataUrl,
    };
    setWorkers(updated);

    if (onUpdateLog) {
      const updatedLog: DispatchLog = {
        ...log,
        workers: updated,
        delegationRecipientName: recipientName,
        delegationRecipientResidentId: recipientResidentId,
        delegationRecipientAddress: recipientAddress,
        delegationRecipientAccount: recipientAccount,
        delegationWorkTitle: workTitle,
      };
      onUpdateLog(updatedLog);
    }
  };

  // Handle changing worker resident ID
  const handleResidentIdChange = (index: number, val: string) => {
    const updated = [...workers];
    updated[index] = {
      ...updated[index],
      residentId: val,
    };
    setWorkers(updated);

    if (onUpdateLog) {
      const updatedLog: DispatchLog = {
        ...log,
        workers: updated,
        delegationRecipientName: recipientName,
        delegationRecipientResidentId: recipientResidentId,
        delegationRecipientAddress: recipientAddress,
        delegationRecipientAccount: recipientAccount,
        delegationWorkTitle: workTitle,
      };
      onUpdateLog(updatedLog);
    }
  };

  // Pad to minimum 8 rows for standard A4 layout
  const minRows = 8;
  const displayRows: (DispatchWorkerItem | null)[] = [...workers];
  while (displayRows.length < minRows) {
    displayRows.push(null);
  }

  return (
    <div className="w-full bg-white text-black font-sans select-text p-4 sm:p-8 delegation-sheet-root">
      
      {/* 1. Header Title */}
      <div className="text-center mb-6 pt-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-[0.4em] text-black">
          위 임 장
        </h1>
      </div>

      {/* 2. Top Table: 수임인 정보 */}
      <div className="mb-6">
        <table className="w-full border-collapse border-[1.5px] border-black text-xs sm:text-sm">
          <tbody>
            {/* Row 1: 수임인 (rowSpan 3), 성명, 주민등록번호 */}
            <tr>
              <th
                rowSpan={3}
                className="w-20 sm:w-24 border border-black bg-slate-50 font-bold text-center py-2 px-2 tracking-wider"
              >
                수 임 인
              </th>
              <th className="w-16 sm:w-20 border border-black bg-slate-50 font-bold text-center py-2 px-1">
                성 명
              </th>
              <td className="w-40 sm:w-48 border border-black px-3 py-2 font-medium">
                {isPrintOnly ? (
                  <span>{recipientName}</span>
                ) : (
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none font-medium px-1 py-0.5 text-xs sm:text-sm"
                    placeholder="수임인 성명"
                  />
                )}
              </td>
              <th className="w-24 sm:w-28 border border-black bg-slate-50 font-bold text-center py-2 px-1">
                주민등록번호
              </th>
              <td className="border border-black px-3 py-2 font-medium">
                {isPrintOnly ? (
                  <span>{recipientResidentId}</span>
                ) : (
                  <input
                    type="text"
                    value={recipientResidentId}
                    onChange={(e) => setRecipientResidentId(e.target.value)}
                    className="w-full bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none font-medium px-1 py-0.5 text-xs sm:text-sm"
                    placeholder="801121-1795828"
                  />
                )}
              </td>
            </tr>

            {/* Row 2: 주소 */}
            <tr>
              <th className="border border-black bg-slate-50 font-bold text-center py-2 px-1">
                주 소
              </th>
              <td colSpan={3} className="border border-black px-3 py-2 font-medium">
                {isPrintOnly ? (
                  <span>{recipientAddress}</span>
                ) : (
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none font-medium px-1 py-0.5 text-xs sm:text-sm"
                    placeholder="수임인 주소"
                  />
                )}
              </td>
            </tr>

            {/* Row 3: 계좌번호 */}
            <tr>
              <th className="border border-black bg-slate-50 font-bold text-center py-2 px-1">
                계좌번호
              </th>
              <td colSpan={3} className="border border-black px-3 py-2 font-medium">
                {isPrintOnly ? (
                  <span>{recipientAccount}</span>
                ) : (
                  <input
                    type="text"
                    value={recipientAccount}
                    onChange={(e) => setRecipientAccount(e.target.value)}
                    className="w-full bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none font-medium px-1 py-0.5 text-xs sm:text-sm"
                    placeholder="기업은행 69301137601015 김진환"
                  />
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. Middle Narrative Section: 작업명, 근로기간, 위임금액 & 법적 문구 */}
      <div className="mb-6 space-y-2 text-xs sm:text-sm leading-relaxed text-black font-medium">
        <div className="flex items-center space-x-2">
          <span className="font-bold whitespace-nowrap">작업명 :</span>
          {isPrintOnly ? (
            <span>{workTitle}</span>
          ) : (
            <input
              type="text"
              value={workTitle}
              onChange={(e) => setWorkTitle(e.target.value)}
              className="flex-1 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none font-medium px-1 py-0.5"
              placeholder={`${log.clientName || '현장'} 작업지원`}
            />
          )}
        </div>

        <div>
          <span className="font-bold">근로기간 : </span>
          <span>{workPeriodText}</span>
        </div>

        <div>
          <span className="font-bold">위임금액 : </span>
          <span className="font-bold text-sm sm:text-base">
            ₩ {totalAmount.toLocaleString()}
          </span>
        </div>

        <p className="pt-2 text-xs sm:text-sm text-justify leading-relaxed tracking-tight text-slate-900">
          하기 본인은 <span className="font-bold underline decoration-slate-400 underline-offset-2">{log.clientName || '귀사'}</span> ({log.siteAddress || activeOffice.address || '현장'}) 현장에 참여한 근로자로서 상기 근로 기간 동안의 임금 전액을 수령함에 있어 본인의 사정으로 인해 아래 수임인에게 위임하며, 추후 귀사에 대하여 민,형사상 어떠한 이의를 제기치 않을 것임을 확인합니다.
        </p>
      </div>

      {/* 4. Delegator Workers Table (위임인 목록 표) */}
      <div className="mb-6">
        <table className="w-full border-collapse border-[1.5px] border-black text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-black">
              <th className="w-14 sm:w-16 border border-black py-2.5 px-1 font-bold text-center">
                구분
              </th>
              <th className="w-20 sm:w-24 border border-black py-2.5 px-1 font-bold text-center">
                성명
              </th>
              <th className="w-32 sm:w-36 border border-black py-2.5 px-1 font-bold text-center">
                주민번호
              </th>
              <th className="w-28 sm:w-36 border border-black py-2.5 px-1 font-bold text-center">
                작업일
              </th>
              <th className="w-24 sm:w-28 border border-black py-2.5 px-2 font-bold text-center">
                영수금액
              </th>
              <th className="w-24 sm:w-32 border border-black py-2.5 px-1 font-bold text-center">
                서명날인
              </th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((item, idx) => {
              const isFirstRow = idx === 0;
              const hasItem = item !== null;
              
              const itemTotal = hasItem
                ? (item.dailyRate || 0) * (item.gongsu || 1) +
                  (item.overtimeFee || 0) +
                  (item.mealFee || 0) +
                  (item.fuelFee || 0) +
                  (item.otherFee || 0)
                : 0;

              // Format work days text (e.g. "8/11" or "3일 [11, 12, 13일]" or "1공수")
              const workDaysDisplay = hasItem
                ? (item.workDaysList && item.workDaysList.length > 0)
                  ? `${item.workDaysList.length}일 (${item.workDaysList.join(', ')}일)`
                  : `${item.gongsu || 1}공수`
                : '';

              return (
                <tr key={hasItem ? item.id : `empty-row-${idx}`} className="h-10 sm:h-11">
                  {/* 구분 (위임인) - First row spans all rows */}
                  {isFirstRow && (
                    <td
                      rowSpan={displayRows.length}
                      className="border border-black font-bold text-center align-middle bg-slate-50/50 py-2"
                    >
                      위<br />임<br />인
                    </td>
                  )}

                  {/* 성명 */}
                  <td className="border border-black text-center font-semibold px-2 py-1">
                    {hasItem ? item.name : ''}
                  </td>

                  {/* 주민번호 */}
                  <td className="border border-black text-center px-1.5 py-1">
                    {hasItem ? (
                      isPrintOnly ? (
                        <span className="font-mono text-xs">
                          {maskResidentNumber ? maskResidentId(item.residentId) : (item.residentId || '')}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={item.residentId || ''}
                          onChange={(e) => handleResidentIdChange(idx, e.target.value)}
                          placeholder="주민번호/생년월일"
                          className="w-full text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-xs font-mono py-0.5"
                        />
                      )
                    ) : ''}
                  </td>

                  {/* 작업일 */}
                  <td className="border border-black text-center text-xs px-1.5 py-1 font-medium">
                    {hasItem ? workDaysDisplay : ''}
                  </td>

                  {/* 영수금액 */}
                  <td className="border border-black text-right px-3 py-1 font-medium">
                    {hasItem && itemTotal > 0 ? `₩ ${itemTotal.toLocaleString()}` : ''}
                  </td>

                  {/* 서명날인 (Interactive Signature / Stamp) */}
                  <td className="border border-black text-center px-1 py-1 align-middle relative">
                    {hasItem ? (
                      item.signatureDataUrl ? (
                        <div
                          onClick={() => !isPrintOnly && setSigningWorkerIndex(idx)}
                          className={`flex items-center justify-center h-full min-h-[32px] cursor-pointer group ${
                            !isPrintOnly ? 'hover:bg-slate-100/80 rounded transition-colors' : ''
                          }`}
                          title="클릭하여 서명 다시 작성 또는 수정"
                        >
                          <img
                            src={item.signatureDataUrl}
                            alt={`${item.name} 서명`}
                            className="max-h-8 max-w-[100px] object-contain inline-block"
                          />
                          {!isPrintOnly && (
                            <span className="sr-only group-hover:not-sr-only text-[10px] text-blue-600 ml-1">
                              수정
                            </span>
                          )}
                        </div>
                      ) : (
                        !isPrintOnly ? (
                          <button
                            type="button"
                            onClick={() => setSigningWorkerIndex(idx)}
                            className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center mx-auto space-x-1 border border-blue-200 transition-colors cursor-pointer"
                          >
                            <PenTool className="w-3 h-3" />
                            <span>서명/날인</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">(인)</span>
                        )
                      )
                    ) : (
                      ''
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Bottom Total Summary Row */}
            <tr className="bg-slate-50 font-bold border-t-2 border-black h-10">
              <td className="border border-black text-center py-2">
                총 계
              </td>
              <td className="border border-black text-center py-2">
                {totalWorkersCount} 명
              </td>
              <td className="border border-black text-center py-2 text-xs text-slate-500">
                -
              </td>
              <td className="border border-black text-center py-2">
                {totalGongsu}공수
              </td>
              <td className="border border-black text-right px-3 py-2 text-sm sm:text-base font-black">
                ₩ {totalAmount.toLocaleString()}
              </td>
              <td className="border border-black text-center py-2 text-xs text-slate-400">
                -
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature Modal */}
      {signingWorkerIndex !== null && workers[signingWorkerIndex] && (
        <SignatureModal
          workerName={workers[signingWorkerIndex].name}
          initialSignature={workers[signingWorkerIndex].signatureDataUrl}
          onSave={(sigDataUrl) => {
            handleSaveSignature(signingWorkerIndex, sigDataUrl);
            setSigningWorkerIndex(null);
          }}
          onClose={() => setSigningWorkerIndex(null)}
        />
      )}

    </div>
  );
};
