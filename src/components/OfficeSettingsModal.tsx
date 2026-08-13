import React, { useState, useEffect } from 'react';
import { OfficeSettings } from '../types';
import { Settings, Save, Shield, Building, Phone, MapPin, CreditCard, Plus, CheckCircle, Trash2, Edit3, Tag } from 'lucide-react';

interface OfficeSettingsModalProps {
  officeSettings: OfficeSettings;
  officeProfiles?: OfficeSettings[];
  activeOfficeId?: string;
  onSave: (settings: OfficeSettings) => void;
  onDeleteProfile?: (id: string) => void;
  onSelectActiveProfile?: (id: string) => void;
}

export const OfficeSettingsModal: React.FC<OfficeSettingsModalProps> = ({
  officeSettings,
  officeProfiles = [],
  activeOfficeId = 'default',
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
  const [adminEmailsStr, setAdminEmailsStr] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [isSavedNotice, setIsSavedNotice] = useState(false);

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
      adminEmails: emailsList.length > 0 ? emailsList : ['acehwan69@gmail.com'],
      isDefault,
    };

    onSave(updated);
    setSelectedEditId(targetId);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title & Description Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">사무소 프로필 다중 관리 & 설정</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                여러 사무실/지점 정보를 등록해두고 선택하여 출력표 및 정산서에 원하는 사무소 직인/정보를 반영할 수 있습니다.
              </p>
            </div>
          </div>

          <button
            onClick={handleAddNew}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>새 사무소 프로필 추가</span>
          </button>
        </div>

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
    </div>
  );
};
