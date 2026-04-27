"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GlowCard } from "../components/ui/spotlight-card";
import { LimelightNav } from "../components/ui/limelight-nav";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Area, AreaChart,
} from "recharts";
import GymModules from "../components/gym/GymModules";
import LoadProgressionPanel from "../components/gym/LoadProgressionPanel";
import { supabase } from "../../lib/supabase";
import { GymWorkoutLog, LoadEntry } from "../../types/gym";

const navLinks = [
  { label: "Menu", href: "/menu" },
  { label: "Financeiro", href: "/financeiro" },
  { label: "Gym", href: "/gym" },
  { label: "Tarefas", href: "/tarefas" },
  { label: "Projetos", href: "/projetos" },
  { label: "Calendário", href: "/calendario" },
  { label: "Quadro dos Sonhos", href: "/quadro-dos-sonhos" },
  { label: "Configurações", href: "#" },
];

const weekDayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getMondayISO(weekOffset = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + weekOffset * 7);
  return d.toISOString().split("T")[0];
}

function MonthDot({ trained, day }: { trained: boolean; day: number }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium transition-all
      ${trained ? "bg-white text-black" : "bg-white/5 text-white/20"}`}>
      {day}
    </div>
  );
}

export default function GymPage() {
  const router = useRouter();
  const [, setActiveBar] = useState<number | null>(null);

  const [logs, setLogs] = useState<GymWorkoutLog[]>([]);
  const [loadEntries, setLoadEntries] = useState<LoadEntry[]>([]);
  const [showLoadPanel, setShowLoadPanel] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  const fetchData = useCallback(async () => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [{ data: logsData }, { data: loadData }] = await Promise.all([
      supabase
        .from("gym_workout_logs")
        .select("*")
        .gte("performed_at", ninetyDaysAgo.toISOString().split("T")[0])
        .order("performed_at", { ascending: false }),
      supabase
        .from("gym_load_progression")
        .select("*")
        .order("week_date", { ascending: true }),
    ]);

    if (logsData) setLogs(logsData as GymWorkoutLog[]);
    if (loadData) setLoadEntries(loadData as LoadEntry[]);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived: date sets ──
  const logDateSet = useMemo(() => new Set(logs.map(l => l.performed_at)), [logs]);

  // This week Mon–Sun
  const thisWeekDates = useMemo(() => {
    const mon = getMondayISO(0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon + "T12:00:00");
      d.setDate(d.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  }, []);

  const lastWeekDates = useMemo(() => {
    const mon = getMondayISO(-1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon + "T12:00:00");
      d.setDate(d.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  }, []);

  // trainedDays aligned to [Dom, Seg, Ter, Qua, Qui, Sex, Sáb]
  // thisWeekDates is [Mon(0), Tue(1), ..., Sun(6)]
  const trainedDays = useMemo(() => [
    logDateSet.has(thisWeekDates[6]), // Dom
    logDateSet.has(thisWeekDates[0]), // Seg
    logDateSet.has(thisWeekDates[1]), // Ter
    logDateSet.has(thisWeekDates[2]), // Qua
    logDateSet.has(thisWeekDates[3]), // Qui
    logDateSet.has(thisWeekDates[4]), // Sex
    logDateSet.has(thisWeekDates[5]), // Sáb
  ], [thisWeekDates, logDateSet]);

  // This month calendar
  const monthCalendar = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return { day, trained: logDateSet.has(dateStr) };
    });
  }, [logDateSet]);

  const totalTrained = useMemo(() => monthCalendar.filter(d => d.trained).length, [monthCalendar]);
  const weekTrained = useMemo(() => trainedDays.filter(Boolean).length, [trainedDays]);

  // Avg duration this week
  const weekAvgDuration = useMemo(() => {
    const weekLogs = logs.filter(l => thisWeekDates.includes(l.performed_at) && l.duration_minutes > 0);
    if (!weekLogs.length) return 0;
    return Math.round(weekLogs.reduce((s, l) => s + l.duration_minutes, 0) / weekLogs.length);
  }, [logs, thisWeekDates]);

  // Max load this week (from load_progression)
  const maxLoadWeek = useMemo(() => {
    const entries = loadEntries.filter(e => thisWeekDates.includes(e.week_date));
    if (!entries.length) return 0;
    return Math.max(...entries.map(e => e.weight_kg));
  }, [loadEntries, thisWeekDates]);

  // Weekly load progress vs last week
  const weekProgress = useMemo(() => {
    const thisMax = loadEntries
      .filter(e => thisWeekDates.includes(e.week_date))
      .reduce((m, e) => Math.max(m, e.weight_kg), 0);
    const lastMax = loadEntries
      .filter(e => lastWeekDates.includes(e.week_date))
      .reduce((m, e) => Math.max(m, e.weight_kg), 0);
    return +(thisMax - lastMax).toFixed(2);
  }, [loadEntries, thisWeekDates, lastWeekDates]);

  // Recent workouts (last 5 logs)
  const recentWorkouts = useMemo(() => logs.slice(0, 5).map(l => ({
    name: l.workout_name,
    date: new Date(l.performed_at + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    duration: l.duration_minutes > 0 ? `${l.duration_minutes} min` : "–",
    notes: l.notes || "–",
  })), [logs]);

  // Frequency chart: sessions per day this week (Mon→Sun order)
  const frequencyData = useMemo(() => thisWeekDates.map((date, i) => ({
    d: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][i],
    sessions: logs.filter(l => l.performed_at === date).length,
  })), [logs, thisWeekDates]);

  // Load progression chart
  const exerciseNames = useMemo(
    () => [...new Set(loadEntries.map(e => e.exercise_name))].sort(),
    [loadEntries],
  );

  useEffect(() => {
    if (!selectedExercise && exerciseNames.length > 0) setSelectedExercise(exerciseNames[0]);
  }, [exerciseNames, selectedExercise]);

  const loadChartData = useMemo(() => {
    if (!selectedExercise) return [];
    return loadEntries
      .filter(e => e.exercise_name === selectedExercise)
      .sort((a, b) => a.week_date.localeCompare(b.week_date))
      .map(e => ({
        mes: new Date(e.week_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        kg: e.weight_kg,
      }));
  }, [loadEntries, selectedExercise]);

  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-[120px]">
          <span className="text-2xl font-bold leading-none">✦</span>
          <span className="text-lg font-semibold tracking-wide">Aura+</span>
        </div>
        <LimelightNav
          initialActive={2}
          items={navLinks.map(item => ({
            id: item.href,
            label: item.label,
            onClick: () => setTimeout(() => router.push(item.href), 350),
          }))}
        />
        <div className="min-w-[120px] flex justify-end">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-bold">Y</div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-6 pb-16 space-y-4">

        {/* ROW 1 */}
        <div className="flex gap-4 items-stretch">
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Avanço de carga */}
            <GlowCard glowColor="blue" className="relative overflow-hidden flex-1">
              <img src="/carga2.jpeg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
              <div className="relative z-10 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-white">Avanço de carga</h2>
                    <p className="text-xs text-white/50 mt-0.5">Progressão semanal por exercício</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {exerciseNames.length > 0 && (
                      <select
                        value={selectedExercise}
                        onChange={e => setSelectedExercise(e.target.value)}
                        className="bg-white/10 text-white text-xs rounded-lg px-2 py-1.5 border border-white/10 focus:outline-none"
                      >
                        {exerciseNames.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    )}
                    <button
                      onClick={() => setShowLoadPanel(true)}
                      className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 text-sm transition-all"
                    >+</button>
                  </div>
                </div>

                {loadChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={loadChartData} barCategoryGap="30%" onClick={(_, idx) => setActiveBar(idx as unknown as number)}>
                      <XAxis dataKey="mes" tick={{ fill: "#ffffff50", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#ffffff50", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}kg`} />
                      <Tooltip
                        contentStyle={{ background: "#111", border: "1px solid #222", borderRadius: 10, fontSize: 12 }}
                        labelStyle={{ color: "#fff" }}
                        formatter={v => [`${v} kg`, ""]}
                      />
                      <Bar dataKey="kg" radius={[6, 6, 4, 4]} fill="rgba(255,255,255,0.7)" activeBar={{ fill: "rgba(255,255,255,0.95)" }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center gap-3">
                    <p className="text-white/30 text-sm">Nenhuma carga registrada ainda</p>
                    <button
                      onClick={() => setShowLoadPanel(true)}
                      className="text-xs text-white/50 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors"
                    >+ Registrar primeira carga</button>
                  </div>
                )}
              </div>
            </GlowCard>

            {/* Treino semanal */}
            <GlowCard glowColor="blue" className="bg-black p-6 flex-1">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-white">Treino semanal</h2>
                <span className="text-xs text-white/30">{weekTrained}/7 dias</span>
              </div>
              <div className="grid grid-cols-7 gap-2 mb-6">
                {weekDayLabels.map((d, i) => (
                  <div key={d} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] text-white/30">{d}</span>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all
                      ${trainedDays[i] ? "bg-white text-black" : "bg-white/5 text-white/20"}`}>
                      {trainedDays[i] ? "✓" : "–"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Calorias esta semana", value: `${weekTrained * 420} kcal` },
                  { label: "Volume semanal", value: "–" },
                  { label: "Tempo médio", value: weekAvgDuration > 0 ? `${weekAvgDuration} min` : "0 min" },
                  { label: "Maior carga", value: maxLoadWeek > 0 ? `${maxLoadWeek} kg` : "0 kg" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-[10px] text-white/30 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </GlowCard>
          </div>

          {/* Foto TikTok */}
          <div className="hidden lg:block flex-shrink-0 w-[230px]">
            <GlowCard glowColor="blue" className="bg-black overflow-hidden h-full">
              <img src="/disciplina.jpg" alt="Disciplina" className="w-full h-full object-cover" />
            </GlowCard>
          </div>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-12 gap-4">

          {/* Resultados */}
          <GlowCard glowColor="blue" className="col-span-12 lg:col-span-3 bg-black p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Resultados</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: "Calorias gastas", value: `${totalTrained * 420} kcal`, sub: "Este mês" },
                { label: "Volume total", value: "–", sub: "Este mês" },
                { label: "Corrida acumulada", value: "– km", sub: "Este mês" },
                { label: "Treinos concluídos", value: `${totalTrained}`, sub: "Este mês" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-white/30">{sub}</p>
                  </div>
                  <span className="text-sm font-semibold text-white/70">{value}</span>
                </div>
              ))}
            </div>
          </GlowCard>

          {/* Frequência semanal */}
          <GlowCard glowColor="blue" className="col-span-12 lg:col-span-5 bg-black p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-white">Frequência semanal</h2>
              <span className="text-xs font-semibold text-white/50">{weekTrained} sessão{weekTrained !== 1 ? "ões" : ""}</span>
            </div>
            <p className="text-xs text-white/30 mb-4">Treinos realizados por dia desta semana</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={frequencyData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fff" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: "#ffffff30", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#ffffff30", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #222", borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: "#fff" }}
                  formatter={v => [`${v} treino(s)`, ""]}
                />
                <Area type="monotone" dataKey="sessions" stroke="white" strokeWidth={2} fill="url(#grad)" dot={{ fill: "white", r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </GlowCard>

          {/* Nutrição */}
          <GlowCard glowColor="blue" className="col-span-12 lg:col-span-4 bg-black p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Nutrição recomendada</h2>
              <button className="text-xs text-white/30 hover:text-white transition-colors">Ver mais</button>
            </div>
            <div className="flex items-center justify-center h-32">
              <p className="text-white/20 text-sm">Em breve</p>
            </div>
          </GlowCard>
        </div>

        {/* ROW 3 */}
        <div className="grid grid-cols-12 gap-4">

          {/* Histórico de treinos */}
          <GlowCard glowColor="blue" className="col-span-12 lg:col-span-8 bg-black p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Histórico de treinos</h2>
            </div>
            <div className="space-y-3">
              {recentWorkouts.length === 0 ? (
                <p className="text-white/20 text-sm py-4 text-center">Nenhum treino registrado</p>
              ) : recentWorkouts.map((w, i) => (
                <div key={i} className="flex items-center gap-4 py-2.5 border-b border-white/[0.04] last:border-0">
                  <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white/40 flex-shrink-0">
                    {w.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{w.name}</p>
                    <p className="text-xs text-white/30">{w.date}</p>
                  </div>
                  <span className="text-xs text-white/30 hidden sm:block w-28 text-center">{w.duration}</span>
                  <span className="text-xs text-white/50 w-20 text-right truncate">{w.notes}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/5">
              {[
                {
                  label: "Progresso semanal",
                  value: weekProgress !== 0 ? `${weekProgress > 0 ? "+" : ""}${weekProgress} kg` : "0 kg",
                },
                { label: "Progresso mensal", value: "–" },
                { label: "Meta semanal", value: `${Math.min(100, Math.round(weekTrained / 5 * 100))}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/[0.03] rounded-xl p-3 text-center">
                  <p className="text-[10px] text-white/30 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </GlowCard>

          {/* Dias treinados */}
          <GlowCard glowColor="blue" className="col-span-12 lg:col-span-4 bg-black p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Dias treinados</h2>
              <span className="text-xs text-white/30">{totalTrained}/{monthCalendar.length} dias</span>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                <span key={i} className="text-center text-[9px] text-white/20 mb-1">{d}</span>
              ))}
              {monthCalendar.map(({ day, trained }) => (
                <MonthDot key={day} day={day} trained={trained} />
              ))}
            </div>
            <div className="pt-3 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/30">Taxa de consistência</span>
                <span className="text-white font-medium">{Math.round(totalTrained / monthCalendar.length * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-white/70 rounded-full" style={{ width: `${Math.round(totalTrained / monthCalendar.length * 100)}%` }} />
              </div>
            </div>
          </GlowCard>
        </div>

        {/* GymModules: Meus Treinos, Histórico completo, Heatmap */}
        <GymModules />
      </div>

      {showLoadPanel && (
        <LoadProgressionPanel
          onClose={() => setShowLoadPanel(false)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
