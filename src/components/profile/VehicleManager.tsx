"use client";

import { useEffect, useState, startTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Star, Pencil } from "lucide-react";
import { listVehicles, deleteVehicle } from "@/lib/actions/vehicles";
import type { Vehicle } from "@/lib/actions/vehicles";
import { VehicleForm } from "./VehicleForm";

export function VehicleManager() {
  const t = useTranslations("vehicle");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Vehicle | null | "new">(null);

  async function load() {
    setLoading(true);
    const data = await listVehicles();
    setVehicles(data);
    setLoading(false);
  }

  useEffect(() => { startTransition(() => { load(); }); }, []);

  async function handleDelete(id: string) {
    if (!confirm(t("delete_confirm", { fallback: "Fahrzeug löschen?" }))) return;
    await deleteVehicle(id);
    await load();
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-14 rounded-xl bg-[var(--bg-elevated)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (editing) {
    return (
      <VehicleForm
        vehicle={editing === "new" ? undefined : editing}
        onDone={() => {
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {vehicles.map((v) => (
        <div
          key={v.id}
          className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[var(--text-base)] truncate">
                {v.name}
              </p>
              {v.is_default && (
                <Star
                  size={12}
                  className="text-amber-500 fill-amber-500 shrink-0"
                />
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {[v.brand, v.model].filter(Boolean).join(" ")}
              {v.battery_kwh ? ` · ${v.battery_kwh} kWh` : ""}
              {v.connector_type ? ` · ${v.connector_type.toUpperCase()}` : ""}
            </p>
          </div>
          <button
            onClick={() => setEditing(v)}
            className="shrink-0 p-1.5 rounded-lg hover:bg-[var(--bg-page)] transition-colors text-[var(--text-muted)]"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => handleDelete(v.id)}
            className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-[var(--text-muted)] hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {vehicles.length === 0 && (
        <p className="text-sm text-[var(--text-muted)] text-center py-4">
          {t("no_vehicles", {
            fallback: "Noch keine Fahrzeuge angelegt.",
          })}
        </p>
      )}

      <button
        onClick={() => setEditing("new")}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] py-2.5 text-sm text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
      >
        <Plus size={15} />
        {t("add_vehicle", { fallback: "Fahrzeug hinzufügen" })}
      </button>
    </div>
  );
}
