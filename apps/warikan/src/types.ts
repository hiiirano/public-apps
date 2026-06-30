// warikan — ドメイン型定義
//
// データはすべて端末内 localStorage に保存。URL 共有時は Group を
// シリアライズしてハッシュに載せる（share.ts）。

/** グループのメンバー（割り勘の参加者） */
export interface Member {
  id: string;
  name: string;
}

/**
 * 立替支出。
 * - payerId: 立て替えた人
 * - participantIds: この支出を負担すべき人たち（payer 自身を含むことが多い）
 * - shares: 省略時は participantIds で均等割り。
 *           指定時は memberId→負担額(整数) のマップで、合計が amount に一致すること。
 */
export interface Expense {
  id: string;
  title: string;
  amount: number; // 整数（円）
  payerId: string;
  participantIds: string[];
  shares?: Record<string, number>;
  createdAt: number;
}

/** 割り勘グループ（旅行・飲み会など1つの精算単位） */
export interface Group {
  id: string;
  name: string;
  members: Member[];
  expenses: Expense[];
  updatedAt: number;
}

/** 各メンバーの収支。net>0=受け取る側 / net<0=支払う側 */
export interface Balance {
  memberId: string;
  paid: number; // 立て替えた合計
  owed: number; // 負担すべき合計
  net: number; // paid - owed
}

/** 精算の1送金: from が to へ amount 円払う */
export interface Settlement {
  from: string; // memberId
  to: string; // memberId
  amount: number;
}
