"use client";

import { useAuth } from "@/components/auth-provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Simple verification
    const token = Cookies.get("access_token");
    if (!token && pathname !== "/admin/login") {
      // Force redirect if no token directly (even before state syncs)
      window.location.href = "/admin/login";
    }
  }, [pathname]);

  if (!mounted) {
    return null; // Prevents hydration mismatch
  }

  // If path is login, bypass
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // If we are definitely unauthenticated in state
  if (!isAuthenticated && pathname !== "/admin/login") {
    return null;
  }

  return <>{children}</>;
}
