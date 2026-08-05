"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Plus, Menu, X } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { IconButton } from "@/components/ui/IconButton";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/strategy/btc-mean-rev", label: "Strategy" },
  { href: "/presets", label: "Presets" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 glass-heavy">
      <div className="flex items-center justify-between px-6 py-2.5">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 group focus-ring rounded-[var(--radius-sm)]">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)]"
            style={{ background: "var(--gradient-cta)" }}
          >
            <Zap size={18} className="text-primary" />
          </div>
          <span className="text-headline text-primary tracking-tight">
            SignalForge
          </span>
        </Link>

        {/* Center: Nav links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "px-4 py-2 rounded-[var(--radius-sm)] text-subhead font-medium focus-ring",
                  "transition-fast",
                  active
                    ? "bg-surface-2 text-primary"
                    : "text-secondary hover:text-primary hover:bg-surface-2",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right: New Strategy CTA — hidden on mobile */}
        <div className="hidden md:block">
          <Link href="/strategy/new">
            <GradientButton size="sm">
              <Plus size={16} />
              New Strategy
            </GradientButton>
          </Link>
        </div>

        {/* Mobile: Hamburger button — 44px touch target */}
        <IconButton
          size="lg"
          className="md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </IconButton>
      </div>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 pt-2 flex flex-col gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={[
                  "px-4 py-2.5 rounded-[var(--radius-sm)] text-subhead font-medium min-h-[44px] flex items-center focus-ring",
                  "transition-fast",
                  active
                    ? "bg-surface-2 text-primary"
                    : "text-secondary hover:text-primary hover:bg-surface-2",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
          <Link href="/strategy/new" onClick={() => setMobileOpen(false)} className="mt-1">
            <GradientButton size="sm" className="w-full">
              <Plus size={16} />
              New Strategy
            </GradientButton>
          </Link>
        </div>
      )}
    </nav>
  );
}
