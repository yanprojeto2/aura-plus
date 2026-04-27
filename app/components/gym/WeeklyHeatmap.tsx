"use client";

import { useMemo } from "react";
import { HeatmapEntry } from "../../../types/gym";

interface WeeklyHeatmapProps {
  data: HeatmapEntry[];
  streak: number;
}

const WEEK_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS_PT = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function cellColor(count: number, isFuture: boolean): string {
  if (isFuture) return "bg-white/[0.02]";
  if (count === 0) return "bg-white/[0.05]";
  if (count === 1) return "bg-white/25";
  if (count === 2) return "bg-white/50";
  return "bg-white/80";
}

export default function WeeklyHeatmap({ data, streak }: WeeklyHeatmapProps) {
  const { cells, monthMarkers } = useMemo(() => {
    const countMap = new Map(data.map(d => [d.date, d.count]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from 52 weeks ago adjusted to Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - 52 * 7 + 1);
    const offsetDay = start.getDay(); // 0=Sun
    start.setDate(start.getDate() - offsetDay);

    const totalCells = 52 * 7;
    const cells: { date: string; count: number; isFuture: boolean; label: string }[] = [];

    for (let i = 0; i < totalCells; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      cells.push({
        date: dateStr,
        count: countMap.get(dateStr) ?? 0,
        isFuture: d > today,
        label: `${d.toLocaleDateString("pt-BR", { weekday: "short" })}, ${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`,
      });
    }

    // Month markers: first cell of each month (column index)
    const markers: { col: number; label: string }[] = [];
    const seen = new Set<string>();
    cells.forEach((cell, i) => {
      const col = Math.floor(i / 7);
      const monthKey = cell.date.slice(0, 7);
      if (!seen.has(monthKey)) {
        seen.add(monthKey);
        const [, m] = monthKey.split("-").map(Number);
        markers.push({ col, label: MONTHS_PT[m - 1] });
      }
    });

    return { cells, monthMarkers: markers };
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto scrollbar-none">
        <div style={{ minWidth: "max-content" }}>
          {/* Month labels */}
          <div className="flex ml-6 mb-1">
            {Array.from({ length: 52 }).map((_, col) => {
              const marker = monthMarkers.find(m => m.col === col);
              return (
                <div key={col} style={{ width: 14, marginRight: 2, flexShrink: 0 }}>
                  {marker && (
                    <span className="text-[9px] text-white/25 whitespace-nowrap">{marker.label}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {WEEK_LABELS.map((d, i) => (
                <div key={i} style={{ width: 12, height: 12 }} className="flex items-center justify-center">
                  {i % 2 === 1 && <span className="text-[9px] text-white/20">{d}</span>}
                </div>
              ))}
            </div>

            {/* Columns (weeks) */}
            {Array.from({ length: 52 }).map((_, col) => (
              <div key={col} className="flex flex-col gap-0.5">
                {Array.from({ length: 7 }).map((_, row) => {
                  const cell = cells[col * 7 + row];
                  if (!cell) return <div key={row} style={{ width: 12, height: 12 }} />;
                  return (
                    <div
                      key={row}
                      title={`${cell.label}: ${cell.count} treino${cell.count !== 1 ? "s" : ""}`}
                      style={{ width: 12, height: 12 }}
                      className={`rounded-sm transition-colors ${cellColor(cell.count, cell.isFuture)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend + streak */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/20">Menos</span>
          {["bg-white/[0.05]", "bg-white/25", "bg-white/50", "bg-white/80"].map((c, i) => (
            <div key={i} style={{ width: 12, height: 12 }} className={`rounded-sm ${c}`} />
          ))}
          <span className="text-[10px] text-white/20">Mais</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">{streak}</span>
          <div>
            <p className="text-xs font-medium text-white/70 leading-none">dias seguidos</p>
            <p className="text-[10px] text-white/30 mt-0.5">streak atual</p>
          </div>
        </div>
      </div>
    </div>
  );
}
