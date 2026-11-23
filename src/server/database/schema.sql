CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  transaction_pin_hash text,
  role text NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id),
  account_number text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('savings', 'current', 'business')),
  balance numeric(20, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'frozen', 'blocked')),
  daily_transfer_limit numeric(20, 2) NOT NULL DEFAULT 10000
    CHECK (daily_transfer_limit >= 0),
  max_single_transaction numeric(20, 2) NOT NULL DEFAULT 5000
    CHECK (max_single_transaction >= 0),
  minimum_balance numeric(20, 2) NOT NULL DEFAULT 0
    CHECK (minimum_balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id),
  account_id uuid REFERENCES accounts(id),
  loan_type text NOT NULL,
  requested_amount numeric(20, 2) NOT NULL CHECK (requested_amount > 0),
  duration_months integer NOT NULL CHECK (duration_months BETWEEN 1 AND 600),
  monthly_income numeric(20, 2) NOT NULL CHECK (monthly_income >= 0),
  employment_status text NOT NULL,
  description text NOT NULL DEFAULT '',
  internal_notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under-review', 'approved', 'rejected', 'active', 'completed')),
  remaining_balance numeric(20, 2) NOT NULL DEFAULT 0 CHECK (remaining_balance >= 0),
  reviewed_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  sender_account_id uuid REFERENCES accounts(id),
  receiver_account_id uuid REFERENCES accounts(id),
  loan_id uuid REFERENCES loans(id),
  type text NOT NULL CHECK (type IN (
    'deposit', 'withdrawal', 'transfer', 'loan-disbursement', 'loan-repayment'
  )),
  amount numeric(20, 2) NOT NULL CHECK (amount > 0),
  fee numeric(20, 2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  review_decision text CHECK (review_decision IN ('approved', 'rejected')),
  description text NOT NULL DEFAULT '',
  idempotency_key text UNIQUE,
  created_by uuid NOT NULL REFERENCES users(id),
  flagged_by uuid REFERENCES users(id),
  reviewed_by uuid REFERENCES users(id),
  is_suspicious boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  type text NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS two_factor_secrets (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret_ciphertext text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
