import "./globals.css";
import { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata = {
  title: "DevPilot | Your AI Code Mentor",
  description: "Understand, improve, and document your code effortlessly.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrains.variable} bg-[#0D1117] text-zinc-100 antialiased transition-colors duration-300`}
      >
        {/* App Wrapper */}
        <main className="min-h-screen flex flex-col">


          {/* Main Content Area */}
          <div className="flex flex-1 min-h-[calc(100vh-3.5rem)]">
            {/* Page Content */}
            <section className="flex-1 overflow-y-auto">{children}</section>
          </div>
        </main>
      </body>
    </html>
  );
}
