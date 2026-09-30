import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

export type MedicineRecord = {
  id: string;
  name: string;
  slug: string;
  generic_name: string | null;
  brand_names: string[];
  form: string | null;
  strength: string | null;
  composition: string | null;
  uses: string[];
  how_it_works: string | null;
  dosage: string | null;
  side_effects: string[];
  warnings: string[];
  interactions: string[];
  storage: string | null;
  price_range: string | null;
  prescription_required: boolean;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function extractText(payload: unknown): string {
  const data = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text;
  const parts: string[] = [];
  for (const item of data.output ?? []) {
    for (const part of item.content ?? []) {
      if (typeof part.text === "string") parts.push(part.text);
    }
  }
  return parts.join("\n");
}

function parseJson(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The assistant did not return a readable answer.");
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

async function callGateway(content: Array<Record<string, unknown>>) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input: [{ role: "user", content }] }),
  });

  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 429) throw new Error("Too many requests right now. Please try again in a moment.");
    if (response.status === 402) throw new Error("AI credits are exhausted. Please top up to keep using MediWiki.");
    throw new Error(`Medicine lookup failed (${response.status}). ${detail.slice(0, 200)}`);
  }
  return extractText(await response.json());
}

const PROFILE_INSTRUCTION = `You are MediWiki, a medicine reference used by Indian primary health centre staff.
Return ONLY a JSON object with these keys:
{"found":boolean,"name":string,"generic_name":string,"brand_names":string[],"form":string,"strength":string,
"composition":string,"uses":string[],"how_it_works":string,"dosage":string,"side_effects":string[],
"warnings":string[],"interactions":string[],"storage":string,"price_range":string,"prescription_required":boolean}
Use plain language a nurse or patient can read. Prices in Indian Rupees. If the input is not a medicine, set found to false.`;

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function persistMedicine(profile: Record<string, unknown>): Promise<MedicineRecord> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const name = str(profile["name"]);
  if (!name) throw new Error("No medicine name could be determined.");
  const slug = slugify(name);

  const existing = await supabaseAdmin.from("medicines").select("*").eq("slug", slug).maybeSingle();
  if (existing.data) return existing.data as MedicineRecord;

  const row = {
    name,
    slug,
    generic_name: str(profile["generic_name"]),
    brand_names: toArray(profile["brand_names"]),
    form: str(profile["form"]),
    strength: str(profile["strength"]),
    composition: str(profile["composition"]),
    uses: toArray(profile["uses"]),
    how_it_works: str(profile["how_it_works"]),
    dosage: str(profile["dosage"]),
    side_effects: toArray(profile["side_effects"]),
    warnings: toArray(profile["warnings"]),
    interactions: toArray(profile["interactions"]),
    storage: str(profile["storage"]),
    price_range: str(profile["price_range"]),
    prescription_required: profile["prescription_required"] !== false,
  };

  const inserted = await supabaseAdmin.from("medicines").insert(row).select("*").single();
  if (inserted.error) throw new Error(inserted.error.message);
  return inserted.data as MedicineRecord;
}

/** Find a medicine by name: database first, then the AI reference. */
export const lookupMedicine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query: string }) => {
    const query = input.query?.trim();
    if (!query) throw new Error("Type a medicine name to search.");
    return { query: query.slice(0, 120) };
  })
  .handler(async ({ data, context }): Promise<MedicineRecord> => {
    const { supabase, userId } = context;

    const direct = await supabase
      .from("medicines")
      .select("*")
      .or(`name.ilike.%${data.query}%,generic_name.ilike.%${data.query}%,slug.ilike.%${slugify(data.query)}%`)
      .limit(1)
      .maybeSingle();

    let medicine = direct.data as MedicineRecord | null;

    if (!medicine) {
      const text = await callGateway([
        { type: "input_text", text: `${PROFILE_INSTRUCTION}\n\nMedicine to describe: ${data.query}` },
      ]);
      const profile = parseJson(text);
      if (profile["found"] === false) throw new Error(`No medicine found for "${data.query}".`);
      medicine = await persistMedicine(profile);
    }

    await supabase.from("recent_searches").insert({
      user_id: userId,
      query: data.query,
      medicine_id: medicine.id,
      mode: "text",
    });

    return medicine;
  });

/** Identify a medicine from a photo of a tablet, strip, bottle or injection. */
export const identifyMedicinePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { imageDataUrl: string }) => {
    if (!input.imageDataUrl?.startsWith("data:image/")) throw new Error("Please upload a valid photo.");
    return { imageDataUrl: input.imageDataUrl };
  })
  .handler(async ({ data, context }): Promise<{ medicine: MedicineRecord; confidence: string; readText: string }> => {
    const { supabase, userId } = context;

    const identifyText = await callGateway([
      {
        type: "input_text",
        text: `Look at this photo of a medicine (tablet, blister strip, package, syrup bottle or injection vial).
Return ONLY JSON: {"found":boolean,"name":string,"confidence":"high"|"medium"|"low","read_text":string}
"name" is the most likely medicine name (brand or generic). "read_text" is the text you could read on the packaging.
If it is clearly not a medicine, set found to false.`,
      },
      { type: "input_image", image_url: data.imageDataUrl },
    ]);

    const identified = parseJson(identifyText);
    const name = str(identified["name"]);
    if (identified["found"] === false || !name) {
      throw new Error("Could not identify a medicine in that photo. Try a sharper, closer shot of the label.");
    }

    const existing = await supabase
      .from("medicines")
      .select("*")
      .or(`name.ilike.%${name}%,slug.eq.${slugify(name)}`)
      .limit(1)
      .maybeSingle();

    let medicine = existing.data as MedicineRecord | null;
    if (!medicine) {
      const profileText = await callGateway([
        { type: "input_text", text: `${PROFILE_INSTRUCTION}\n\nMedicine to describe: ${name}` },
      ]);
      medicine = await persistMedicine(parseJson(profileText));
    }

    await supabase.from("recent_searches").insert({
      user_id: userId,
      query: name,
      medicine_id: medicine.id,
      mode: "scan",
    });

    return {
      medicine,
      confidence: str(identified["confidence"]) ?? "medium",
      readText: str(identified["read_text"]) ?? "",
    };
  });
