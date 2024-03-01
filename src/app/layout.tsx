import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Home from "@/app/page"
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Login from "./Login";
import SessionProvider from "@/components/SessionProvider";
import { Providers } from './providers.jsx'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zachary Vivian's Site",
  description: "Resume Site",
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
        <Providers>
          <SessionProvider session={session}>
            {!session ? (
              <Login/>
            ): (
              <>
                <Header />
                <Sidebar />
                {children}
              </>
            )}
          </SessionProvider>
        </Providers>
      </body>
    </html>
  );
}
