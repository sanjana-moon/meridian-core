import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpRightFromSquare,
  ChartNoAxesCombined,
  CircleDollarSign,
  Download,
  FileClock,
  ShieldCheck,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  dashboardRoles,
  roleDashboardContent,
  type DashboardRole,
} from "@/lib/dashboard-config";

function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; href?: string };
}) {
  return (
    <div className="dashboard-heading">
      <div>
        <h1 className="dashboard-heading-title">{title}</h1>
        <p className="dashboard-heading-copy">{description}</p>
      </div>
      {action ? (
        action.href ? (
          <Link className="dashboard-button-secondary" href={action.href}>
            {action.label}
            <ArrowUpRightFromSquare aria-hidden="true" size={16} />
          </Link>
        ) : (
          // TODO(API): Enable this action only after the authorized server endpoint exists.
          <button className="dashboard-button" disabled type="button">
            {action.label}
          </button>
        )
      ) : null}
    </div>
  );
}

function EmptyTable({
  columns,
  title,
  description,
}: {
  columns: string[];
  title: string;
  description: string;
}) {
  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length}>
              <div className="dashboard-empty-state">
                <FileClock
                  aria-hidden="true"
                  className="mx-auto mb-3 text-muted-foreground"
                  size={24}
                />
                <p className="dashboard-empty-title">{title}</p>
                <p className="dashboard-empty-copy">{description}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function LiveChartPlaceholder({ title }: { title: string }) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <h2 className="dashboard-panel-title">{title}</h2>
        <span className="dashboard-badge dashboard-badge-neutral">Live data</span>
      </div>
      <div className="dashboard-panel-body">
        <div className="dashboard-chart-empty">
          <ChartNoAxesCombined
            aria-hidden="true"
            className="text-muted-foreground"
            size={28}
          />
          <p className="text-sm font-medium">Chart will appear when connected</p>
          <p className="text-xs text-muted-foreground">
            No financial data is fabricated in this preview.
          </p>
        </div>
      </div>
    </section>
  );
}

export function DashboardOverview({ role }: { role: DashboardRole }) {
  const { title, description, metrics, charts } = roleDashboardContent[role];
  const dashboardPath = dashboardRoles[role].navigation[0].href;

  return (
    <DashboardShell role={role} activeHref={dashboardPath}>
      <PageHeading title={title} description={description} />

      <section aria-label="Summary metrics" className="dashboard-metrics">
        {metrics.map((metric, index) => {
          const Icon = [CircleDollarSign, ArrowDownLeft, ArrowUpRight, ShieldCheck][
            index % 4
          ];

          return (
            <article className="dashboard-metric" key={metric}>
              <div className="flex items-center justify-between gap-3">
                <p className="dashboard-metric-label">{metric}</p>
                <Icon aria-hidden="true" className="text-primary" size={18} />
              </div>
              <span className="dashboard-metric-value balance-display">—</span>
              <p className="mt-2 text-xs text-muted-foreground">
                Waiting for a verified API response
              </p>
            </article>
          );
        })}
      </section>

      {role === "customer" ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Account overview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Switch between your accounts to view account-specific activity.
              </p>
            </div>
            {/* TODO(API): Populate only accounts owned by the authenticated customer. */}
            <select
              aria-label="Choose account"
              className="dashboard-input sm:max-w-64"
              disabled
              defaultValue=""
            >
              <option value="">Connect accounts API</option>
            </select>
          </div>
        </section>
      ) : null}

      <section aria-label="Banking analytics" className="dashboard-chart-grid">
        {charts.map((chart) => (
          <LiveChartPlaceholder key={chart} title={chart} />
        ))}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2 className="dashboard-panel-title">Recent transactions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Transaction activity will appear after the API is connected.
            </p>
          </div>
          {role === "customer" ? (
            <Link
              className="dashboard-button-secondary"
              href="/customer/transactions"
            >
              View transactions
            </Link>
          ) : null}
        </div>
        <EmptyTable
          columns={["Transaction ID", "Type", "Date", "Amount", "Status"]}
          description="No transaction records are available in this preview."
          title="No activity to show"
        />
      </section>
    </DashboardShell>
  );
}

export interface WorkspacePageProps {
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

export function WorkspacePage({
  role,
  activeHref,
  title,
  description,
  columns,
  actionLabel,
  actionHref,
  includeFilters = true,
  includeExport = false,
  notice,
  controls,
}: WorkspacePageProps) {
  return (
    <DashboardShell role={role} activeHref={activeHref}>
      <PageHeading
        action={
          actionLabel
            ? { label: actionLabel, href: actionHref }
            : undefined
        }
        description={description}
        title={title}
      />

      {notice ? <p className="dashboard-notice">{notice}</p> : null}

      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2 className="dashboard-panel-title">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Records are loaded only from an authorized server API.
            </p>
          </div>
          {includeExport ? (
            // TODO(API): Connect statement export to an authenticated, account-scoped endpoint.
            <button
              className="dashboard-button-secondary"
              disabled
              type="button"
            >
              <Download aria-hidden="true" size={16} />
              Download statement
            </button>
          ) : null}
        </div>

        {includeFilters ? (
          <div className="border-b border-border p-5">
            {/* TODO(API): Apply these filters on the server and paginate the authorized result set. */}
            <div className="dashboard-filters">
              <label className="dashboard-field">
                Search
                <input
                  className="dashboard-input"
                  disabled
                  placeholder="Connect search API"
                  type="search"
                />
              </label>
              <label className="dashboard-field">
                Date range
                <select className="dashboard-input" disabled defaultValue="">
                  <option value="">All dates</option>
                </select>
              </label>
              <label className="dashboard-field">
                Type or status
                <select className="dashboard-input" disabled defaultValue="">
                  <option value="">All types and statuses</option>
                </select>
              </label>
            </div>
          </div>
        ) : null}

        {controls?.length ? (
          <div className="flex flex-wrap gap-2 border-b border-border p-5">
            {/* TODO(API): Render row-level controls only for records the current role may manage. */}
            {controls.map((control) => (
              <button
                className="dashboard-button-secondary"
                disabled
                key={control}
                type="button"
              >
                {control}
              </button>
            ))}
          </div>
        ) : null}

        <EmptyTable
          columns={columns}
          description="No records are available until the API is connected."
          title="Nothing to display yet"
        />
      </section>
    </DashboardShell>
  );
}

export function TransactionWorkspace({ role }: { role: "staff" | "customer" }) {
  const activeHref =
    role === "staff" ? "/staff/transactions" : "/customer/transactions";

  return (
    <DashboardShell activeHref={activeHref} role={role}>
      <PageHeading
        description={
          role === "staff"
            ? "Search, filter, and review transaction activity."
            : "Review activity and submit deposit or withdrawal requests."
        }
        title="Transactions"
      />

      {role === "customer" ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {(["Deposit", "Withdrawal"] as const).map((requestType) => (
            <div className="dashboard-panel" key={requestType}>
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">
                  Request a {requestType.toLowerCase()}
                </h2>
              </div>
              <div className="dashboard-panel-body">
                {/* TODO(API): Create a server-reviewed request; never credit/debit a client-supplied balance. */}
                <form className="grid gap-4">
                  <label className="dashboard-field">
                    Account
                    <select className="dashboard-input" disabled defaultValue="">
                      <option value="">Connect accounts API</option>
                    </select>
                  </label>
                  <label className="dashboard-field">
                    Amount
                    <input
                      className="dashboard-input"
                      disabled
                      inputMode="decimal"
                      placeholder="0.00"
                      type="number"
                    />
                  </label>
                  <label className="dashboard-field">
                    Description
                    <input
                      className="dashboard-input"
                      disabled
                      placeholder="Optional note"
                    />
                  </label>
                  <button className="dashboard-button" disabled type="button">
                    Submit request
                  </button>
                </form>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <p className="dashboard-notice">
          Flagging suspicious activity will require a staff-authorized review API.
        </p>
      )}

      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2 className="dashboard-panel-title">Transaction history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Search by transaction ID and filter by date, type, or status.
            </p>
          </div>
          {role === "customer" ? (
            // TODO(API): Download receipts only for transactions owned by the authenticated customer.
            <button
              className="dashboard-button-secondary"
              disabled
              type="button"
            >
              Download receipt
            </button>
          ) : null}
        </div>
        <div className="border-b border-border p-5">
          {/* TODO(API): Enforce role scope, filters, and pagination in the transaction query. */}
          <div className="dashboard-filters">
            <label className="dashboard-field">
              Transaction ID
              <input
                className="dashboard-input"
                disabled
                placeholder="Connect transaction API"
                type="search"
              />
            </label>
            <label className="dashboard-field">
              Date range
              <select className="dashboard-input" disabled defaultValue="">
                <option value="">All dates</option>
              </select>
            </label>
            <label className="dashboard-field">
              Transaction type
              <select className="dashboard-input" disabled defaultValue="">
                <option value="">All types</option>
              </select>
            </label>
            {role === "staff" ? (
              <label className="dashboard-field">
                Status
                <select className="dashboard-input" disabled defaultValue="">
                  <option value="">All statuses</option>
                </select>
              </label>
            ) : null}
          </div>
        </div>
        <EmptyTable
          columns={[
            "Transaction ID",
            "Sender",
            "Receiver",
            "Type",
            "Amount",
            "Fee",
            "Date",
            "Status",
          ]}
          description="Transaction history will appear when the API is connected."
          title="No transactions to show"
        />
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm text-muted-foreground">
          <span>Pagination is unavailable until live records are connected.</span>
          <button className="dashboard-button-secondary" disabled type="button">
            Next
          </button>
        </div>
      </section>
    </DashboardShell>
  );
}

export function LoanWorkspace({ role }: { role: DashboardRole }) {
  const activeHref = dashboardRoles[role].navigation.find(
    ({ href }) => href.endsWith("/loans"),
  )?.href;

  if (!activeHref) {
    throw new Error(`No loan workspace is configured for role "${role}".`);
  }

  return (
    <DashboardShell activeHref={activeHref} role={role}>
      <PageHeading
        description={
          role === "customer"
            ? "Apply for financing and track repayment progress."
            : "Review applications, decisions, and repayment history."
        }
        title={role === "customer" ? "Loans" : "Loan applications"}
      />

      {role === "customer" ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Apply for a loan</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Submit application details for a secure review.
              </p>
            </div>
          </div>
          <div className="dashboard-panel-body">
            {/* TODO(API): Validate application details and derive eligibility on the server. */}
            <form className="grid gap-4 sm:grid-cols-2">
              <label className="dashboard-field">
                Loan type
                <select className="dashboard-input" disabled defaultValue="">
                  <option value="">Connect loans API</option>
                </select>
              </label>
              <label className="dashboard-field">
                Amount
                <input
                  className="dashboard-input"
                  disabled
                  inputMode="decimal"
                  placeholder="0.00"
                  type="number"
                />
              </label>
              <label className="dashboard-field">
                Duration
                <input
                  className="dashboard-input"
                  disabled
                  placeholder="Months"
                  type="number"
                />
              </label>
              <label className="dashboard-field">
                Monthly income
                <input
                  className="dashboard-input"
                  disabled
                  inputMode="decimal"
                  placeholder="0.00"
                  type="number"
                />
              </label>
              <label className="dashboard-field">
                Employment status
                <select className="dashboard-input" disabled defaultValue="">
                  <option value="">Connect loans API</option>
                </select>
              </label>
              <label className="dashboard-field sm:col-span-2">
                Description
                <textarea
                  className="dashboard-input min-h-24"
                  disabled
                  placeholder="Tell us about your loan request"
                />
              </label>
              <button className="dashboard-button" disabled type="button">
                Submit application
              </button>
            </form>
          </div>
        </section>
      ) : (
        <div className="dashboard-notice">
          {role === "staff"
            ? "Staff can add internal review notes and forward applications to Admin, but cannot approve or reject loans."
            : "Only authorized Admins can approve or reject applications."}
        </div>
      )}

      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2 className="dashboard-panel-title">
              {role === "customer" ? "Your loans and history" : "Applications"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Status, repayment progress, and remaining balances require live
              loan data.
            </p>
          </div>
        </div>
        {role === "staff" ? (
          <div className="border-b border-border p-5">
            {/* TODO(API): Persist staff-only notes and forward eligible applications to Admin. */}
            <label className="dashboard-field">
              Internal review notes
              <textarea
                className="dashboard-input min-h-20"
                disabled
                placeholder="Connect loan review API"
              />
            </label>
            <button
              className="dashboard-button-secondary mt-3"
              disabled
              type="button"
            >
              Forward to Admin
            </button>
          </div>
        ) : null}
        {role === "admin" ? (
          <div className="border-b border-border p-5">
            {/* TODO(API): Approve or reject only after server-side role checks and atomic disbursement are implemented. */}
            <div className="flex flex-wrap gap-2">
              <button className="dashboard-button" disabled type="button">
                Approve application
              </button>
              <button
                className="dashboard-button-secondary"
                disabled
                type="button"
              >
                Reject application
              </button>
            </div>
          </div>
        ) : null}
        <EmptyTable
          columns={[
            "Loan ID",
            "Customer",
            "Type",
            "Amount",
            "Duration",
            "Status",
            "Remaining balance",
          ]}
          description="No loan applications are available in this preview."
          title="No loan records to show"
        />
      </section>

      {role === "customer" ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h2 className="dashboard-panel-title">Repayment schedule</h2>
          </div>
          <EmptyTable
            columns={["Due date", "Payment", "Principal", "Interest", "Status"]}
            description="Repayment schedule will appear with your loan details."
            title="No scheduled payments"
          />
        </section>
      ) : null}
    </DashboardShell>
  );
}

export function TransferWorkspace() {
  return (
    <DashboardShell role="customer" activeHref="/customer/transfer">
      <PageHeading
        description="Transfer between your accounts or to another Meridian customer."
        title="Make a transfer"
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Transfer details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Transfers remain unavailable until secure APIs are configured.
              </p>
            </div>
          </div>
          <div className="dashboard-panel-body">
            {/* TODO(API): Validate ownership, PIN, limits, and balances on the server; execute transfers atomically. */}
            <form className="grid gap-4">
              <label className="dashboard-field">
                From account
                <select className="dashboard-input" disabled defaultValue="">
                  <option value="">Connect accounts API</option>
                </select>
              </label>
              <label className="dashboard-field">
                Recipient account
                <input
                  autoComplete="off"
                  className="dashboard-input"
                  disabled
                  placeholder="Account number"
                />
              </label>
              <label className="dashboard-field">
                Amount
                <input
                  className="dashboard-input"
                  disabled
                  inputMode="decimal"
                  placeholder="0.00"
                  type="number"
                />
              </label>
              <label className="dashboard-field">
                Transaction PIN
                <input
                  autoComplete="off"
                  className="dashboard-input"
                  disabled
                  placeholder="Enter your PIN"
                  type="password"
                />
              </label>
              <label className="dashboard-field">
                Description
                <input
                  className="dashboard-input"
                  disabled
                  placeholder="Optional note"
                />
              </label>
              <button className="dashboard-button" disabled type="button">
                Review transfer
              </button>
            </form>
          </div>
        </section>

        <aside className="dashboard-panel h-fit">
          <div className="dashboard-panel-header">
            <h2 className="dashboard-panel-title">Before you transfer</h2>
          </div>
          <div className="dashboard-panel-body space-y-4 text-sm text-muted-foreground">
            <p>Only transfer to a recipient you trust.</p>
            <p>
              Account ownership, available balance, transaction limits, and
              transaction PIN must be validated by the server.
            </p>
            <p>Transfers are not submitted or simulated in this UI preview.</p>
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
  const isAdmin = role === "admin";

  return (
    <DashboardShell role={role} activeHref={activeHref}>
      <PageHeading
        description={
          isAdmin
            ? "Bank-wide controls are available after an authorized settings API is configured."
            : "Manage your profile and security preferences."
        }
        title={isAdmin ? "Bank settings" : "Account settings"}
      />
      {isAdmin ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h2 className="dashboard-panel-title">Transaction controls</h2>
          </div>
          <div className="dashboard-panel-body">
            {/* TODO(API): Load and update bank-wide transaction policies using admin authorization. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="dashboard-field">
                Default transaction limit
                <input
                  className="dashboard-input"
                  disabled
                  placeholder="Connect settings API"
                />
              </label>
              <label className="dashboard-field">
                Approval policy
                <select className="dashboard-input" disabled defaultValue="">
                  <option value="">Connect settings API</option>
                </select>
              </label>
            </div>
            <button
              className="dashboard-button mt-5"
              disabled
              type="button"
            >
              Save settings
            </button>
          </div>
        </section>
      ) : (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h2 className="dashboard-panel-title">Profile and security</h2>
          </div>
          <div className="dashboard-panel-body">
            {/* TODO(API): Load profile and update security settings through authenticated APIs. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="dashboard-field">
                Email address
                <input
                  className="dashboard-input"
                  disabled
                  placeholder="Connect profile API"
                  type="email"
                />
              </label>
              <label className="dashboard-field">
                Two-factor authentication
                <select className="dashboard-input" disabled defaultValue="">
                  <option value="">Connect security API</option>
                </select>
              </label>
            </div>
            <button
              className="dashboard-button mt-5"
              disabled
              type="button"
            >
              Save changes
            </button>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
