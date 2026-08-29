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
  },
];

export const DEFAULT_OFFICE_SETTINGS: OfficeSettings = DEFAULT_OFFICE_PROFILES[0];

export const INITIAL_WORKERS: WorkerMaster[] = [
  { id: 'w1', name: '이성복', category: '보통', defaultDailyRate: 160000, phone: '010-1234-5678' },
  { id: 'w2', name: '구완회', category: '보통', defaultDailyRate: 160000, phone: '010-2345-6789' },
  { id: 'w3', name: '임성빈', category: '보통', defaultDailyRate: 160000, phone: '010-3456-7890' },
  { id: 'w4', name: '강명수', category: '보통', defaultDailyRate: 160000, phone: '010-4567-8901' },
  { id: 'w5', name: '박철민', category: '기공', defaultDailyRate: 220000, phone: '010-5678-9012' },
  { id: 'w6', name: '최동현', category: '보통', defaultDailyRate: 160000, phone: '010-6789-0123' },
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

