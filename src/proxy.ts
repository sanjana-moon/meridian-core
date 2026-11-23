import { auth } from "@/auth";
import { NextResponse } from "next/server";

const roleHome = {
  admin: "/admin/dashboard",
  staff: "/staff/dashboard",
  customer: "/customer/dashboard",
} as const;

export default auth((request) => {
  const user = request.auth?.user;
  const path = request.nextUrl.pathname;

  if (!user?.role || !(user.role in roleHome)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const requiredRole = path.startsWith("/admin")
    ? "admin"
    : path.startsWith("/staff")
      ? "staff"
      : "customer";
  const allowed =
    user.role === requiredRole ||
    (requiredRole === "staff" && user.role === "admin");

  if (!allowed) {
    return NextResponse.redirect(new URL(roleHome[user.role], request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/customer/:path*"],
};
