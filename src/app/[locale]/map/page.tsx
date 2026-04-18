import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MapClientLoader } from "@/components/map/MapClientLoader";

interface MapPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: MapPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "map" });
  return { title: `${t("title")} – LadeKompass` };
}

export default function MapPage() {
  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100svh - 56px)" }}
    >
      <MapClientLoader />
    </div>
  );
}
