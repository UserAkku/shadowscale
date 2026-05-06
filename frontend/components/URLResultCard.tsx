"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function URLResultCard({ result }: { result: any }) {
  const { isLoggedIn } = useAuth();
  const displayUrl = `${window.location.origin}/r/${result.shortCode}`;

  return (
    <Card className="mt-8 animate-in slide-in-from-bottom-5">
      <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6">
        <div className="flex flex-col gap-2 w-full md:w-1/2">
          <div className="text-sm font-bold text-gray-600 truncate uppercase">
            ORIGINAL: {result.originalUrl}
          </div>
          <div className="text-2xl font-black truncate">
            {displayUrl}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <CopyButton text={displayUrl} variant="outline" />
          {isLoggedIn && (
            <Link href={`/analytics/${result.shortCode}`}>
              <Button variant="default">View Analytics</Button>
            </Link>
          )}
        </div>
      </CardContent>
      {!isLoggedIn && (
        <div className="border-t-heavy bg-[#d0d0d0] p-4 flex justify-between items-center flex-col md:flex-row gap-4">
          <p className="text-sm font-bold uppercase text-black">
            Login to save this link to your account permanently.
          </p>
          <Link href="/auth">
            <Button variant="outline" className="h-10 text-xs">Save to Account</Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
