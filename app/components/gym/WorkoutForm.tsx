"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { GymWorkout, GymExercise } from "../../../types/gym";

const MUSCLE_GROUPS = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps",
  "Pernas", "Glúteos", "Abdômen", "Panturrilha", "Full Body",
];

interface ExerciseRow {
  key: string;
  name: string;
  sets: number;
  reps: string;
  weight_kg: number;
}

interface WorkoutFormProps {
  workout?: GymWorkout | null;
  onClose: () => void;
  onSaved: () => void;
}

const newRow = (): ExerciseRow => ({
  key: Math.random().toString(36).slice(2),
  name: "",
  sets: 3,
  reps: "8-12",
  weight_kg: 0,
});

export default function WorkoutForm({ workout, onClose, onSaved }: WorkoutFormProps) {
  const [name, setName] = useState(workout?.name ?? "");
  const [muscleGroup, setMuscleGroup] = useState(workout?.muscle_group ?? "");
  const [notes, setNotes] = useState(workout?.notes ?? "");
  const [exercises, setExercises] = useState<ExerciseRow[]>(() => {
    if (workout?.exercises?.length) {
      return workout.exercises.map(ex => ({
        key: String(ex.id ?? Math.random()),
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight_kg: ex.weight_kg,
      }));
    }
    return [newRow()];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const updateExercise = (key: string, field: keyof Omit<ExerciseRow, "key">, value: string | number) => {
    setExercises(prev => prev.map(ex => ex.key === key ? { ...ex, [field]: value } : ex));
  };

  const removeExercise = (key: string) => {
    setExercises(prev => prev.length > 1 ? prev.filter(ex => ex.key !== key) : prev);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Nome é obrigatório"); return; }
    setSaving(true);
    setError("");

    try {
      if (workout) {
        // Update workout
        await supabase.from("gym_workouts").update({ name: name.trim(), muscle_group: muscleGroup, notes }).eq("id", workout.id);
        // Delete old exercises and reinsert
        await supabase.from("gym_workout_exercises").delete().eq("workout_id", workout.id);
      } else {
        // Create workout
        const { data: w, error: wErr } = await supabase
          .from("gym_workouts")
          .insert({ name: name.trim(), muscle_group: muscleGroup, notes })
          .select()
          .single();
        if (wErr || !w) throw new Error(wErr?.message ?? "Erro ao criar treino");
        workout = w as GymWorkout;
      }

      // Insert exercises
      const validExercises = exercises.filter(ex => ex.name.trim());
      if (validExercises.length > 0) {
        await supabase.from("gym_workout_exercises").insert(
          validExercises.map((ex, i): Omit<GymExercise, "id"> => ({
            workout_id: workout!.id,
            name: ex.name.trim(),
            sets: ex.sets,
            reps: ex.reps,
            weight_kg: ex.weight_kg,
            order_index: i,
          }))
        );
      }

      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg h-full bg-[#0a0a0a] border-l border-white/10 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
          <h2 className="font-semibold text-white">{workout ? "Editar treino" : "Novo treino"}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Nome */}
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Nome do treino *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Treino A — Peito e Tríceps"
              className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15"
            />
          </div>

          {/* Grupo muscular */}
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Grupo muscular</label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map(g => (
                <button
                  key={g}
                  onClick={() => setMuscleGroup(muscleGroup === g ? "" : g)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    muscleGroup === g
                      ? "bg-white/15 border-white/30 text-white"
                      : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/70"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Observações</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas sobre o treino..."
              rows={2}
              className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15 resize-none"
            />
          </div>

          {/* Exercícios */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-white/40">Exercícios</label>
              <button
                onClick={() => setExercises(prev => [...prev, newRow()])}
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                + Adicionar
              </button>
            </div>

            {/* Cabeçalho */}
            <div className="grid grid-cols-12 gap-2 mb-2 px-1">
              <span className="col-span-5 text-[10px] text-white/20 uppercase tracking-wider">Exercício</span>
              <span className="col-span-2 text-[10px] text-white/20 uppercase tracking-wider text-center">Séries</span>
              <span className="col-span-2 text-[10px] text-white/20 uppercase tracking-wider text-center">Reps</span>
              <span className="col-span-2 text-[10px] text-white/20 uppercase tracking-wider text-center">Kg</span>
              <span className="col-span-1" />
            </div>

            <div className="space-y-2">
              {exercises.map(ex => (
                <div key={ex.key} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    value={ex.name}
                    onChange={e => updateExercise(ex.key, "name", e.target.value)}
                    placeholder="Nome"
                    className="col-span-5 bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15"
                  />
                  <input
                    type="number"
                    value={ex.sets}
                    onChange={e => updateExercise(ex.key, "sets", parseInt(e.target.value) || 0)}
                    className="col-span-2 bg-white/5 rounded-xl px-2 py-2 text-sm text-white text-center outline-none border border-transparent focus:border-white/15"
                    min="1"
                  />
                  <input
                    value={ex.reps}
                    onChange={e => updateExercise(ex.key, "reps", e.target.value)}
                    placeholder="8-12"
                    className="col-span-2 bg-white/5 rounded-xl px-2 py-2 text-sm text-white text-center outline-none border border-transparent focus:border-white/15"
                  />
                  <input
                    type="number"
                    value={ex.weight_kg}
                    onChange={e => updateExercise(ex.key, "weight_kg", parseFloat(e.target.value) || 0)}
                    className="col-span-2 bg-white/5 rounded-xl px-2 py-2 text-sm text-white text-center outline-none border border-transparent focus:border-white/15"
                    min="0"
                    step="0.5"
                  />
                  <button
                    onClick={() => removeExercise(ex.key)}
                    className="col-span-1 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/50 text-sm hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-40"
          >
            {saving ? "Salvando…" : workout ? "Salvar" : "Criar treino"}
          </button>
        </div>
      </div>
    </div>
  );
}
