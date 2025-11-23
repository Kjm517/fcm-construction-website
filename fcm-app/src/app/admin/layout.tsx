'use client';

import React, { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  const resetInactivityTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Public auth pages that don't require authentication
    const publicAuthPages = ["/admin/login", "/admin/forgot-password"];
    if (publicAuthPages.includes(pathname)) {
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
  }, [pathname, router]);

  useEffect(() => {
    // Public auth pages that don't require authentication
    const publicAuthPages = ["/admin/login", "/admin/forgot-password"];
    if (publicAuthPages.includes(pathname)) {
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

    // Initialize the timer
    resetInactivityTimer();

    // Listen for user activity events
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'focus',
      'visibilitychange'
    ];
    
    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetInactivityTimer();
      }
    };

    events.forEach((event) => {
      if (event === 'visibilitychange') {
        document.addEventListener(event, handleVisibilityChange);
      } else {
        window.addEventListener(event, resetInactivityTimer, true);
      }
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        if (event === 'visibilitychange') {
          document.removeEventListener(event, handleVisibilityChange);
        } else {
          window.removeEventListener(event, resetInactivityTimer, true);
        }
      });
    };
  }, [pathname, router, resetInactivityTimer]);

  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
