-- Treinos cadastrados
create table if not exists gym_workouts (
  id bigint generated always as identity primary key,
  name text not null,
  muscle_group text not null default '',
  notes text not null default '',
  created_at timestamptz default now()
);

-- Exercícios de cada treino
create table if not exists gym_workout_exercises (
  id bigint generated always as identity primary key,
  workout_id bigint references gym_workouts on delete cascade,
  name text not null,
  sets integer not null default 3,
  reps text not null default '8-12',
  weight_kg numeric not null default 0,
  order_index integer not null default 0
);

-- Log de treinos realizados
create table if not exists gym_workout_logs (
  id bigint generated always as identity primary key,
  workout_id bigint references gym_workouts on delete set null,
  workout_name text not null,
  performed_at date not null default current_date,
  duration_minutes integer not null default 0,
  notes text not null default '',
  created_at timestamptz default now()
);

-- RLS — acesso público (projeto sem autenticação)
alter table gym_workouts enable row level security;
alter table gym_workout_exercises enable row level security;
alter table gym_workout_logs enable row level security;

create policy "public access" on gym_workouts for all using (true) with check (true);
create policy "public access" on gym_workout_exercises for all using (true) with check (true);
create policy "public access" on gym_workout_logs for all using (true) with check (true);
