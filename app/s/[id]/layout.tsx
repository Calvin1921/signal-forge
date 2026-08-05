import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import "./share.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SignalForge — Shared Strategy",
  description: "A visually auditable trading strategy, shared.",
};

export default function ShareLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${fraunces.variable} editorial ed-grain`}>{children}</div>
  );
}
