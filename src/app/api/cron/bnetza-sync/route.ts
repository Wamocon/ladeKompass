import { type NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createServiceClient } from "@/lib/supabase/server";

// BNetzA public XLSX download URL
const BNETZA_URL =
  "https://www.bundesnetzagentur.de/SharedDocs/Downloads/DE/Sachgebiete/Energie/Unternehmen_Institutionen/E_Mobilitaet/Ladesaeulenregister.xlsx?__blob=publicationFile";

// Batch size for upsert operations
const BATCH_SIZE = 500;

// Vercel cron / manual trigger — protected by CRON_SECRET
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow unauthenticated access only in development
  if (process.env.NODE_ENV === "production") {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServiceClient();
  const schema = process.env.SUPABASE_DB_SCHEMA ?? "public";

  // Start sync log entry
  const { data: logEntry, error: logError } = await supabase
    .schema(schema as "public")
    .from("bnetza_sync_log")
    .insert({ status: "running" })
    .select("id")
    .single();

  if (logError || !logEntry) {
    console.error("Failed to create sync log entry:", logError);
    return NextResponse.json({ error: "Failed to init sync log" }, { status: 500 });
  }

  const logId = logEntry.id as number;

  async function failSync(message: string) {
    await supabase
      .schema(schema as "public")
      .from("bnetza_sync_log")
      .update({ status: "error", error_msg: message, finished_at: new Date().toISOString() })
      .eq("id", logId);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // --- 1. Download XLSX -----------------------------------------------------
  let xlsxBuffer: ArrayBuffer;
  try {
    const res = await fetch(BNETZA_URL, {
      headers: { "User-Agent": "LadeKompass-Cron/1.0" },
      // No cache — always fetch fresh
      cache: "no-store",
    });
    if (!res.ok) {
      return failSync(`BNetzA download failed: HTTP ${res.status}`);
    }
    xlsxBuffer = await res.arrayBuffer();
  } catch (err) {
    return failSync(`BNetzA download error: ${String(err)}`);
  }

  // --- 2. Parse XLSX ---------------------------------------------------------
  let rows: Record<string, string>[];
  try {
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(new Uint8Array(xlsxBuffer) as any);
    const worksheet = workbook.worksheets[0];
    const headers: string[] = [];
    worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
      headers.push(String(cell.value ?? "").trim());
    });
    rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowData: Record<string, string> = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber - 1] ?? `col_${colNumber}`;
        const val: unknown = cell.value;
        if (typeof val === "object" && val !== null && !Array.isArray(val) && "richText" in val) {
          rowData[header] = ((val as { richText: { text: string }[] }).richText ?? []).map(r => r.text).join("");
        } else if (val instanceof Date) {
          rowData[header] = val.toISOString().split("T")[0];
        } else {
          rowData[header] = val == null ? "" : String(val);
        }
      });
      rows.push(rowData);
    });
  } catch (err) {
    return failSync(`XLSX parse error: ${String(err)}`);
  }

  if (rows.length === 0) {
    return failSync("XLSX contained no rows");
  }

  // --- 3. Transform rows  ---------------------------------------------------
  // BNetzA columns (German headers, may vary slightly between releases):
  //   Betreiber, Straße, Hausnummer, Adresszusatz, Postleitzahl, Ort, Bundesland,
  //   Landkreis, Breitengrad, Längengrad, Inbetriebnahmedatum,
  //   Nennleistung [kW], Steckertypen1, P1 [kW], Steckertypen2, P2 [kW], ...

  function parseCoord(raw: string): number | null {
    if (!raw) return null;
    const n = parseFloat(raw.replace(",", "."));
    return isNaN(n) ? null : n;
  }

  function parseKw(raw: string): number | null {
    if (!raw) return null;
    const n = parseFloat(raw.replace(",", "."));
    return isNaN(n) ? null : n;
  }

  function parseDate(raw: string): string | null {
    if (!raw) return null;
    // Try DD.MM.YYYY format
    const parts = raw.split(".");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    return null;
  }

  // Helper to find column by partial German name
  const colKeys = rows.length > 0 ? Object.keys(rows[0]) : [];
  function findCol(...candidates: string[]): string {
    for (const c of candidates) {
      const found = colKeys.find((k) => k.toLowerCase().includes(c.toLowerCase()));
      if (found) return found;
    }
    return "";
  }

  const COL_BETREIBER    = findCol("Betreiber");
  const COL_STRASSE      = findCol("Stra");
  const COL_HAUSNR       = findCol("Hausnummer");
  const COL_ZUSATZ       = findCol("Adresszusatz");
  const COL_PLZ          = findCol("Postleitzahl");
  const COL_ORT          = findCol("Ort");
  const COL_BUNDESLAND   = findCol("Bundesland");
  const COL_KREIS        = findCol("Landkreis", "Kreis");
  const COL_LAT          = findCol("Breitengrad");
  const COL_LNG          = findCol("ngengrad"); // Längengrad
  const COL_DATUM        = findCol("Inbetriebnahmedatum");
  const COL_KW           = findCol("Nennleistung");
  const COL_ANSCHLUSS1   = findCol("Steckertypen1");
  const COL_KW1          = findCol("P1");
  const COL_ANSCHLUSS2   = findCol("Steckertypen2");
  const COL_KW2          = findCol("P2");
  const COL_ANSCHLUSS3   = findCol("Steckertypen3");
  const COL_KW3          = findCol("P3");
  const COL_ANSCHLUSS4   = findCol("Steckertypen4");
  const COL_KW4          = findCol("P4");

  type StationRow = {
    betreiber: string | null;
    strasse: string | null;
    hausnummer: string | null;
    adresszusatz: string | null;
    postleitzahl: string | null;
    ort: string | null;
    bundesland: string | null;
    kreis_kreisfreie_stadt: string | null;
    breitengrad: number;
    laengengrad: number;
    inbetriebnahmedatum: string | null;
    nennleistung_kw: number | null;
    anschluss_1: string | null;
    kw_1: number | null;
    anschluss_2: string | null;
    kw_2: number | null;
    anschluss_3: string | null;
    kw_3: number | null;
    anschluss_4: string | null;
    kw_4: number | null;
    bnetza_id: string;
    last_synced_at: string;
  };

  const now = new Date().toISOString();
  const stations: StationRow[] = [];
  let skipped = 0;

  for (const row of rows) {
    const lat = parseCoord(row[COL_LAT]);
    const lng = parseCoord(row[COL_LNG]);
    if (lat === null || lng === null) { skipped++; continue; }

    const betreiber  = (row[COL_BETREIBER] ?? "").trim() || null;
    const strasse    = (row[COL_STRASSE] ?? "").trim() || null;
    const hausnummer = (row[COL_HAUSNR] ?? "").trim() || null;
    const plz        = (row[COL_PLZ] ?? "").trim() || null;
    const ort        = (row[COL_ORT] ?? "").trim() || null;

    // Build a stable composite ID
    const bnetza_id = [betreiber, strasse, hausnummer, plz, ort, lat, lng]
      .join("|")
      .toLowerCase()
      .replace(/\s+/g, " ");

    stations.push({
      betreiber,
      strasse,
      hausnummer,
      adresszusatz: (row[COL_ZUSATZ] ?? "").trim() || null,
      postleitzahl: plz,
      ort,
      bundesland:   (row[COL_BUNDESLAND] ?? "").trim() || null,
      kreis_kreisfreie_stadt: (row[COL_KREIS] ?? "").trim() || null,
      breitengrad:  lat,
      laengengrad:  lng,
      inbetriebnahmedatum: parseDate(row[COL_DATUM]),
      nennleistung_kw: parseKw(row[COL_KW]),
      anschluss_1: (row[COL_ANSCHLUSS1] ?? "").trim() || null,
      kw_1:        parseKw(row[COL_KW1]),
      anschluss_2: (row[COL_ANSCHLUSS2] ?? "").trim() || null,
      kw_2:        parseKw(row[COL_KW2]),
      anschluss_3: (row[COL_ANSCHLUSS3] ?? "").trim() || null,
      kw_3:        parseKw(row[COL_KW3]),
      anschluss_4: (row[COL_ANSCHLUSS4] ?? "").trim() || null,
      kw_4:        parseKw(row[COL_KW4]),
      bnetza_id,
      last_synced_at: now,
    });
  }

  // --- 4. Batch upsert into Supabase ----------------------------------------
  let totalUpserted = 0;
  let totalFailed   = 0;

  for (let i = 0; i < stations.length; i += BATCH_SIZE) {
    const batch = stations.slice(i, i + BATCH_SIZE);
    const { error: upsertError } = await supabase
      .schema(schema as "public")
      .from("bnetza_stations")
      .upsert(batch, { onConflict: "bnetza_id", ignoreDuplicates: false });

    if (upsertError) {
      console.error(`Upsert batch ${i}–${i + batch.length} failed:`, upsertError);
      totalFailed += batch.length;
    } else {
      totalUpserted += batch.length;
    }
  }

  // --- 5. Update sync log ---------------------------------------------------
  await supabase
    .schema(schema as "public")
    .from("bnetza_sync_log")
    .update({
      status:        totalFailed === 0 ? "success" : "error",
      rows_fetched:  rows.length,
      rows_upserted: totalUpserted,
      rows_failed:   totalFailed,
      finished_at:   new Date().toISOString(),
      error_msg:     totalFailed > 0 ? `${totalFailed} rows failed` : null,
    })
    .eq("id", logId);

  return NextResponse.json({
    ok:           true,
    rowsFetched:  rows.length,
    rowsSkipped:  skipped,
    rowsUpserted: totalUpserted,
    rowsFailed:   totalFailed,
  });
}
