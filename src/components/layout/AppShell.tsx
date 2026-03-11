'use client';

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import { authClient } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isPublicPage = pathname === "/";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isPending) {
        if (!session && !isAuthPage && !isPublicPage) {
            router.push("/login");
        } else if (session && isPublicPage) {
            router.push("/dashboard");
        }
    }
  }, [session, isPending, isAuthPage, isPublicPage, router, mounted]);

  if (!mounted || (isPending && !isAuthPage)) {
    return (
      <div className="flex min-h-screen">
        {/* Sidebar Skeleton */}
        <div className="w-64 border-r border-border p-6 space-y-8 hidden md:block">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 bg-muted animate-pulse rounded-lg" />
            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 w-full bg-muted/50 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>

        {/* Main Area Skeleton */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header Skeleton */}
          <div className="h-16 border-b border-border flex items-center justify-between px-6">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
              <div className="w-24 h-8 bg-muted animate-pulse rounded-lg" />
            </div>
          </div>

          {/* Content Skeleton */}
          <main className="flex-1 p-6 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-3">
                <div className="h-10 w-[250px] bg-muted animate-pulse rounded-lg" />
                <div className="h-4 w-[400px] bg-muted animate-pulse rounded" />
              </div>
              <div className="h-10 w-[150px] bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 w-full bg-muted/30 animate-pulse rounded-2xl" />
              ))}
            </div>
            <div className="h-[400px] w-full bg-muted/20 animate-pulse rounded-3xl" />
          </main>
        </div>
      </div>
    );
  }

  if (isAuthPage || isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
        <GlobalErrorBoundary>
          <Sidebar />
          <div className="flex-1 ml-64 flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 p-6 overflow-y-auto">
                  {children}
              </main>
          </div>
        </GlobalErrorBoundary>
    </div>
  );
}




