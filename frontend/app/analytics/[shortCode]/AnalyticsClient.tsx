"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";

const AnalyticsCharts = dynamic(() => import("@/components/AnalyticsCharts"), {
  loading: () => <div className="h-96 bg-[#e8e8e8] animate-pulse border-heavy" />,
  ssr: false
});

export default function AnalyticsClient({ shortCode }: { shortCode: string }) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
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

    const fetchData = async () => {
      try {
        const res = await api.getAnalytics(shortCode);
        if (res.success) setData(res.data);
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
      }
    };
    fetchData();
  }, [shortCode, mounted, isLoggedIn, router]);

  if (!mounted || !isLoggedIn) return null;

  if (error) {
    return (
      <div className="flex-grow flex items-center justify-center p-6 text-center">
        <div className="space-y-4 border-heavy bg-white p-12">
          <h1 className="text-4xl font-black uppercase tracking-widest text-red-600">Error</h1>
          <p className="font-bold uppercase">{error}</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-grow p-6 md:p-12 max-w-6xl mx-auto w-full animate-pulse">
        <div className="h-12 w-64 bg-[#d0d0d0] border-heavy mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-[#d0d0d0] border-heavy" />)}
        </div>
      </div>
    );
  }

  const shortUrl = `${window.location.origin}/r/${shortCode}`;

  return (
    <div className="flex-grow p-6 md:p-12 max-w-6xl mx-auto w-full space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-heavy pb-6">
        <div className="min-w-0 w-full">
          <Link href="/dashboard" className="text-sm font-bold uppercase hover:underline flex items-center gap-2 mb-4 w-max">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2 break-all">Analytics</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-lg md:text-xl font-bold hover:underline break-all">
              {shortUrl}
            </a>
            <CopyButton text={shortUrl} variant="outline" className="h-8 px-2 py-1 text-xs flex-shrink-0" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-mono">{data.totalClicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Today's Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-mono">{data.todayClicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Top Country</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black truncate uppercase">
              {data.topCountries?.[0]?.country || "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Top Device</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black truncate uppercase">
              {data.devices?.[0]?.device || "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      <AnalyticsCharts data={data} />
    </div>
  );
}

