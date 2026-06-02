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

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-fira", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.zacharycvivian.com"),
  title: "Home - Zachary Vivian's Portfolio Website",
  description:
    "On this website, you're able to learn more about Zach Vivian's experience, reach out to him, view his gallery, and even leave a testimonial if you've worked with him in the past!",
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
            {/* SVG filter for liquid glass refraction distortion */}
            <svg style={{position:'absolute',width:0,height:0,overflow:'hidden'}} aria-hidden="true">
              <defs>
                <filter id="glass-distort" x="-15%" y="-15%" width="130%" height="130%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.022 0.022" numOctaves="3" seed="5" result="noise"/>
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G"/>
                </filter>
              </defs>
            </svg>
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
