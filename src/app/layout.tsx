import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "ملودی - پلتفرم موزیک",
  description: "بهترین پلتفرم گوش دادن به موزیک ایرانی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-[#121212] text-white font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
