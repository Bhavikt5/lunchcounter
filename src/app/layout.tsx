import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lunch Counter | Internal Lunch Booking & Billing System",
  description: "Automated lunch bookings, 11 AM vendor count generation, and weekly billing system for employees.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${poppins.variable}`}>
      <body className="h-full antialiased bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
