import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "תקציב הבית",
  description: "ניהול הוצאות משותף - מאור ואנאל",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
