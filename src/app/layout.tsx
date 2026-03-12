import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "WhatsApp CRM SaaS",
  description:
    "A WhatsApp-based CRM SaaS for managing customer conversations, leads, and automation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 font-sans">
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
