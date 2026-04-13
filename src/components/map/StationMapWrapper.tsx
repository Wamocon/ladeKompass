"use client";

import { useState, useCallback } from "react";
import { StationMap } from "./StationMap";
import { StationFilters } from "./StationFilters";
import { StationSearch } from "./StationSearch";
import type { StationFiltersState } from "./StationFilters";

export default function StationMapWrapper() {
  const [filters, setFilters] = useState<StationFiltersState>({
    powerLevel: null,
    connectorType: null,
  });

  const [center, setCenter] = useState<[number, number] | null>(null);

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setCenter([lat, lng]);
  }, []);

  return (
    <div className="relative flex-1 flex flex-col h-full">
      {/* Search + Filter bar */}
      <div className="absolute top-3 left-3 right-3 z-[500] flex gap-2">
        <div className="flex-1">
          <StationSearch onLocationSelect={handleLocationSelect} />
        </div>
        <StationFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Map */}
      <StationMap
        defaultCenter={center ?? [51.1657, 10.4515]}
        filters={filters}
        flyToCenter={center}
      />
    </div>
  );
}
