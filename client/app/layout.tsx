import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { UserProvider } from "@/contexts/user-context";
import "./globals.css";

// Configure Geist Sans font
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Configure Geist Mono font
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata for the application
export const metadata: Metadata = {
  title: "E-Learning Platform",
  description: "A modern e-learning platform for students and teachers",
};

/**
 * RootLayout component - Provides the base layout for all pages
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The page content
 * @returns {JSX.Element} The base layout structure
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Wrap all children in UserProvider for global user context */}
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
