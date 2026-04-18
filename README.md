# LadeKompass

> **Alle Ladesäulen. Ein Überblick.**  
> Die intelligente EV-Navigationslösung für Deutschland – kostenlos, neutral, mobil.

LadeKompass ist eine webbasierte SaaS-Anwendung für Elektrofahrzeugfahrer. Die App bietet eine interaktive Ladesäulen-Karte, intelligente Routenplanung mit Lade-Stopps, Tarif-Vergleich und ein Community-Meldesystem – optimiert für Desktop und Mobilgeräte.

---

## Tech Stack

| Schicht | Technologie |
|---|---|
| **Framework** | Next.js 16 (App Router, `src/app/`) |
| **Sprache** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4 (utility-first) |
| **Backend/DB** | Supabase (PostgreSQL, Auth, RLS) |
| **Deployment** | Vercel (via GitHub Actions CI/CD) |
| **Tests** | Vitest (Unit, 100% Coverage) |
| **i18n** | next-intl (DE + EN) |

---

## Features

- 🗺️ **Interaktive Ladesäulen-Karte** – MapLibre GL, BNetzA-Daten, Echtzeit-Status
- 🔍 **Intelligente Suche & Filter** – nach Ladeleistung, Steckertyp, Status
- 🛣️ **Routenplanung mit Lade-Stopps** – OSRM-Routing, automatische Ladeplanung
- 🧭 **Turn-by-Turn Navigation** – GPS-gestützt, Spuranzeige, HUD
- 📊 **Tarif-Vergleich** – kWh-Preise, Minutenpreis, Blockiergebühren
- 📱 **Mobile First** – Bottom Tab Navigation, Bottom Sheets, Safe Area Support
- 🌙 **Dark Mode** – vollständig unterstützt
- 🌐 **Mehrsprachig** – Deutsch + Englisch (next-intl)
- 🔒 **Freemium-Modell** – Free / Lite / Pro Pläne

---

## Mobile Navigation

LadeKompass verwendet eine **Bottom Tab Navigation** als Industrie-Standard für mobile EV-Apps (wie Google Maps, Waze, Komoot):

- **Header** (mobile): Logo + Theme-Toggle + Sprachumschalter
- **Bottom Tab Bar** (mobile only): Karte | Route | Dashboard | Fahrzeuge | Einstellungen
- **Map-Panel** (mobile): FAB-Button öffnet Bottom Sheet mit Filtern & Stationen
- **NavigationWizard** (mobile): responsives Panel, oben über der Karte

---

## Quick Start

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen konfigurieren
cp .env.example .env.local
# Supabase-Zugangsdaten in .env.local eintragen

# 3. Entwicklungsserver starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

---

## Scripts

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Entwicklungsserver (Turbopack) |
| `npm run build` | Production-Build |
| `npm run start` | Production-Server starten |
| `npm run lint` | ESLint ausführen |
| `npm run typecheck` | TypeScript-Typenprüfung |
| `npm test` | Unit-Tests ausführen |
| `npm run test:coverage` | Tests mit Coverage-Report (100%) |

---

## Umgebungsvariablen

```env
NEXT_PUBLIC_SUPABASE_URL=         # Supabase-Projekt-URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase Anon Key
SUPABASE_SERVICE_ROLE_KEY=        # Service Role Key (server-only)
SUPABASE_DB_SCHEMA=               # Datenbankschema (z.B. ladekompass-dev)
```

---

## Projektstruktur

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/           # Mehrsprachige Seiten (de/en)
│   │   ├── map/            # Interaktive Karte (Startseite)
│   │   ├── route/          # Routenplaner
│   │   ├── dashboard/      # Dashboard (Lite/Pro)
│   │   ├── profile/        # Fahrzeugverwaltung
│   │   ├── settings/       # Einstellungen
│   │   └── auth/           # Authentifizierung
│   └── api/                # API-Routen
├── components/
│   ├── layout/             # Header, Footer, BottomNav (mobile)
│   ├── map/                # Karte, NavigationWizard, Filter
│   ├── ui/                 # MobileSheet, PlanGate, etc.
│   └── ...
├── lib/                    # Geschäftslogik (100% getestet)
│   ├── route-calc.ts       # Routen- und Entfernungsberechnungen
│   ├── tariff-calculator.ts # Ladekosten-Berechnung
│   ├── plan-limits.ts      # Freemium-Plan-Logik
│   └── legal/              # DSGVO-Consent-Logik
└── i18n/                   # Internationalisierung (next-intl)

messages/
├── de.json                 # Deutsche Übersetzungen
└── en.json                 # Englische Übersetzungen

supabase/
└── migrations/             # Datenbankmigrationen
```

---

## Tests & Coverage

```bash
npm test                    # Tests ausführen
npm run test:coverage       # Mit Coverage-Report
```

**Coverage: 100%** auf allen gemessenen Modulen:
- `src/lib/route-calc.ts`
- `src/lib/tariff-calculator.ts`
- `src/lib/plan-limits.ts`
- `src/lib/legal/consent.ts`

---

## Dokumentation

- **[docs/Produkthandbuch-LadeKompass.md](docs/Produkthandbuch-LadeKompass.md)** — Vollständiges Produkthandbuch
- **[HOWTO.md](HOWTO.md)** — Setup- & Deployment-Anleitung (DE/EN)
- **[AGENTS.md](AGENTS.md)** — GitHub Copilot Agents, Skills & Instructions
- **[legal-docs/](legal-docs/)** — Rechtliche Dokumente (DE/EN)

---

## Deployment

Die App wird automatisch über GitHub Actions auf Vercel deployed:

1. Push auf `main` → GitHub Actions CI/CD
2. `npm run typecheck` → `npm run lint` → `npm run build`
3. Deploy auf Vercel (serverless + Edge)

---

*LadeKompass – entwickelt von WAMOCON, Germany*
