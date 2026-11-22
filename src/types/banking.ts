export type AccountType = "savings" | "current" | "business";

export type AccountStatus = "active" | "inactive" | "frozen" | "blocked";

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "transfer"
  | "loan-disbursement"
  | "loan-repayment";

export type TransactionStatus =
  | "pending"
  | "completed"
  | "failed"
  | "reversed";

export type LoanStatus =
  | "pending"
  | "under-review"
  | "approved"
  | "rejected"
  | "active"
  | "completed";

export interface TransactionRecord {
  id: string;
  senderId: string | null;
  receiverId: string | null;
  type: TransactionType;
  amount: string;
  fee: string;
  createdAt: string;
  status: TransactionStatus;
  description: string;
}

export interface AccountRecord {
  id: string;
  ownerId: string;
  number: string;
  type: AccountType;
  balance: string;
  status: AccountStatus;
}

export interface LoanRecord {
  id: string;
  customerId: string;
  type: string;
  amount: string;
  durationMonths: number;
  monthlyIncome: string;
  employmentStatus: string;
  description: string;
  status: LoanStatus;
  remainingBalance: string;
}
