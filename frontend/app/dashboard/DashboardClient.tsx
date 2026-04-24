"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getClaims, removeClaim } from "@/lib/claims";
import { useToast } from "@/components/ToastProvider";
import ShortenForm from "@/components/ShortenForm";
import URLTable from "@/components/URLTable";

export default function DashboardClient() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [urls, setUrls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!isLoggedIn) {
      router.push("/auth");
      return;
    }

    const initDashboard = async () => {
      const claims = getClaims();
      let claimedCount = 0;
      if (claims.length > 0) {
        for (const claim of claims) {
          try {
            await api.claimURL(claim.claimToken);
            removeClaim(claim.claimToken);
            claimedCount++;
          } catch (err) {
            console.error("Failed to claim URL", err);
          }
        }
        if (claimedCount > 0) {
          toast(`${claimedCount} links added to your account.`);
        }
      }

      fetchUrls();
    };

    initDashboard();
  }, [isLoggedIn, router, mounted, toast]);

  const fetchUrls = async () => {
    try {
      setLoading(true);
      const res = await api.getMyURLs();
      if (res.success) {
        setUrls(res.urls);
      }
    } catch (err: any) {
      toast(err.message || "Failed to load URLs");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isLoggedIn) return null;

  return (
    <div className="flex-grow p-6 md:p-12 max-w-6xl mx-auto w-full space-y-12">
      <div>
        <h1 className="text-4xl font-black uppercase tracking-tight mb-8">Dashboard</h1>
        <ShortenForm />
      </div>

      <div>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-2xl font-black uppercase">My Links</h2>
          <div className="text-sm font-bold uppercase text-gray-500">Total: {urls.length}</div>
        </div>
        <URLTable urls={urls} loading={loading} onRefresh={fetchUrls} />
      </div>
    </div>
  );
}
