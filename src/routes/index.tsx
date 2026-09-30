import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Camera, Fingerprint, MapPin, Pill, ShieldCheck } from "lucide-react";
import heroImage from "@/assets/hero-phc.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Upasthiti — Real-time doctor attendance for PHCs" },
      {
        name: "description",
        content:
          "Upasthiti gives health officers live visibility of doctor attendance across Primary Health Centres, with biometric and GPS verification and the MediWiki medicine assistant.",
      },
      { property: "og:title", content: "Upasthiti — Real-time doctor attendance for PHCs" },
      {
        property: "og:description",
        content:
          "Live attendance monitoring for Primary Health Centres, plus MediWiki, a smart medicine information assistant.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Fingerprint,
    title: "Biometric check-in",
    body: "Fingerprint verification at every PHC and subcentre confirms who is actually on duty.",
  },
  {
    icon: MapPin,
    title: "GPS presence",
    body: "The field app confirms the doctor is inside the facility geofence during working hours.",
  },
  {
    icon: Activity,
    title: "Officer dashboard",
    body: "DDHS, DHO and BMO see live check-ins, absences and flagged records across every centre.",
  },
  {
    icon: ShieldCheck,
    title: "Clean, trusted records",
    body: "Suspect entries are flagged, never deleted, so reports stay accurate and auditable.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <span className="font-display text-xl font-semibold text-primary">Upasthiti</span>
        <Button asChild size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="hero-wash">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="text-primary-foreground">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Digital platform for healthcare services
            </p>
            <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">
              Every doctor present. Every centre accountable.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed opacity-90">
              Upasthiti tracks doctor attendance across Primary Health Centres in real time, so absences
              are spotted early and care never stops. MediWiki puts a trustworthy medicine reference in
              the same app.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/dashboard">Open attendance dashboard</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/mediwiki">Try MediWiki</Link>
              </Button>
            </div>
          </div>
          <img
            src={heroImage}
            alt="A doctor checking in at a biometric scanner in a primary health centre"
            width={1600}
            height={1008}
            className="rounded-2xl shadow-lift"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl">How attendance stays honest</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="surface-panel p-5">
              <f.icon className="h-6 w-6 text-primary" aria-hidden />
              <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-secondary/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">MediWiki</p>
            <h2 className="mt-3 text-3xl">A Wikipedia for medicines, built into Upasthiti</h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Search a medicine by name or photograph a tablet, strip, syrup bottle or injection. You get a
              clean profile: uses, dosage, side effects, warnings, interactions and price — with saving,
              comparison and recent searches.
            </p>
            <Button asChild className="mt-6">
              <Link to="/mediwiki">Open MediWiki</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-panel p-5">
              <Camera className="h-6 w-6 text-accent" aria-hidden />
              <h3 className="mt-3 text-base font-semibold">Scan to identify</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload a photo and get the medicine identified instantly.
              </p>
            </div>
            <div className="surface-panel p-5">
              <Pill className="h-6 w-6 text-accent" aria-hidden />
              <h3 className="mt-3 text-base font-semibold">Compare side by side</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Put two medicines next to each other before prescribing or dispensing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Upasthiti — Real-Time Doctor Attendance Monitoring for Primary Health Centres.
      </footer>
    </div>
  );
}
