# Produkthandbuch: LadeKompass – Alle Ladesäulen, ein Überblick

> **Version 1.1** | Stand: April 2026 | WAMOCON

---

## Inhaltsverzeichnis

1. [Übersicht](#1-übersicht)
2. [Business Model: Free, Lite und Pro](#2-business-model-free-lite-und-pro)
3. [Tutorials – Erste Schritte](#3-tutorials--erste-schritte)
4. [How-to Guides](#4-how-to-guides)
5. [Funktionsreferenz](#5-funktionsreferenz)
6. [Mobile Nutzung](#6-mobile-nutzung)
7. [Technische Architektur](#7-technische-architektur)
8. [Compliance und DSGVO](#8-compliance-und-dsgvo)
9. [Glossar](#9-glossar)

---

## 1. Übersicht

**LadeKompass** ist eine webbasierte SaaS-Lösung für Elektrofahrzeugfahrer in Deutschland.

**Was LadeKompass löst:**
- Alle Ladesäulen aus dem BNetzA-Register auf einer einzigen, übersichtlichen Karte
- Intelligente Routenplanung mit automatischer Lade-Stopp-Berechnung
- Echtzeit-Status und Community-Meldungen für Ladestationen
- Tarif-Vergleich (kWh, Minuten, Blockiergebühren) auf einen Blick
- Volle Nutzung auf jedem Smartphone ohne App-Download

**Kerneigenschaften:**
- Öffentlich zugänglich ohne Registrierung (Free-Tarif)
- DSGVO-konform, Hosting in Deutschland
- Mobile-First: optimiert für alle Smartphone-Größen
- Mehrsprachig: Deutsch und Englisch

---

## 2. Business Model: Free, Lite und Pro

LadeKompass ist in drei Tarifen verfügbar.

### 2.1 Planuebersicht

| Feature | Free | Lite | Pro |
| :--- | :---: | :---: | :---: |
| Ladesäulen-Karte | Ja | Ja | Ja |
| Standortsuche | Ja | Ja | Ja |
| Filter (Leistung, Steckertyp) | Ja | Ja | Ja |
| Community-Meldungen lesen | Ja | Ja | Ja |
| Community-Meldungen abgeben | Nein | Ja | Ja |
| Routenplanung (Basis) | Ja (5/Monat) | Ja (30/Monat) | Ja (unbegrenzt) |
| Tarif-Vergleich | Nein | Ja | Ja |
| Dashboard | Nein | Ja | Ja |
| News-Feed (günstigste Stationen) | Nein | Nein | Ja |
| Erweiterte Filter | Nein | Nein | Ja |
| Favoriten | 0 | 10 | Unbegrenzt |
| CSV-Export der Stationen | Nein | Nein | Ja |
| Fahrzeugprofile | Nein | Ja | Ja |

### 2.2 Routenplanung-Kontingente

| Plan | Routen/Monat |
| :--- | :---: |
| Free | 5 |
| Lite | 30 |
| Pro | Unbegrenzt |

### 2.3 Upgrade-Prozess

1. Im Header oder auf der Upgrade-Seite `/upgrade` auf **Auf Lite/Pro upgraden** klicken.
2. Kontaktformular ausfüllen oder E-Mail an WAMOCON senden.
3. Nach Freischaltung durch den Super-Admin steht der neue Plan sofort zur Verfügung.

---

## 3. Tutorials – Erste Schritte

### 3.1 Erste Ladesäule finden (Free, ohne Registrierung)

1. App unter [ladekompass.de](https://ladekompass.de) öffnen (oder localhost in der Entwicklung)
2. Karte lädt automatisch mit Ladesäulen in Deutschland
3. **Auf „Meinen Standort"** klicken → Karte zentriert sich auf deinen Standort
4. Grüne Marker = verfügbar, Rote = defekt, Graue = unbekannt
5. Auf eine Station klicken → Stationsdetails mit Steckertypen und Leistung
6. **Auf Station navigieren** → Routenplaner öffnet sich mit vorausgefülltem Ziel

### 3.2 Route mit Lade-Stopps planen

1. Navigation-Icon oben rechts auf der Karte klicken → NavigationWizard öffnet sich
2. **Startadresse** eingeben (Autocomplete mit Nominatim)
3. **Zieladresse** eingeben
4. **Route berechnen** klicken → Route wird angezeigt
5. Schieberegler für **Reichweite** und **Akku-Füllstand** einstellen
6. App berechnet automatisch notwendige Lade-Stopps auf der Route
7. **Navigation starten (GPS)** → Turn-by-Turn Navigation mit Spur-Anzeige

### 3.3 Tarif-Vergleich nutzen (Lite/Pro)

1. Auf eine Station auf der Karte klicken
2. Im Detailpanel auf **Tarife anzeigen** klicken
3. Alle bekannten Tarife mit kWh-Preis, Minutenpreis und Einmalgebühr werden angezeigt
4. Kostenrechner: Akkukapazität und Ladestand eingeben → Ladekosten werden berechnet
5. Falls keine strukturierten Tarife vorliegen: OCM-Preisbeschreibung des Betreibers wird als Text angezeigt
6. Falls keine Preisdaten vorhanden: direkter Link zur Betreiber-Webseite oder GoingElectric als Fallback

### 3.4 Community-Meldung abgeben (Lite/Pro)

1. Station auf der Karte auswählen
2. **Meldung abgeben** klicken
3. Status wählen: Verfügbar / Belegt / Defekt / Preiskorrektur
4. Optionale Beschreibung eingeben
5. **Absenden** klicken → Meldung erscheint im Community-Feed

### 3.5 Konto erstellen und einloggen

1. Header: **Anmelden** klicken → `/auth/login`
2. E-Mail und Passwort eingeben
3. Oder: **Registrieren** → Organisations-Name, E-Mail, Passwort
4. AGB, Datenschutz und DSGVO-Einwilligung akzeptieren
5. Nach Login: Plan-Badge im Header sichtbar

---

## 4. How-to Guides

### 4.1 Mobile Nutzung: Filter öffnen

1. Auf der Karte auf das **Filter-Symbol** (Schieberegler-Icon) unten links tippen
2. Bottom Sheet öffnet sich von unten
3. Ladeleistung wählen: AC / DC / HPC
4. Steckertyp wählen: Typ 2 / CCS / CHAdeMO / Tesla
5. „Jetzt geöffnet" aktivieren für 24/7-Stationen
6. Station aus der Liste tippen → Karte springt zur Station

### 4.2 Mobile Nutzung: Navigation starten

1. Auf der Karte auf das **Navigations-Icon** (blauer FAB, unten rechts) tippen
2. NavigationWizard öffnet sich oben
3. Start- und Zieladresse eingeben
4. Route berechnen und Navigation starten
5. Während der Navigation: HUD zeigt nächste Abbiegung + Distanz

### 4.3 Kartenstil wechseln (Desktop)

1. Im linken Panel auf **Kartenstil** klicken
2. Zwischen Hell, Dunkel, Farbig und Standard wählen

### 4.4 Theme wechseln (Desktop & Mobile)

1. Im Header auf das **Sonne/Mond-Symbol** klicken
2. Zyklus: System → Hell → Dunkel → System

### 4.5 Sprache wechseln

1. Im Header auf **DE / EN** klicken
2. Dropdown zeigt verfügbare Sprachen
3. Klick auf eine Sprache → sofortige Umschaltung ohne Neuladen

### 4.6 CSV-Export der sichtbaren Stationen (Pro)

1. Im linken Panel (Desktop) auf **Aktionen** klicken
2. **Stationen als CSV exportieren** klicken
3. CSV-Datei mit Name, Adresse, Koordinaten, Max-kW, Status wird heruntergeladen

### 4.7 Admin: Plan eines Nutzers freischalten

1. `/admin/subscriptions` öffnen (nur Super-Admin)
2. Nutzer suchen
3. Auf **Lite aktiv** oder **Pro aktiv** klicken
4. Status wird sofort aktualisiert

---

## 5. Funktionsreferenz

### 5.1 Routen-Übersicht

| Route | Beschreibung | Zugriff |
| :--- | :--- | :--- |
| `/` | Weiterleitung zur Karte | Alle |
| `/[locale]/map` | Interaktive Ladesäulen-Karte | Alle |
| `/[locale]/route` | Routenplaner (Seite) | Alle (kontingentiert) |
| `/[locale]/route/archive` | Archiv gespeicherter Routen | Eingeloggt |
| `/[locale]/dashboard` | Dashboard mit News-Feed | Lite / Pro |
| `/[locale]/profile` | Fahrzeugverwaltung | Eingeloggt |
| `/[locale]/settings` | Profileinstellungen | Eingeloggt |
| `/[locale]/upgrade` | Plan-Upgrade | Alle |
| `/[locale]/stations/[id]` | Stationsdetailseite | Alle |
| `/[locale]/auth/login` | Anmeldung | Unauthentifiziert |
| `/[locale]/auth/register` | Registrierung | Unauthentifiziert |
| `/[locale]/admin` | Admin-Übersicht | Admin+ |
| `/[locale]/admin/subscriptions` | Subscription-Verwaltung | Super-Admin |
| `/[locale]/legal/impressum` | Impressum | Alle |
| `/[locale]/legal/datenschutz` | Datenschutzerklärung | Alle |
| `/[locale]/legal/agb` | AGB | Alle |

### 5.2 Rollen und Berechtigungen

| Berechtigung | Unauthentifiziert | Free | Lite | Pro | Admin | Super-Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Karte anzeigen | Ja | Ja | Ja | Ja | Ja | Ja |
| Routenplanung | Nein | Ja (5/Mo) | Ja (30/Mo) | Ja | Ja | Ja |
| Tarif-Vergleich | Nein | Nein | Ja | Ja | Ja | Ja |
| Dashboard | Nein | Nein | Ja | Ja | Ja | Ja |
| Community-Meldungen | Nein | Nein | Ja | Ja | Ja | Ja |
| News-Feed | Nein | Nein | Nein | Ja | Ja | Ja |
| Favoriten (max.) | 0 | 0 | 10 | ∞ | ∞ | ∞ |
| Admin-Panel | Nein | Nein | Nein | Nein | Ja | Ja |
| Subscription-Verwaltung | Nein | Nein | Nein | Nein | Nein | Ja |

### 5.3 Plan-Gates (Feature-Sperren)

Gesperrte Features zeigen eine `PlanGate`-Komponente mit Upgrade-CTA:

| Plan-Gate | Auslöser | Weiterleitung |
| :--- | :--- | :--- |
| Routenplanung-Kontingent | 5 Routen/Monat (Free) überschritten | `/upgrade` |
| Tarif-Vergleich | Free-User öffnet Tarife | `/upgrade` |
| Dashboard | Free-User auf `/dashboard` | `/upgrade` |
| News-Feed | Lite-User versucht News zu lesen | `/upgrade` |
| Favoriten | Lite: > 10 Favoriten | `/upgrade` |

### 5.4 Karten-Features

| Feature | Beschreibung |
| :--- | :--- |
| Ladesäulen-Cluster | Gruppierung naher Stationen bei niedrigem Zoom |
| EV-Pin-Icons | 5 farbige SVG-Teardrop-Pins nach Ladeleistung und Status |
| Echtzeit-Status | Grün/Rot/Grau-Marker je nach Betriebsstatus |
| Heatmap | Dichtekarte aller Ladestationen |
| 3D-Gebäude | Optionale 3D-Ansicht (MapLibre) |
| Nutzerposition | GPS-Ortung mit blauem Puls-Marker |
| Route-Layer | Berechnete Route als blaue Linie |
| Lade-Stopps | Orange Marker auf der Route |
| Kartenstile | Hell, Dunkel, Farbig, Standard |

#### 5.4.1 EV-Pin-Typen

Jede Ladesäule wird als farbiger Teardrop-Pin dargestellt – abhängig von der maximalen Ladeleistung und dem Betriebsstatus:

| Typ | Farbe | Kriterium |
| :--- | :--- | :--- |
| **HPC** (Ultraschnell) | Dunkelgrün `#15803d` | ≥ 150 kW |
| **DC** (Schnell) | Grün `#16a34a` | ≥ 50 kW |
| **AC** (Normal) | Hellgrün `#22c55e` | < 50 kW |
| **Offline** | Rot `#dc2626` | Station außer Betrieb |
| **Unbekannt** | Grau `#64748b` | Keine Leistungsangabe |

### 5.5 NavigationWizard

| Schritt | Beschreibung |
| :--- | :--- |
| 1. Eingabe | Start- und Zieladresse via Nominatim-Autocomplete |
| 2. Berechnung | OSRM-Routing (open source), vollständige Abbiegeliste |
| 3. Ladeplanung | Automatische Lade-Stopp-Berechnung nach Reichweite/Akku |
| 4. Navigation | GPS-Tracking, Schritt-für-Schritt-Anweisung, Spur-Empfehlung |
| 5. HUD | Vollbild-HUD mit Manöver-Icon, Distanz, Verbleibende Zeit |

---

## 6. Mobile Nutzung

LadeKompass ist vollständig für Mobilgeräte optimiert und folgt den **Best Practices für mobile Navigation** (Bottom Tab Navigation – Standard bei Google Maps, Waze, Komoot).

### 6.1 Mobiles Layout

```
┌─────────────────────────┐
│  Logo  | Theme | Sprache │  ← Header (fixiert, kompakt)
├─────────────────────────┤
│                         │
│       Karteninhalt      │  ← Hauptinhalt (scrollbar / Karte)
│                         │
├─────────────────────────┤
│ Map | Route | Dashboard │  ← Bottom Tab Navigation (fixiert)
│ Fahrzeuge | Einstellungen│
└─────────────────────────┘
```

### 6.2 Bottom Tab Navigation

Auf mobilen Geräten (< 768px) wird die Navigation als fixierter Tab-Balken am unteren Bildschirmrand angezeigt:

| Tab | Icon | Zugriff |
| :--- | :--- | :--- |
| Karte | Map | Immer |
| Route | Navigation | Immer |
| Dashboard | LayoutDashboard | Eingeloggt |
| Fahrzeuge | Car | Eingeloggt |
| Einstellungen | Settings | Eingeloggt |

Nicht-eingeloggte Nutzer sehen nur Karte + Route.

### 6.3 Bottom Sheet (Filter & Stationen)

Auf der Karte öffnet ein FAB-Button (unten links, Schieberegler-Icon) ein **Bottom Sheet** mit:
- Ortssuche
- Schnellfilter (Ladeleistung, Steckertyp, "Jetzt geöffnet")
- Schnellaktionen (Standort, nächste HPC, nächste freie Station)
- Stationsliste mit direktem Sprung auf der Karte

### 6.4 Unterstützte Geräte

| Gerät | Bildschirmbreite | Status |
| :--- | :--- | :--- |
| iPhone SE (3. Gen) | 375px | ✅ |
| iPhone 14/15 | 390–430px | ✅ |
| Samsung Galaxy S23 | 360–384px | ✅ |
| Google Pixel 7 | 412px | ✅ |
| iPad Mini | 768px | ✅ (Desktop-Layout) |
| Desktop | ≥ 768px | ✅ |

### 6.5 Progressive Web App (PWA)

- Vollständige Offline-Karte ist in der Entwicklung
- `viewport-fit=cover` für notch-sichere Darstellung (iPhone)
- Safe Area Insets: `env(safe-area-inset-bottom)` in BottomNav und Sheets

---

## 7. Technische Architektur

### 7.1 Stack

| Schicht | Technologie |
| :--- | :--- |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Karte | MapLibre GL JS (WebGL), Nominatim (Geocoding) |
| Routing | OSRM (Open Source Routing Machine) |
| Stations-Daten | BNetzA Ladesäulenregister + OpenChargeMap API |
| Backend / Auth | Supabase (PostgreSQL + RLS + Edge Functions) |
| Deployment | Vercel (serverless + Edge) |
| Tests | Vitest (Unit, 100% Coverage) |
| i18n | next-intl (DE + EN) |
| Dokumentation | Markdown (GitHub Pages-fähig) |

### 7.2 Middleware-Checks

1. **API-Guard:** `/api/*` werden direkt durchgeleitet – kein Locale-Redirect (verhindert 404 auf API-Routen)
2. **Auth-Check:** Nicht eingeloggt → `/auth/login` (nur für geschützte Routen)
3. **Plan-Check:** Free auf gesperrtem Feature → `PlanGate`-Komponente mit Upgrade-CTA
4. **Locale-Redirect:** `/` → `/de/map`
5. **Admin-Guard:** Nicht-Admin auf `/admin/*` → `/dashboard`

### 7.3 API-Routen

| Endpoint | Methode | Beschreibung |
| :--- | :--- | :--- |
| `/api/stations` | GET | Ladesäulen im Viewport (BNetzA + OCM) |
| `/api/geocode` | GET | Adressen-Suche (Nominatim-Proxy) |
| `/api/reports` | POST | Community-Meldung absenden |
| `/api/tariffs` | GET | Tarife für eine Station |
| `/api/prices` | GET | Aktuelle Ladepreise |
| `/api/news-feed` | GET | Günstigste Stationen im Umkreis |
| `/api/cron/bnetza-sync` | POST | Tägliche Synchronisierung (Vercel Cron) |

### 7.4 Datenbankschema (Supabase)

Haupttabellen:

| Tabelle | Beschreibung |
| :--- | :--- |
| `profiles` | Nutzerprofil (Name, Plan, Rolle) |
| `vehicles` | Fahrzeugprofile (Modell, Kapazität, Reichweite) |
| `stations` | Lokale Station-Daten (BNetzA-Import) |
| `station_reports` | Community-Meldungen |
| `saved_routes` | Gespeicherte Routen |
| `user_consents` | DSGVO-Einwilligungen |

### 7.5 Cron Job

Täglich 03:00 UTC via Vercel Cron:
- BNetzA-Ladesäulenregister synchronisieren
- Stale Stationen markieren

---

## 8. Compliance und DSGVO

Bei Registrierung und Einladungs-Annahme Pflicht-Zustimmung zu:
1. Allgemeine Geschäftsbedingungen (AGB)
2. Datenschutzerklärung
3. DSGVO-konforme Datenverarbeitung

**Jede Einwilligung wird in `user_consents` gespeichert mit:**
- `user_id`
- Typ (terms, privacy, dsgvo)
- Version (z.B. `2026-04-13`)
- Zeitstempel (`accepted_at`)

**Rechtliche Seiten:**

| Seite | URL |
| :--- | :--- |
| Impressum | `/de/legal/impressum` |
| Datenschutzerklärung | `/de/legal/datenschutz` |
| AGB | `/de/legal/agb` |

**Datenlöschung:**
- Nutzer kann unter `/settings` Kontolöschung beantragen
- Nach Kontolöschung: personenbezogene Daten werden innerhalb von 30 Tagen gelöscht

---

## 9. Glossar

| Begriff | Erklärung |
| :--- | :--- |
| AC | Alternating Current – Wechselstrom, typisch 3,7–22 kW |
| DC | Direct Current – Gleichstrom, typisch 50–150 kW |
| HPC | High Power Charging – Ultraschnellladen, ≥ 150 kW |
| BNetzA | Bundesnetzagentur – offizielles Ladesäulenregister |
| OCM | OpenChargeMap – globale Open-Data-Datenbank |
| OSRM | Open Source Routing Machine – Open-Source-Routenberechnung |
| Nominatim | OpenStreetMap-basierter Geocoding-Service |
| MapLibre GL | Open-Source-Karten-Rendering auf WebGL-Basis |
| EV-Pin | Farbiger Teardrop-Marker auf der Karte je Ladesäulentyp (HPC/DC/AC/Offline) |
| NearbyFeed | Dashboard-Komponente die günstige Stationen in der Nähe des Nutzers anzeigt |
| PlanGate | UI-Komponente, die Features basierend auf dem Tarif sperrt |
| BottomNav | Fixierter Tab-Balken am unteren Bildschirmrand (mobile) |
| MobileSheet | Bottom Sheet – Panel, das von unten einschiebt (mobile) |
| RLS | Row Level Security – PostgreSQL-Datenisolation auf Zeilenebene |
| SoC | State of Charge – Ladestand in Prozent |
| FAB | Floating Action Button – schwebender Aktionsknopf auf der Karte |
| Turn-by-Turn | Schritt-für-Schritt-Navigation mit gesprochenen/angezeigten Anweisungen |

---

*LadeKompass Produkthandbuch – Version 1.1 – April 2026*  
*© WAMOCON, Deutschland. Alle Rechte vorbehalten.*
