import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Camera, Loader2, Search, Trash2 } from "lucide-react";
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
  component: MediWiki;
});

function MediWiki() {
  return null;
}
