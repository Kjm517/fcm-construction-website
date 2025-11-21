'use client';

import React, { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  const resetInactivityTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (pathname === "/admin/login") {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const isLoggedIn = localStorage.getItem("admin-auth") === "true";
    if (!isLoggedIn) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      localStorage.removeItem("admin-auth");
      router.replace("/admin/login");
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    if (pathname === "/admin/login") {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const isLoggedIn = localStorage.getItem("admin-auth") === "true";

    if (!isLoggedIn) {
      router.replace("/admin/login");
      return;
    }

    resetInactivityTimer();

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, true);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer, true);
      });
    };
  }, [pathname, router]);

  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
