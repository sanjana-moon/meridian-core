import { WorkspacePage } from "@/components/shared/banking-pages";

export default function StaffCustomersPage() {
  return (
    <WorkspacePage
      actionLabel="Register customer"
      activeHref="/staff/customers"
      columns={["Customer", "Customer ID", "Accounts", "Verification", "Status"]}
      description="Register customers, verify information, and view profiles."
      role="staff"
      title="Customers"
    />
  );
}
