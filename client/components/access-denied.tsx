import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";

interface AccessDeniedProps {
  message?: string;
  redirectPath?: string;
  redirectLabel?: string;
}

export function AccessDenied({
  message = "You do not have permission to view this page.",
  redirectPath = "/dashboard",
  redirectLabel = "Return to Dashboard",
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 flex flex-col items-center justify-center">
        <div className="bg-background-light dark:bg-slate-900/20 p-8 rounded-lg max-w-md w-full text-center">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-destructive dark:text-red-400">
            Access Denied
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
          <Button
            onClick={() => router.push(redirectPath)}
            className="flex items-center justify-center mx-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {redirectLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
