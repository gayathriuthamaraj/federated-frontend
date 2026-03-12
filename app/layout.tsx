import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalSidebar from "./components/ConditionalSidebar";
import PageTransition from "./components/PageTransition";
import { AuthProvider } from "./context/AuthContext";
import { CacheProvider } from "./context/CacheContext";
import { CloseFriendsProvider } from "./context/CloseFriendsContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Gotham — Federated Social Network",
  description: "A decentralized, federated social network built for communities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
        style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)", margin: 0 }}
      >
        <AuthProvider>
          <CacheProvider>
            <CloseFriendsProvider>
              {/* ConditionalSidebar returns null on /login, /register, /recover, /profile/setup */}
              <div className="flex h-screen overflow-hidden">
                <ConditionalSidebar />
                <main className="flex-1 overflow-y-auto relative h-full">
                  <PageTransition>
                    {children}
                  </PageTransition>
                </main>
              </div>
            </CloseFriendsProvider>
          </CacheProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
