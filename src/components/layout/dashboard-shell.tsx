import Link from "next/link";
import { Landmark, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import {
  dashboardRoles,
  type DashboardRole,
} from "@/lib/dashboard-config";

interface DashboardShellProps {
  role: DashboardRole;
  activeHref: string;
  children: ReactNode;
}

export function DashboardShell({
  role,
  activeHref,
  children,
}: DashboardShellProps) {
  const { label, description, navigation } = dashboardRoles[role];

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
            Banking workspace
          </div>
          <p className="mt-2 text-xs leading-5 text-sidebar-foreground/65">
            Authentication and live banking APIs are not connected yet.
          </p>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <span className="dashboard-badge dashboard-badge-neutral">
            UI preview · APIs pending
          </span>
        </header>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
