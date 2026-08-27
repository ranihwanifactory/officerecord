import React, { useState, useEffect, useRef } from 'react';
import { OfficeSettings, DatabaseBackupData } from '../types';
import { 
  Settings, Save, Shield, Building, Phone, MapPin, CreditCard, Plus, CheckCircle, 
  Trash2, Edit3, Tag, Database, Download, Upload, RefreshCw, AlertTriangle, CheckCircle2,
  FileText, Users, Loader2, HardDrive
} from 'lucide-react';
import { 
  downloadDatabaseBackup, 
  validateBackupFile, 
  restoreDatabaseFromBackup,
  syncOfficeProfilesWithFirestore
} from '../services/dataService';

interface OfficeSettingsModalProps {
  officeSettings: OfficeSettings;
  officeProfiles?: OfficeSettings[];
  activeOfficeId?: string;
  dispatchLogsCount?: number;
  workersCount?: number;
  clientsCount?: number;
  currentUserEmail?: string;
  onSave: (settings: OfficeSettings) => void;
  onDeleteProfile?: (id: string) => void;
  onSelectActiveProfile?: (id: string) => void;
}

export const OfficeSettingsModal: React.FC<OfficeSettingsModalProps> = ({
  officeSettings,
  officeProfiles = [],
  activeOfficeId = 'default',
  dispatchLogsCount = 0,
  workersCount = 0,
  clientsCount = 0,
  currentUserEmail,
  onSave,
  onDeleteProfile,
  onSelectActiveProfile,
}) => {
  // If no officeProfiles passed, fallback to single array with officeSettings
  const profiles = officeProfiles.length > 0 ? officeProfiles : [officeSettings];

  // Currently selected profile id for editing in form
  const [selectedEditId, setSelectedEditId] = useState<string | null>(
    officeSettings.id || profiles[0]?.id || 'default'
  );

  // Form State
  const [profileName, setProfileName] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [address, setAddress] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [representativeName, setRepresentativeName] = useState('김진환');
  const [representativeResidentId, setRepresentativeResidentId] = useState('801121-1795828');
  const [representativeAccount, setRepresentativeAccount] = useState('기업은행 69301137601015 김진환');
  const [adminEmailsStr, setAdminEmailsStr] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Auto-sync with Firestore on mount to guarantee latest cloud profiles across devices
  useEffect(() => {
    syncOfficeProfilesWithFirestore().catch((err) => {
      console.warn('Modal auto-sync error:', err);
    });
  }, []);

  const handleSyncCloud = async () => {
    try {
      setIsSyncingCloud(true);
      const synced = await syncOfficeProfilesWithFirestore();
      setSyncNotice(`✓ 클라우드 DB와 ${synced.length}개 사무소 프로필이 동기화되었습니다.`);
      setTimeout(() => setSyncNotice(null), 3500);
    } catch (err: any) {
      alert(`동기화 중 오류가 발생했습니다: ${err?.message || err}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Backup & Restore State
  const [backupDownloadNotice, setBackupDownloadNotice] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<DatabaseBackupData | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResultNotice, setRestoreResultNotice] = useState<{
    logs: number;
    workers: number;
    clients: number;
    profiles: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form based on selectedEditId
  useEffect(() => {
    if (selectedEditId) {
      const target = profiles.find((p) => p.id === selectedEditId) || officeSettings;
      setProfileName(target.profileName || target.officeName || '젊은인력사무소 (본점)');
      setOfficeName(target.officeName || '');
      setPhone1(target.phone1 || '');
      setPhone2(target.phone2 || '');
      setAddress(target.address || '');
      setBankAccount(target.bankAccount || '');
      setRepresentativeName(target.representativeName || '김진환');
      setRepresentativeResidentId(target.representativeResidentId || '801121-1795828');
      setRepresentativeAccount(target.representativeAccount || '기업은행 69301137601015 김진환');
      setAdminEmailsStr((target.adminEmails || ['acehwan69@gmail.com']).join(', '));
      setIsDefault(Boolean(target.isDefault));
    } else {
      // New Profile Reset
      setProfileName('');
      setOfficeName('');
      setPhone1('');
      setPhone2('');
      setAddress('');
      setBankAccount('');
      setRepresentativeName('김진환');
      setRepresentativeResidentId('801121-1795828');
      setRepresentativeAccount('기업은행 69301137601015 김진환');
      setAdminEmailsStr('acehwan69@gmail.com, hwanace@gmail.com');
      setIsDefault(profiles.length === 0);
    }
  }, [selectedEditId, officeProfiles, officeSettings]);

  const handleAddNew = () => {
    setSelectedEditId(null);
  };

  const handleSelectForEdit = (profile: OfficeSettings) => {
    setSelectedEditId(profile.id || null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailsList = adminEmailsStr
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    const targetId = selectedEditId || `office_${Date.now()}`;
    const cleanOfficeName = officeName.trim() || '젊은인력사무소';
    const cleanProfileName = profileName.trim() || `${cleanOfficeName} 프로필`;

    const updated: OfficeSettings = {
      id: targetId,
      profileName: cleanProfileName,
      officeName: cleanOfficeName,
      phone1: phone1.trim(),
      phone2: phone2.trim(),
      address: address.trim(),
      bankAccount: bankAccount.trim(),
      representativeName: representativeName.trim(),
      representativeResidentId: representativeResidentId.trim(),
      representativeAccount: representativeAccount.trim(),
      adminEmails: emailsList.length > 0 ? emailsList : ['acehwan69@gmail.com'],
      isDefault,
    };

    onSave(updated);
    setSelectedEditId(targetId);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleDownloadBackup = () => {
    try {
      downloadDatabaseBackup(currentUserEmail);
      setBackupDownloadNotice(true);
      setTimeout(() => setBackupDownloadNotice(false), 4000);
    } catch (err: any) {
      alert(`백업 파일 생성 중 오류가 발생했습니다: ${err?.message || err}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError(null);
    setRestoreResultNotice(null);
    const file = e.target.files?.[0];
    if (!file) {
      setRestoreFile(null);
      setParsedBackup(null);
      return;
    }

    setRestoreFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = validateBackupFile(content);
      if (validation.isValid && validation.data) {
        setParsedBackup(validation.data);
        setRestoreError(null);
      } else {
        setParsedBackup(null);
        setRestoreError(validation.error || '유효하지 않은 백업 파일입니다.');
      }
    };
    reader.onerror = () => {
      setRestoreError('파일을 읽는 중 오류가 발생했습니다.');
      setParsedBackup(null);
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!parsedBackup) return;

    const summary = parsedBackup.summary || {
      logsCount: parsedBackup.dispatchLogs?.length || 0,
      workersCount: parsedBackup.workers?.length || 0,
      clientsCount: parsedBackup.clients?.length || 0,
      officeProfilesCount: parsedBackup.officeProfiles?.length || 0,
    };

    const confirmMsg = restoreMode === 'overwrite'
      ? `[주의: 전체 덮어쓰기 복원]\n\n현재 시스템의 기존 데이터를 백업 데이터(출력표 ${summary.logsCount}건, 인부 ${summary.workersCount}명, 업체 ${summary.clientsCount}곳, 프로필 ${summary.officeProfilesCount}개)로 완전히 교체합니다.\n\n정말로 복원을 진행하시겠습니까?`
      : `[병합 추가 복원]\n\n기존 데이터를 유지한 상태로 백업 데이터(출력표 ${summary.logsCount}건, 인부 ${summary.workersCount}명, 업체 ${summary.clientsCount}곳, 프로필 ${summary.officeProfilesCount}개)를 추가 및 병합합니다.\n\n진행하시겠습니까?`;

    if (!confirm(confirmMsg)) return;

    try {
      setIsRestoring(true);
      const result = await restoreDatabaseFromBackup(parsedBackup, restoreMode);
      setRestoreResultNotice({
        logs: result.logsCount,
        workers: result.workersCount,
        clients: result.clientsCount,
        profiles: result.officeProfilesCount,
      });
      setRestoreFile(null);
      setParsedBackup(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      alert(`데이터베이스 복구 중 오류가 발생했습니다: ${err?.message || err}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCancelRestore = () => {
    setRestoreFile(null);
    setParsedBackup(null);
    setRestoreError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title & Description Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">사무소 프로필 다중 관리 & 설정</h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  클라우드 DB 실시간 동기화 중
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                모든 PC, 모바일 및 기기 간에 등록된 사무소 프로필이 실시간으로 자동 동기화됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSyncCloud}
              disabled={isSyncingCloud}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="클라우드 DB와 즉시 수동 동기화"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>{isSyncingCloud ? '동기화 중...' : '클라우드 DB 동기화'}</span>
            </button>

            <button
              onClick={handleAddNew}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>새 프로필 추가</span>
            </button>
          </div>
        </div>

        {syncNotice && (
          <div className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{syncNotice}</span>
          </div>
        )}

        {/* Profiles List Cards Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            등록된 사무소 목록 ({profiles.length}개)
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profiles.map((p) => {
              const pId = p.id || 'default';
              const isActive = activeOfficeId === pId || (profiles.length === 1);
              const isBeingEdited = selectedEditId === pId;

              return (
                <div
                  key={pId}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isActive
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20'
                      : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          {p.profileName || p.officeName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {p.isDefault && (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 rounded-md border border-amber-300 dark:border-amber-800">
                            기본
                          </span>
                        )}
                        {isActive && (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 rounded-md border border-blue-300 dark:border-blue-700 flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>현재 사용 중</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5 pt-1 font-medium">
                      <div>상호: <span className="font-bold">{p.officeName}</span></div>
                      {p.phone1 && <div>연락처: {p.phone1} {p.phone2 ? `/ ${p.phone2}` : ''}</div>}
                      {p.bankAccount && <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">계좌: {p.bankAccount}</div>}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    {!isActive ? (
                      <button
                        onClick={() => onSelectActiveProfile && onSelectActiveProfile(pId)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>이 사무소로 선택하기</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1">
                        <span>✓ 기본 선택됨</span>
                      </span>
                    )}

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSelectForEdit(p)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer ${
                          isBeingEdited
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isBeingEdited ? '수정 중' : '정보 수정'}</span>
                      </button>

                      {profiles.length > 1 && !p.isDefault && onDeleteProfile && (
                        <button
                          onClick={() => {
                            if (confirm(`'${p.profileName || p.officeName}' 프로필을 삭제하시겠습니까?`)) {
                              onDeleteProfile(pId);
                              if (selectedEditId === pId) {
                                setSelectedEditId(profiles.find((x) => x.id !== pId)?.id || 'default');
                              }
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                          title="프로필 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Card for Selected or New Profile */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>
              {selectedEditId
                ? `'${profileName || '사무소'}' 세부 정보 수정`
                : '신규 사무소 프로필 등록'}
            </span>
          </h3>
          {selectedEditId && (
            <button
              onClick={handleAddNew}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              + 새 프로필 작성으로 전환
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Label Name & Office Real Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>프로필 구분 명칭 *</span>
              </label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="예: 젊은인력사무소 (본점)"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                * 드롭다운 목록에서 사무소를 쉽게 구별할 별칭입니다.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>사무소 상호명 (출력표 표기) *</span>
              </label>
              <input
                type="text"
                required
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder="예: 젊은인력사무소"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* Phones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>전화번호 1 (사무실)</span>
              </label>
              <input
                type="text"
                value={phone1}
                onChange={(e) => setPhone1(e.target.value)}
                placeholder="054-933-1566"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>전화번호 2 (휴대폰)</span>
              </label>
              <input
                type="text"
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
                placeholder="010-7545-0038"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>사무소 소재지 주소</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="경북 성주군 성주읍 성주순환로2길 69"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Bank Account */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
              <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>출력표 인쇄용 입금 계좌번호</span>
            </label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="농협 302-65550038-11 손영란"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Representative / Delegation Info Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <span>✍️ 위임장 수임인 (대표자) 기본 정보</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  수임인 성명
                </label>
                <input
                  type="text"
                  value={representativeName}
                  onChange={(e) => setRepresentativeName(e.target.value)}
                  placeholder="예: 김진환"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  수임인 주민등록번호
                </label>
                <input
                  type="text"
                  value={representativeResidentId}
                  onChange={(e) => setRepresentativeResidentId(e.target.value)}
                  placeholder="예: 801121-1795828"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                수임인 수령 계좌번호
              </label>
              <input
                type="text"
                value={representativeAccount}
                onChange={(e) => setRepresentativeAccount(e.target.value)}
                placeholder="예: 기업은행 69301137601015 김진환"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Admin Emails */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>관리자 구글 계정 이메일 목록 (쉼표로 구분)</span>
            </label>
            <input
              type="text"
              value={adminEmailsStr}
              onChange={(e) => setAdminEmailsStr(e.target.value)}
              placeholder="acehwan69@gmail.com, hwanace@gmail.com"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-mono text-blue-600 dark:text-blue-400 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Default Switch Checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="isDefaultCheck"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="isDefaultCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              이 사무소를 시스템 대표 기본 사무소로 지정
            </label>
          </div>

          {/* Submit */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            {isSavedNotice ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                ✓ 프로필 설정이 성공적으로 저장되었습니다!
              </span>
            ) : <div />}

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{selectedEditId ? '프로필 변경사항 저장' : '새 프로필 등록'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================== */}
      {/* FULL DATABASE BACKUP & RESTORE SECTION (ADMIN EXCLUSIVE)  */}
      {/* ========================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-6">
        
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                전체 데이터베이스 백업 및 복구 (Admin Backup & Restore)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                앱에서 기록한 모든 출력표 일지, 인부 명단, 업체 정보, 사무소 프로필을 JSON 파일로 백업하고 언제든지 안전하게 복원할 수 있습니다.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
            관리자 전용
          </span>
        </div>

        {/* Live Database Stats Overview */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            현재 저장된 데이터베이스 통계
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">출력표 일지</div>
                <div className="text-base font-extrabold text-slate-800 dark:text-slate-100">{dispatchLogsCount}건</div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">인부 명단</div>
                <div className="text-base font-extrabold text-slate-800 dark:text-slate-100">{workersCount}명</div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">현장/업체</div>
                <div className="text-base font-extrabold text-slate-800 dark:text-slate-100">{clientsCount}곳</div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">사무소 프로필</div>
                <div className="text-base font-extrabold text-slate-800 dark:text-slate-100">{profiles.length}개</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Action Panels: Backup (Left) & Restore (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* 1. Database Backup Panel */}
          <div className="bg-gradient-to-br from-slate-50 to-purple-50/40 dark:from-slate-800/50 dark:to-purple-950/20 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  데이터베이스 전체 백업 (다운로드)
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                현재 등록된 모든 데이터(출력표 일지, 인부, 업체, 사무소 프로필 등)를 타임스탬프가 포함된 단일 <code className="bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 rounded text-purple-700 dark:text-purple-300 font-mono text-[11px]">.json</code> 파일로 즉시 다운로드하여 외장 드라이브나 PC에 안전하게 보관할 수 있습니다.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>전체 DB 백업 파일(.json) 다운로드</span>
              </button>

              {backupDownloadNotice && (
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center space-x-1.5 py-1 animate-pulse">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ 전체 데이터베이스 백업 파일이 생성되어 다운로드되었습니다!</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Database Restore Panel */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/50 dark:to-blue-950/20 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  데이터베이스 복구 / 복원 (가져오기)
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                이전에 백업해둔 <code className="bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300 font-mono text-[11px]">.json</code> 파일을 업로드하여 기존 데이터를 복원하거나 새로 추가 병합할 수 있습니다.
              </p>
            </div>

            {/* Hidden File Input & Trigger Button */}
            <div className="space-y-2 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
                id="restoreFileInput"
              />

              {!parsedBackup ? (
                <label
                  htmlFor="restoreFileInput"
                  className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-2xs transition-all cursor-pointer text-center"
                >
                  <Upload className="w-4 h-4 stroke-[2.5]" />
                  <span>백업 파일(.json) 선택하여 복구하기</span>
                </label>
              ) : null}

              {restoreError && (
                <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Parsed Backup Preview & Restore Execution Card */}
        {parsedBackup && (
          <div className="bg-blue-50/70 dark:bg-blue-950/40 p-5 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-blue-200/80 dark:border-blue-800 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  선택된 백업 파일 정보 검증 완료
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {restoreFile?.name}
              </span>
            </div>

            {/* Backup Content Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/60">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">출력표 일지</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                  {parsedBackup.summary?.logsCount || parsedBackup.dispatchLogs?.length || 0}건
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">인부 명단</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                  {parsedBackup.summary?.workersCount || parsedBackup.workers?.length || 0}명
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">현장/업체</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                  {parsedBackup.summary?.clientsCount || parsedBackup.clients?.length || 0}곳
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">사무소 프로필</span>
                <span className="font-extrabold text-purple-600 dark:text-purple-400 text-sm">
                  {parsedBackup.summary?.officeProfilesCount || parsedBackup.officeProfiles?.length || 0}개
                </span>
              </div>
            </div>

            {/* Restore Mode Options */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                복구 방식 선택
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                    restoreMode === 'overwrite'
                      ? 'bg-white dark:bg-slate-900 border-blue-600 dark:border-blue-400 shadow-2xs'
                      : 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="restoreMode"
                    value="overwrite"
                    checked={restoreMode === 'overwrite'}
                    onChange={() => setRestoreMode('overwrite')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      전체 덮어쓰기 (완전 복원)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      기존 데이터를 백업 시점의 상태로 완전히 교체 복구합니다.
                    </div>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                    restoreMode === 'merge'
                      ? 'bg-white dark:bg-slate-900 border-blue-600 dark:border-blue-400 shadow-2xs'
                      : 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="restoreMode"
                    value="merge"
                    checked={restoreMode === 'merge'}
                    onChange={() => setRestoreMode('merge')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      기존 데이터에 병합 (추가 복원)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      현재 등록된 데이터를 유지하면서 백업 항목들을 추가 및 갱신합니다.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleCancelRestore}
                disabled={isRestoring}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                취소
              </button>

              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-bold px-5 py-2 rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>데이터베이스 복구 중...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>데이터베이스 복원 실행</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Restore Result Notification Banner */}
        {restoreResultNotice && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 p-4 rounded-2xl text-emerald-800 dark:text-emerald-200 space-y-1 animate-in fade-in">
            <div className="font-extrabold text-sm flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>✓ 데이터베이스가 성공적으로 복구 및 동기화되었습니다!</span>
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-300 pl-5">
              복원 결과: 출력표 {restoreResultNotice.logs}건 / 인부 명단 {restoreResultNotice.workers}명 / 현장·업체 {restoreResultNotice.clients}곳 / 사무소 프로필 {restoreResultNotice.profiles}개
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
