"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChartNoAxesCombined,
  CircleDollarSign,
  FileClock,
  Landmark,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState, type FormEvent, type ReactNode } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  dashboardRoles,
  roleDashboardContent,
  type DashboardRole,
} from "@/lib/config/dashboard";
import {
  useGetAccountQuery,
  useCreateAccountMutation,
  useDeactivateAccountMutation,
  useGetAccountsQuery,
  useUpdateAccountMutation,
} from "@/store/api/accounts.api";
import {
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
} from "@/store/api/notifications.api";
import {
  useApplyForLoanMutation,
  useApproveLoanMutation,
  useGetLoanQuery,
  useGetLoansQuery,
  useRejectLoanMutation,
  useReviewLoanMutation,
} from "@/store/api/loans.api";
import {
  useGetTransactionsQuery,
  useGetTransactionQuery,
  useRepayLoanMutation,
  useRequestDepositMutation,
  useRequestWithdrawalMutation,
  useReviewTransactionMutation,
  useTransferFundsMutation,
} from "@/store/api/transactions.api";
import {
  useCreateCustomerMutation,
  useGetCustomerQuery,
  useGetCustomersQuery,
  useUpdateCustomerStatusMutation,
} from "@/store/api/users.api";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from "@/store/api/settings.api";
import { useGetTwoFactorStatusQuery } from "@/store/api/two-factor.api";
import type {
  ApiAccount,
  ApiTransaction,
} from "@/types/api";

function money(value: string | number | undefined): string {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function date(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="dashboard-heading">
      <div>
        <h1 className="dashboard-heading-title">{title}</h1>
        <p className="dashboard-heading-copy">{description}</p>
      </div>
      {action ? (
        <Link className="dashboard-button-secondary" href={action.href}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function Feedback({
  error,
  success,
}: {
  error?: unknown;
  success?: string;
}) {
  return (
    <>
      {error ? (
        <p className="dashboard-notice" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : null}
      {success ? (
        <p className="dashboard-notice" role="status">
          {success}
        </p>
      ) : null}
    </>
  );
}

function LoadingOrError({
  loading,
  error,
}: {
  loading: boolean;
  error?: unknown;
}) {
  if (loading) {
    return (
      <p className="px-5 py-6 text-sm text-muted-foreground" role="status">
        Loading live data…
      </p>
    );
  }
  if (error) {
    return (
      <p className="dashboard-notice m-5" role="alert">
        {getApiErrorMessage(error)}
      </p>
    );
  }
  return null;
}

function EmptyRow({ columns, message }: { columns: number; message: string }) {
  return (
    <tr>
      <td className="py-10 text-center text-muted-foreground" colSpan={columns}>
        {message}
      </td>
    </tr>
  );
}

function StatusBadge({ value }: { value: string }) {
  const style =
    ["completed", "active", "approved"].includes(value)
      ? "badge-success"
      : ["pending", "under-review"].includes(value)
        ? "badge-warning"
        : ["failed", "rejected", "blocked", "frozen"].includes(value)
          ? "badge-danger"
          : "dashboard-badge-neutral";
  return (
    <span className={`dashboard-badge ${style}`}>
      {value.replaceAll("-", " ")}
    </span>
  );
}

export function DashboardShell({
  role,
  activeHref,
  children,
}: {
  role: DashboardRole;
  activeHref: string;
  children: ReactNode;
}) {
  const { data: session } = useSession();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notices = useGetNotificationsQuery(
    { page: 1, limit: 8 },
    { skip: !session?.user },
  );
  const [markRead, markReadState] = useMarkNotificationReadMutation();
  const [deleteNotification, deleteNotificationState] = useDeleteNotificationMutation();
  const { label, description, navigation } = dashboardRoles[role];
  const unread = notices.data?.notifications.filter((item) => !item.read_at).length ?? 0;

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" href="/">
          <span className="dashboard-brand-mark">
            <Landmark aria-hidden="true" size={21} />
          </span>
          <span>Meridian Core</span>
        </Link>
        <div className="mb-3 hidden text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 lg:block">
          Workspace
        </div>
        <nav aria-label={`${label} navigation`} className="dashboard-nav">
          {navigation.map(({ href, icon: Icon, label: itemLabel }) => (
            <Link
              aria-current={href === activeHref ? "page" : undefined}
              className={`dashboard-nav-link${href === activeHref ? " dashboard-nav-link-active" : ""}`}
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" size={18} />
              <span>{itemLabel}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-6 hidden rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-4 text-sm lg:block">
          <div className="flex items-center gap-2 font-medium">
            <LockKeyhole aria-hidden="true" size={16} />
            Secure banking workspace
          </div>
          <p className="mt-2 text-xs leading-5 text-sidebar-foreground/65">
            Account actions are verified by the server before they reach the database.
          </p>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">
              {session?.user?.name ?? description}
              {session?.user?.email ? ` · ${session.user.email}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-expanded={notificationsOpen}
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              className="dashboard-button-secondary relative min-h-10 px-3"
              onClick={() => setNotificationsOpen((open) => !open)}
              type="button"
            >
              <Bell aria-hidden="true" size={17} />
              {unread ? (
                <span className="dashboard-badge badge-warning">{unread}</span>
              ) : null}
            </button>
            <button
              className="dashboard-button-secondary min-h-10 px-3"
              onClick={() => void signOut({ callbackUrl: "/login" })}
              type="button"
            >
              <LogOut aria-hidden="true" size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
        {notificationsOpen ? (
          <section aria-label="Notifications" className="border-b border-border bg-card px-5 py-4 sm:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <h2 className="font-semibold">Notifications</h2>
              <button
                aria-label="Close notifications"
                className="dashboard-button-secondary min-h-8 px-2"
                onClick={() => setNotificationsOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={16} />
              </button>
            </div>
            <LoadingOrError loading={notices.isLoading} error={notices.error} />
            <ul className="mx-auto mt-3 max-w-7xl divide-y divide-border">
              {notices.data?.notifications.map((notice) => (
                <li className="flex items-start justify-between gap-4 py-3" key={notice.id}>
                  <div>
                    <p className="text-sm">{notice.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{date(notice.created_at)}</p>
                  </div>
                  {!notice.read_at ? (
                    <button
                      className="dashboard-button-secondary min-h-8 text-xs"
                      onClick={() => void markRead(notice.id)}
                      type="button"
                    >
                      Mark read
                    </button>
                  ) : <StatusBadge value="read" />}
                  <button
                    className="dashboard-button-secondary min-h-8 text-xs"
                    onClick={() => void deleteNotification(notice.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </li>
              ))}
              {!notices.isLoading && !notices.error && !notices.data?.notifications.length ? (
                <li className="py-4 text-sm text-muted-foreground">No notifications.</li>
              ) : null}
            </ul>
            <div className="mx-auto mt-2 max-w-7xl">
              <Feedback error={markReadState.error || deleteNotificationState.error} />
            </div>
          </section>
        ) : null}
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <article className="dashboard-metric">
      <div className="flex items-center justify-between gap-3">
        <p className="dashboard-metric-label">{label}</p>
        <Icon aria-hidden="true" className="text-primary" size={18} />
      </div>
      <span className="dashboard-metric-value balance-display">{value}</span>
    </article>
  );
}

function TransactionChart({
  transactions,
  types,
  measure,
}: {
  transactions: ApiTransaction[];
  types: ApiTransaction["type"][];
  measure: "amount" | "count";
}) {
  const latestDate = transactions.length
    ? new Date(transactions[0].created_at)
    : null;
  const months = latestDate
    ? Array.from({ length: 6 }, (_value, index) => {
        const start = new Date(
          latestDate.getFullYear(),
          latestDate.getMonth() - (5 - index),
          1,
        );
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
        const matching = transactions.filter((item) => {
            const createdAt = new Date(item.created_at);
            return (
              item.status === "completed" &&
              createdAt >= start &&
              createdAt < end &&
              types.includes(item.type)
            );
          });
        const amount =
          measure === "count"
            ? matching.length
            : matching.reduce((sum, item) => sum + Number(item.amount), 0);
        return {
          label: new Intl.DateTimeFormat("en", { month: "short" }).format(start),
          amount,
        };
      })
    : [];
  const maxAmount = Math.max(...months.map((month) => month.amount), 1);
  const displayValue = (value: number) =>
    measure === "count" ? String(value) : money(value);

  return (
    <div className="dashboard-panel-body">
      {transactions.length ? (
        <div aria-label="Monthly transaction totals from the loaded records" className="flex min-h-40 items-end justify-around gap-3 border-b border-border pb-3">
          {months.map((month) => (
            <div className="flex h-36 flex-1 flex-col items-center justify-end gap-2" key={month.label}>
              <span className="text-xs text-muted-foreground">{month.amount ? displayValue(month.amount) : ""}</span>
              <div
                className="w-full max-w-12 rounded-t-md bg-primary"
                style={{ height: `${Math.max(4, (month.amount / maxAmount) * 100)}%` }}
                title={`${month.label}: ${displayValue(month.amount)}`}
              />
              <span className="text-xs text-muted-foreground">{month.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-chart-empty">
          <ChartNoAxesCombined aria-hidden="true" className="text-muted-foreground" size={28} />
          <p className="text-sm font-medium">No transaction data yet</p>
          <p className="text-xs text-muted-foreground">This chart uses completed API records.</p>
        </div>
      )}
    </div>
  );
}

function BreakdownChart({
  items,
  moneyValues = false,
}: {
  items: { label: string; value: number }[];
  moneyValues?: boolean;
}) {
  const maximum = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="dashboard-panel-body space-y-4">
      {items.length ? items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span>{item.label}</span>
            <span className="font-medium tabular">{moneyValues ? money(item.value) : item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, (item.value / maximum) * 100)}%` }} />
          </div>
        </div>
      )) : <p className="text-sm text-muted-foreground">No records available.</p>}
    </div>
  );
}

export function DashboardOverview({ role }: { role: DashboardRole }) {
  const content = roleDashboardContent[role];
  const activeHref = dashboardRoles[role].navigation[0].href;
  const accounts = useGetAccountsQuery();
  const transactions = useGetTransactionsQuery({ page: 1, limit: 100 });
  const loans = useGetLoansQuery();
  const customers = useGetCustomersQuery(
    { page: 1, limit: 1 },
    { skip: role === "customer" },
  );
  const pendingTransactions = useGetTransactionsQuery(
    { page: 1, limit: 100, status: "pending" },
    { skip: role === "customer" },
  );
  const accountRows = accounts.data?.accounts ?? [];
  const transactionRows = transactions.data?.transactions ?? [];
  const loanRows = loans.data?.loans ?? [];
  const totalBalance = accountRows.reduce((sum, account) => sum + Number(account.balance), 0);
  const deposits = transactionRows
    .filter((item) => item.type === "deposit" && item.status === "completed")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const withdrawals = transactionRows
    .filter((item) => item.type === "withdrawal" && item.status === "completed")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const completedTransactions = transactionRows.filter((item) => item.status === "completed");
  const transactionTypeCounts = (["deposit", "withdrawal", "transfer", "loan-disbursement", "loan-repayment"] as const)
    .map((type) => ({
      label: type.replaceAll("-", " "),
      value: completedTransactions.filter((item) => item.type === type).length,
    }))
    .filter((item) => item.value > 0);
  const chartTypes: ApiTransaction["type"][] =
    role === "customer"
      ? ["withdrawal", "transfer", "loan-repayment"]
      : ["deposit", "withdrawal", "transfer", "loan-disbursement", "loan-repayment"];
  const metrics: { label: string; value: string; Icon: LucideIcon }[] =
    role === "customer"
      ? [
          { label: "Total account balance", value: money(totalBalance), Icon: CircleDollarSign },
          { label: "Recent deposits", value: money(deposits), Icon: ArrowDownLeft },
          { label: "Recent withdrawals", value: money(withdrawals), Icon: ArrowUpRight },
          { label: "Active loans", value: String(loanRows.filter((loan) => loan.status === "active").length), Icon: ShieldCheck },
        ]
      : role === "admin"
        ? [
            { label: "Registered customers", value: String(customers.data?.total ?? "—"), Icon: ShieldCheck },
            { label: "Bank accounts", value: String(accountRows.length), Icon: CircleDollarSign },
            { label: "Bank balance", value: money(totalBalance), Icon: CircleDollarSign },
            { label: "Recent deposits", value: money(deposits), Icon: ArrowDownLeft },
            { label: "Recent withdrawals", value: money(withdrawals), Icon: ArrowUpRight },
            { label: "Transactions", value: String(transactions.data?.total ?? "—"), Icon: FileClock },
            { label: "Pending loans", value: String(loanRows.filter((loan) => ["pending", "under-review"].includes(loan.status)).length), Icon: ShieldCheck },
          ]
        : [
            { label: "Customers", value: String(customers.data?.total ?? "—"), Icon: ShieldCheck },
            { label: "Transactions", value: String(transactions.data?.total ?? "—"), Icon: FileClock },
            { label: "Pending requests", value: String(pendingTransactions.data?.total ?? "—"), Icon: ArrowDownLeft },
            { label: "Loans to review", value: String(loanRows.filter((loan) => ["pending", "under-review"].includes(loan.status)).length), Icon: ShieldCheck },
          ];
  const loading =
    accounts.isLoading ||
    transactions.isLoading ||
    loans.isLoading ||
    customers.isLoading ||
    pendingTransactions.isLoading;
  const error =
    accounts.error ||
    transactions.error ||
    loans.error ||
    customers.error ||
    pendingTransactions.error;
  const chartPanels =
    role === "customer"
      ? [
          { title: "Monthly spending", kind: "monthly" as const, measure: "amount" as const, types: ["withdrawal", "transfer", "loan-repayment"] as ApiTransaction["type"][] },
          { title: "Monthly deposit history", kind: "monthly" as const, measure: "amount" as const, types: ["deposit"] as ApiTransaction["type"][] },
          { title: "Transaction distribution", kind: "breakdown" as const, items: transactionTypeCounts },
        ]
      : role === "admin"
        ? [
            { title: "Monthly transaction volume", kind: "monthly" as const, measure: "count" as const, types: chartTypes },
            { title: "Deposits vs. withdrawals", kind: "breakdown" as const, moneyValues: true, items: [{ label: "Deposits", value: deposits }, { label: "Withdrawals", value: withdrawals }] },
            { title: "Account distribution", kind: "breakdown" as const, items: (["savings", "current", "business"] as const).map((type) => ({ label: type, value: accountRows.filter((account) => account.type === type).length })) },
            { title: "Loan approval statistics", kind: "breakdown" as const, items: (["pending", "under-review", "active", "completed", "rejected"] as const).map((status) => ({ label: status.replaceAll("-", " "), value: loanRows.filter((loan) => loan.status === status).length })) },
            { title: "Monthly banking activity", kind: "monthly" as const, measure: "amount" as const, types: chartTypes },
          ]
        : [
            { title: "Transaction activity", kind: "monthly" as const, measure: "count" as const, types: chartTypes },
            { title: "Pending requests by type", kind: "breakdown" as const, items: ["deposit", "withdrawal"].map((type) => ({ label: type, value: (pendingTransactions.data?.transactions ?? []).filter((item) => item.type === type).length })) },
          ];

  return (
    <DashboardShell role={role} activeHref={activeHref}>
      <PageHeading title={content.title} description={content.description} />
      <LoadingOrError loading={loading} error={error} />
      <section aria-label="Summary metrics" className="dashboard-metrics">
        {metrics.map(({ label, value, Icon }) => (
          <Metric icon={Icon} key={label} label={label} value={value} />
        ))}
      </section>
      {role === "customer" ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Account overview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Account balances and statuses come from your authenticated account list.
              </p>
            </div>
            <Link className="dashboard-button-secondary" href="/customer/accounts">Manage accounts</Link>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead><tr><th>Account number</th><th>Type</th><th>Balance</th><th>Status</th></tr></thead>
              <tbody>
                {accountRows.map((account) => (
                  <tr key={account.id}>
                    <td className="font-mono">{account.account_number}</td>
                    <td className="capitalize">{account.type}</td>
                    <td className="numeric">{money(account.balance)}</td>
                    <td><StatusBadge value={account.status} /></td>
                  </tr>
                ))}
                {!loading && !accountRows.length ? <EmptyRow columns={4} message="No accounts are linked to your profile." /> : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <section className="dashboard-chart-grid">
        {chartPanels.map((panel) => (
          <article className="dashboard-panel" key={panel.title}>
            <div className="dashboard-panel-header">
              <div>
                <h2 className="dashboard-panel-title">{panel.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">Computed from the latest API records.</p>
              </div>
              <span className="dashboard-badge dashboard-badge-neutral">Live records</span>
            </div>
            {panel.kind === "monthly" ? (
              <TransactionChart
                measure={panel.measure}
                transactions={transactionRows}
                types={panel.types}
              />
            ) : (
              <BreakdownChart items={panel.items} moneyValues={"moneyValues" in panel ? panel.moneyValues : false} />
            )}
          </article>
        ))}
      </section>
      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2 className="dashboard-panel-title">Recent transactions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Most recent transactions visible to your role.</p>
          </div>
          {role === "customer" ? <Link className="dashboard-button-secondary" href="/customer/transactions">View history</Link> : null}
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead><tr><th>Reference</th><th>Type</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {transactionRows.slice(0, 8).map((transaction) => (
                <tr key={transaction.id}>
                  <td className="font-mono">{transaction.reference}</td>
                  <td className="capitalize">{transaction.type.replaceAll("-", " ")}</td>
                  <td>{date(transaction.created_at)}</td>
                  <td className="numeric">{money(transaction.amount)}</td>
                  <td><StatusBadge value={transaction.status} /></td>
                </tr>
              ))}
              {!loading && !transactionRows.length ? <EmptyRow columns={5} message="No transaction activity is available." /> : null}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}

interface WorkspacePageProps {
  role: DashboardRole;
  activeHref: string;
  title: string;
  description: string;
  columns: string[];
  actionLabel?: string;
  actionHref?: string;
  includeFilters?: boolean;
  includeExport?: boolean;
  notice?: string;
  controls?: string[];
}

export function WorkspacePage({ role, activeHref }: WorkspacePageProps) {
  return activeHref.endsWith("/accounts") ? (
    <AccountsWorkspace role={role} activeHref={activeHref} />
  ) : (
    <CustomersWorkspace role={role} activeHref={activeHref} />
  );
}

function AccountsWorkspace({
  role,
  activeHref,
}: {
  role: DashboardRole;
  activeHref: string;
}) {
  const accounts = useGetAccountsQuery();
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const selectedAccount = useGetAccountQuery(selectedAccountId, {
    skip: !selectedAccountId,
  });
  const customers = useGetCustomersQuery(
    { page: 1, limit: 100 },
    { skip: role === "customer" },
  );
  const [createAccount, createState] = useCreateAccountMutation();
  const [updateAccount, updateState] = useUpdateAccountMutation();
  const [deactivateAccount, deactivateState] = useDeactivateAccountMutation();
  const [notice, setNotice] = useState("");

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await createAccount({
        ownerId: String(form.get("ownerId")),
        type: String(form.get("type")) as "savings" | "current" | "business",
      }).unwrap();
      formElement.reset();
      setNotice("Account created.");
    } catch {
      setNotice("");
    }
  }

  async function changeStatus(account: ApiAccount, status: ApiAccount["status"]) {
    if (!window.confirm(`Change account status to "${status}"?`)) return;
    try {
      if (status === "inactive") await deactivateAccount(account.id).unwrap();
      else await updateAccount({ accountId: account.id, body: { status } }).unwrap();
    } catch {
      return;
    }
  }

  const customerNames = new Map(
    (customers.data?.customers ?? []).map((customer) => [customer.id, customer.name]),
  );

  return (
    <DashboardShell activeHref={activeHref} role={role}>
      <PageHeading
        description={role === "customer" ? "Review account balances and download account statements." : "Create accounts, adjust limits, and manage account status."}
        title={role === "customer" ? "Your accounts" : "Accounts"}
      />
      {role !== "customer" ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header"><h2 className="dashboard-panel-title">Create account</h2></div>
          <form className="dashboard-panel-body grid gap-4 sm:grid-cols-[1fr_1fr_auto]" onSubmit={submitAccount}>
            <label className="dashboard-field">
              Customer
              <select className="dashboard-input" name="ownerId" required>
                <option value="">Select a customer</option>
                {customers.data?.customers.filter((customer) => customer.status === "active").map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name} · {customer.email}</option>
                ))}
              </select>
            </label>
            <label className="dashboard-field">
              Account type
              <select className="dashboard-input" defaultValue="savings" name="type">
                <option value="savings">Savings</option><option value="current">Current</option><option value="business">Business</option>
              </select>
            </label>
            <button className="dashboard-button self-end" disabled={createState.isLoading} type="submit">Create account</button>
            <div className="sm:col-span-3"><Feedback error={createState.error} success={notice} /></div>
          </form>
        </section>
      ) : null}
      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2 className="dashboard-panel-title">Account records</h2>
            <p className="mt-1 text-sm text-muted-foreground">Values are loaded directly from the account API.</p>
          </div>
          <LoadingOrError loading={accounts.isLoading || customers.isLoading} error={accounts.error || customers.error} />
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr><th>Account number</th>{role !== "customer" ? <th>Customer</th> : null}<th>Type</th><th>Balance</th><th>Status</th><th>Limits</th><th>Statement</th>{role !== "customer" ? <th>Manage</th> : null}</tr>
            </thead>
            <tbody>
              {(accounts.data?.accounts ?? []).map((account) => (
                <tr key={account.id}>
                  <td>
                    <button className="font-mono text-primary hover:underline" onClick={() => setSelectedAccountId(account.id)} type="button">
                      {account.account_number}
                    </button>
                  </td>
                  {role !== "customer" ? <td>{customerNames.get(account.owner_id) ?? account.owner_id}</td> : null}
                  <td className="capitalize">{account.type}</td>
                  <td className="numeric">{money(account.balance)}</td>
                  <td><StatusBadge value={account.status} /></td>
                  <td className="text-xs">
                    <div>Single: {money(account.max_single_transaction)}</div>
                    <div>Daily: {money(account.daily_transfer_limit)}</div>
                    <div>Minimum: {money(account.minimum_balance)}</div>
                  </td>
                  <td><a className="font-medium text-primary hover:underline" download href={`/api/accounts/${account.id}?format=csv`}>Download CSV</a></td>
                  {role !== "customer" ? (
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <select
                          aria-label={`Set status for ${account.account_number}`}
                          className="dashboard-input min-h-9 min-w-32"
                          onChange={(event) => void changeStatus(account, event.target.value as ApiAccount["status"])}
                          value={account.status}
                        >
                          <option value="active">Active</option><option value="frozen">Frozen</option><option value="blocked">Blocked</option><option value="inactive">Inactive</option>
                        </select>
                        <button
                          className="dashboard-button-secondary min-h-9"
                          onClick={async () => {
                            const daily = window.prompt("Daily transfer limit", account.daily_transfer_limit);
                            if (daily === null) return;
                            const single = window.prompt("Maximum single transaction", account.max_single_transaction);
                            if (single === null) return;
                            const minimum = window.prompt("Minimum balance", account.minimum_balance);
                            if (minimum === null) return;
                            try {
                              await updateAccount({
                                accountId: account.id,
                                body: {
                                  dailyTransferLimit: daily,
                                  maxSingleTransaction: single,
                                  minimumBalance: minimum,
                                },
                              }).unwrap();
                            } catch {
                              return;
                            }
                          }}
                          type="button"
                        >
                          Save limits
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
              {!accounts.isLoading && !accounts.error && !accounts.data?.accounts.length ? (
                <EmptyRow columns={role === "customer" ? 6 : 8} message="No accounts found." />
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-4"><Feedback error={updateState.error || deactivateState.error} /></div>
      </section>
      {selectedAccountId ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h2 className="dashboard-panel-title">Account details and activity</h2>
            <button className="dashboard-button-secondary min-h-9" onClick={() => setSelectedAccountId("")} type="button">Close</button>
          </div>
          <LoadingOrError loading={selectedAccount.isLoading} error={selectedAccount.error} />
          {selectedAccount.data ? (
            <div className="dashboard-panel-body">
              <dl className="mb-5 grid gap-3 sm:grid-cols-3">
                <div><dt className="text-xs text-muted-foreground">Account number</dt><dd className="font-mono">{selectedAccount.data.account.account_number}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Balance</dt><dd>{money(selectedAccount.data.account.balance)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Status</dt><dd><StatusBadge value={selectedAccount.data.account.status} /></dd></div>
              </dl>
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead><tr><th>Reference</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {(selectedAccount.data.transactions ?? []).map((transaction) => (
                      <tr key={transaction.id}><td className="font-mono">{transaction.reference}</td><td>{transaction.type}</td><td>{money(transaction.amount)}</td><td><StatusBadge value={transaction.status} /></td><td>{date(transaction.created_at)}</td></tr>
                    ))}
                    {!selectedAccount.data.transactions?.length ? <EmptyRow columns={5} message="No account activity." /> : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </DashboardShell>
  );
}

function CustomersWorkspace({
  role,
  activeHref,
}: {
  role: DashboardRole;
  activeHref: string;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const customers = useGetCustomersQuery({ page, limit: 25, search });
  const selected = useGetCustomerQuery(selectedId, { skip: !selectedId });
  const [createCustomer, createState] = useCreateCustomerMutation();
  const [updateStatus, updateState] = useUpdateCustomerStatusMutation();
  const [notice, setNotice] = useState("");

  async function registerCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await createCustomer({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password: String(form.get("password")),
        transactionPin: String(form.get("transactionPin")),
        accountType: String(form.get("accountType")) as "savings" | "current" | "business",
      }).unwrap();
      formElement.reset();
      setNotice("Customer registered and account created.");
    } catch {
      setNotice("");
    }
  }

  const canManageStatus = role === "admin";
  return (
    <DashboardShell activeHref={activeHref} role={role}>
      <PageHeading
        description="Search registered customers, inspect their authorized account activity, and manage customer access."
        title="Customers"
      />
      {role !== "customer" ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header"><h2 className="dashboard-panel-title">Register customer</h2></div>
          <form className="dashboard-panel-body grid gap-4 sm:grid-cols-2" onSubmit={registerCustomer}>
            <label className="dashboard-field">Full name<input className="dashboard-input" maxLength={100} minLength={2} name="name" required /></label>
            <label className="dashboard-field">Email<input className="dashboard-input" maxLength={254} name="email" required type="email" /></label>
            <label className="dashboard-field">Temporary password<input className="dashboard-input" minLength={12} name="password" required type="password" /></label>
            <label className="dashboard-field">Transaction PIN<input className="dashboard-input" inputMode="numeric" maxLength={8} minLength={4} name="transactionPin" pattern="[0-9]{4,8}" required type="password" /></label>
            <label className="dashboard-field">Account type<select className="dashboard-input" defaultValue="savings" name="accountType"><option value="savings">Savings</option><option value="current">Current</option><option value="business">Business</option></select></label>
            <button className="dashboard-button self-end" disabled={createState.isLoading} type="submit">Register customer</button>
            <div className="sm:col-span-2"><Feedback error={createState.error} success={notice} /></div>
          </form>
        </section>
      ) : null}
      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <h2 className="dashboard-panel-title">Customer directory</h2>
          <span className="text-sm text-muted-foreground">{customers.data?.total ?? 0} records</span>
        </div>
        <div className="border-b border-border p-5">
          <label className="dashboard-field max-w-lg">
            Search customers
            <input
              className="dashboard-input"
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Name or email"
              type="search"
              value={search}
            />
          </label>
        </div>
        <LoadingOrError loading={customers.isLoading} error={customers.error} />
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead><tr><th>Customer</th><th>Customer ID</th><th>Status</th><th>Joined</th><th>Details</th>{canManageStatus ? <th>Access</th> : null}</tr></thead>
            <tbody>
              {(customers.data?.customers ?? []).map((customer) => (
                <tr key={customer.id}>
                  <td><div className="font-medium">{customer.name}</div><div className="text-xs text-muted-foreground">{customer.email}</div></td>
                  <td className="font-mono text-xs">{customer.id}</td>
                  <td><StatusBadge value={customer.status} /></td>
                  <td>{date(customer.created_at)}</td>
                  <td><button className="dashboard-button-secondary min-h-9" onClick={() => setSelectedId(customer.id)} type="button">View details</button></td>
                  {canManageStatus ? (
                    <td>
                      <button
                        className="dashboard-button-secondary min-h-9"
                        disabled={updateState.isLoading}
                        onClick={() => void updateStatus({
                          customerId: customer.id,
                          status: customer.status === "active" ? "blocked" : "active",
                        })}
                        type="button"
                      >
                        {customer.status === "active" ? "Block" : "Activate"}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
              {!customers.isLoading && !customers.error && !customers.data?.customers.length ? <EmptyRow columns={canManageStatus ? 6 : 5} message="No customers match this search." /> : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm">
          <span>Page {page} of {Math.max(1, Math.ceil((customers.data?.total ?? 0) / 25))}</span>
          <div className="flex gap-2">
            <button className="dashboard-button-secondary min-h-9" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">Previous</button>
            <button className="dashboard-button-secondary min-h-9" disabled={page * 25 >= (customers.data?.total ?? 0)} onClick={() => setPage((value) => value + 1)} type="button">Next</button>
          </div>
        </div>
        <div className="px-5 pb-4"><Feedback error={updateState.error} /></div>
      </section>
      {selectedId ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div><h2 className="dashboard-panel-title">Customer details</h2><p className="text-xs text-muted-foreground">{selected.data?.email}</p></div>
            <button className="dashboard-button-secondary min-h-9" onClick={() => setSelectedId("")} type="button">Close</button>
          </div>
          <LoadingOrError loading={selected.isLoading} error={selected.error} />
          {selected.data ? (
            <div className="dashboard-panel-body grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 font-semibold">Accounts</h3>
                <ul className="space-y-2">
                  {selected.data.accounts.map((account) => (
                    <li className="flex justify-between gap-3 rounded-lg border border-border p-3 text-sm" key={account.id}>
                      <span>{account.account_number} · {account.type}</span><span>{money(account.balance)} · {account.status}</span>
                    </li>
                  ))}
                  {!selected.data.accounts.length ? <li className="text-sm text-muted-foreground">No accounts.</li> : null}
                </ul>
              </div>
              <div>
                <h3 className="mb-3 font-semibold">Recent transactions</h3>
                <ul className="space-y-2">
                  {selected.data.transactions.slice(0, 10).map((transaction) => (
                    <li className="flex justify-between gap-3 rounded-lg border border-border p-3 text-sm" key={transaction.id}>
                      <span>{transaction.reference} · {transaction.type}</span><span>{money(transaction.amount)} · {transaction.status}</span>
                    </li>
                  ))}
                  {!selected.data.transactions.length ? <li className="text-sm text-muted-foreground">No transactions.</li> : null}
                </ul>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </DashboardShell>
  );
}

export function TransactionWorkspace({ role }: { role: "staff" | "customer" }) {
  const activeHref = role === "staff" ? "/staff/transactions" : "/customer/transactions";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const transactions = useGetTransactionsQuery({
    page,
    limit: 25,
    ...(search ? { search } : {}),
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to: `${to}T23:59:59.999` } : {}),
  });
  const accounts = useGetAccountsQuery(undefined, { skip: role !== "customer" });
  const detail = useGetTransactionQuery(selectedId, { skip: !selectedId });
  const [deposit, depositState] = useRequestDepositMutation();
  const [withdrawal, withdrawalState] = useRequestWithdrawalMutation();
  const [review, reviewState] = useReviewTransactionMutation();
  const [success, setSuccess] = useState("");

  async function submitMoneyRequest(
    event: FormEvent<HTMLFormElement>,
    requestType: "deposit" | "withdrawal",
  ) {
    event.preventDefault();
    setSuccess("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const body = {
      accountId: String(form.get("accountId")),
      amount: String(form.get("amount")),
      description: String(form.get("description") ?? ""),
      ...(requestType === "withdrawal" ? { transactionPin: String(form.get("transactionPin")) } : {}),
    };
    try {
      if (requestType === "deposit") await deposit(body).unwrap();
      else await withdrawal(body).unwrap();
      formElement.reset();
      setSuccess(`${requestType === "deposit" ? "Deposit" : "Withdrawal"} request submitted for review.`);
    } catch {
      setSuccess("");
    }
  }

  async function decide(id: string, decision: "approve" | "reject" | "flag") {
    try {
      await review({ id, decision }).unwrap();
    } catch {
      return;
    }
  }

  const rows = transactions.data?.transactions ?? [];
  const totalPages = Math.max(1, Math.ceil((transactions.data?.total ?? 0) / 25));
  return (
    <DashboardShell activeHref={activeHref} role={role}>
      <PageHeading
        description={role === "staff" ? "Search transactions, review pending requests, and flag suspicious activity." : "Review activity and submit deposit or withdrawal requests."}
        title="Transactions"
      />
      {role === "customer" ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {(["deposit", "withdrawal"] as const).map((requestType) => (
            <div className="dashboard-panel" key={requestType}>
              <div className="dashboard-panel-header"><h2 className="dashboard-panel-title">Request a {requestType}</h2></div>
              <form className="dashboard-panel-body grid gap-4" onSubmit={(event) => void submitMoneyRequest(event, requestType)}>
                <label className="dashboard-field">Account<select className="dashboard-input" name="accountId" required><option value="">Select account</option>{accounts.data?.accounts.filter((account) => account.status === "active").map((account) => <option key={account.id} value={account.id}>{account.account_number} · {account.type} · {money(account.balance)}</option>)}</select></label>
                <label className="dashboard-field">Amount<input className="dashboard-input" inputMode="decimal" min="0.01" name="amount" required step="0.01" type="number" /></label>
                {requestType === "withdrawal" ? <label className="dashboard-field">Transaction PIN<input autoComplete="off" className="dashboard-input" inputMode="numeric" maxLength={8} minLength={4} name="transactionPin" pattern="[0-9]{4,8}" required type="password" /></label> : null}
                <label className="dashboard-field">Description<input className="dashboard-input" maxLength={500} name="description" /></label>
                <button className="dashboard-button" disabled={requestType === "deposit" ? depositState.isLoading : withdrawalState.isLoading} type="submit">Submit request</button>
                <Feedback error={requestType === "deposit" ? depositState.error : withdrawalState.error} success={success} />
              </form>
            </div>
          ))}
        </section>
      ) : null}
      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div><h2 className="dashboard-panel-title">Transaction history</h2><p className="mt-1 text-sm text-muted-foreground">{transactions.data?.total ?? 0} matching records</p></div>
        </div>
        <div className="border-b border-border p-5">
          <div className="dashboard-filters">
            <label className="dashboard-field">Reference or ID<input className="dashboard-input" onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search transactions" type="search" value={search} /></label>
            <label className="dashboard-field">Type<select className="dashboard-input" onChange={(event) => { setType(event.target.value); setPage(1); }} value={type}><option value="">All types</option><option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option><option value="transfer">Transfer</option><option value="loan-disbursement">Loan disbursement</option><option value="loan-repayment">Loan repayment</option></select></label>
            <label className="dashboard-field">From<input className="dashboard-input" onChange={(event) => { setFrom(event.target.value); setPage(1); }} type="date" value={from} /></label>
            <label className="dashboard-field">To<input className="dashboard-input" onChange={(event) => { setTo(event.target.value); setPage(1); }} type="date" value={to} /></label>
            {role === "staff" ? <label className="dashboard-field">Status<select className="dashboard-input" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}><option value="">All statuses</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="failed">Failed</option></select></label> : null}
          </div>
        </div>
        <LoadingOrError loading={transactions.isLoading} error={transactions.error} />
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead><tr><th>Reference</th><th>Sender account</th><th>Receiver account</th><th>Type</th><th>Amount</th><th>Fee</th><th>Date</th><th>Status</th>{role === "staff" ? <th>Review</th> : null}</tr></thead>
            <tbody>
              {rows.map((transaction) => (
                <tr key={transaction.id}>
                  <td><button className="font-mono text-primary hover:underline" onClick={() => setSelectedId(transaction.id)} type="button">{transaction.reference}</button></td>
                  <td className="font-mono text-xs">{transaction.sender_account_id ?? "—"}</td>
                  <td className="font-mono text-xs">{transaction.receiver_account_id ?? "—"}</td>
                  <td className="capitalize">{transaction.type.replaceAll("-", " ")}</td>
                  <td className="numeric">{money(transaction.amount)}</td>
                  <td className="numeric">{money(transaction.fee)}</td>
                  <td>{date(transaction.created_at)}</td>
                  <td><StatusBadge value={transaction.status} /></td>
                  {role === "staff" ? (
                    <td>
                      {transaction.status === "pending" ? (
                        <div className="flex gap-2">
                          <button className="dashboard-button-secondary min-h-8 px-2 text-xs" onClick={() => void decide(transaction.id, "approve")} type="button">Approve</button>
                          <button className="dashboard-button-secondary min-h-8 px-2 text-xs" onClick={() => void decide(transaction.id, "reject")} type="button">Reject</button>
                        </div>
                      ) : transaction.is_suspicious ? <StatusBadge value="flagged" /> : <button className="dashboard-button-secondary min-h-8 px-2 text-xs" onClick={() => void decide(transaction.id, "flag")} type="button">Flag</button>}
                    </td>
                  ) : null}
                </tr>
              ))}
              {!transactions.isLoading && !transactions.error && !rows.length ? <EmptyRow columns={role === "staff" ? 9 : 8} message="No transactions match these filters." /> : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button className="dashboard-button-secondary min-h-9" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">Previous</button>
            <button className="dashboard-button-secondary min-h-9" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} type="button">Next</button>
          </div>
        </div>
        <div className="px-5 pb-4"><Feedback error={reviewState.error} /></div>
      </section>
      {selectedId ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header"><h2 className="dashboard-panel-title">Transaction details</h2><button className="dashboard-button-secondary min-h-9" onClick={() => setSelectedId("")} type="button">Close</button></div>
          <LoadingOrError loading={detail.isLoading} error={detail.error} />
          {detail.data?.transaction ? (
            <dl className="grid gap-3 p-5 sm:grid-cols-2">
              {Object.entries(detail.data.transaction).map(([key, value]) => (
                <div className="rounded-lg border border-border p-3" key={key}>
                  <dt className="text-xs capitalize text-muted-foreground">{key.replaceAll("_", " ")}</dt>
                  <dd className="mt-1 break-all text-sm">{value === null ? "—" : String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      ) : null}
    </DashboardShell>
  );
}

export function LoanWorkspace({ role }: { role: DashboardRole }) {
  const activeHref = dashboardRoles[role].navigation.find(({ href }) => href.endsWith("/loans"))?.href;
  if (!activeHref) throw new Error(`No loan workspace is configured for role "${role}".`);
  const loans = useGetLoansQuery();
  const accounts = useGetAccountsQuery(undefined, { skip: role === "staff" });
  const customers = useGetCustomersQuery({ page: 1, limit: 100 }, { skip: role === "customer" });
  const [selectedId, setSelectedId] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [apply, applyState] = useApplyForLoanMutation();
  const [review, reviewState] = useReviewLoanMutation();
  const [approve, approveState] = useApproveLoanMutation();
  const [reject, rejectState] = useRejectLoanMutation();
  const [repay, repayState] = useRepayLoanMutation();
  const selectedLoan = useGetLoanQuery(selectedId, { skip: !selectedId });
  const [success, setSuccess] = useState("");
  const loanRows = loans.data?.loans ?? [];
  const ownerNames = new Map((customers.data?.customers ?? []).map((customer) => [customer.id, customer.name]));
  const selectedAccounts = accounts.data?.accounts.filter((account) => account.owner_id === selectedLoan.data?.loan.customer_id) ?? [];

  async function applyForLoan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await apply({
        loanType: String(form.get("loanType")),
        requestedAmount: String(form.get("requestedAmount")),
        durationMonths: Number(form.get("durationMonths")),
        monthlyIncome: String(form.get("monthlyIncome")),
        employmentStatus: String(form.get("employmentStatus")),
        description: String(form.get("description") ?? ""),
        ...(form.get("accountId") ? { accountId: String(form.get("accountId")) } : {}),
      }).unwrap();
      formElement.reset();
      setSuccess("Loan application submitted.");
    } catch {
      setSuccess("");
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    const form = new FormData(event.currentTarget);
    try {
      await review({ id: selectedId, internalNotes: String(form.get("internalNotes") ?? "") }).unwrap();
      setSuccess("Application forwarded for administrator decision.");
    } catch {
      setSuccess("");
    }
  }

  async function submitDecision(decision: "approve" | "reject") {
    if (!selectedId) return;
    try {
      if (decision === "approve") {
        await approve({
          id: selectedId,
          ...(selectedAccountId ? { accountId: selectedAccountId } : {}),
          ...(twoFactorCode ? { twoFactorCode } : {}),
        }).unwrap();
        setSuccess("Loan approved and disbursed.");
      } else {
        await reject({ id: selectedId, ...(twoFactorCode ? { twoFactorCode } : {}) }).unwrap();
        setSuccess("Loan application rejected.");
      }
    } catch {
      setSuccess("");
    }
  }

  async function submitRepayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const loan = selectedLoan.data?.loan;
    if (!loan?.account_id) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await repay({
        accountId: loan.account_id,
        loanId: loan.id,
        amount: String(form.get("amount")),
        description: String(form.get("description") ?? ""),
        transactionPin: String(form.get("transactionPin")),
        idempotencyKey: crypto.randomUUID(),
      }).unwrap();
      formElement.reset();
      setSuccess("Loan repayment completed.");
    } catch {
      setSuccess("");
    }
  }

  return (
    <DashboardShell activeHref={activeHref} role={role}>
      <PageHeading
        description={role === "customer" ? "Apply for financing, track decisions, and repay active loans." : "Review loan applications and record authorized decisions."}
        title={role === "customer" ? "Loans" : "Loan applications"}
      />
      {role === "customer" ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header"><h2 className="dashboard-panel-title">Apply for a loan</h2></div>
          <form className="dashboard-panel-body grid gap-4 sm:grid-cols-2" onSubmit={applyForLoan}>
            <label className="dashboard-field">Loan type<input className="dashboard-input" maxLength={80} minLength={2} name="loanType" required /></label>
            <label className="dashboard-field">Requested amount<input className="dashboard-input" inputMode="decimal" min="0.01" name="requestedAmount" required step="0.01" type="number" /></label>
            <label className="dashboard-field">Duration (months)<input className="dashboard-input" max="600" min="1" name="durationMonths" required type="number" /></label>
            <label className="dashboard-field">Monthly income<input className="dashboard-input" inputMode="decimal" min="0" name="monthlyIncome" required step="0.01" type="number" /></label>
            <label className="dashboard-field">Employment status<input className="dashboard-input" maxLength={80} minLength={2} name="employmentStatus" required /></label>
            <label className="dashboard-field">Disbursement account (optional)<select className="dashboard-input" name="accountId"><option value="">Choose later</option>{accounts.data?.accounts.filter((account) => account.status === "active").map((account) => <option key={account.id} value={account.id}>{account.account_number} · {account.type}</option>)}</select></label>
            <label className="dashboard-field sm:col-span-2">Description<textarea className="dashboard-input min-h-24" maxLength={2000} name="description" /></label>
            <button className="dashboard-button" disabled={applyState.isLoading} type="submit">Submit application</button>
            <div className="sm:col-span-2"><Feedback error={applyState.error} success={success} /></div>
          </form>
        </section>
      ) : null}
      {role === "admin" ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel-body grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="dashboard-field">Administrator 2FA code (if enabled)<input className="dashboard-input" inputMode="numeric" maxLength={6} onChange={(event) => setTwoFactorCode(event.target.value)} value={twoFactorCode} /></label>
            <p className="self-end pb-2 text-sm text-muted-foreground">Only an administrator can approve or reject applications.</p>
            <Feedback error={approveState.error || rejectState.error} success={success} />
          </div>
        </section>
      ) : null}
      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div><h2 className="dashboard-panel-title">{role === "customer" ? "Your loans" : "Applications"}</h2><p className="mt-1 text-sm text-muted-foreground">{loanRows.length} records</p></div>
          <LoadingOrError loading={loans.isLoading} error={loans.error} />
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead><tr><th>Loan</th>{role !== "customer" ? <th>Customer</th> : null}<th>Type</th><th>Amount</th><th>Duration</th><th>Status</th><th>Remaining</th><th>Details</th></tr></thead>
            <tbody>
              {loanRows.map((loan) => (
                <tr key={loan.id}>
                  <td className="font-mono text-xs">{loan.id}</td>
                  {role !== "customer" ? <td>{ownerNames.get(loan.customer_id) ?? loan.customer_id}</td> : null}
                  <td>{loan.loan_type}</td><td>{money(loan.requested_amount)}</td><td>{loan.duration_months} months</td><td><StatusBadge value={loan.status} /></td><td>{money(loan.remaining_balance)}</td>
                  <td><button className="dashboard-button-secondary min-h-9" onClick={() => { setSelectedId(loan.id); setSelectedAccountId(loan.account_id ?? ""); setSuccess(""); }} type="button">Review</button></td>
                </tr>
              ))}
              {!loans.isLoading && !loans.error && !loanRows.length ? <EmptyRow columns={role === "customer" ? 7 : 8} message="No loan applications found." /> : null}
            </tbody>
          </table>
        </div>
      </section>
      {selectedId ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div><h2 className="dashboard-panel-title">Loan details</h2><p className="text-xs text-muted-foreground">{selectedId}</p></div>
            <button className="dashboard-button-secondary min-h-9" onClick={() => setSelectedId("")} type="button">Close</button>
          </div>
          <LoadingOrError loading={selectedLoan.isLoading} error={selectedLoan.error} />
          {selectedLoan.data ? (
            <div className="dashboard-panel-body grid gap-5">
              <dl className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Requested", money(selectedLoan.data.loan.requested_amount)],
                  ["Remaining", money(selectedLoan.data.loan.remaining_balance)],
                  ["Status", selectedLoan.data.loan.status],
                  ["Income", money(selectedLoan.data.loan.monthly_income)],
                  ["Employment", selectedLoan.data.loan.employment_status],
                  ["Description", selectedLoan.data.loan.description || "—"],
                ].map(([label, value]) => <div className="rounded-lg border border-border p-3" key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm">{value}</dd></div>)}
              </dl>
              {role === "staff" ? (
                <form className="grid gap-3" onSubmit={submitReview}>
                  <label className="dashboard-field">Internal review notes<textarea className="dashboard-input min-h-20" defaultValue={selectedLoan.data.loan.internal_notes ?? ""} maxLength={2000} name="internalNotes" /></label>
                  <button className="dashboard-button-secondary justify-self-start" disabled={reviewState.isLoading} type="submit">Forward to Admin</button>
                  <Feedback error={reviewState.error} success={success} />
                </form>
              ) : null}
              {role === "admin" && ["pending", "under-review"].includes(selectedLoan.data.loan.status) ? (
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <label className="dashboard-field">Disbursement account<select className="dashboard-input" onChange={(event) => setSelectedAccountId(event.target.value)} required value={selectedAccountId}><option value="">Select customer account</option>{selectedAccounts.filter((account) => account.status === "active").map((account) => <option key={account.id} value={account.id}>{account.account_number} · {account.type}</option>)}</select></label>
                  <button className="dashboard-button self-end" disabled={approveState.isLoading} onClick={() => void submitDecision("approve")} type="button">Approve & disburse</button>
                  <button className="dashboard-button-secondary self-end" disabled={rejectState.isLoading} onClick={() => void submitDecision("reject")} type="button">Reject</button>
                </div>
              ) : null}
              {role === "customer" && selectedLoan.data.loan.status === "active" ? (
                <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitRepayment}>
                  <label className="dashboard-field">Repayment amount<input className="dashboard-input" inputMode="decimal" max={selectedLoan.data.loan.remaining_balance} min="0.01" name="amount" required step="0.01" type="number" /></label>
                  <label className="dashboard-field">Transaction PIN<input autoComplete="off" className="dashboard-input" inputMode="numeric" maxLength={8} minLength={4} name="transactionPin" pattern="[0-9]{4,8}" required type="password" /></label>
                  <label className="dashboard-field sm:col-span-2">Description<input className="dashboard-input" maxLength={500} name="description" /></label>
                  <button className="dashboard-button" disabled={repayState.isLoading} type="submit">Make repayment</button>
                  <Feedback error={repayState.error} success={success} />
                </form>
              ) : null}
              <div>
                <h3 className="mb-2 font-semibold">Repayment history</h3>
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead><tr><th>Reference</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {(selectedLoan.data.repayments ?? []).map((repayment) => <tr key={repayment.id}><td className="font-mono">{repayment.reference}</td><td>{money(repayment.amount)}</td><td><StatusBadge value={repayment.status} /></td><td>{date(repayment.created_at)}</td></tr>)}
                      {!selectedLoan.data.repayments?.length ? <EmptyRow columns={4} message="No repayments recorded." /> : null}
                    </tbody>
                  </table>
                </div>
              </div>
              <Feedback error={approveState.error || rejectState.error || repayState.error} success={success} />
            </div>
          ) : null}
        </section>
      ) : null}
    </DashboardShell>
  );
}

export function TransferWorkspace() {
  const accounts = useGetAccountsQuery();
  const [transfer, transferState] = useTransferFundsMutation();
  const [success, setSuccess] = useState("");

  async function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const result = await transfer({
        senderAccountId: String(form.get("senderAccountId")),
        recipientAccountNumber: String(form.get("recipientAccountNumber")),
        amount: String(form.get("amount")),
        transactionPin: String(form.get("transactionPin")),
        description: String(form.get("description") ?? ""),
        idempotencyKey: crypto.randomUUID(),
      }).unwrap();
      formElement.reset();
      setSuccess(`Transfer completed. Reference: ${result.transaction.reference}`);
    } catch {
      setSuccess("");
    }
  }

  return (
    <DashboardShell role="customer" activeHref="/customer/transfer">
      <PageHeading description="Transfer between your accounts or to another Meridian customer." title="Make a transfer" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <section className="dashboard-panel">
          <div className="dashboard-panel-header"><div><h2 className="dashboard-panel-title">Transfer details</h2><p className="mt-1 text-sm text-muted-foreground">The server verifies ownership, PIN, limits, and balances before atomically recording a transfer.</p></div></div>
          <form className="dashboard-panel-body grid gap-4" onSubmit={submitTransfer}>
            <label className="dashboard-field">From account<select className="dashboard-input" name="senderAccountId" required><option value="">Select account</option>{accounts.data?.accounts.filter((account) => account.status === "active").map((account) => <option key={account.id} value={account.id}>{account.account_number} · {money(account.balance)}</option>)}</select></label>
            <label className="dashboard-field">Recipient account number<input autoComplete="off" className="dashboard-input" maxLength={40} minLength={6} name="recipientAccountNumber" required /></label>
            <label className="dashboard-field">Amount<input className="dashboard-input" inputMode="decimal" min="0.01" name="amount" required step="0.01" type="number" /></label>
            <label className="dashboard-field">Transaction PIN<input autoComplete="off" className="dashboard-input" inputMode="numeric" maxLength={8} minLength={4} name="transactionPin" pattern="[0-9]{4,8}" required type="password" /></label>
            <label className="dashboard-field">Description<input className="dashboard-input" maxLength={500} name="description" /></label>
            <button className="dashboard-button" disabled={transferState.isLoading || accounts.isLoading} type="submit">{transferState.isLoading ? "Processing…" : "Submit transfer"}</button>
            <Feedback error={transferState.error} success={success} />
            <LoadingOrError loading={accounts.isLoading} error={accounts.error} />
          </form>
        </section>
        <aside className="dashboard-panel h-fit">
          <div className="dashboard-panel-header"><h2 className="dashboard-panel-title">Before you transfer</h2></div>
          <div className="dashboard-panel-body space-y-4 text-sm text-muted-foreground">
            <p>Only transfer to a recipient you trust.</p>
            <p>Transactions use a unique idempotency key and are committed atomically.</p>
            <p>Available funds and account limits are checked on the server.</p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

export function SettingsWorkspace({
  role,
  activeHref,
}: {
  role: DashboardRole;
  activeHref: string;
}) {
  return role === "admin" ? (
    <AdminSettings activeHref={activeHref} />
  ) : (
    <CustomerSettings activeHref={activeHref} role={role} />
  );
}

function AdminSettings({ activeHref }: { activeHref: string }) {
  const settings = useGetSettingsQuery();
  const [updateSettings, updateState] = useUpdateSettingsMutation();
  const [code, setCode] = useState("");
  const [success, setSuccess] = useState("");
  const current = settings.data?.settings ?? {};

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await updateSettings({
        settings: {
          dailyTransferLimit: String(form.get("dailyTransferLimit")),
          maxSingleTransaction: String(form.get("maxSingleTransaction")),
          loanApprovalPolicy: String(form.get("loanApprovalPolicy")),
        },
        ...(code ? { twoFactorCode: code } : {}),
      }).unwrap();
      setSuccess("Bank settings saved.");
    } catch {
      setSuccess("");
    }
  }

  return (
    <DashboardShell activeHref={activeHref} role="admin">
      <PageHeading description="Bank-wide transaction and approval settings." title="Bank settings" />
      <section className="dashboard-panel">
        <div className="dashboard-panel-header"><h2 className="dashboard-panel-title">Transaction controls</h2><LoadingOrError loading={settings.isLoading} error={settings.error} /></div>
        <form className="dashboard-panel-body grid gap-4 sm:grid-cols-2" key={settings.isSuccess ? "loaded" : "loading"} onSubmit={saveSettings}>
          <label className="dashboard-field">Default daily transfer limit<input className="dashboard-input" defaultValue={String(current.dailyTransferLimit ?? "")} name="dailyTransferLimit" required /></label>
          <label className="dashboard-field">Default single transaction limit<input className="dashboard-input" defaultValue={String(current.maxSingleTransaction ?? "")} name="maxSingleTransaction" required /></label>
          <label className="dashboard-field">Loan approval policy<input className="dashboard-input" defaultValue={String(current.loanApprovalPolicy ?? "")} name="loanApprovalPolicy" required /></label>
          <label className="dashboard-field">Administrator 2FA code (if enabled)<input className="dashboard-input" inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value)} value={code} /></label>
          <button className="dashboard-button sm:col-span-2 sm:justify-self-start" disabled={updateState.isLoading || settings.isLoading} type="submit">Save settings</button>
          <div className="sm:col-span-2"><Feedback error={updateState.error} success={success} /></div>
        </form>
      </section>
    </DashboardShell>
  );
}

function CustomerSettings({
  role,
  activeHref,
}: {
  role: "staff" | "customer";
  activeHref: string;
}) {
  const { data: session } = useSession();
  const twoFactor = useGetTwoFactorStatusQuery();
  return (
    <DashboardShell activeHref={activeHref} role={role}>
      <PageHeading description="Review your account profile and security settings." title="Account settings" />
      <section className="dashboard-panel">
        <div className="dashboard-panel-header"><h2 className="dashboard-panel-title">Profile and security</h2></div>
        <div className="dashboard-panel-body grid gap-4 sm:grid-cols-2">
          <label className="dashboard-field">Name<input className="dashboard-input" readOnly value={session?.user?.name ?? ""} /></label>
          <label className="dashboard-field">Email address<input className="dashboard-input" readOnly type="email" value={session?.user?.email ?? ""} /></label>
          <div className="dashboard-field">
            Two-factor authentication
            <div className="flex min-h-10 items-center gap-3">
              {twoFactor.isLoading ? <span className="text-sm text-muted-foreground">Checking…</span> : <StatusBadge value={twoFactor.data?.enabled ? "active" : "disabled"} />}
              <Link className="font-medium text-primary hover:underline" href="/two-factor">Manage 2FA</Link>
            </div>
            {twoFactor.error ? <span className="text-xs text-danger">{getApiErrorMessage(twoFactor.error)}</span> : null}
          </div>
          <div className="dashboard-field">
            Notifications
            <span className="text-sm text-muted-foreground">Banking activity alerts appear in the top navigation.</span>
          </div>
        </div>
      </section>
      <section className="dashboard-panel">
        <div className="dashboard-panel-header"><h2 className="dashboard-panel-title">Security help</h2></div>
        <div className="dashboard-panel-body flex items-start gap-3 text-sm text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="mt-0.5 text-primary" size={18} />
          <p>Never share your transaction PIN or authenticator recovery codes. Sensitive operations are checked on the server.</p>
        </div>
      </section>
    </DashboardShell>
  );
}
