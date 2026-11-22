import { WorkspacePage } from "@/components/shared/banking-pages";

export default function AdminCustomersPage() {
  return (
    <WorkspacePage
      actionLabel="Add customer"
      activeHref="/admin/customers"
      columns={["Customer", "Customer ID", "Accounts", "Status", "Joined"]}
      description="Search customer profiles and review account activity."
      controls={[
        "View details",
        "Transaction history",
        "Activate",
        "Deactivate",
        "Block",
      ]}
      role="admin"
      title="Customers"
    />
  );
}
