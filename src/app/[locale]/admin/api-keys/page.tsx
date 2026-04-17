import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Shield, Key, ExternalLink, Check, AlertCircle } from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: `API-Keys – ${t("title")} – LadeKompass` };
}

interface ApiKeyInfo {
  key: string;
  label: string;
  description: string;
  envVar: string;
  currentValue: string;
  docsUrl: string;
  freeSignupUrl: string;
  required: boolean;
}

export default async function AdminApiKeysPage({ params }: Props) {
  const { locale } = await params;

  // Guard: only super_admin
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      db: { schema: process.env.SUPABASE_DB_SCHEMA ?? "ladekompass-dev" },
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => {
          try {
            for (const { name, value, options } of cs) cookieStore.set(name, value, options);
          } catch {
            // Server Component — token refresh silent
          }
        },
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/${locale}/auth/login`);
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "super_admin") redirect(`/${locale}/admin`);
  }

  const apiKeys: ApiKeyInfo[] = [
    {
      key: "ocm",
      label: "Open Charge Map API",
      description: "Ladesäulen-Daten weltweit inkl. Bundesnetzagentur-Daten. Kostenlos bis 1.000+ Anfragen/min.",
      envVar: "OCM_API_KEY",
      currentValue: process.env.OCM_API_KEY ? "✓ gesetzt" : "nicht gesetzt",
      docsUrl: "https://openchargemap.org/site/develop/api",
      freeSignupUrl: "https://openchargemap.org/site/loginprovider",
      required: true,
    },
    {
      key: "chargeprice",
      label: "Chargeprice API",
      description: "Echtzeit-Tarifvergleich (EnBW, ionity, ARAL etc.). Kostenlose Testlizenz für Non-Profit/Open-Source.",
      envVar: "CHARGEPRICE_API_KEY",
      currentValue: process.env.CHARGEPRICE_API_KEY ? "✓ gesetzt" : "nicht gesetzt",
      docsUrl: "https://www.chargeprice.app/api-access",
      freeSignupUrl: "mailto:info@chargeprice.app?subject=API Access Request - LadeKompass Open Source",
      required: false,
    },
    {
      key: "google_maps",
      label: "Google Maps / Geocoding API",
      description: "Adress-Autovervollständigung und Geocoding. Kostenloses Kontingent: 200 USD/Monat (~40.000 Requests).",
      envVar: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
      currentValue: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "✓ gesetzt" : "nicht gesetzt",
      docsUrl: "https://developers.google.com/maps/documentation/geocoding",
      freeSignupUrl: "https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com",
      required: false,
    },
    {
      key: "resend",
      label: "Resend (E-Mail)",
      description: "Transaktionsmails (Passwort-Reset, Bestätigungen). Kostenloses Tier: 100 E-Mails/Tag.",
      envVar: "RESEND_API_KEY",
      currentValue: process.env.RESEND_API_KEY ? "✓ gesetzt" : "nicht gesetzt",
      docsUrl: "https://resend.com/docs",
      freeSignupUrl: "https://resend.com/signup",
      required: false,
    },
  ];

  return (
    <main className="min-h-screen bg-(--bg-page) px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={22} className="text-(--primary)" />
          <h1 className="text-xl font-bold text-(--text-base)">API-Keys & Externe Dienste</h1>
        </div>
        <p className="text-sm text-(--text-muted) mb-8">
          Übersicht aller externen API-Keys und wie du sie einträgst. Keys werden in{" "}
          <code className="bg-(--bg-elevated) px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code>{" "}
          gesetzt (lokal) oder als Vercel Environment Variable (Produktion).
        </p>

        {/* .env.local Guide */}
        <div className="bg-(--bg-surface) border border-(--border) rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Key size={16} className="text-(--primary)" />
            <h2 className="text-sm font-bold text-(--text-base)">Wie trage ich einen Key ein?</h2>
          </div>
          <div className="space-y-3 text-sm text-(--text-muted)">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-(--primary) text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <p>Öffne <code className="bg-(--bg-elevated) px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code> im Projektordner</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-(--primary) text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <p>Trage den Key ein: <code className="bg-(--bg-elevated) px-1.5 py-0.5 rounded text-xs font-mono">OCM_API_KEY=dein-key-hier</code></p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-(--primary) text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <p>Dev-Server neu starten: <code className="bg-(--bg-elevated) px-1.5 py-0.5 rounded text-xs font-mono">npm run dev</code></p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0">P</span>
              <p><strong>Produktion (Vercel):</strong> Vercel Dashboard → dein Projekt → Settings → Environment Variables → Key + Wert hinzufügen → Redeploy</p>
            </div>
          </div>
        </div>

        {/* API Key Cards */}
        <div className="space-y-4">
          {apiKeys.map((api) => {
            const isSet = api.currentValue.startsWith("✓");
            return (
              <div
                key={api.key}
                className={`bg-(--bg-surface) border rounded-2xl p-5 ${
                  isSet ? "border-green-200 dark:border-green-900" : api.required ? "border-amber-200 dark:border-amber-900" : "border-(--border)"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-(--text-base)">{api.label}</h3>
                      {api.required && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold uppercase">
                          Pflicht
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-(--text-muted) mb-3">{api.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <code className="bg-(--bg-elevated) px-2 py-1 rounded font-mono text-(--text-muted)">
                        {api.envVar}
                      </code>
                      <span className={`flex items-center gap-1 font-semibold ${isSet ? "text-green-600" : "text-(--text-muted)"}`}>
                        {isSet ? <Check size={12} /> : <AlertCircle size={12} />}
                        {api.currentValue}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <a
                      href={api.freeSignupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-(--primary) hover:bg-(--primary-hover) text-white text-xs font-semibold transition-colors"
                    >
                      <Key size={11} />
                      Key holen
                    </a>
                    <a
                      href={api.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-(--border) text-xs text-(--text-muted) hover:bg-(--bg-elevated) transition-colors"
                    >
                      <ExternalLink size={11} />
                      Docs
                    </a>
                  </div>
                </div>

                {/* Quick signup guide */}
                {!isSet && (
                  <div className="mt-3 pt-3 border-t border-(--border)">
                    {api.key === "ocm" && (
                      <ol className="text-xs text-(--text-muted) space-y-1 list-decimal list-inside">
                        <li>openchargemap.org → oben rechts <strong>Register</strong></li>
                        <li>Konto erstellen (E-Mail + Passwort)</li>
                        <li>Nach Login: <strong>My Profile → API Key</strong> → kopieren</li>
                        <li>In <code className="bg-(--bg-elevated) px-1 rounded font-mono">.env.local</code> eintragen: <code className="bg-(--bg-elevated) px-1 rounded font-mono">OCM_API_KEY=xxx</code></li>
                      </ol>
                    )}
                    {api.key === "chargeprice" && (
                      <ol className="text-xs text-(--text-muted) space-y-1 list-decimal list-inside">
                        <li>E-Mail an <strong>info@chargeprice.app</strong></li>
                        <li>Betreff: &ldquo;API Access - LadeKompass Open Source&rdquo;</li>
                        <li>Key wird per Mail zurückgeschickt (1-3 Werktage)</li>
                      </ol>
                    )}
                    {api.key === "google_maps" && (
                      <ol className="text-xs text-(--text-muted) space-y-1 list-decimal list-inside">
                        <li>console.cloud.google.com → Projekt erstellen</li>
                        <li>APIs &amp; Services → Geocoding API aktivieren</li>
                        <li>Credentials → API Key erstellen → HTTP-Referrer einschränken</li>
                        <li>In <code className="bg-(--bg-elevated) px-1 rounded font-mono">.env.local</code>: <code className="bg-(--bg-elevated) px-1 rounded font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx</code></li>
                      </ol>
                    )}
                    {api.key === "resend" && (
                      <ol className="text-xs text-(--text-muted) space-y-1 list-decimal list-inside">
                        <li>resend.com → <strong>Sign Up</strong> (kostenlos)</li>
                        <li>Domain verifizieren oder Subdomain einrichten</li>
                        <li>API Keys → <strong>Create API Key</strong></li>
                        <li>In <code className="bg-(--bg-elevated) px-1 rounded font-mono">.env.local</code>: <code className="bg-(--bg-elevated) px-1 rounded font-mono">RESEND_API_KEY=re_xxx</code></li>
                      </ol>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BNetzA note */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-(--text-base) mb-2">🏢 Bundesnetzagentur — Kein API-Key nötig</h3>
          <p className="text-xs text-(--text-muted) mb-3">
            Die BNetzA hat keine öffentliche Echtzeit-API. Ihre Ladesäulendaten werden direkt in die Open Charge Map eingespeist — der OCM API Key reicht daher aus.
          </p>
          <a
            href="https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/E-Mobilitaet/Ladesaeulenkarte/start.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink size={11} />
            BNetzA Ladesäulenregister (CSV/Excel Download)
          </a>
        </div>
      </div>
    </main>
  );
}
