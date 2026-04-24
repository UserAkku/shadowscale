import { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Auth - ShadowScale",
  robots: {
    index: false,
    follow: false,
  }
};

export default function AuthPage() {
  return (
    <div className="flex-grow flex items-center justify-center p-6">
      <AuthForm />
    </div>
  );
}
