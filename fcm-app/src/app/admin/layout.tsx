'use client';

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/admin/login") {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const isLoggedIn = localStorage.getItem("admin-auth") === "true";

    if (!isLoggedIn) {
      router.replace("/admin/login");
    }
  }, [pathname, router]);

  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
