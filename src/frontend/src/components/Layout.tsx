import { Link } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const year = new Date().getFullYear();
  const hostname =
    typeof window === "undefined" ? "" : window.location.hostname;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar text-sidebar-foreground shadow-subtle">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            data-ocid="nav.home_link"
            className="flex min-w-0 items-center gap-2.5 rounded-md outline-none transition-smooth focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <ClipboardCheck className="size-5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-mono text-[0.625rem] font-medium uppercase tracking-[0.2em] text-sidebar-foreground/60">
                Laporan Inspeksi
              </span>
              <span className="truncate font-display text-base font-bold leading-tight">
                Bengkel Cek Kendaraan
              </span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-background">{children}</main>

      <footer className="border-t border-border bg-secondary">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
          <p className="text-center text-xs text-muted-foreground">
            © {year}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline underline-offset-4 transition-smooth hover:text-primary"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
