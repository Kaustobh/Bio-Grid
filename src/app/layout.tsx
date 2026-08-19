"use client";

import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import BiometricProvider from "@/components/BiometricProvider";
import CollapsibleSidebar from "@/components/CollapsibleSidebar";
import AppFooter from "@/components/AppFooter";
// CursorWarp removed – using native cursor for Calm Tech aesthetic
import { useBiometricStore } from "@/store/useBiometricStore";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, user } = useBiometricStore();
  
  return (
    <div 
      className="min-h-screen bg-deep-space w-full"
      style={user ? {
        display: "grid",
        gridTemplateColumns: sidebarCollapsed ? "64px 1fr" : "260px 1fr",
        transition: "grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      } : {
        display: "block"
      }}
    >
      {user && <CollapsibleSidebar />}
      <div className="flex flex-col min-w-0 w-full">
        {children}
        <AppFooter />
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans antialiased">
        <BiometricProvider>
          <LayoutContent>{children}</LayoutContent>
        </BiometricProvider>
        {/* CursorWarp removed – native cursor */}
      </body>
    </html>
  );
}
