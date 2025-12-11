"use client";

import { Github, ExternalLink } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Description */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Moxie" className="h-6 w-6" />
            <span className="text-sm text-muted-foreground">
              <span className="gradient-moxie-text font-medium">Moxie</span>
              {" "}- Prediction Market Perpetuals on Solana
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <a
              href="https://docs.solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Docs
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
