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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isPending && !session && !isAuthPage) {
      router.push("/login");
    }
  }, [session, isPending, isAuthPage, router, mounted]);

  if (!mounted || (isPending && !isAuthPage)) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg font-medium text-gray-600">Loading...</div>
        </div>
    );
  }

  if (isAuthPage) {
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



