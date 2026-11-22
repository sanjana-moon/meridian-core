import { WorkspacePage } from "@/components/shared/banking-pages";

export default function CustomerAccountsPage() {
  return (
    <WorkspacePage
      activeHref="/customer/accounts"
      columns={["Account number", "Type", "Balance", "Status"]}
      description="Review your savings, current, and business accounts."
      includeExport
      includeFilters={false}
      role="customer"
      title="Your accounts"
    />
  );
}
