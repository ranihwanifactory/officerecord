import React, { useState } from 'react';
import { OfficeSettings } from '../types';
import { Settings, Save, Shield, Building, Phone, MapPin, CreditCard } from 'lucide-react';

interface OfficeSettingsModalProps {
  officeSettings: OfficeSettings;
  onSave: (settings: OfficeSettings) => void;
}

export const OfficeSettingsModal: React.FC<OfficeSettingsModalProps> = ({ officeSettings, onSave }) => {
  const [officeName, setOfficeName] = useState(officeSettings.officeName);
  const [phone1, setPhone1] = useState(officeSettings.phone1);
  const [phone2, setPhone2] = useState(officeSettings.phone2);
  const [address, setAddress] = useState(officeSettings.address);
  const [bankAccount, setBankAccount] = useState(officeSettings.bankAccount);
  const [adminEmailsStr, setAdminEmailsStr] = useState(officeSettings.adminEmails.join(', '));
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailsList = adminEmailsStr
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    const updated: OfficeSettings = {
      officeName: officeName.trim() || '젊은인력사무소',
      phone1: phone1.trim(),
      phone2: phone2.trim(),
      address: address.trim(),
      bankAccount: bankAccount.trim(),
      adminEmails: emailsList.length > 0 ? emailsList : ['acehwan69@gmail.com'],
    };

    onSave(updated);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">사무소 및 도장/출력표 설정</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            출력표 하단 및 직인 상단에 표시될 사무소 정보와 계좌번호를 수정합니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Office Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
            <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>사무소 상호명 *</span>
          </label>
          <input
            type="text"
            required
            value={officeName}
            onChange={(e) => setOfficeName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
          />
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
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            * <span className="font-bold text-blue-600 dark:text-blue-400">acehwan69@gmail.com</span> 계정으로 구글 로그인 시 관리자 권한이 부여됩니다.
          </p>
        </div>

        {/* Submit */}
        <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          {isSavedNotice ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
              ✓ 사무소 정보가 성공적으로 저장되었습니다!
            </span>
          ) : <div />}

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>설정 저장하기</span>
          </button>
        </div>

      </form>
    </div>
  );
};
