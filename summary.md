# Meridian Core Project Summary

## Project Overview

Meridian Core is a Next.js 16 App Router banking application for three roles: administrator, bank staff, and customer. It uses React 19, Redux Toolkit RTK Query, NextAuth v5 credentials authentication, Neon PostgreSQL, Zod validation, Tailwind CSS, Recharts-style live chart components, and TOTP two-factor authentication.

The project is primarily implemented through route handlers backed by server controllers and PostgreSQL transactions. Most models, repositories, and service placeholder files are not yet used; the controllers currently contain the main SQL and business logic.

## User-Facing Routes

- `/` provides the public landing page and links to sign-in.
- `/login` renders the credentials sign-in form.
- `/register` creates a customer and an initial bank account.
- `/two-factor` lets an authenticated user set up, verify, or disable TOTP 2FA.

### Administrator Routes

- `/admin/dashboard` shows live customer, account, balance, transaction, deposit, withdrawal, and pending-loan metrics, with account and loan charts.
- `/admin/customers` supports customer search, details, transaction history, activation, and blocking.
- `/admin/accounts` supports account creation, status changes, account limits, account details, and CSV statement downloads.
- `/admin/loans` supports loan review, 2FA-protected approval or rejection, and loan-disbursement recording.
- `/admin/settings` manages bank-wide transfer limits and loan approval policy settings.

### Bank Staff Routes

- `/staff/dashboard` provides a staff review-oriented overview.
- `/staff/customers` supports customer registration and profile/account inspection.
- `/staff/transactions` provides transaction search, filters, pagination, pending-request review, approval/rejection, and suspicious-transaction flagging.
- `/staff/loans` allows staff to review applications, add internal notes, and forward applications to administrators.

Staff cannot approve loans or reject them in this implementation.

### Customer Routes

- `/customer/dashboard` shows account balance, deposit and withdrawal totals, active loans, account details, charts, and recent activity.
- `/customer/accounts` lists owned accounts and provides CSV account statements.
- `/customer/transfer` performs customer transfers with account ownership, PIN, 2FA, balance, transaction-limit, and idempotency checks.
- `/customer/transactions` lists visible transaction history and supports deposit and withdrawal requests.
- `/customer/loans` supports loan applications, status tracking, repayment history, and repayments.
- `/customer/settings` displays profile/security status and links to 2FA management.

## API Route Summary

- `/api/auth/[...nextauth]` provides NextAuth authentication handlers.
- `/api/auth/register` registers a customer and creates an initial account.
- `/api/users` lists/searches customers and registers or activates/blocks customers.
- `/api/accounts` lists or creates accounts.
- `/api/accounts/[accountId]` gets account details/statements, updates account settings/status, or deactivates an account.
- `/api/transactions` lists transactions or submits a loan repayment.
- `/api/transactions/[transactionId]` gets transaction details or staff/admin-reviews deposit and withdrawal requests and flags activity.
- `/api/transactions/transfer` performs an atomic fund transfer.
- `/api/transactions/deposit` submits a deposit request.
- `/api/transactions/withdrawal` submits a PIN/2FA-protected withdrawal request.
- `/api/loans` lists or creates loan applications.
- `/api/loans/[loanId]` gets or sends a loan to staff review.
- `/api/loans/[loanId]/approve` records an admin-approved loan and its disbursement transaction.
- `/api/loans/[loanId]/reject` records an admin rejection.
- `/api/admin/settings` gets or updates administrator-managed settings.
- `/api/notifications` lists notifications.
- `/api/notifications/[notificationId]` marks a notification read or deletes it.
- `/api/two-factor/status`, `/setup`, `/verify`, and `/disable` manage TOTP and recovery codes.

## Backend and Data Summary

- `src/proxy.ts` restricts dashboard routes by role and redirects unauthorized users to the appropriate workspace or login page.
- `src/server/auth/auth.config.ts` implements credentials authentication with Argon2 password verification and JWT session roles.
- `src/server/guards/` validates active authenticated users and role permissions.
- `src/server/database/schema.sql` defines users, accounts, loans, transactions, settings, notifications, 2FA secrets, and recovery codes.
- `src/server/database/with-transaction.ts` provides begin/commit/rollback transaction handling.
- Atomic transfer and repayment logic uses PostgreSQL locks, row locking, balance checks, idempotency keys, and rollback handling.
- `src/server/security/encryption.ts` encrypts TOTP secrets with AES-256-GCM.
- `src/server/security/totp.ts` creates TOTP setup data and validates enabled 2FA codes.
- Zod schemas validate authentication, account, transaction, transfer, loan, and settings input.
- RTK Query endpoints in `src/store/api/` provide cache tags and invalidation for accounts, transactions, customers, loans, settings, notifications, and 2FA.

## UI and Configuration

- [src/components/shared/banking-pages.tsx](/C:/My%20project/meridian-core/src/components/shared/banking-pages.tsx) contains the shared dashboard shell and the major account, customer, transaction, loan, transfer, and settings workspaces.
- [src/features/auth/components/auth-page.tsx](/C:/My%20project/meridian-core/src/features/auth/components/auth-page.tsx) contains login, registration, and 2FA UI.
- [src/lib/config/dashboard.ts](/C:/My%20project/meridian-core/src/lib/config/dashboard.ts) defines role navigation and dashboard content.
- [src/app/globals.css](/C:/My%20project/meridian-core/src/app/globals.css) defines the fintech color system, light/dark themes, and dashboard component classes.
- `README.md` documents the intended architecture and feature requirements, while `project-requirements.md` lists the role-based product requirements.

## Read Scope and Changes

I reviewed the project documentation, configuration, source tree, route handlers, pages, components, Redux APIs, validation schemas, database schema, controllers, guards, security utilities, and backend support files. I also inspected the generated build and dependencies only for inventory context, and I did not expose or summarize environment secrets.

No existing file was modified or deleted. The only change made was the creation of this [summary.md](/C:/My%20project/meridian-core/summary.md).
