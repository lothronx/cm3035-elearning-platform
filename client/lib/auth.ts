"use client";

import { useRouter } from "next/navigation";

export async function checkAuthStatus(): Promise<boolean> {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) return false;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: accessToken }),
    });

    if (response.ok) return true;

    if (response.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return false;

      const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (refreshResponse.ok) {
        const { access: newAccessToken } = await refreshResponse.json();
        localStorage.setItem("accessToken", newAccessToken);
        return true;
      }
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return false;
  } catch (error) {
    console.error("Auth check failed:", error);
    return false;
  }
}

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const accessToken = localStorage.getItem("accessToken");

  const headers = new Headers(init?.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  return response;
}

export const handleUnauthorized = (router: ReturnType<typeof useRouter>) => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  router.push("/");
};
