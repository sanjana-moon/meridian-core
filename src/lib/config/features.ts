import {
  ShieldCheck,
  Banknote,
  PiggyBank,
  Briefcase,
  BarChart3,
  Lock,
} from "lucide-react";

export interface MarketingFeature {
  slug: string;
  title: string;
  shortDescription: string;
  icon: typeof ShieldCheck;
  accent: "navy" | "teal" | "gold";
  longDescription: string;
  highlights: string[];
}

export const marketingFeatures: MarketingFeature[] = [
  {
    slug: "secure-transfers",
    title: "Secure Transfers",
    shortDescription:
      "Move funds with cryptographic transaction PINs and atomic dual-ledger updates.",
    icon: ShieldCheck,
    accent: "navy",
    longDescription:
      "Every transfer is validated against available balance, daily limits, and account status — then committed atomically so money never leaves one account without arriving in the other. Transaction PINs are hashed with Argon2 and verified server-side.",
    highlights: [
      "Atomic debit + credit in a single database transaction",
      "Argon2-hashed transaction PIN verification",
      "Configurable daily and per-transaction limits",
      "Unique reference ID for every transfer (MC-YYYYMMDD-XXXXXX)",
    ],
  },
  {
    slug: "instant-loans",
    title: "Instant Loans",
    shortDescription:
      "Apply, get reviewed, and receive disbursement — all within one workflow.",
    icon: Banknote,
    accent: "teal",
    longDescription:
      "Loan applications flow through Staff review to Admin approval. Approved loans are disbursed as recorded banking transactions, and repayment schedules are generated automatically with a full audit trail.",
    highlights: [
      "Multi-stage review: Pending → Under Review → Approved",
      "Disbursement recorded as a first-class transaction",
      "Auto-generated repayment schedule",
      "Full repayment history with remaining balance tracking",
    ],
  },
  {
    slug: "savings-accounts",
    title: "Savings Accounts",
    shortDescription:
      "Grow your balance with structured deposits and real-time interest tracking.",
    icon: PiggyBank,
    accent: "gold",
    longDescription:
      "Multiple account types — Savings, Current, and Business — each with their own balance, status, and statement history. Deposit requests are reviewed by staff for a realistic approval workflow.",
    highlights: [
      "Three account types under one customer profile",
      "Deposit and withdrawal approval workflow",
      "Downloadable account statements",
      "Real-time balance and transaction history",
    ],
  },
  {
    slug: "business-banking",
    title: "Business Banking",
    shortDescription:
      "Dedicated business accounts with higher limits and staff-assisted onboarding.",
    icon: Briefcase,
    accent: "navy",
    longDescription:
      "Business accounts are onboarded through Staff verification, giving you access to elevated transaction limits and dedicated account management from day one.",
    highlights: [
      "Staff-verified business onboarding",
      "Higher transaction and daily limits",
      "Multi-user access patterns supported",
      "Dedicated account support workflow",
    ],
  },
  {
    slug: "analytics-insights",
    title: "Analytics & Insights",
    shortDescription:
      "Visualize spending, deposits, and loan activity with real application data.",
    icon: BarChart3,
    accent: "teal",
    longDescription:
      "Every chart on Meridian Core is fed by live application data — monthly transaction volume, deposit-versus-withdrawal comparisons, account distribution, and loan approval statistics. No hardcoded numbers.",
    highlights: [
      "Monthly transaction volume trends",
      "Deposit vs withdrawal breakdown",
      "Account distribution donut",
      "Loan approval statistics over time",
    ],
  },
  {
    slug: "two-factor-security",
    title: "Two-Factor Security",
    shortDescription:
      "Protect sensitive actions with authenticator-app TOTP verification.",
    icon: Lock,
    accent: "gold",
    longDescription:
      "TOTP-based two-factor authentication can be enabled per user for sensitive actions like transfers and PIN changes. Recovery codes are issued once and stored hashed — never in plaintext.",
    highlights: [
      "TOTP via Google Authenticator or Authy",
      "Single-use recovery codes",
      "Encrypted secret storage",
      "Optional per user — enabled from settings",
    ],
  },
];

export function getFeatureBySlug(slug: string) {
  return marketingFeatures.find((f) => f.slug === slug);
}