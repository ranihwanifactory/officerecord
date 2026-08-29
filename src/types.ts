export type WorkerCategory = '보통' | '조공' | '기공' | '특별기공' | '신호수' | '잡급' | '반장' | '일반' | string;

export interface WorkerMaster {
  id: string;
  name: string;
  category: WorkerCategory;
  defaultDailyRate: number; // e.g. 160000
  residentId?: string; // 주민등록번호 (예: 801121-1795828)
  phone?: string;
  memo?: string;
  createdAt?: string;
}

export interface ClientSiteMaster {
  id: string;
  clientName: string; // e.g. "신성에스엔티"
  contactPhone: string; // e.g. "010-2998-1757"
  registrationNumber?: string; // 사업자등록번호 (e.g. "508-81-12345")
  representative?: string; // 대표자명
  email?: string; // 전자세금계산서 수신 이메일
  address?: string; // 사업장 주소
  bizType?: string; // 업태 (예: 건설업, 제조업)
  bizCategory?: string; // 종목 (예: 철근콘크리트, 토공)
  memo?: string;
}

export type TaxInvoiceStatus = 'draft' | 'issued' | 'nts_transmitted' | 'amended' | 'cancelled' | '작성중' | '발행완료' | '국세청전송' | '취소/수정' | string;
export type TaxInvoiceTaxType = 'taxable' | 'tax_free' | 'zero_rate' | '일반' | '영세율' | '면세' | string;
export type PaymentStatus = 'unpaid' | 'paid' | 'partial' | '미수' | '완납' | '일부입금' | string;

export interface TaxInvoiceItem {
  id: string;
  itemDate?: string; // 월/일 (예: "08-28" 또는 "2026-08-28")
  date?: string; // alias for itemDate
  itemName: string; // 품목명 (예: "8월 보통인부 노무용역비", "건설현장 용역지원")
  itemDescription?: string; // alias for itemName
  spec?: string; // 규격 (예: "보통", "기공")
  specification?: string; // alias for spec
  quantity?: number; // 수량 (공수)
  unitPrice?: number; // 단가
  supplyAmount: number; // 공급가액
  taxAmount: number; // 세액
  remarks?: string; // 비고
  remark?: string; // alias for remarks
}

export interface TaxInvoice {
  id: string;
  invoiceNumber?: string; // 세금계산서 관리번호 (예: "20260828-001")
  issueDate: string; // 작성일자 (YYYY-MM-DD)
  ntsIssueId?: string; // 국세청 승인번호 (홈택스 24자리 또는 발급번호)
  ntsApprovalNumber?: string; // 국세청 승인번호 alias
  invoiceType?: string; // 세금계산서 종류 ('일반', '영세율', '면세')

  // 공급자 (사무소 프로필 연동)
  supplierOfficeId?: string; // OfficeSettings profile id
  supplierName: string; // 상호(법인명)
  supplierOfficeName?: string; // 상호 alias
  supplierRegistrationNumber: string; // 등록번호
  supplierRepresentative: string; // 성명(대표자)
  supplierAddress: string; // 사업장 주소
  supplierBizType?: string; // 업태
  supplierBizCategory?: string; // 종목
  supplierEmail?: string; // 공급자 이메일
  supplierPhone?: string; // 공급자 전화번호

  // 공급받는자 (거래처)
  clientId?: string; // ClientSiteMaster reference ID
  buyerClientId?: string; // 거래처 ID alias
  clientName: string; // 상호(법인명)
  buyerOfficeName?: string; // 공급받는자 상호 alias
  clientRegistrationNumber: string; // 등록번호 (사업자/주민번호)
  buyerRegistrationNumber?: string; // 등록번호 alias
  clientRepresentative?: string; // 성명(대표자)
  buyerRepresentative?: string; // 대표자명 alias
  clientAddress?: string; // 사업장 주소
  buyerAddress?: string; // 사업장 주소 alias
  clientBizType?: string; // 업태
  buyerBizType?: string; // 업태 alias
  clientBizCategory?: string; // 종목
  buyerBizCategory?: string; // 종목 alias
  clientEmail?: string; // 공급받는자 이메일 (계산서 수신용)
  buyerEmail?: string; // 이메일 alias
  clientContact?: string; // 담당자 연락처

  // 금액 계산
  taxType?: TaxInvoiceTaxType; // 과세(10%) / 면세 / 영세율
  supplyAmount: number; // 공급가액 합계
  taxAmount: number; // 세액 합계
  totalAmount: number; // 총 합계금액 (공급가액 + 세액)

  // 세부 품목 목록 (1~4건 이상)
  items: TaxInvoiceItem[];

  // 연계된 출력일지
  linkedDispatchLogId?: string;
  linkedDispatchLogDate?: string;

  // 발행 상태 및 수금/입금 상태
  status: TaxInvoiceStatus; // 'draft' | 'issued' | 'nts_transmitted' | 'amended' | 'cancelled' | '발행완료' 등
  paymentStatus?: PaymentStatus; // 'unpaid' | 'paid' | 'partial'
  paidAmount?: number; // 실제 입금된 금액
  paidDate?: string; // 입금일자 (YYYY-MM-DD)
  paymentType?: 'cash' | 'check' | 'note' | 'receivable' | string; // 영수/청구 구분 및 결제수단

  memo?: string; // 메모 / 특이사항
  remarks?: string; // 특이사항 alias
  createdAt: string;
  updatedAt: string;
  createdByEmail?: string;
}

export interface DispatchWorkerItem {
  id: string;
  workerId?: string; // reference to WorkerMaster if selected
  name: string; // e.g. "이성복"
  category: WorkerCategory; // '일반' | '기공'
  dailyRate: number; // e.g. 160000
  gongsu: number; // e.g. 1.0 (공수) or total days worked
  residentId?: string; // 주민등록번호 (위임장 표기용)
  signatureDataUrl?: string; // 서명날인 이미지 (Base64 Data URL)
  remarks?: string; // 비고
  workDaysList?: number[]; // [1, 2, 3, 5, 12, 15, ...] selected day numbers (1..31)
  overtimeFee?: number; // 잔업비 (원)
  mealFee?: number; // 식대 (원)
  fuelFee?: number; // 주유비 (원)
  otherFee?: number; // 기타비용 (원)
  extraFeeRemarks?: string; // 기타비용 세부 내역 (예: "야간잔업 2시간, 식대 2식, 주유비")
}

export interface InvoiceItem {
  id: string;
  date: string; // 일자 (예: "2026-08-11" 또는 "08월 11일")
  workCategory: string; // 용역 항목/직종 (예: "보통인부", "특별기공", "신호수", "철거작업")
  serviceCount: number; // 용역 수 / 공수 (예: 3.0명)
  unitPrice: number; // 단가 (예: 160,000원)
  laborCost: number; // 인건비 (용역수 * 단가)
  overtimeFee?: number; // 잔업비 (원)
  mealFee?: number; // 식대 (원)
  fuelFee?: number; // 주유비 (원)
  otherFee?: number; // 기타비용 (원)
  totalItemAmount: number; // 총 금액 (인건비 + 기타비용)
  remarks?: string; // 비고 / 세부내역
}

export interface DispatchLog {
  id: string;
  date: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD (작업 시작일)
  endDate?: string; // YYYY-MM-DD (작업 종료일)
  clientName: string; // 업체/현장명
  clientContact: string; // 구인자연락처
  siteAddress?: string; // 현장 주소
  officeProfileId?: string; // 발행 사무소 프로필 ID
  generalGongsuCount: number; // 일반 공수 합계
  skillGongsuCount: number; // 기공 공수 합계
  workers: DispatchWorkerItem[];
  formType?: 'worker_roster' | 'invoice_summary' | 'delegation_letter'; // 양식 선택: 'worker_roster' (인부별 출근 출력표) | 'invoice_summary' (계산서용 출력표) | 'delegation_letter' (임금 수령 위임장)
  invoiceItems?: InvoiceItem[]; // 계산서용 일별 용역수 & 인건비 정산 항목들
  totalLaborCost?: number; // 총 인건비 합계
  totalExtraFee?: number; // 기타비용 총합계 (잔업/식대/주유비)
  totalAmount: number; // 기존 합계 (인건비 + 기타비용)
  grandTotalAmount?: number; // 최종 총 청구금액
  memo?: string;
  isPaid?: boolean; // 결제 완료 여부 (true: 결제완료, false/undefined: 미결제)
  paidAt?: string; // 결제 완료 처리 일시
  
  // 위임장 전용 커스텀 필드 (옵션)
  delegationWorkTitle?: string; // 작업명 (기본: "[업체명] 작업지원")
  delegationRecipientName?: string; // 수임인 성명
  delegationRecipientResidentId?: string; // 수임인 주민등록번호
  delegationRecipientAddress?: string; // 수임인 주소
  delegationRecipientAccount?: string; // 수임인 계좌번호

  createdAt: string;
  updatedAt: string;
  createdByEmail?: string;
}

export interface OfficeSettings {
  id?: string; // 프로필 고유 ID (예: 'office-1', 'default')
  profileName?: string; // 프로필 관리용 명칭 (예: '젊은인력사무소 (본점)', '대구 지점')
  officeName: string; // e.g. "젊은인력사무소"
  registrationNumber?: string; // 사업자등록번호 (e.g. "508-90-12345")
  bizType?: string; // 업태 (예: "서비스업")
  bizCategory?: string; // 종목 (예: "인력공급, 고용알선업")
  email?: string; // 전자세금계산서 발행용 이메일
  phone1: string; // e.g. "054-933-1566"
  phone2: string; // e.g. "010-7545-0038"
  address: string; // e.g. "경북 성주군 성주읍 성주순환로2길 69"
  bankAccount: string; // e.g. "농협 302-65550038-11 손영란"
  
  // 위임장 수임인 기본 정보
  representativeName?: string; // 수임인 성명 (기본: "김진환")
  representativeResidentId?: string; // 수임인 주민등록번호 (기본: "801121-1795828")
  representativeAccount?: string; // 수임인 입금계좌 (기본: "기업은행 69301137601015 김진환")

  adminEmails: string[]; // e.g. ["acehwan69@gmail.com"]
  isDefault?: boolean; // 기본 사무소 여부
}

export interface DatabaseBackupData {
  version: string;
  exportedAt: string;
  exportedByEmail?: string;
  dispatchLogs: DispatchLog[];
  workers: WorkerMaster[];
  clients: ClientSiteMaster[];
  officeProfiles: OfficeSettings[];
  taxInvoices?: TaxInvoice[];
  activeOfficeId?: string;
  summary?: {
    logsCount: number;
    workersCount: number;
    clientsCount: number;
    officeProfilesCount: number;
    taxInvoicesCount?: number;
  };
}
