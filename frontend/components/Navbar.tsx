"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function Navbar() {
  const { isLoggedIn, logout } = useAuth();

  return (
    <nav className="border-b-heavy bg-[#e8e8e8] px-4 md:px-6 py-4 flex flex-wrap justify-between items-center gap-4 sticky top-0 z-50">
      <Link href="/" className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
        ShadowScale
      </Link>
      <div className="flex gap-4 md:gap-6 items-center">
        {isLoggedIn ? (
          <>
            <Link href="/dashboard" className="text-xs md:text-sm font-bold uppercase hover:bg-black hover:text-[#e8e8e8] px-2 py-1 transition-colors">
              Dashboard
            </Link>
            <button onClick={logout} className="text-xs md:text-sm font-bold uppercase hover:bg-black hover:text-[#e8e8e8] px-2 py-1 transition-colors">
              Logout
            </button>
          </>
        ) : (
          <Link href="/auth" className="text-xs md:text-sm font-bold uppercase border-heavy px-3 md:px-4 py-2 hover:bg-black hover:text-[#e8e8e8] transition-colors whitespace-nowrap">
            Login / Sign Up
          </Link>
        )}
      </div>
    </nav>
  );
}
