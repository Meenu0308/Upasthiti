import { Bookmark, BookmarkCheck, GitCompare } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MedicineRecord } from "@/lib/mediwiki.functions";

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <AccordionItem value={title}>
      <AccordionTrigger className="text-sm font-semibold">{title}</AccordionTrigger>
      <AccordionContent>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
}

function TextSection({ title, body }: { title: string; body: string | null }) {
  if (!body) return null;
  return (
    <AccordionItem value={title}>
      <AccordionTrigger className="text-sm font-semibold">{title}</AccordionTrigger>
      <AccordionContent>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </AccordionContent>
    </AccordionItem>
  );
}

export function MedicineProfile({
  medicine,
  saved,
  onToggleSave,
  onCompare,
}: {
  medicine: MedicineRecord;
  saved: boolean;
  onToggleSave: () => void;
  onCompare?: () => void;
}) {
  return (
    <article className="surface-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl">{medicine.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {[medicine.generic_name, medicine.form, medicine.strength].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={medicine.prescription_required ? "default" : "secondary"}>
              {medicine.prescription_required ? "Prescription required" : "Over the counter"}
            </Badge>
            {medicine.price_range && <Badge variant="outline">{medicine.price_range}</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          {onCompare && (
            <Button variant="outline" size="sm" onClick={onCompare}>
              <GitCompare className="mr-1.5 h-4 w-4" /> Compare
            </Button>
          )}
          <Button variant={saved ? "secondary" : "default"} size="sm" onClick={onToggleSave}>
            {saved ? (
              <>
                <BookmarkCheck className="mr-1.5 h-4 w-4" /> Saved
              </>
            ) : (
              <>
                <Bookmark className="mr-1.5 h-4 w-4" /> Save
              </>
            )}
          </Button>
        </div>
      </div>

      {medicine.brand_names.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Common brands: </span>
          {medicine.brand_names.join(", ")}
        </p>
      )}

      <Accordion type="multiple" defaultValue={["Uses", "Dosage"]} className="mt-4">
        <Section title="Uses" items={medicine.uses} />
        <TextSection title="Dosage" body={medicine.dosage} />
        <TextSection title="How it works" body={medicine.how_it_works} />
        <Section title="Side effects" items={medicine.side_effects} />
        <Section title="Warnings" items={medicine.warnings} />
        <Section title="Interactions" items={medicine.interactions} />
        <TextSection title="Composition" body={medicine.composition} />
        <TextSection title="Storage" body={medicine.storage} />
      </Accordion>

      <p className="mt-5 rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
        MediWiki is a reference aid, not a prescription. Always confirm dosage and suitability with the
        treating doctor.
      </p>
    </article>
  );
}
