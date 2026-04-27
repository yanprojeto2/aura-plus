"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { GlowCard } from "../ui/spotlight-card";
import { GymWorkout, GymWorkoutLog, HeatmapEntry } from "../../../types/gym";
import WorkoutCard from "./WorkoutCard";
import WorkoutForm from "./WorkoutForm";
import WorkoutLogList from "./WorkoutLogList";
import WeeklyHeatmap from "./WeeklyHeatmap";

/* ─── Toast simples ─── */
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-white text-black text-sm font-medium px-5 py-2.5 rounded-full shadow-2xl animate-fade-in pointer-events-none">
      {message}
    </div>
  );
}

/* ─── Skeleton ─── */
function WorkoutSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />
      ))}
    </div>
  );
}

/* ─── Componente principal ─── */
export default function GymModules() {
  const [workouts, setWorkouts]         = useState<GymWorkout[]>([]);
  const [logs, setLogs]                 = useState<GymWorkoutLog[]>([]);
  const [loadingWorkouts, setLW]        = useState(true);
  const [loadingLogs, setLL]            = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editingWorkout, setEditing]    = useState<GymWorkout | null>(null);
  const [toast, setToast]               = useState<string | null>(null);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  /* ─── Fetch ─── */
  const loadWorkouts = useCallback(async () => {
    setLW(true);
    const { data } = await supabase
      .from("gym_workouts")
      .select("*, exercises:gym_workout_exercises(*)")
      .order("created_at", { ascending: false });
    if (data) setWorkouts(data as GymWorkout[]);
    setLW(false);
  }, []);

  const loadLogs = useCallback(async () => {
    setLL(true);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const { data } = await supabase
      .from("gym_workout_logs")
      .select("*")
      .gte("performed_at", ninetyDaysAgo.toISOString().split("T")[0])
      .order("performed_at", { ascending: false });
    if (data) setLogs(data as GymWorkoutLog[]);
    setLL(false);
  }, []);

  useEffect(() => {
    loadWorkouts();
    loadLogs();
  }, [loadWorkouts, loadLogs]);

  /* ─── Heatmap data ─── */
  const heatmapData: HeatmapEntry[] = useMemo(() => {
    const map = new Map<string, number>();
    logs.forEach(l => map.set(l.performed_at, (map.get(l.performed_at) ?? 0) + 1));
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
  }, [logs]);

  /* ─── Streak ─── */
  const streak = useMemo(() => {
    const dateSet = new Set(logs.map(l => l.performed_at));
    let count = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // allow today not trained yet — start from yesterday if today is missing
    if (!dateSet.has(d.toISOString().split("T")[0])) {
      d.setDate(d.getDate() - 1);
    }
    while (dateSet.has(d.toISOString().split("T")[0])) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [logs]);

  /* ─── Handlers ─── */
  const handleDelete = async (id: number) => {
    await supabase.from("gym_workouts").delete().eq("id", id);
    setWorkouts(prev => prev.filter(w => w.id !== id));
    showToast("Treino excluído");
  };

  const handleLog = async (workout: GymWorkout, duration: number) => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("gym_workout_logs")
      .insert({ workout_id: workout.id, workout_name: workout.name, performed_at: today, duration_minutes: duration, notes: "" })
      .select()
      .single();
    if (data) {
      setLogs(prev => [data as GymWorkoutLog, ...prev]);
      showToast(`"${workout.name}" registrado!`);
    }
  };

  const openEdit = (workout: GymWorkout) => {
    setEditing(workout);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <>
      {/* ── Seção 1: Meus Treinos ── */}
      <GlowCard glowColor="blue" className="bg-black p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-white">Meus Treinos</h2>
            <p className="text-xs text-white/30 mt-0.5">{workouts.length} treino{workouts.length !== 1 ? "s" : ""} cadastrado{workouts.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-all"
          >
            + Novo treino
          </button>
        </div>

        {loadingWorkouts ? (
          <WorkoutSkeleton />
        ) : workouts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-white/20 text-sm">Nenhum treino cadastrado</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-xs text-white/30 hover:text-white transition-colors"
            >
              + Criar primeiro treino
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {workouts.map(w => (
              <WorkoutCard
                key={w.id}
                workout={w}
                onEdit={openEdit}
                onDelete={handleDelete}
                onLog={handleLog}
              />
            ))}
          </div>
        )}
      </GlowCard>

      {/* ── Seção 2: Histórico ── */}
      <GlowCard glowColor="blue" className="bg-black p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-white">Histórico de treinos</h2>
          <p className="text-xs text-white/30 mt-0.5">{logs.length} sessão{logs.length !== 1 ? "ões" : ""} registrada{logs.length !== 1 ? "s" : ""}</p>
        </div>
        <WorkoutLogList logs={logs} loading={loadingLogs} />
      </GlowCard>

      {/* ── Seção 3: Heatmap ── */}
      <GlowCard glowColor="blue" className="bg-black p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-white">Frequência de treinos</h2>
          <p className="text-xs text-white/30 mt-0.5">Últimas 52 semanas</p>
        </div>
        <WeeklyHeatmap data={heatmapData} streak={streak} />
      </GlowCard>

      {/* ── Form (Sheet) ── */}
      {showForm && (
        <WorkoutForm
          workout={editingWorkout}
          onClose={closeForm}
          onSaved={() => { loadWorkouts(); showToast(editingWorkout ? "Treino atualizado!" : "Treino criado!"); }}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}
