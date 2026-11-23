import type {
  AccountStatus,
  AccountType,
  LoanStatus,
  TransactionStatus,
  TransactionType,
} from "@/types/banking";

export interface ApiAccount {
  id: string;
  owner_id: string;
  account_number: string;
  type: AccountType;
  balance: string;
  status: AccountStatus;
  daily_transfer_limit: string;
  max_single_transaction: string;
  minimum_balance: string;
  created_at: string;
}

export interface ApiTransaction {
  id: string;
  reference: string;
  sender_account_id: string | null;
  receiver_account_id: string | null;
  loan_id?: string | null;
  sender_account_number?: string | null;
  recipient_account_number?: string | null;
  type: TransactionType;
  amount: string;
  fee: string;
  status: TransactionStatus;
  description: string;
  is_suspicious?: boolean;
  created_at: string;
  reviewed_by?: string | null;
}

export interface ApiLoan {
  id: string;
  customer_id: string;
  account_id: string | null;
  loan_type: string;
  requested_amount: string;
  duration_months: number;
  monthly_income: string;
  employment_status: string;
  description: string;
  internal_notes?: string | null;
  status: LoanStatus;
  remaining_balance: string;
  created_at: string;
  updated_at: string;
}

export interface ApiCustomer {
  id: string;
  name: string;
  email: string;
  status: "active" | "blocked";
  created_at: string;
}

export interface ApiNotification {
  id: string;
  type: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface ApiPage<T> {
  [key: string]: T[] | number;
  page: number;
  limit: number;
  total: number;
}

export interface ApiFailure {
  status: number;
  data?: { error?: string; message?: string };
}
