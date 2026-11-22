import { WorkspacePage } from "@/components/shared/banking-pages";

export default function AdminAccountsPage() {
  return (
    <WorkspacePage
      actionLabel="Create account"
      activeHref="/admin/accounts"
      columns={[
        "Account number",
        "Customer",
        "Type",
        "Balance",
        "Status",
        "Transaction limit",
      ]}
      description="Manage savings, current, and business accounts and their limits."
      controls={[
        "Activate",
        "Deactivate",
        "Freeze",
        "Unfreeze",
        "Block",
        "Set transaction limit",
      ]}
      role="admin"
      title="Accounts"
    />
  );
}
