"use client";

import { useState } from "react";
import { GymWorkout } from "../../../types/gym";

const MUSCLE_COLORS: Record<string, string> = {
  Peito:       "bg-blue-500/20 text-blue-400",
  Costas:      "bg-purple-500/20 text-purple-400",
  Ombros:      "bg-cyan-500/20 text-cyan-400",
  "Bíceps":    "bg-green-500/20 text-green-400",
  "Tríceps":   "bg-orange-500/20 text-orange-400",
  Pernas:      "bg-red-500/20 text-red-400",
  "Glúteos":   "bg-pink-500/20 text-pink-400",
  "Abdômen":   "bg-yellow-500/20 text-yellow-400",
  Panturrilha: "bg-teal-500/20 text-teal-400",
  "Full Body": "bg-white/10 text-white/50",
};

interface WorkoutCardProps {
  workout: GymWorkout;
  onEdit: (workout: GymWorkout) => void;
  onDelete: (id: number) => Promise<void>;
  onLog: (workout: GymWorkout, duration: number) => Promise<void>;
}

export default function WorkoutCard({ workout, onEdit, onDelete, onLog }: WorkoutCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [logging, setLogging] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [duration, setDuration] = useState("60");

  const exerciseCount = workout.exercises?.length ?? 0;
  const badgeClass = MUSCLE_COLORS[workout.muscle_group] ?? "bg-white/10 text-white/50";

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(workout.id);
    setDeleting(false);
  };

  const handleLog = async () => {
    setLogging(true);
    await onLog(workout, parseInt(duration) || 0);
    setLogging(false);
    setShowLogModal(false);
    setDuration("60");
  };

  return (
    <>
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{workout.name}</p>
            {workout.muscle_group && (
              <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
                {workout.muscle_group}
              </span>
            )}
          </div>
          <span className="text-[11px] text-white/30 flex-shrink-0 mt-0.5">
            {exerciseCount} exerc.
          </span>
        </div>

        {/* Exercises preview */}
        {exerciseCount > 0 && (
          <div className="space-y-1">
            {workout.exercises!.slice(0, 3).map((ex, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-white/50 truncate">{ex.name}</span>
                <span className="text-white/25 ml-2 flex-shrink-0">{ex.sets}×{ex.reps} {ex.weight_kg > 0 ? `· ${ex.weight_kg}kg` : ""}</span>
              </div>
            ))}
            {exerciseCount > 3 && (
              <p className="text-[10px] text-white/20">+{exerciseCount - 3} mais</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setShowLogModal(true)}
            className="flex-1 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-all"
          >
            Registrar
          </button>
          <button
            onClick={() => onEdit(workout)}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all text-xs"
          >
            ✏
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/30 hover:text-red-400 transition-all text-xs disabled:opacity-40"
          >
            {deleting ? "…" : "✕"}
          </button>
        </div>
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Registrar treino</h2>
              <button onClick={() => setShowLogModal(false)} className="text-white/30 hover:text-white transition-colors">✕</button>
            </div>
            <p className="text-sm text-white/50 mb-4">{workout.name}</p>
            <div className="mb-5">
              <label className="text-xs text-white/40 mb-1.5 block">Duração (minutos)</label>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white outline-none border border-transparent focus:border-white/15"
                min="0"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLogModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/50 text-sm transition-all hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={handleLog}
                disabled={logging}
                className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold transition-all hover:bg-white/90 disabled:opacity-40"
              >
                {logging ? "Salvando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
