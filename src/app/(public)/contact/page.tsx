import { MapPin, Phone, Mail, Clock, KeyRound, Trophy, Users, Megaphone, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-elements";
import { ContactForm } from "@/components/public/contact-form";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const DEMO_LOGINS = [
  { role: "Admin", icon: Trophy, email: "admin@tourney.bd", password: "admin123", color: "text-amber-500" },
  { role: "Organizer", icon: Megaphone, email: "jubair@mirpursports.bd", password: "organ123", color: "text-emerald-500" },
  { role: "Team Manager", icon: Users, email: "rahim@dhakawarriors.bd", password: "manage123", color: "text-sky-500" },
  { role: "Referee", icon: ShieldCheck, email: "ref.rahman@tourney.bd", password: "refer123", color: "text-violet-500" },
];

export default async function ContactPage() {
  const { contactEmail } = await getSettings();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Contact us"
        description="Have a question, partnership idea, or want to bring TourneyBD to your district? We'd love to hear from you."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* FORM */}
        <Card className="lg:col-span-2 p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Send us a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in the form below and our team will get back to you within 24 hours.
          </p>
          <div className="mt-5">
            <ContactForm />
          </div>
        </Card>

        {/* INFO */}
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="text-sm font-semibold">Reach us directly</h3>
            <div className="mt-4 space-y-3">
              <InfoRow icon={MapPin} title="Visit us" lines={["House 12, Road 5", "Mirpur DOHS, Dhaka 1216", "Bangladesh"]} />
              <InfoRow icon={Phone} title="Call us" lines={["+880 1711 000000", "Sat–Thu, 10am – 6pm"]} />
              <InfoRow icon={Mail} title="Email us" lines={[contactEmail]} />
              <InfoRow icon={Clock} title="Office hours" lines={["Saturday – Thursday", "10:00 AM – 6:00 PM BST"]} />
            </div>
          </Card>

          {/* DEMO LOGINS */}
          <Card className="overflow-hidden p-0 py-0">
            <div className="bg-gradient-to-br from-primary to-emerald-800 p-4 text-primary-foreground">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                <h3 className="font-semibold">Demo logins</h3>
              </div>
              <p className="mt-1 text-xs text-white/85">
                Reviewers can explore every dashboard using these pre-seeded accounts.
              </p>
            </div>
            <div className="space-y-2 p-4">
              {DEMO_LOGINS.map((d) => (
                <div key={d.email} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <d.icon className={`h-4 w-4 ${d.color}`} />
                    <span className="font-medium text-sm">{d.role}</span>
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-xs">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Email:</span> {d.email}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Password:</span> {d.password}
                    </p>
                  </div>
                </div>
              ))}
              <a
                href="/login"
                className="mt-2 block w-full rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Go to login →
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon, title, lines,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  lines: string[];
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
        <div className="mt-0.5 space-y-0.5 text-sm">
          {lines.map((l, i) => <p key={i} className={i === 0 ? "font-medium" : "text-muted-foreground"}>{l}</p>)}
        </div>
      </div>
    </div>
  );
}
