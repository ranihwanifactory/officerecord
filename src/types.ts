export type WorkerCategory = '일반' | '기공';

export interface WorkerMaster {
  id: string;
  name: string;
  category: WorkerCategory;
  defaultDailyRate: number; // e.g. 160000
  phone?: string;
  memo?: string;
  createdAt?: string;
}

export interface ClientSiteMaster {
  id: string;
  clientName: string; // e.g. "신성에스엔티"
  contactPhone: string; // e.g. "010-2998-1757"
  address?: string;
  memo?: string;
}

export interface DispatchWorkerItem {
  id: string;
  workerId?: string; // reference to WorkerMaster if selected
  name: string; // e.g. "이성복"
  category: WorkerCategory; // '일반' | '기공'
  dailyRate: number; // e.g. 160000
  gongsu: number; // e.g. 1.0 (공수) or total days worked
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
  generalGongsuCount: number; // 일반 공수 합계
  skillGongsuCount: number; // 기공 공수 합계
  workers: DispatchWorkerItem[];
  formType?: 'worker_roster' | 'invoice_summary'; // 양식 선택: 'worker_roster' (인부별 출근 출력표) | 'invoice_summary' (계산서용 출력표)
  invoiceItems?: InvoiceItem[]; // 계산서용 일별 용역수 & 인건비 정산 항목들
  totalLaborCost?: number; // 총 인건비 합계
  totalExtraFee?: number; // 기타비용 총합계 (잔업/식대/주유비)
  totalAmount: number; // 기존 합계 (인건비 + 기타비용)
  grandTotalAmount?: number; // 최종 총 청구금액
  memo?: string;
  isPaid?: boolean; // 결제 완료 여부 (true: 결제완료, false/undefined: 미결제)
  paidAt?: string; // 결제 완료 처리 일시
  createdAt: string;
  updatedAt: string;
  createdByEmail?: string;
}

export interface OfficeSettings {
  officeName: string; // e.g. "젊은인력사무소"
  phone1: string; // e.g. "054-933-1566"
  phone2: string; // e.g. "010-7545-0038"
  address: string; // e.g. "경북 성주군 성주읍 성주순환로2길 69"
  bankAccount: string; // e.g. "농협 302-65550038-11 손영란"
  adminEmails: string[]; // e.g. ["acehwan69@gmail.com"]
}
