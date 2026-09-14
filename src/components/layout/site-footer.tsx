import Link from "next/link";
import { Mail, Phone, MapPin, Trophy } from "lucide-react";
import { Logo } from "@/components/shared/logo";

const FOOTER_LINKS = [
  {
    title: "Explore",
    links: [
      { href: "/tournaments", label: "Tournaments" },
      { href: "/teams", label: "Teams" },
      { href: "/players", label: "Players" },
      { href: "/fixtures", label: "Fixtures" },
      { href: "/results", label: "Results" },
      { href: "/rankings", label: "Rankings" },
      { href: "/venues", label: "Venues" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact" },
      { href: "/login", label: "Login" },
      { href: "/register", label: "Become a Team Manager" },
    ],
  },
  {
    title: "Dashboards",
    links: [
      { href: "/admin", label: "Admin" },
      { href: "/organizer", label: "Organizer" },
      { href: "/team", label: "Team Manager" },
      { href: "/referee", label: "Referee" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-2">
            <Logo />
            <p className="text-sm text-muted-foreground max-w-xs">
              The all-in-one tournament management platform built for Bangladesh. From grassroots
              community leagues to corporate cups — organize, play, and follow the game.
            </p>
            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" /> Mirpur, Dhaka, Bangladesh
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" /> +880 1711 000000
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" /> hello@tourney.bd
              </p>
            </div>
          </div>
          {FOOTER_LINKS.map((section) => (
            <div key={section.title}>
              <h4 className="mb-3 text-sm font-semibold">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TourneyBD. Built for the Bangladesh sporting community.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            <span>Made with passion in Dhaka</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
