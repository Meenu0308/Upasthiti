import { Link, useNavigate } from "@tanstack/react-router";
import { Activity, BookOpenCheck, LogOut, Stethoscope } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, useAuth } from "@/hooks/useAuth";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, roles } = useAuth();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <Stethoscope className="h-5 w-5" aria-hidden />
            <span className="font-display text-lg font-semibold tracking-tight">Upasthiti</span>
          </Link>

          <nav className="ml-4 flex items-center gap-1">
            <Link
              to="/dashboard"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
            >
              <span className="flex items-center gap-1.5">
                <Activity className="h-4 w-4" aria-hidden />
                Attendance
              </span>
            </Link>
            <Link
              to="/mediwiki"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
            >
              <span className="flex items-center gap-1.5">
                <BookOpenCheck className="h-4 w-4" aria-hidden />
                MediWiki
              </span>
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground">
                {roles.length ? roles.map((r) => ROLE_LABELS[r]).join(", ") : "No role assigned"}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
