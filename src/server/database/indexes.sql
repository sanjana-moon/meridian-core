CREATE INDEX IF NOT EXISTS accounts_owner_id_idx ON accounts(owner_id);
CREATE INDEX IF NOT EXISTS transactions_sender_account_id_idx ON transactions(sender_account_id);
CREATE INDEX IF NOT EXISTS transactions_receiver_account_id_idx ON transactions(receiver_account_id);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);
CREATE INDEX IF NOT EXISTS loans_customer_id_idx ON loans(customer_id);
CREATE INDEX IF NOT EXISTS loans_status_idx ON loans(status);
CREATE INDEX IF NOT EXISTS notifications_user_id_created_at_idx
  ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS recovery_codes_user_id_idx ON recovery_codes(user_id);
