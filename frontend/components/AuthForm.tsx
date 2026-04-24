"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authSchema } from "@/lib/validations";
import { api } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: any) => {
    try {
      const response = isLogin
        ? await api.login(data.email, data.password)
        : await api.signup(data.email, data.password);

      if (response.success && response.token) {
        login(response.token, response.user);
        toast("Successfully authenticated.");
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast(err.message || "Authentication failed");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader className="flex flex-row space-y-0 space-x-0 border-b-heavy p-0 bg-[#d0d0d0]">
        <button
          onClick={() => { setIsLogin(true); reset(); }}
          className={`flex-1 p-4 font-black uppercase tracking-tight text-center border-r-heavy ${isLogin ? 'bg-[#e8e8e8] border-b-2 border-b-[#e8e8e8] -mb-[2px] z-10' : 'hover:bg-[#e0e0e0]'}`}
        >
          Login
        </button>
        <button
          onClick={() => { setIsLogin(false); reset(); }}
          className={`flex-1 p-4 font-black uppercase tracking-tight text-center ${!isLogin ? 'bg-[#e8e8e8] border-b-2 border-b-[#e8e8e8] -mb-[2px] z-10' : 'hover:bg-[#e0e0e0]'}`}
        >
          Sign Up
        </button>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest">Email</label>
            <Input
              {...register("email")}
              type="email"
              placeholder="YOUR@EMAIL.COM"
              className={errors.email ? 'border-red-500 border-2' : ''}
            />
            {errors.email && <p className="text-red-500 text-xs font-bold uppercase">{errors.email.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest">Password</label>
            <Input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className={errors.password ? 'border-red-500 border-2' : ''}
            />
            {errors.password && <p className="text-red-500 text-xs font-bold uppercase">{errors.password.message as string}</p>}
          </div>
          <Button type="submit" className="w-full h-14" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (isLogin ? "Login" : "Create Account")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
