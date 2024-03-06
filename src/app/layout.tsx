import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider"; // Ensure this import is correct
// Import or define your authOptions here if needed for session configuration

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zachary Vivian's Personal Website",
  description: "Find more information out about me and leave testimonials!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider session={null}>
          <Header />
          <Sidebar />
          {children}
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
