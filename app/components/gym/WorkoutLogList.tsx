"use client";

import { useMemo, useState } from "react";
import { GymWorkoutLog } from "../../../types/gym";

type FilterPeriod = "week" | "month" | "all";

interface WorkoutLogListProps {
  logs: GymWorkoutLog[];
  loading: boolean;
}

function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDuration(minutes: number) {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const PAGE_SIZE = 10;

export default function WorkoutLogList({ logs, loading }: WorkoutLogListProps) {
  const [filter, setFilter] = useState<FilterPeriod>("month");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const now = new Date();
    return logs.filter(l => {
      const [y, m, d] = l.performed_at.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      if (filter === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      }
      if (filter === "month") {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [logs, filter]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const filterLabels: { id: FilterPeriod; label: string }[] = [
    { id: "week",  label: "Esta semana" },
    { id: "month", label: "Este mês"    },
    { id: "all",   label: "Tudo"        },
  ];

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtro */}
      <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 self-start w-fit">
        {filterLabels.map(f => (
          <button
            key={f.id}
            onClick={() => { setFilter(f.id); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="text-sm text-white/20 py-8 text-center">Nenhum treino registrado no período</p>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((log, i) => (
              <div
                key={log.id}
                className={`flex items-center gap-4 py-3 ${i < paginated.length - 1 ? "border-b border-white/[0.04]" : ""}`}
              >
                {/* Data */}
                <div className="w-16 flex-shrink-0 text-center">
                  <p className="text-xs font-semibold text-white">
                    {log.performed_at.split("-")[2]}
                  </p>
                  <p className="text-[10px] text-white/30 uppercase">
                    {new Date(log.performed_at + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })}
                  </p>
                </div>

                {/* Divisor */}
                <div className="w-px h-8 bg-white/[0.06] flex-shrink-0" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{log.workout_name}</p>
                  {log.notes && <p className="text-[11px] text-white/30 truncate mt-0.5">{log.notes}</p>}
                </div>

                {/* Duração */}
                <span className="text-xs text-white/40 flex-shrink-0">{fmtDuration(log.duration_minutes)}</span>
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => setPage(p => p + 1)}
              className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-xs font-medium transition-all"
            >
              Carregar mais
            </button>
          )}
        </>
      )}
    </div>
  );
}
