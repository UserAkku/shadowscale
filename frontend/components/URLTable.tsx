"use client";

import { api } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";
import Link from "next/link";
import { Button } from "./ui/Button";
import { CopyButton } from "./ui/CopyButton";
import { Trash2, BarChart2, ExternalLink } from "lucide-react";
import { useState } from "react";

export default function URLTable({ urls, loading, onRefresh }: { urls: any[], loading: boolean, onRefresh: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (shortCode: string) => {
    if (!confirm("Are you sure you want to delete this URL?")) return;
    
    try {
      setDeletingId(shortCode);
      await api.deleteURL(shortCode, user?.id);
      toast("URL deleted!");
      onRefresh();
    } catch (err: any) {
      toast(err.message || "Failed to delete URL");
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="border-heavy bg-[#e8e8e8] p-12 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-bold uppercase tracking-widest">Loading Records...</div>
        </div>
      </div>
    );
  }

  if (urls.length === 0) {
    return (
      <div className="border-heavy bg-[#e8e8e8] p-12 text-center">
        <p className="text-lg font-bold uppercase text-gray-600">No URLs found.</p>
      </div>
    );
  }

  return (
    <div className="border-heavy bg-white overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b-heavy bg-[#e8e8e8] text-sm uppercase font-black tracking-widest">
            <th className="p-4 border-r-heavy">Short Link</th>
            <th className="p-4 border-r-heavy">Original URL</th>
            <th className="p-4 border-r-heavy">Clicks</th>
            <th className="p-4 border-r-heavy">Created</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {urls.map((url) => (
            <tr key={url.id} className="border-b-heavy last:border-b-0 hover:bg-gray-50">
              <td className="p-4 border-r-heavy font-bold">
                <a href={`${process.env.NEXT_PUBLIC_API_URL}/r/${url.short_code}`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                  {url.short_code} <ExternalLink className="w-3 h-3" />
                </a>
              </td>
              <td className="p-4 border-r-heavy text-sm truncate max-w-xs" title={url.original_url}>
                {url.original_url}
              </td>
              <td className="p-4 border-r-heavy font-mono font-bold">
                {url.click_count}
              </td>
              <td className="p-4 border-r-heavy text-sm">
                {new Date(url.created_at).toLocaleDateString()}
              </td>
              <td className="p-4 flex gap-2">
                <CopyButton text={`${process.env.NEXT_PUBLIC_API_URL}/r/${url.short_code}`} variant="outline" className="h-8 px-3 py-1 text-xs" />
                <Link href={`/analytics/${url.short_code}`}>
                  <Button variant="default" className="h-8 px-3 py-1 text-xs gap-1">
                    <BarChart2 className="w-3 h-3" /> Stats
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="h-8 px-3 py-1 text-xs text-red-600 hover:text-white hover:bg-red-600 border-red-600"
                  onClick={() => handleDelete(url.short_code)}
                  disabled={deletingId === url.short_code}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
