"use client";

import { useEffect, useState, startTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Star, Pencil, Zap, Battery, Calendar, Gauge, AlertTriangle, CheckCircle } from "lucide-react";
import { listVehicles, deleteVehicle } from "@/lib/actions/vehicles";
import type { Vehicle } from "@/lib/actions/vehicles";
import { VehicleForm } from "./VehicleForm";

const CONNECTOR_COLORS: Record<string, string> = {
  ccs: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  type2: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  chademo: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  tesla_ccs: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function ExpiryBadge({ label, date }: { label: string; date?: string }) {
  if (!date) return null;
  // eslint-disable-next-line react-hooks/purity
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  const isWarn = days < 60;
  const isExpired = days < 0;
  return (
    <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
      isExpired ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
      isWarn ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
      "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
    }`}>
      {isExpired ? <AlertTriangle size={9} /> : <CheckCircle size={9} />}
      {label} {isExpired ? "abgelaufen" : `noch ${days}d`}
    </span>
  );
}

function VehicleCard({ v, onEdit, onDelete }: { v: Vehicle; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const maxPower = v.max_charge_kw ?? 0;
  const powerColor = maxPower >= 150 ? "text-purple-600" : maxPower >= 50 ? "text-blue-600" : "text-green-600";

  return (
    <div className={`rounded-2xl border bg-(--bg-surface) transition-all ${v.is_default ? "border-(--primary)" : "border-(--border)"}`}>
      {/* Card Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Color swatch + brand initial */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0`}
          style={{ background: v.color ? `var(--tw-prose-pre-bg, ${colorToHex(v.color)})` : "var(--primary)" }}>
          {(v.brand ?? v.name).charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-(--text-base) truncate">{v.name}</p>
            {v.is_default && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
            {v.license_plate && (
              <span className="text-[10px] px-2 py-0.5 rounded border border-(--border) font-mono text-(--text-muted) bg-(--bg-elevated)">
                {v.license_plate}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {v.brand && <span className="text-xs text-(--text-muted)">{v.brand} {v.model}</span>}
            {v.year && <span className="text-xs text-(--text-muted)">· {v.year}</span>}
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-2 shrink-0">
          {v.battery_kwh && (
            <div className="flex items-center gap-1 text-xs font-semibold text-(--text-muted)">
              <Battery size={12} />
              {v.battery_kwh}kWh
            </div>
          )}
          {maxPower > 0 && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${powerColor}`}>
              <Zap size={12} />
              {maxPower}kW
            </div>
          )}
          {v.connector_type && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${CONNECTOR_COLORS[v.connector_type] ?? "bg-zinc-100 text-zinc-500"}`}>
              {v.connector_type === "tesla_ccs" ? "Tesla" : v.connector_type.toUpperCase()}
            </span>
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-(--border) px-4 py-3 space-y-3">
          {/* Tech specs */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {v.range_km && (
              <div className="flex items-center gap-1.5 text-(--text-muted)">
                <Gauge size={12} /> WLTP-Reichweite: <span className="font-semibold text-(--text-base)">{v.range_km} km</span>
              </div>
            )}
            {v.efficiency_kwh_per_100km && (
              <div className="flex items-center gap-1.5 text-(--text-muted)">
                <Zap size={12} /> Verbrauch: <span className="font-semibold text-(--text-base)">{v.efficiency_kwh_per_100km} kWh/100km</span>
              </div>
            )}
            {v.ac_charge_kw && (
              <div className="flex items-center gap-1.5 text-(--text-muted)">
                <Zap size={12} /> AC-Laden: <span className="font-semibold text-(--text-base)">{v.ac_charge_kw} kW</span>
              </div>
            )}
            {v.mileage_km && (
              <div className="flex items-center gap-1.5 text-(--text-muted)">
                <Gauge size={12} /> KM-Stand: <span className="font-semibold text-(--text-base)">{v.mileage_km.toLocaleString("de-DE")} km</span>
              </div>
            )}
            {v.purchase_date && (
              <div className="flex items-center gap-1.5 text-(--text-muted)">
                <Calendar size={12} /> Kauf: <span className="font-semibold text-(--text-base)">{new Date(v.purchase_date).toLocaleDateString("de-DE")}</span>
              </div>
            )}
            {v.vin && (
              <div className="flex items-center gap-1.5 text-(--text-muted) col-span-2">
                FIN: <span className="font-mono text-[11px] text-(--text-base)">{v.vin}</span>
              </div>
            )}
          </div>

          {/* SoC preference bar */}
          {(v.preferred_soc_min !== undefined || v.preferred_soc_max !== undefined) && (
            <div>
              <p className="text-xs text-(--text-muted) mb-1">Lade-Fenster</p>
              <div className="relative h-3 bg-(--bg-elevated) rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-gradient-to-r from-amber-400 to-green-500 rounded-full"
                  style={{ left: `${v.preferred_soc_min ?? 20}%`, width: `${(v.preferred_soc_max ?? 80) - (v.preferred_soc_min ?? 20)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-(--text-muted) mt-0.5">
                <span>0%</span>
                <span className="text-amber-500 font-bold">{v.preferred_soc_min ?? 20}%</span>
                <span className="text-green-600 font-bold">{v.preferred_soc_max ?? 80}%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Expiry badges */}
          <div className="flex gap-2 flex-wrap">
            <ExpiryBadge label="Versicherung" date={v.insurance_expiry} />
            <ExpiryBadge label="TÜV/HU" date={v.tuev_expiry} />
          </div>

          {v.notes && (
            <p className="text-xs text-(--text-muted) bg-(--bg-elevated) rounded-lg px-3 py-2 italic">{v.notes}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-(--border) py-2 text-xs font-semibold text-(--text-muted) hover:border-(--primary) hover:text-(--primary) transition-colors">
              <Pencil size={12} /> Bearbeiten
            </button>
            <button onClick={onDelete}
              className="flex items-center gap-1.5 rounded-xl border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-muted) hover:border-red-400 hover:text-red-600 transition-colors">
              <Trash2 size={12} /> Löschen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple color name to hex -- fallback to primary
function colorToHex(color: string): string {
  const map: Record<string, string> = {
    "weiss": "#f4f4f4", "weiß": "#f4f4f4", schwarz: "#1a1a1a", rot: "#dc2626", blau: "#2563eb",
    "grün": "#16a34a", "gruen": "#16a34a", grau: "#6b7280", silber: "#94a3b8", orange: "#ea580c",
    gelb: "#ca8a04", braun: "#78450f", violett: "#7c3aed", white: "#f4f4f4",
    black: "#1a1a1a", red: "#dc2626", blue: "#2563eb", green: "#16a34a",
    gray: "#6b7280", silver: "#94a3b8",
  };
  return map[color.toLowerCase()] ?? "#16a34a";
}

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
    if (!confirm(t("delete_confirm", { fallback: "Fahrzeug Löschen?" }))) return;
    await deleteVehicle(id);
    await load();
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-(--bg-elevated) animate-pulse" />)}
      </div>
    );
  }

  if (editing) {
    return (
      <VehicleForm
        vehicle={editing === "new" ? undefined : editing}
        onDone={() => { setEditing(null); load(); }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {vehicles.map((v) => (
        <VehicleCard
          key={v.id}
          v={v}
          onEdit={() => setEditing(v)}
          onDelete={() => handleDelete(v.id)}
        />
      ))}

      {vehicles.length === 0 && (
        <p className="text-sm text-(--text-muted) text-center py-6">
          {t("no_vehicles", { fallback: "Noch keine Fahrzeuge angelegt." })}
        </p>
      )}

      <button
        onClick={() => setEditing("new")}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-(--border) py-3 text-sm text-(--text-muted) hover:border-(--primary) hover:text-(--primary) transition-colors"
      >
        <Plus size={15} />
        {t("add_vehicle", { fallback: "Fahrzeug hinzufügen" })}
      </button>
    </div>
  );
}
