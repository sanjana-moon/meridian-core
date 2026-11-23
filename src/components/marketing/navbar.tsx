import { ArrowRight, Landmark } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="dashboard-topbar sticky top-0 z-10">
      <Link className="dashboard-brand mb-0 text-foreground" href="/">
        <span className="dashboard-brand-mark">
          <Landmark aria-hidden="true" size={21} />
        </span>
        Meridian Core
      </Link>
      <nav aria-label="Main navigation" className="flex items-center gap-3">
        <Link
          className="dashboard-button-secondary hidden sm:inline-flex"
          href="/features/secure-transfers"
        >
          Features
        </Link>
        <Link className="dashboard-button-secondary" href="/login">
          Sign in
        </Link>
        <Link className="dashboard-button" href="/register">
          Get started
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </nav>
    </header>
  );
}
