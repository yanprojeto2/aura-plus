"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlowCard } from "../components/ui/spotlight-card";
import { LimelightNav } from "../components/ui/limelight-nav";
import { AnimateCheckbox } from "../components/ui/animate-checkbox";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { supabase } from "../../lib/supabase";

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

function DraggableVideo() {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setPos((p) => ({
      x: Math.max(0, Math.min(100, p.x - dx * 0.15)),
      y: Math.max(0, Math.min(100, p.y - dy * 0.3)),
    }));
  };

  const onMouseUp = () => { dragging.current = false; };

  return (
    <div
      className="absolute inset-0 z-0 group"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ cursor: dragging.current ? "grabbing" : "grab" }}
    >
      <video
        src="/Video.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
      />
      <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white/60 text-[11px] px-2.5 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Arraste para ajustar
      </div>
    </div>
  );
}

const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface WeeklyTask {
  id: number | string;
  text: string;
  days: boolean[];
}

function WeeklyTodoCard() {
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    supabase.from('weekly_tasks').select('*').order('created_at').then(({ data }) => {
      if (data) setTasks(data.map(t => ({ id: t.id, text: t.text, days: t.days })))
    })
  }, []);

  const toggleDay = async (taskId: number | string, dayIdx: number) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const updatedDays = task.days.map((d, i) => i === dayIdx ? !d : d)
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, days: updatedDays } : t))
    await supabase.from('weekly_tasks').update({ days: updatedDays }).eq('id', taskId)
  };

  const addTask = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const { data } = await supabase.from('weekly_tasks').insert({ text: trimmed, days: Array(7).fill(false) }).select().single()
    if (data) setTasks((prev) => [...prev, { id: data.id, text: data.text, days: data.days }]);
    setInput("");
  };

  const removeTask = async (id: number | string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await supabase.from('weekly_tasks').delete().eq('id', id)
  };

  return (
    <GlowCard glowColor="blue" className="bg-black p-6 w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-white text-base">To Do semanal</h2>
        <span className="text-xs text-gray-500">
          {tasks.reduce((a, t) => a + t.days.filter(Boolean).length, 0)} concluídas
        </span>
      </div>

      <div className="flex items-center mb-3">
        <div className="flex-1 min-w-0" />
        <div className="flex gap-1">
          {WEEK_DAYS.map((d) => (
            <span key={d} className="w-8 text-center text-[11px] text-gray-500">{d}</span>
          ))}
          <div className="w-6" />
        </div>
      </div>

      <div className="space-y-2">
        {tasks.map(({ id, text, days }) => (
          <div key={id} className="flex items-center gap-2 group/row">
            <span className="flex-1 min-w-0 text-sm text-white pr-2">{text}</span>
            <div className="flex gap-1">
              {days.map((done, i) => (
                <div key={i} className="w-8 flex justify-center">
                  <AnimateCheckbox
                    checked={done}
                    onCheckedChange={() => toggleDay(id, i)}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => removeTask(id)}
              className="w-6 text-white/15 hover:text-white/50 text-xs transition-colors opacity-0 group-hover/row:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-5 pt-4 border-t border-white/5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Nova tarefa semanal..."
          className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/10"
        />
        <button
          onClick={addTask}
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm transition-all"
        >
          +
        </button>
      </div>
    </GlowCard>
  );
}

interface TodoItem {
  id: number | string;
  text: string;
  done: boolean;
}

function TodoCard({ title, initialItems }: { title: string; initialItems: string[] }) {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    supabase.from('todos').select('*').eq('list', 'profissional').order('created_at').then(({ data }) => {
      if (data) setItems(data.map(t => ({ id: t.id, text: t.text, done: t.done })))
    })
  }, []);

  const toggle = async (id: number | string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, done: !i.done } : i))
    await supabase.from('todos').update({ done: !item.done }).eq('id', id)
  };

  const add = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const { data } = await supabase.from('todos').insert({ text: trimmed, done: false, list: 'profissional' }).select().single()
    if (data) setItems((prev) => [...prev, { id: data.id, text: data.text, done: data.done }]);
    setInput("");
  };

  const remove = async (id: number | string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    await supabase.from('todos').delete().eq('id', id)
  };

  return (
    <GlowCard glowColor="blue" className="bg-black p-6 flex flex-col gap-4 w-full">
      <h2 className="font-semibold text-white text-base">{title}</h2>

      <div className="flex flex-col gap-2 flex-1">
        {items.map(({ id, text, done }) => (
          <div key={id} className="flex items-center gap-3 group/item">
            <AnimateCheckbox
              checked={done}
              onCheckedChange={() => toggle(id)}
            />
            <span className={`text-sm flex-1 transition-all ${done ? "line-through text-white/30" : "text-white"}`}>
              {text}
            </span>
            <button
              onClick={() => remove(id)}
              className="text-white/20 hover:text-white/60 transition-colors opacity-0 group-hover/item:opacity-100 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-auto pt-4 border-t border-white/5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Nova tarefa..."
          className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:bg-white/8 transition-all border border-transparent focus:border-white/10"
        />
        <button
          onClick={add}
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm transition-all"
        >
          +
        </button>
      </div>
    </GlowCard>
  );
}

const disciplineData = {
  dia:    { valores: [75, 60, 88, 50, 70], media: "70%", melhor: "88%", pior: "50%", progresso: 70 },
  semana: { valores: [82, 74, 91, 65, 78], media: "72%", melhor: "91%", pior: "48%", progresso: 86 },
  mes:    { valores: [90, 85, 88, 80, 92], media: "87%", melhor: "95%", pior: "76%", progresso: 92 },
};
const labels = ["Foco", "Consistência", "Produtividade", "Metas", "Rotina"];
type Period = "dia" | "semana" | "mes";

function DisciplineCard() {
  const [period, setPeriod] = useState<Period>("semana");
  const d = disciplineData[period];
  const radarData = labels.map((label, i) => ({ label, value: d.valores[i] }));
  const circumference = 100;
  const dashArray = `${d.progresso} ${circumference}`;

  return (
    <GlowCard glowColor="blue" className="bg-black p-6 w-full">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Seu Nível de Disciplina</h2>
          <p className="text-xs text-white/30 mt-0.5">Visão multidimensional do seu desempenho</p>
        </div>
        <div className="flex gap-2">
          {(["dia", "semana", "mes"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                period === p
                  ? "bg-[#1a6fd4] border-[#1a6fd4] text-white"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6 items-center flex-wrap">
        <div className="flex flex-col gap-4 flex-1 min-w-[160px]">
          {[
            { label: "Média",  value: d.media  },
            { label: "Melhor", value: d.melhor },
            { label: "Pior",   value: d.pior   },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-3 pb-3 border-b border-white/5 last:border-0">
              <span className="w-6 h-0.5 rounded bg-[#1a6fd4] flex-shrink-0" />
              <span className="text-sm text-white/40 flex-1">{label}</span>
              <span className="text-sm font-bold text-white">{value}</span>
            </div>
          ))}

          <div className="flex items-center gap-3 mt-1">
            <svg viewBox="0 0 36 36" className="w-10 h-10 flex-shrink-0 -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#1a6fd4" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={dashArray}
                style={{ transition: "stroke-dasharray 0.5s ease" }}
              />
            </svg>
            <span className="text-xs text-white/40">
              <strong className="text-white font-bold">{d.progresso}%</strong> da meta atingida
            </span>
          </div>
        </div>

        <div className="flex-[1.2] min-w-[200px] max-w-[300px] h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
              />
              <Radar
                dataKey="value"
                stroke="#1a6fd4"
                strokeWidth={2}
                fill="#1a6fd4"
                fillOpacity={0.2}
                dot={{ fill: "#1a6fd4", r: 3 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </GlowCard>
  );
}

/* ─── Contas a Pagar Hoje ─── */
function ContasHojeCard() {
  const [contas, setContas] = useState<{ id: number; nome: string; valor: number; status: string; categoria: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const d = new Date();
    const hoje = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    supabase
      .from("financeiro_despesas")
      .select("id,nome,valor,status,categoria")
      .eq("data", hoje)
      .in("status", ["Pendente", "Vencida"])
      .order("valor", { ascending: false })
      .then(({ data }) => {
        setContas(data ?? []);
        setLoading(false);
      });
  }, []);

  const total = contas.reduce((a, c) => a + Number(c.valor), 0);
  const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <GlowCard glowColor="blue" className="bg-black p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white">Contas a Pagar Hoje</h2>
          <p className="text-[11px] text-white/30 mt-0.5">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </p>
        </div>
        {total > 0 && (
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Total</p>
            <p className="text-lg font-bold text-white">R${fmtBRL(total)}</p>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-white/20 text-center py-6">Carregando...</p>
      ) : contas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <span className="text-3xl">🎉</span>
          <p className="text-sm text-white/40">Nenhuma conta para hoje</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contas.map(c => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === "Vencida" ? "bg-red-500" : "bg-yellow-400"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.nome}</p>
                  {c.categoria && <p className="text-[10px] text-white/30">{c.categoria}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.status === "Vencida" ? "bg-white/10 text-white/70" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {c.status}
                </span>
                <p className="text-sm font-bold text-white">R${fmtBRL(Number(c.valor))}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlowCard>
  );
}

/* ─── Pixel Art Agents ─── */
function PixelChar({ grid, scale = 4 }: { grid: (string | null)[][]; scale?: number }) {
  const h = grid.length, w = grid[0].length;
  return (
    <svg width={w * scale} height={h * scale} style={{ imageRendering: "pixelated", display: "block" }}>
      {grid.flatMap((row, y) =>
        row.map((color, x) =>
          color ? <rect key={`${x}-${y}`} x={x * scale} y={y * scale} width={scale} height={scale} fill={color} /> : null
        )
      )}
    </svg>
  );
}

function makeChar(H: string, B: string, T: string, P: string, SH: string): (string | null)[][] {
  const S = "#f4c89a", E = "#2d1b00", M = "#c0392b", N = null;
  return [
    [N,N,N,H,H,H,H,H,H,N,N,N],
    [N,N,H,H,H,H,H,H,H,H,N,N],
    [N,N,S,S,S,S,S,S,S,S,N,N],
    [N,S,S,S,S,S,S,S,S,S,S,N],
    [N,S,S,E,S,S,S,S,E,S,S,N],
    [N,S,S,S,S,S,S,S,S,S,S,N],
    [N,S,S,S,M,M,M,M,S,S,S,N],
    [N,N,S,S,S,S,S,S,S,S,N,N],
    [N,B,B,B,B,B,B,B,B,B,B,N],
    [B,B,B,B,B,B,B,B,B,B,B,B],
    [N,B,B,T,T,T,T,T,T,B,B,N],
    [N,B,B,T,T,T,T,T,T,B,B,N],
    [N,B,B,T,T,T,T,T,T,B,B,N],
    [N,N,P,P,P,P,P,P,P,P,N,N],
    [N,N,P,P,P,P,P,P,P,P,N,N],
    [N,N,P,P,N,N,N,N,P,P,N,N],
    [N,N,P,P,N,N,N,N,P,P,N,N],
    [N,N,SH,SH,N,N,N,N,SH,SH,N,N],
  ];
}

const AGENTS = [
  { nome: "Kender",  funcao: "Agente Financeiro", char: makeChar("#1a0a00","#1e40af","#fbbf24","#374151","#111827"), glow: "#3b82f6" },
  { nome: "Stack",   funcao: "Agente Gym",         char: makeChar("#7c2d12","#dc2626","#dc2626","#111827","#f8fafc"), glow: "#ef4444" },
  { nome: "Raquel",  funcao: "Agente Tarefas",     char: makeChar("#fde68a","#db2777","#f9a8d4","#1d4ed8","#dc2626"), glow: "#ec4899" },
  { nome: "Dani",    funcao: "Agente Calendário",  char: makeChar("#1a1a1a","#7c3aed","#a78bfa","#1a1a1a","#7c3aed"), glow: "#a855f7" },
  { nome: "Suzan",   funcao: "Agente Projetos",    char: makeChar("#b91c1c","#d97706","#fbbf24","#78350f","#451a03"), glow: "#f59e0b" },
];

function AgentsCard() {
  return (
    <GlowCard glowColor="blue" className="bg-black p-6 w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-white">Agentes Disponíveis</h2>
        <span className="text-xs text-white/30">{AGENTS.length} agentes ativos</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {AGENTS.map(agent => (
          <div key={agent.nome} className="flex flex-col items-center gap-2 group cursor-default">
            {/* Pixel art frame */}
            <div
              className="relative flex items-center justify-center rounded-xl p-3 transition-all duration-200 group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #0f0f0f, #1a1a1a)", boxShadow: `0 0 0 1px #ffffff10, 0 4px 20px ${agent.glow}30` }}
            >
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `radial-gradient(circle at 50% 80%, ${agent.glow}20, transparent 70%)` }}
              />
              <PixelChar grid={agent.char} scale={4} />
            </div>
            {/* Info */}
            <div className="text-center">
              <p className="text-sm font-semibold text-white leading-none">{agent.nome}</p>
              <p className="text-[10px] text-white/40 mt-0.5 leading-tight">{agent.funcao}</p>
            </div>
            {/* Online dot */}
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400/70">online</span>
            </div>
          </div>
        ))}
      </div>
    </GlowCard>
  );
}

function ButlerCard() {
  return (
    <GlowCard glowColor="blue" className="bg-black w-full flex flex-col">
      <div className="flex items-center justify-center bg-black px-4 pt-8 pb-4">
        <video
          src="/butler.mov"
          autoPlay
          loop
          muted
          playsInline
          className="rounded-xl object-contain"
          style={{ width: "100%", maxHeight: "150px", backgroundColor: "black" }}
        />
      </div>
      <div className="p-5 flex flex-col gap-3 bg-black">
        <div className="text-center">
          <h2 className="text-base font-semibold text-white">Fale com o seu Butler</h2>
        </div>
        <button className="w-full py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all">
          Iniciar conversa
        </button>
      </div>
    </GlowCard>
  );
}

export default function MenuPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-[120px]">
          <span className="text-2xl font-bold leading-none">✦</span>
          <span className="text-lg font-semibold tracking-wide">Aura+</span>
        </div>

        <LimelightNav
          initialActive={0}
          items={navLinks.map((item) => ({
            id: item.href,
            label: item.label,
            onClick: () => setTimeout(() => router.push(item.href), 350),
          }))}
        />

        <div className="min-w-[120px] flex justify-end">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-bold">
            Y
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 pb-16 space-y-6">
        {/* HERO CARD */}
        <div className="relative rounded-3xl overflow-hidden p-10 min-h-[280px] flex items-center">
          <div className="absolute inset-0 bg-black/55 z-10 pointer-events-none" />
          <DraggableVideo />

          <div className="flex-1 z-20">
            <p className="text-sm text-gray-300 mb-1">Bem-vindo ao Menu</p>
            <p className="text-5xl font-bold tracking-tight">Aura<span className="opacity-40">+</span></p>
            <p className="text-sm text-gray-400 mt-2">Gerencie suas tarefas e metas</p>
          </div>

          <div className="grid grid-cols-2 gap-3 z-20">
            {[
              { label: "Tarefas hoje", value: "0" },
              { label: "Concluídas", value: "0" },
              { label: "Em aberto", value: "0" },
              { label: "Esta semana", value: "0" },
            ].map(({ label, value }, i) => (
              <div key={i} className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[130px]">
                <p className="text-[11px] text-gray-300 mb-1">{label}</p>
                <p className="text-base font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CARDS DE TODO */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-stretch">
          <div className="lg:col-span-1 flex">
            <ButlerCard />
          </div>
          <div className="lg:col-span-1 flex">
            <TodoCard
              title="Tarefas profissionais"
              initialItems={[]}
            />
          </div>
          <div className="lg:col-span-2 flex">
            <WeeklyTodoCard />
          </div>
        </div>

        {/* Contas a Pagar Hoje + Agentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ContasHojeCard />
          <AgentsCard />
        </div>

        {/* Linha inferior */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DisciplineCard />
        </div>
      </div>
    </div>
  );
}
