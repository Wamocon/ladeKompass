import { getSavedRoutes, deleteSavedRoute } from "@/lib/actions/route";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import RouteArchiveClient from "./RouteArchiveClient";

export const dynamic = "force-dynamic";

export default async function RouteArchivePage() {
  const t = await getTranslations("route");
  const { routes, error } = await getSavedRoutes();

  if (error === "NOT_AUTHENTICATED") {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-base)]">
              {t("archive_title", { fallback: "Gespeicherte Routen" })}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {t("archive_subtitle", { fallback: "Deine archivierten Routenpläne" })}
            </p>
          </div>
          <a
            href="../route"
            className="text-sm font-medium px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
          >
            {t("new_route", { fallback: "Neue Route" })}
          </a>
        </div>

        {error && error !== "NOT_AUTHENTICATED" && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <RouteArchiveClient
          initialRoutes={routes}
          deleteAction={deleteSavedRoute}
        />
      </div>
    </main>
  );
}
