import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, UserX } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Attendance dashboard — Upasthiti" },
      {
        name: "description",
        content: "Live doctor attendance across Primary Health Centres, with flagged and incomplete records.",
      },
      { property: "og:title", content: "Attendance dashboard — Upasthiti" },
      { property: "og:description", content: "Live doctor attendance across Primary Health Centres." },
    ],
  }),
  component: Dashboard,
});

type EventRow = {
  id: string;
  doctor_id: string;
  phc_id: string;
  event_type: string;
  source: string;
  occurred_at: string;
  gps_accuracy_m: number | null;
  status: string;
  flag_reason: string | null;
};

function timeOf(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Dashboard() {
  const { isOfficer, roles, loading: authLoading } = useAuth();
  const [phcFilter, setPhcFilter] = useState("all");

  const phcs = useQuery({
    queryKey: ["phcs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("phcs").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const doctors = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("doctors").select("*").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const events = useQuery({
    queryKey: ["attendance-today"],
    enabled: isOfficer,
    queryFn: async () => {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("attendance_events")
        .select("*")
        .gte("occurred_at", since.toISOString())
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const rows = useMemo(() => {
    const doctorList = doctors.data ?? [];
    const phcList = phcs.data ?? [];
    const eventList = events.data ?? [];

    return doctorList
      .filter((d) => phcFilter === "all" || d.phc_id === phcFilter)
      .map((doctor) => {
        const own = eventList.filter((e) => e.doctor_id === doctor.id);
        const checkIn = own.filter((e) => e.event_type === "in").at(-1);
        const checkOut = own.find((e) => e.event_type === "out");
        const flagged = own.find((e) => e.status === "flagged");
        const incomplete = own.find((e) => e.status === "incomplete");

        let status: "present" | "absent" | "flagged" | "incomplete" = "absent";
        if (flagged) status = "flagged";
        else if (incomplete) status = "incomplete";
        else if (checkIn) status = "present";

        return {
          doctor,
          phcName: phcList.find((p) => p.id === doctor.phc_id)?.name ?? "—",
          checkIn,
          checkOut,
          status,
          note: flagged?.flag_reason ?? incomplete?.flag_reason ?? null,
        };
      });
  }, [doctors.data, phcs.data, events.data, phcFilter]);

  const counts = useMemo(
    () => ({
      present: rows.filter((r) => r.status === "present").length,
      absent: rows.filter((r) => r.status === "absent").length,
      flagged: rows.filter((r) => r.status === "flagged").length,
      incomplete: rows.filter((r) => r.status === "incomplete").length,
    }),
    [rows],
  );

  if (!authLoading && !isOfficer) {
    return (
      <AppShell>
        <div className="surface-panel p-8 text-center">
          <h1 className="text-2xl">Attendance is for health officers</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Your account is registered as {roles.length ? roles.join(", ") : "a doctor"}. Attendance records
            are visible to DDHS, DHO and BMO accounts. MediWiki is open to you from the menu above.
          </p>
        </div>
      </AppShell>
    );
  }

  const statusStyles: Record<string, string> = {
    present: "bg-success/12 text-success border-success/30",
    absent: "bg-destructive/10 text-destructive border-destructive/30",
    flagged: "bg-warning/15 text-warning-foreground border-warning/40",
    incomplete: "bg-muted text-muted-foreground border-border",
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Attendance today</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live check-ins across every Primary Health Centre in the district.
          </p>
        </div>
        <Select value={phcFilter} onValueChange={setPhcFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All centres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All centres</SelectItem>
            {(phcs.data ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Present" value={counts.present} tone="text-success" />
        <StatCard icon={UserX} label="Not checked in" value={counts.absent} tone="text-destructive" />
        <StatCard icon={AlertTriangle} label="Flagged" value={counts.flagged} tone="text-accent" />
        <StatCard icon={Clock} label="Missing check-out" value={counts.incomplete} tone="text-muted-foreground" />
      </div>

      <div className="surface-panel mt-8 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Doctor</th>
              <th className="px-4 py-3 font-semibold">Health centre</th>
              <th className="px-4 py-3 font-semibold">Check-in</th>
              <th className="px-4 py-3 font-semibold">Check-out</th>
              <th className="px-4 py-3 font-semibold">Verified by</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {events.isLoading || doctors.isLoading ? (
              <tr>
                <td colSpan={6} className="p-4">
                  <Skeleton className="h-24 w-full" />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.doctor.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{row.doctor.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.doctor.designation} · {row.doctor.employee_code}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.phcName}</td>
                  <td className="px-4 py-3">{row.checkIn ? timeOf(row.checkIn.occurred_at) : "—"}</td>
                  <td className="px-4 py-3">{row.checkOut ? timeOf(row.checkOut.occurred_at) : "—"}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {row.checkIn?.source ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={statusStyles[row.status]}>
                      {row.status === "incomplete" ? "No check-out" : row.status}
                    </Badge>
                    {row.note && <p className="mt-1 text-xs text-muted-foreground">{row.note}</p>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="surface-panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className={`h-5 w-5 ${tone}`} aria-hidden />
      </div>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
