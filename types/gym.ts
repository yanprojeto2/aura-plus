export interface GymWorkout {
  id: number;
  name: string;
  muscle_group: string;
  notes: string;
  created_at: string;
  exercises?: GymExercise[];
}

export interface GymExercise {
  id?: number;
  workout_id?: number;
  name: string;
  sets: number;
  reps: string;
  weight_kg: number;
  order_index: number;
}

export interface GymWorkoutLog {
  id: number;
  workout_id: number | null;
  workout_name: string;
  performed_at: string;
  duration_minutes: number;
  notes: string;
  created_at: string;
}

export interface HeatmapEntry {
  date: string;
  count: number;
}

export interface LoadEntry {
  id: number;
  exercise_name: string;
  muscle_group: string;
  week_date: string; // YYYY-MM-DD (Monday of that week)
  weight_kg: number;
  notes: string;
  created_at: string;
}

export const MUSCLE_GROUPS = [
  "Costas",
  "Bíceps e Tríceps",
  "Ombro",
  "Perna",
  "Peito",
  "Outros",
] as const;
