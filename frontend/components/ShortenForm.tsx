"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { urlSchema } from "@/lib/validations";
import { api } from "@/lib/api";
import { addClaim } from "@/lib/claims";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import URLResultCard from "./URLResultCard";
import { useAuth } from "./AuthProvider";
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function ShortenForm() {
  const [result, setResult] = useState<any>(null);
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: "" },
  });

  const onSubmit = async (data: { url: string }) => {
    try {
      const response = await api.shortenURL(data.url);
      setResult(response);
      reset();
      
      if (!isLoggedIn && response.claimToken) {
        addClaim({
          claimToken: response.claimToken,
          shortCode: response.shortCode,
          originalUrl: response.originalUrl,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      toast(err.message || "Failed to shorten URL");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="relative">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <Input
              {...register("url")}
              placeholder="PASTE YOUR LONG URL HERE..."
              className={`h-16 text-lg md:text-xl font-bold uppercase bg-white/50 backdrop-blur-sm ${errors.url ? 'border-red-500 border-2' : ''}`}
            />
            {errors.url && <p className="text-red-500 text-xs font-bold mt-2 uppercase">{errors.url.message as string}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="h-16 text-lg px-8 flex-shrink-0 gap-2">
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Shorten"}
            {!isSubmitting && <ArrowRight className="w-6 h-6" />}
          </Button>
        </div>
      </form>
      
      {result && <URLResultCard result={result} />}
    </div>
  );
}
