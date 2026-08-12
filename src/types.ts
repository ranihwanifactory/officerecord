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
  totalAmount: number; // 합계 (단가 * 공수 sum)
  memo?: string;
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
