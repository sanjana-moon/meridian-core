import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  CreditCard,
  FileClock,
  HandCoins,
  House,
  Settings,
  Users,
} from "lucide-react";

export type DashboardRole = "admin" | "staff" | "customer";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const dashboardRoles: Record<
  DashboardRole,
  { label: string; description: string; navigation: DashboardNavItem[] }
> = {
  admin: {
    label: "Administrator",
    description: "Bank-wide oversight and approvals",
    navigation: [
      { label: "Dashboard", href: "/admin/dashboard", icon: House },
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Accounts", href: "/admin/accounts", icon: CreditCard },
      { label: "Loans", href: "/admin/loans", icon: HandCoins },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
  staff: {
    label: "Bank staff",
    description: "Customer service and review queue",
    navigation: [
      { label: "Dashboard", href: "/staff/dashboard", icon: House },
      { label: "Customers", href: "/staff/customers", icon: Users },
      { label: "Transactions", href: "/staff/transactions", icon: ArrowLeftRight },
      { label: "Loans", href: "/staff/loans", icon: HandCoins },
    ],
  },
  customer: {
    label: "Customer",
    description: "Your accounts and activity",
    navigation: [
      { label: "Dashboard", href: "/customer/dashboard", icon: House },
      { label: "Accounts", href: "/customer/accounts", icon: CreditCard },
      { label: "Transfer", href: "/customer/transfer", icon: ArrowLeftRight },
      { label: "Transactions", href: "/customer/transactions", icon: FileClock },
      { label: "Loans", href: "/customer/loans", icon: HandCoins },
      { label: "Settings", href: "/customer/settings", icon: Settings },
    ],
  },
};

export const roleDashboardContent = {
  admin: {
    title: "Bank overview",
    description: "A live view of customers, accounts, activity, and lending.",
    metrics: [
      "Total customers",
      "Total accounts",
      "Bank balance",
      "Deposits",
      "Withdrawals",
      "Transactions",
      "Pending loans",
    ],
    charts: [
      "Monthly transaction volume",
      "Deposits vs. withdrawals",
      "Account distribution",
      "Loan approval statistics",
      "Monthly banking activity",
    ],
  },
  staff: {
    title: "Staff overview",
    description: "Review requests and keep customer operations moving.",
    metrics: ["Customers", "Transactions today", "Pending requests", "Loans to review"],
    charts: ["Transaction activity", "Deposit and withdrawal requests"],
  },
  customer: {
    title: "Welcome back",
    description: "Your accounts, transactions, and loans in one place.",
    metrics: ["Total balance", "Deposits", "Withdrawals", "Active loans"],
    charts: ["Monthly spending", "Monthly deposits", "Transaction distribution"],
  },
} satisfies Record<
  DashboardRole,
  { title: string; description: string; metrics: string[]; charts: string[] }
>;
