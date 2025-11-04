import "./globals.css";
import { ReactNode } from "react";


export const metadata = {
  title: "DevPilot Dashboard",
  description: "Chat with your codebase",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-zinc-950 text-zinc-100">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
