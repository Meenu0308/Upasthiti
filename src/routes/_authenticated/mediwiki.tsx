import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Camera, Clock, Loader2, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { MedicineProfile } from "@/components/MedicineProfile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  identifyMedicinePhoto,
  lookupMedicine,
  type MedicineRecord,
} from "@/lib/mediwiki.functions";

export const Route = createFileRoute("/_authenticated/mediwiki")({
  head: () => ({
    meta: [
      { title: "MediWiki — smart medicine assistant | Upasthiti" },
      {
        name: "description",
        content:
          "Search a medicine by name or scan a tablet, strip, syrup bottle or injection to get uses, dosage, side effects, warnings and price.",
      },
      { property: "og:title", content: "MediWiki — smart medicine assistant" },
      {
        property: "og:description",
        content: "Identify any medicine by name or photo and read a clean, plain-language profile.",
      },
    ],
  }),
  component: MediWikiPage,
});

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

function MediWikiPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lookup = useServerFn(lookupMedicine);
  const identify = useServerFn(identifyMedicinePhoto);
  const fileRef = useRef<HTMLInputElement>(null);

  const [term, setTerm] = useState("");
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<MedicineRecord | null>(null);
  const [scanNote, setScanNote] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compare, setCompare] = useState<MedicineRecord[]>([]);

  const catalogue = useQuery({
    queryKey: ["medicines"],
    queryFn: async () => {
      const { data, error } = await supabase.from("medicines").select("*").order("name");
      if (error) throw error;
      return data as MedicineRecord[];
    },
  });

  const saved = useQuery({
    queryKey: ["saved-medicines", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_medicines")
        .select("id, medicine_id, medicines(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; medicine_id: string; medicines: MedicineRecord }>;
    },
  });

  const recent = useQuery({
    queryKey: ["recent-searches", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recent_searches")
        .select("id, query, mode, created_at, medicine_id, medicines(*)")
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data as Array<{
        id: string;
        query: string;
        mode: string;
        created_at: string;
        medicine_id: string | null;
        medicines: MedicineRecord | null;
      }>;
    },
  });

  const savedIds = new Set((saved.data ?? []).map((row) => row.medicine_id));

  const refreshLists = () => {
    queryClient.invalidateQueries({ queryKey: ["saved-medicines", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["recent-searches", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["medicines"] });
  };

  const runSearch = async (query: string) => {
    if (!query.trim()) return;
    setBusy(true);
    setScanNote(null);
    try {
      const medicine = await lookup({ data: { query } });
      setCurrent(medicine);
      refreshLists();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Search failed");
    } finally {
      setBusy(false);
    }
  };

  const runScan = async (file: File) => {
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      setPreview(dataUrl);
      const result = await identify({ data: { imageDataUrl: dataUrl } });
      setCurrent(result.medicine);
      setScanNote(
        `Identified with ${result.confidence} confidence${result.readText ? ` — label read: "${result.readText}"` : ""}.`,
      );
      refreshLists();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not identify that photo");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const toggleSave = async (medicine: MedicineRecord) => {
    if (!user) return;
    if (savedIds.has(medicine.id)) {
      await supabase.from("saved_medicines").delete().eq("user_id", user.id).eq("medicine_id", medicine.id);
      toast.success(`Removed ${medicine.name}`);
    } else {
      await supabase.from("saved_medicines").insert({ user_id: user.id, medicine_id: medicine.id });
      toast.success(`Saved ${medicine.name}`);
    }
    queryClient.invalidateQueries({ queryKey: ["saved-medicines", user.id] });
  };

  const addToCompare = (medicine: MedicineRecord) => {
    setCompare((prev) => {
      if (prev.some((m) => m.id === medicine.id)) return prev;
      const next = [...prev, medicine];
      return next.slice(-2);
    });
    toast.success(`${medicine.name} added to comparison`);
  };

  const clearRecent = async () => {
    if (!user) return;
    await supabase.from("recent_searches").delete().eq("user_id", user.id);
    queryClient.invalidateQueries({ queryKey: ["recent-searches", user.id] });
  };

  return (
    <AppShell>
      <div className="max-w-3xl">
        <Badge variant="secondary">MediWiki</Badge>
        <h1 className="mt-3 text-3xl">A Wikipedia for medicines</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Search by name, or photograph a tablet, blister strip, syrup bottle or injection vial. You get a
          clean profile you can save, compare and revisit.
        </p>
      </div>

      <Tabs defaultValue="search" className="mt-8">
        <TabsList>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="scan">Scan photo</TabsTrigger>
          <TabsTrigger value="saved">Saved ({saved.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="compare">Compare ({compare.length})</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6 space-y-6">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(term);
            }}
          >
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g. Dolo 650, Amoxicillin, ORS"
              className="h-11"
            />
            <Button type="submit" className="h-11" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-1.5">Search</span>
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {(catalogue.data ?? []).slice(0, 8).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setTerm(m.name);
                  runSearch(m.name);
                }}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {m.name}
              </button>
            ))}
          </div>

          {current && (
            <MedicineProfile
              medicine={current}
              saved={savedIds.has(current.id)}
              onToggleSave={() => toggleSave(current)}
              onCompare={() => addToCompare(current)}
            />
          )}
        </TabsContent>

        <TabsContent value="scan" className="mt-6 space-y-6">
          <div className="surface-panel flex flex-col items-center p-8 text-center">
            <Camera className="h-8 w-8 text-primary" aria-hidden />
            <h2 className="mt-3 text-lg font-semibold">Upload or take a photo</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              A close, well-lit shot of the label or the tablet imprint gives the best result.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) runScan(file);
              }}
            />
            <Button className="mt-5" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {busy ? "Identifying…" : "Choose photo"}
            </Button>
            {preview && (
              <img
                src={preview}
                alt="Uploaded medicine"
                loading="lazy"
                className="mt-6 max-h-56 rounded-lg border border-border object-contain"
              />
            )}
          </div>

          {scanNote && (
            <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">{scanNote}</p>
          )}

          {current && (
            <MedicineProfile
              medicine={current}
              saved={savedIds.has(current.id)}
              onToggleSave={() => toggleSave(current)}
              onCompare={() => addToCompare(current)}
            />
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-6 space-y-4">
          {(saved.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No saved medicines yet.</p>
          )}
          {(saved.data ?? []).map((row) => (
            <MedicineProfile
              key={row.id}
              medicine={row.medicines}
              saved
              onToggleSave={() => toggleSave(row.medicines)}
              onCompare={() => addToCompare(row.medicines)}
            />
          ))}
        </TabsContent>

        <TabsContent value="compare" className="mt-6">
          {compare.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              Add two medicines using the Compare button on any profile.
            </p>
          ) : (
            <div className="surface-panel overflow-x-auto">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-medium">
                  {compare[0]!.name} vs {compare[1]!.name}
                </p>
                <Button variant="ghost" size="sm" onClick={() => setCompare([])}>
                  <X className="mr-1.5 h-4 w-4" /> Clear
                </Button>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {(
                    [
                      ["Generic name", (m: MedicineRecord) => m.generic_name ?? "—"],
                      ["Form & strength", (m: MedicineRecord) => [m.form, m.strength].filter(Boolean).join(" · ") || "—"],
                      ["Used for", (m: MedicineRecord) => m.uses.join(", ") || "—"],
                      ["Dosage", (m: MedicineRecord) => m.dosage ?? "—"],
                      ["Side effects", (m: MedicineRecord) => m.side_effects.join(", ") || "—"],
                      ["Warnings", (m: MedicineRecord) => m.warnings.join(", ") || "—"],
                      ["Price", (m: MedicineRecord) => m.price_range ?? "—"],
                      [
                        "Prescription",
                        (m: MedicineRecord) => (m.prescription_required ? "Required" : "Not required"),
                      ],
                    ] as Array<[string, (m: MedicineRecord) => string]>
                  ).map(([label, get]) => (
                    <tr key={label} className="border-t border-border align-top">
                      <th className="w-40 px-4 py-3 text-left font-medium text-muted-foreground">{label}</th>
                      <td className="px-4 py-3">{get(compare[0]!)}</td>
                      <td className="px-4 py-3">{get(compare[1]!)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Your last 15 lookups.</p>
            {(recent.data ?? []).length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearRecent}>
                <Trash2 className="mr-1.5 h-4 w-4" /> Clear
              </Button>
            )}
          </div>
          {(recent.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing searched yet.</p>
          )}
          {(recent.data ?? []).map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => {
                if (row.medicines) setCurrent(row.medicines);
                setTerm(row.query);
              }}
              className="surface-panel flex w-full items-center gap-3 p-4 text-left transition-colors hover:border-primary"
            >
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span className="font-medium">{row.query}</span>
              <Badge variant="outline" className="ml-auto capitalize">
                {row.mode}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(row.created_at).toLocaleString()}
              </span>
            </button>
          ))}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
