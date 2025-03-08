"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { LoginForm } from "@/components/welcome/login-form";
import { RegisterForm } from "@/components/welcome/register-form";
import { checkAuthStatus } from "@/lib/auth";

export default function WelcomePage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await checkAuthStatus();
      if (isAuthenticated) {
        router.push("/dashboard");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Toaster position="bottom-right" />

      {/* Welcome section */}
      <div className="flex flex-1 items-center justify-center bg-primary p-8 text-primary-foreground">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome to <span className="text-secondary">E-Learning</span>
          </h1>
          <p className="text-xl">
            Your gateway to knowledge and skills. Join our platform to access high-quality courses
            and connect with expert educators.
          </p>
        </div>
      </div>

      {/* Auth section */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {isLogin ? (
            <>
              <LoginForm />
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setIsLogin(false)}
                  className="underline underline-offset-4 hover:text-primary">
                  Register
                </button>
              </p>
            </>
          ) : (
            <>
              <RegisterForm />
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => setIsLogin(true)}
                  className="underline underline-offset-4 hover:text-primary">
                  Login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
