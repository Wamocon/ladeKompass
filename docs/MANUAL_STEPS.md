# Manuelle Schritte — LadeKompass Setup

Diese Schritte müssen **manuell** im Supabase Dashboard oder in Vercel durchgeführt werden und können nicht automatisiert werden.

---

## 1. Supabase Dashboard – Migrationen ausführen

Öffne das [Supabase SQL-Editor](https://app.supabase.com/) → dein Projekt → **SQL Editor**.

### Migration 1: Rekursive RLS-Richtlinien beheben
Datei: `supabase/migrations/20260415000004_fix-recursive-rls.sql`

Führe den SQL-Inhalt dieser Datei aus. Er behebt infinite Rekursion in den `profiles`-Policies.

### Migration 2: BNetzA-Tabellen anlegen
Datei: `supabase/migrations/20260415000005_bnetza-stations.sql`

Führe den SQL-Inhalt aus. Er legt folgende Tabellen im Schema `ladekompass-dev` an:
- `ladekompass-dev.bnetza_stations` – Ladesäulen aus dem BNetzA-Register
- `ladekompass-dev.bnetza_sync_log` – Protokollierung der Synchronisierungsläufe

### Migration 3: Gespeicherte Routen
Datei: `supabase/migrations/20260415000006_saved-routes.sql`

Legt die Tabelle `ladekompass-dev.saved_routes` zum Speichern von Routenplänen an.

> **Hinweis:** Alle Tabellen müssen im Schema `ladekompass-dev` existieren, da `SUPABASE_DB_SCHEMA=ladekompass-dev` gesetzt ist. Überprüfe nach der Migration im Table Editor, ob die Tabellen sichtbar sind.

---

## 2. Supabase Dashboard – Schema-Berechtigung prüfen

Stelle sicher, dass die Schema-Nutzung für `ladekompass-dev` erlaubt ist:

```sql
-- Im SQL Editor ausführen:
GRANT USAGE ON SCHEMA "ladekompass-dev" TO anon, authenticated, service_role;
```

Dies ist in `20260415000003_grant-schema-usage.sql` enthalten.

---

## 3. Vercel Dashboard – Umgebungsvariablen setzen

Öffne [Vercel Dashboard](https://vercel.com/) → dein Projekt → **Settings → Environment Variables**.

Folgende Variablen müssen gesetzt sein:

| Variable | Wert | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (Service Role) | Production, Preview |
| `SUPABASE_DB_SCHEMA` | `ladekompass-dev` | Production, Preview, Development |
| `CRON_SECRET` | Ein langer zufälliger String (z.B. `openssl rand -hex 32`) | Production |
| `OCM_API_KEY` | OpenChargeMap API-Key (optional) | Production, Preview, Development |

> **Sicherheitshinweis:** `SUPABASE_SERVICE_ROLE_KEY` darf **niemals** mit `NEXT_PUBLIC_` präfixiert werden. Dieser Schlüssel umgeht RLS und darf nur serverseitig verwendet werden.

---

## 4. BNetzA-Cron manuell testen (optional)

Nachdem `CRON_SECRET` gesetzt und deployted ist, kannst du den Cron-Job manuell testen:

```bash
curl -H "Authorization: Bearer DEIN_CRON_SECRET" \
  https://deine-app.vercel.app/api/cron/bnetza-sync
```

Erwartete Antwort:
```json
{ "success": true, "rowsUpserted": 12345, "duration": "45.2s" }
```

Der Cron läuft automatisch jeden **Montag um 03:00 UTC** (konfiguriert in `vercel.json`).

---

## 5. OpenChargeMap API-Key (empfohlen)

Das Projekt fragt Ladesäulendaten über die OCM-API ab. Ohne API-Key ist das Rate-Limit sehr niedrig.

1. Registriere dich auf [openchargemap.io](https://openchargemap.io/site/develop/apps)
2. Erstelle eine neue App → erhalte einen API-Key
3. Setze `OCM_API_KEY` in Vercel (siehe Schritt 3)

---

## 6. Lokale Entwicklung

Kopiere `.env.local.example` zu `.env.local` und fülle die Werte aus:

```bash
cp .env.local.example .env.local
```

Dann:
```bash
npm install
npm run dev
```

App läuft auf `http://localhost:3000`.

---

## 7. Farbkodierung der Ladestationen (Karte)

| Farbe | Bedeutung |
|---|---|
| 🟢 Neon-Grün | HPC / Ultraschnell (≥ 150 kW) |
| 🔵 Neon-Cyan | DC Schnell (50–149 kW) |
| 🟣 Violett | DC Semi-Fast (22–49 kW) |
| 🟢 Grün | AC (< 22 kW) |
| 🟡 Amber | Unbekannte Leistung |
| 🔴 Rot | Nicht verfügbar / offline |

---

## 8. Bekannte Einschränkungen

- **BNetzA-XLSX**: Die BNetzA ändert gelegentlich das Spaltenformat. Falls der Cron fehlschlägt, prüfe `bnetza_sync_log` und passe ggf. die Spalten-Mappings in `src/app/api/cron/bnetza-sync/route.ts` an.
- **Nominatim-Geocoding**: Kostenlos, aber Rate-limitiert. Bei hohem Traffic sollte ein eigener Geocoding-Service eingebunden werden.
- **OCM-API**: Gibt maximal 500 Ergebnisse pro Anfrage zurück.
