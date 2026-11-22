import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@/components/milestone-two.css";
import "@/components/rooms.css";
import "./design.css";
const ui = localFont({
  src: "./fonts/PlusJakartaSans.ttf",
  variable: "--font-ui",
  display: "swap",
  weight: "200 800",
});
export const metadata: Metadata = {
  title: "Catalyst — Possible, together.",
  description:
    "Turn ideas into collective action. A deterministic feasibility engine for ambitious community projects.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={ui.variable}>{children}</body>
    </html>
  );
}
