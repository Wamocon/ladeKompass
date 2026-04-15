"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Loader, MapPin } from "lucide-react";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface StationSearchProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

export function StationSearch({ onLocationSelect }: StationSearchProps) {
  const t = useTranslations("map");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function search(value: string) {
    setQuery(value);
    if (value.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`);
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } finally {
      setLoading(false);
    }
  }

  function select(result: NominatimResult) {
    onLocationSelect(parseFloat(result.lat), parseFloat(result.lon));
    setQuery(result.display_name.split(",")[0]);
    setOpen(false);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      onLocationSelect(pos.coords.latitude, pos.coords.longitude);
    });
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-[var(--bg-surface)]/95 backdrop-blur-sm border border-[var(--border)] rounded-xl shadow px-3 py-2">
        {loading ? (
          <Loader size={16} className="text-[var(--text-muted)] animate-spin shrink-0" />
        ) : (
          <Search size={16} className="text-[var(--text-muted)] shrink-0" />
        )}
        <input
          type="search"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder={t("search_placeholder")}
          className="flex-1 bg-transparent text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none min-w-0"
        />
        <button
          onClick={useMyLocation}
          title={t("locate_me")}
          className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors ml-1"
        >
          <MapPin size={16} />
        </button>
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-[600]">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => select(r)}
              className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-base)] hover:bg-[var(--bg-elevated)] transition-colors border-b border-[var(--border)] last:border-b-0 truncate"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
