import { DispatchLog, OfficeSettings, WorkerMaster, ClientSiteMaster } from '../types';

export const DEFAULT_OFFICE_PROFILES: OfficeSettings[] = [
  {
    id: 'default',
    profileName: '젊은인력사무소 (본점)',
    officeName: '젊은인력사무소',
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
  { id: 'c1', clientName: '신성에스엔티', contactPhone: '010-2998-1757', address: '경북 성주군 성주읍' },
  { id: 'c2', clientName: '태양건설(성주현장)', contactPhone: '010-8888-9999', address: '성주군 초전면' },
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
