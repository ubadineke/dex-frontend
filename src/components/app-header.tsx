"use client";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import { ThemeSelect } from "@/components/theme-select";
import { ClusterUiSelect } from "./cluster/cluster-ui";
import { WalletButton } from "@/components/solana/solana-provider";

export function AppHeader({
  links = [],
}: {
  links: { label: string; path: string }[];
}) {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  function isActive(path: string) {
    return path === "/" ? pathname === "/" : pathname.startsWith(path);
  }

  const isOnTradePage = pathname === "/trade" || pathname === "/";

  return (
    <header className="relative z-50 px-4 py-3 bg-card border-b border-border">
      <div className="mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            href="/trade"
          >
            <img src="/logo.png" alt="Moxie" className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight gradient-moxie-text">
              Moxie
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center">
            <ul className="flex gap-1">
              {links.map(({ label, path }) => (
                <li key={path}>
                  <Link
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(path)
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                    href={path}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setShowMenu(!showMenu)}
        >
          {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ClusterUiSelect />
          
          {/* Account Button - Prominent on Trade page */}
          {isOnTradePage && (
            <Link href="/account">
              <Button variant="outline" className="h-9 gap-2">
                <User className="h-4 w-4" />
                Account
              </Button>
            </Link>
          )}
          
          <WalletButton />
          <ThemeSelect />
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden fixed inset-x-0 top-[61px] bottom-0 bg-background/95 backdrop-blur-sm">
            <div className="flex flex-col p-4 gap-4 border-t border-border">
              <ul className="flex flex-col gap-2">
                {links.map(({ label, path }) => (
                  <li key={path}>
                    <Link
                      className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                        isActive(path)
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                      href={path}
                      onClick={() => setShowMenu(false)}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                {/* Account Button in Mobile Menu */}
                <Link href="/account" onClick={() => setShowMenu(false)} className="w-full">
                  <Button variant="outline" className="w-full h-10 gap-2">
                    <User className="h-4 w-4" />
                    Account
                  </Button>
                </Link>
                <div className="w-full [&_.wallet-adapter-button-trigger]:w-full [&_.wallet-adapter-button-trigger]:h-10">
                  <WalletButton />
                </div>
                <div className="flex items-center gap-3 w-full">
                  <ClusterUiSelect className="flex-1" />
                  <ThemeSelect />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
