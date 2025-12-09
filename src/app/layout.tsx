import type { Metadata } from "next";
import { Manrope, Fira_Code } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../auth";
import SessionProvider from "@/components/SessionProvider";
import { Providers } from "./providers.jsx";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import FirebaseAuthProvider from "@/components/FirebaseAuthProvider";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-fira" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.zacharycvivian.com"),
  title: "Home - Zachary Vivian's Portfolio Website",
  description:
    "On this website, you're able to learn more about Zach Vivian's experience, reach out to him, view his blogs, and even leave a testimonial if you've worked with him in the past!",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${firaCode.variable}`}>
        <SessionProvider session={session}>
          <FirebaseAuthProvider>
          <Providers>
            <Header />
            <Sidebar />
            {children}
            <SpeedInsights />
            <Analytics />
            <Footer />
          </Providers>
          </FirebaseAuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
