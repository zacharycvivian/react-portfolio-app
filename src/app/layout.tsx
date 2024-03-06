import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/app/page";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../auth";
import Login from "./Login";
import SessionProvider from "@/components/SessionProvider";
import { Providers } from "./providers.jsx";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zachary Vivian's Personal Website",
  description: "Find more information out about me and leave testimonials!",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <Header />
          <Sidebar />
          {children}
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
