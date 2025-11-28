'use client';

import React, { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

const INACTIVITY_TIMEOUT = 20 * 60 * 1000;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

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
      router.replace("/admin/login?inactive=true");
    }, INACTIVITY_TIMEOUT);
  }, [pathname, router]);

  useEffect(() => {
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

    const lastHiddenTime = localStorage.getItem("admin-last-hidden-time");
    if (lastHiddenTime) {
      const timeAway = Date.now() - parseInt(lastHiddenTime, 10);
      if (timeAway >= INACTIVITY_TIMEOUT) {
        localStorage.removeItem("admin-auth");
        localStorage.removeItem("admin-last-hidden-time");
        router.replace("/admin/login?inactive=true");
        return;
      } else {
        localStorage.removeItem("admin-last-hidden-time");
      }
    }

    resetInactivityTimer();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem("admin-last-hidden-time", Date.now().toString());
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      } else if (document.visibilityState === 'visible') {
        const hiddenTime = localStorage.getItem("admin-last-hidden-time");
        if (hiddenTime) {
          const timeAway = Date.now() - parseInt(hiddenTime, 10);
          if (timeAway >= INACTIVITY_TIMEOUT) {
            // User was away for 20+ minutes, log them out
            localStorage.removeItem("admin-auth");
            localStorage.removeItem("admin-last-hidden-time");
            router.replace("/admin/login?inactive=true");
            return;
          } else {
            localStorage.removeItem("admin-last-hidden-time");
            resetInactivityTimer();
          }
        } else {
          resetInactivityTimer();
        }
      }
    };

    const handleBeforeUnload = () => {
      localStorage.setItem("admin-last-hidden-time", Date.now().toString());
    };

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'focus',
    ];

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    events.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, true);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      events.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer, true);
      });
    };
  }, [pathname, router, resetInactivityTimer]);

  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
