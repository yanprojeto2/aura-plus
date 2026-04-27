"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { LoadEntry, MUSCLE_GROUPS } from "../../../types/gym";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

function getMondayDate(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().split("T")[0];
}

export default function LoadProgressionPanel({ onClose, onSaved }: Props) {
  const [entries, setEntries] = useState<LoadEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exerciseName, setExerciseName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string>(MUSCLE_GROUPS[0]);
  const [weekDate, setWeekDate] = useState(getMondayDate);
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("gym_load_progression")
      .select("*")
      .order("week_date", { ascending: true });
    if (data) setEntries(data as LoadEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEntries();
    supabase
      .from("gym_workout_exercises")
      .select("name")
      .then(({ data }) => {
        if (data) setSuggestions([...new Set(data.map((e: { name: string }) => e.name))]);
      });
  }, [loadEntries]);

  const handleSave = async () => {
    if (!exerciseName.trim() || !weightKg) return;
    setSaving(true);
    const { error } = await supabase.from("gym_load_progression").insert({
      exercise_name: exerciseName.trim(),
      muscle_group: muscleGroup,
      week_date: weekDate,
      weight_kg: parseFloat(weightKg),
      notes: notes.trim(),
    });
    if (!error) {
      setExerciseName("");
      setWeightKg("");
      setNotes("");
      await loadEntries();
      onSaved();
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    await supabase.from("gym_load_progression").delete().eq("id", id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  // Group entries: muscle_group → exercise_name → entries[]
  const grouped = entries.reduce((acc, e) => {
    const group = e.muscle_group || "Outros";
    if (!acc[group]) acc[group] = {};
    if (!acc[group][e.exercise_name]) acc[group][e.exercise_name] = [];
    acc[group][e.exercise_name].push(e);
    return acc;
  }, {} as Record<string, Record<string, LoadEntry[]>>);

  // Show muscle groups in fixed order (only those with entries)
  const orderedGroups = MUSCLE_GROUPS.filter(g => grouped[g]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-md bg-[#0D0D0D] border-l border-white/10 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h2 className="font-semibold text-white">Avanço de Carga</h2>
            <p className="text-xs text-white/30 mt-0.5">Registro semanal por exercício</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
          >✕</button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 border-b border-white/[0.06] space-y-3">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Nova entrada</p>

          {/* Muscle group pills */}
          <div>
            <label className="text-[11px] text-white/30 mb-2 block">Grupo muscular</label>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map(g => (
                <button
                  key={g}
                  onClick={() => setMuscleGroup(g)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    muscleGroup === g
                      ? "bg-white text-black"
                      : "bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise name */}
          <div>
            <label className="text-[11px] text-white/30 mb-1 block">Exercício</label>
            <input
              list="exercise-suggestions"
              value={exerciseName}
              onChange={e => setExerciseName(e.target.value)}
              placeholder="Ex: Remada, Rosca Direta…"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
            />
            <datalist id="exercise-suggestions">
              {suggestions.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/30 mb-1 block">Semana</label>
              <input
                type="date"
                value={weekDate}
                onChange={e => setWeekDate(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="text-[11px] text-white/30 mb-1 block">Carga (kg)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                placeholder="0"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-white/30 mb-1 block">Observações (opcional)</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: 3×8, falha no último set…"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !exerciseName.trim() || !weightKg}
            className="w-full py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 disabled:opacity-30 transition-all"
          >
            {saving ? "Salvando…" : "Registrar carga"}
          </button>
        </div>

        {/* Cards por grupo muscular */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : orderedGroups.length === 0 ? (
            <p className="text-center text-white/20 text-sm py-8">Nenhuma entrada ainda</p>
          ) : (
            orderedGroups.map(group => (
              <div key={group} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                {/* Card header */}
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-sm font-semibold text-white">{group}</p>
                </div>

                {/* Exercises in this group */}
                <div className="px-4 py-3 space-y-4">
                  {Object.entries(grouped[group]).map(([exName, exEntries]) => {
                    const sorted = [...exEntries].sort((a, b) => a.week_date.localeCompare(b.week_date));
                    const last = sorted[sorted.length - 1];
                    const prev = sorted[sorted.length - 2];
                    const diff = prev ? +(last.weight_kg - prev.weight_kg).toFixed(2) : null;

                    return (
                      <div key={exName}>
                        {/* Exercise header */}
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-white/70">{exName}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{last.weight_kg} kg</span>
                            {diff !== null && diff !== 0 && (
                              <span className={`text-[11px] font-medium ${diff > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {diff > 0 ? "+" : ""}{diff}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Weekly rows */}
                        <div className="space-y-1">
                          {[...sorted].reverse().map(e => (
                            <div key={e.id} className="flex items-center gap-3 py-1 px-2.5 rounded-lg bg-white/[0.03] group">
                              <span className="text-[11px] text-white/30 w-16 flex-shrink-0">
                                {new Date(e.week_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                              </span>
                              <span className="text-[11px] font-semibold text-white flex-1">{e.weight_kg} kg</span>
                              {e.notes && (
                                <span className="text-[10px] text-white/30 max-w-[90px] truncate">{e.notes}</span>
                              )}
                              <button
                                onClick={() => handleDelete(e.id)}
                                className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-[11px] ml-1 flex-shrink-0"
                              >✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
