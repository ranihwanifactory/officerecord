import { DispatchLog, OfficeSettings, WorkerMaster, ClientSiteMaster, TaxInvoice } from '../types';

export const DEFAULT_OFFICE_PROFILES: OfficeSettings[] = [
  {
    id: 'default',
    profileName: '젊은인력사무소 (본점)',
    officeName: '젊은인력사무소',
    registrationNumber: '508-90-65550',
    bizType: '서비스업',
    bizCategory: '인력공급, 근로자파견, 고용알선',
    email: 'acehwan69@gmail.com',
    phone1: '054-933-1566',
    phone2: '010-7545-0038',
    address: '경북 성주군 성주읍 성주순환로2길 69',
    bankAccount: '농협 302-65550038-11 손영란',
    representativeName: '김진환',
    representativeResidentId: '801121-1795828',
    representativeAccount: '기업은행 69301137601015 김진환',
    adminEmails: ['acehwan69@gmail.com', 'hwanace@gmail.com'],
    isDefault: true,
    color: '#2563EB', // 기본 본점 대표 색상 (로얄 블루)
  },
];

export const BRANCH_COLOR_PALETTE = [
  { name: '로얄 블루', hex: '#2563EB', bgClass: 'bg-blue-600', textClass: 'text-blue-600' },
  { name: '에메랄드 그린', hex: '#059669', bgClass: 'bg-emerald-600', textClass: 'text-emerald-600' },
  { name: '바이올렛 퍼플', hex: '#7C3AED', bgClass: 'bg-purple-600', textClass: 'text-purple-600' },
  { name: '앰버 오렌지', hex: '#D97706', bgClass: 'bg-amber-600', textClass: 'text-amber-600' },
  { name: '로즈 레드', hex: '#E11D48', bgClass: 'bg-rose-600', textClass: 'text-rose-600' },
  { name: '틸 사이언', hex: '#0D9488', bgClass: 'bg-teal-600', textClass: 'text-teal-600' },
  { name: '인디고 네이비', hex: '#4F46E5', bgClass: 'bg-indigo-600', textClass: 'text-indigo-600' },
  { name: '스카이 블루', hex: '#0284C7', bgClass: 'bg-sky-600', textClass: 'text-sky-600' },
  { name: '푸시아 핑크', hex: '#C026D3', bgClass: 'bg-fuchsia-600', textClass: 'text-fuchsia-600' },
  { name: '슬레이트 그레이', hex: '#475569', bgClass: 'bg-slate-600', textClass: 'text-slate-600' },
];

export function getBranchRepresentativeColor(
  profiles: OfficeSettings[],
  profileId?: string,
  fallbackIndex: number = 0
): string {
  if (!profileId) {
    const defaultProfile = profiles.find((p) => p.isDefault) || profiles[0];
    return defaultProfile?.color || BRANCH_COLOR_PALETTE[0].hex;
  }
  const found = profiles.find((p) => p.id === profileId);
  if (found?.color) {
    return found.color;
  }
  const idx = profiles.findIndex((p) => p.id === profileId);
  const targetIdx = idx >= 0 ? idx : Math.abs(fallbackIndex);
  return BRANCH_COLOR_PALETTE[targetIdx % BRANCH_COLOR_PALETTE.length].hex;
}

export const DEFAULT_OFFICE_SETTINGS: OfficeSettings = DEFAULT_OFFICE_PROFILES[0];

export const INITIAL_WORKERS: WorkerMaster[] = [
  { id: 'w1', name: '이성복', category: '보통', specialty: '곰방/양중, 자재정리', defaultDailyRate: 160000, phone: '010-1234-5678', memo: '체력 좋고 성실함, 안전교육 이수', bankName: '농협', accountNumber: '302-1234-5678-91', accountHolder: '이성복', bankAccount: '농협 302-1234-5678-91 (이성복)' },
  { id: 'w2', name: '구완회', category: '보통', specialty: '조적, 할석(하스리)', defaultDailyRate: 160000, phone: '010-2345-6789', memo: '차량소지(스타렉스)', bankName: '국민은행', accountNumber: '655502-01-234567', accountHolder: '구완회', bankAccount: '국민은행 655502-01-234567 (구완회)' },
  { id: 'w3', name: '임성빈', category: '보통', specialty: '철거, 자재운반', defaultDailyRate: 160000, phone: '010-3456-7890', bankName: '대구은행', accountNumber: '508-12-345678-9', accountHolder: '임성빈', bankAccount: '대구은행 508-12-345678-9 (임성빈)' },
  { id: 'w4', name: '강명수', category: '보통', specialty: '미장, 견출', defaultDailyRate: 160000, phone: '010-4567-8901', memo: '숙련도 높음', bankName: '신한은행', accountNumber: '110-345-678901', accountHolder: '강명수', bankAccount: '신한은행 110-345-678901 (강명수)' },
  { id: 'w5', name: '박철민', category: '기공', specialty: '용접, 형틀목수', defaultDailyRate: 220000, phone: '010-5678-9012', memo: '용접기능사 자격증 보유', bankName: '카카오뱅크', accountNumber: '3333-01-2345678', accountHolder: '박철민', bankAccount: '카카오뱅크 3333-01-2345678 (박철민)' },
  { id: 'w6', name: '최동현', category: '보통', specialty: '청소/정리, 신호수', defaultDailyRate: 160000, phone: '010-6789-0123', bankName: '우리은행', accountNumber: '1002-456-789012', accountHolder: '최동현', bankAccount: '우리은행 1002-456-789012 (최동현)' },
];

export const INITIAL_CLIENTS: ClientSiteMaster[] = [
  { 
    id: 'c1', 
    clientName: '신성에스엔티', 
    contactPhone: '010-2998-1757', 
    registrationNumber: '508-81-29981',
    representative: '박신성',
    email: 'sinseong_snt@example.com',
    address: '경북 성주군 성주읍 성주일반산업단지 3로 12',
    bizType: '제조업, 건설업',
    bizCategory: '금속가공, 플랜트시공'
  },
  { 
    id: 'c2', 
    clientName: '태양건설(성주현장)', 
    contactPhone: '010-8888-9999', 
    registrationNumber: '514-82-38490',
    representative: '이태양',
    email: 'taeyang_build@example.com',
    address: '성주군 초전면 대장길 88',
    bizType: '건설업',
    bizCategory: '종합건설, 토목공사'
  },
];

export const INITIAL_DISPATCH_LOGS: DispatchLog[] = [
  {
    id: 'sample-2026-08-11',
    date: '2026-08-11',
    clientName: '신성에스엔티',
    clientContact: '010-2998-1757',
    generalGongsuCount: 4,
    skillGongsuCount: 0,
    workers: [
      { id: 'item-1', workerId: 'w1', name: '이성복', category: '보통', dailyRate: 160000, gongsu: 1.0, remarks: '' },
      { id: 'item-2', workerId: 'w2', name: '구완회', category: '보통', dailyRate: 160000, gongsu: 1.0, remarks: '' },
      { id: 'item-3', workerId: 'w3', name: '임성빈', category: '보통', dailyRate: 160000, gongsu: 1.0, remarks: '' },
      { id: 'item-4', workerId: 'w4', name: '강명수', category: '보통', dailyRate: 160000, gongsu: 1.0, remarks: '' },
    ],
    totalAmount: 640000,
    memo: '8월 11일 신성에스엔티 보통 4명 출력',
    createdAt: '2026-08-11T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
    createdByEmail: 'acehwan69@gmail.com',
  },
];

export const INITIAL_TAX_INVOICES: TaxInvoice[] = [
  {
    id: 'sample-inv-20260811',
    invoiceNumber: '20260811-001',
    issueDate: '2026-08-11',
    ntsIssueId: '20260811-41000000-00129841',
    supplierOfficeId: 'default',
    supplierName: '젊은인력사무소',
    supplierRegistrationNumber: '508-90-65550',
    supplierRepresentative: '김진환',
    supplierAddress: '경북 성주군 성주읍 성주순환로2길 69',
    supplierBizType: '서비스업',
    supplierBizCategory: '인력공급, 근로자파견',
    supplierEmail: 'acehwan69@gmail.com',
    supplierPhone: '054-933-1566',
    
    clientId: 'c1',
    clientName: '신성에스엔티',
    clientRegistrationNumber: '508-81-29981',
    clientRepresentative: '박신성',
    clientAddress: '경북 성주군 성주읍 성주일반산업단지 3로 12',
    clientBizType: '제조업, 건설업',
    clientBizCategory: '금속가공, 플랜트시공',
    clientEmail: 'sinseong_snt@example.com',
    clientContact: '010-2998-1757',

    taxType: 'taxable',
    supplyAmount: 640000,
    taxAmount: 64000,
    totalAmount: 704000,
    items: [
      {
        id: 'item-inv-1',
        itemDate: '08-11',
        itemName: '8월 11일 보통인부 노무용역비',
        spec: '보통',
        quantity: 4,
        unitPrice: 160000,
        supplyAmount: 640000,
        taxAmount: 64000,
        remarks: '신성에스엔티 현장 작업지원',
      },
    ],
    linkedDispatchLogId: 'sample-2026-08-11',
    linkedDispatchLogDate: '2026-08-11',
    status: 'issued',
    paymentStatus: 'paid',
    paidAmount: 704000,
    paidDate: '2026-08-15',
    paymentType: 'cash',
    memo: '8/15 계좌 입금 확인 완료',
    createdAt: '2026-08-11T10:00:00.000Z',
    updatedAt: '2026-08-15T09:00:00.000Z',
    createdByEmail: 'acehwan69@gmail.com',
  },
];

