"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth, checkAuthStatus } from "@/lib/auth";
import { User, AuthContextType } from "@/types/user-types";

/**
 * Default context value for AuthContext
 */
const defaultAuthContext: AuthContextType = {
  user: null,
  setUser: () => {},
  loading: true,
  refreshUserData: async () => {},
  logout: () => {},
};

/**
 * Context for authentication-related state and functions
 */
export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

/**
 * Provider component for authentication context
 * Handles user authentication, data fetching, and session management
 */
export function AuthProvider({ 
  children,
  onLogout
}: { 
  children: ReactNode;
  onLogout?: () => void;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authCounter, setAuthCounter] = useState(0); // Used to trigger auth checks

  /**
   * Refreshes user data from the server
   * Handles errors and unauthenticated states
   */
  const refreshUserData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const isAuthenticated = await checkAuthStatus();
      if (!isAuthenticated) {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        if (window.location.pathname !== "/") {
          router.push("/");
        }
        setLoading(false);
        return;
      }

      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/`);
      const data = await response.json();

      // Update both state and localStorage
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
    } catch (error) {
      console.error("Error refreshing user data:", error);
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      if (window.location.pathname !== "/") {
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  }, [router]); // Only depend on router to avoid circular dependencies

  /**
   * Handles user logout
   * Clears local storage and updates state
   */
  const logout = useCallback(() => {
    // Clear local storage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    // Update state
    setUser(null);

    // Increment auth counter to trigger a re-check
    setAuthCounter((prev) => prev + 1);

    // Call external logout handler if provided
    if (onLogout) {
      onLogout();
    }

    // Redirect to home
    if (window.location.pathname !== "/") {
      router.push("/");
    }
  }, [router, onLogout]);

  // Listen for storage events (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "accessToken" || event.key === "user") {
        refreshUserData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshUserData]);

  // Initial auth check + auth check triggered by authCounter changes
  useEffect(() => {
    let isMounted = true; // To prevent state updates after unmount

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");

        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (isMounted) {
            setUser(parsedUser);
          }
        } else {
          const isAuthenticated = await checkAuthStatus();
          if (!isAuthenticated) {
            if (isMounted) {
              setUser(null);
              if (window.location.pathname !== "/") {
                router.push("/");
              }
              setLoading(false);
            }
            return;
          }

          // Manually fetch user data instead of using refreshUserData
          // to avoid potential circular dependencies
          try {
            const response = await fetchWithAuth(
              `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/`
            );
            const data = await response.json();

            if (isMounted) {
              setUser(data);
              localStorage.setItem("user", JSON.stringify(data));
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            if (isMounted) {
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        if (isMounted) {
          setUser(null);
          if (window.location.pathname !== "/") {
            router.push("/");
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Cleanup function
    return () => {
      isMounted = false; // Prevent state updates after unmount
    };
  }, [authCounter, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        refreshUserData,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access the authentication context
 * @returns The authentication context
 */
export const useAuth = () => useContext(AuthContext);
