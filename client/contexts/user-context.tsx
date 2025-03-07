"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchWithAuth, checkAuthStatus } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface UserContextType {
  userRole: string;
  firstName: string;
  lastName: string;
  updateUserData: (data: Record<string, string>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [userData, setUserData] = useState({
    userRole: "",
    firstName: "",
    lastName: "",
  });

  const updateUserData = (data: Record<string, string>) => {
    setUserData({
      userRole: data.role,
      firstName: data.first_name,
      lastName: data.last_name,
    });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const isAuthenticated = await checkAuthStatus();
        if (!isAuthenticated) {
          if (window.location.pathname !== "/") {
            router.push("/");
          }
          return;
        }

        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/`);
        const data = await response.json();
        updateUserData(data);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        if (window.location.pathname !== "/") {
          router.push("/");
        }
      }
    };

    fetchUserData();
  }, []);

  return (
    <UserContext.Provider
      value={{
        ...userData,
        updateUserData,
      }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
