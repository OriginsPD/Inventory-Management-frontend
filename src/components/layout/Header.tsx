'use client';

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const Header = () => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <header className="bg-white border-b p-4 shadow-sm flex justify-between items-center h-16 w-full">
      <h2 className="text-xl font-semibold text-gray-800">Inventory Management System</h2>
      <div className="flex items-center space-x-4">
        {isPending ? (
          <span className="text-sm text-gray-600">Loading...</span>
        ) : session ? (
          <>
            <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">{session.user.name}</span>
                <span className="text-xs text-gray-500">{(session.user as any).role}</span>
            </div>
            <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-sm"
            >
              Logout
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
};

export default Header;
