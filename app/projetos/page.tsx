"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GlowCard } from "../components/ui/spotlight-card";
import { LimelightNav } from "../components/ui/limelight-nav";
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

type Prazo = "longo" | "medio" | "curto";
type Status = "ativo" | "concluido" | "pausado";

interface Projeto {
  id: number;
  title: string;
  description: string;
  prazo: Prazo;
  status: Status;
  created_at: string;
}

const PRAZO_CONFIG: Record<Prazo, { label: string; sub: string; color: string; bar: string; border: string; bg: string }> = {
  longo: {
    label: "Longo Prazo",
    sub: "1+ ano",
    color: "text-blue-400",
    bar: "bg-blue-400/60",
    border: "border-blue-400/20",
    bg: "bg-blue-400/5",
  },
  medio: {
    label: "Médio Prazo",
    sub: "3–12 meses",
    color: "text-amber-400",
    bar: "bg-amber-400/60",
    border: "border-amber-400/20",
    bg: "bg-amber-400/5",
  },
  curto: {
    label: "Curto Prazo",
    sub: "Até 3 meses",
    color: "text-emerald-400",
    bar: "bg-emerald-400/60",
    border: "border-emerald-400/20",
    bg: "bg-emerald-400/5",
  },
};

const STATUS_CONFIG: Record<Status, { label: string; pill: string }> = {
  ativo: { label: "Ativo", pill: "bg-white/8 text-white/50" },
  concluido: { label: "Concluído", pill: "bg-emerald-400/15 text-emerald-400" },
  pausado: { label: "Pausado", pill: "bg-amber-400/15 text-amber-400" },
};

function ProjetoCard({
  projeto,
  onDelete,
  onStatus,
}: {
  projeto: Projeto;
  onDelete: (id: number) => void;
  onStatus: (id: number, status: Status) => void;
}) {
  const done = projeto.status === "concluido";

  return (
    <div className={`group relative p-4 rounded-xl border transition-all ${
      done ? "border-white/5 opacity-55" : "border-white/[0.07] hover:border-white/12 hover:bg-white/[0.02]"
    }`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className={`text-sm font-semibold leading-snug ${done ? "line-through text-white/30" : "text-white"}`}>
          {projeto.title}
        </p>
        <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_CONFIG[projeto.status].pill}`}>
          {STATUS_CONFIG[projeto.status].label}
        </span>
      </div>

      {projeto.description && (
        <p className="text-xs text-white/35 leading-relaxed line-clamp-2 mb-3">
          {projeto.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-white/20">
          {new Date(projeto.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" })}
        </span>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!done ? (
            <button
              onClick={() => onStatus(projeto.id, "concluido")}
              title="Concluir"
              className="px-2 py-1 text-[11px] text-white/30 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
            >✓</button>
          ) : (
            <button
              onClick={() => onStatus(projeto.id, "ativo")}
              title="Reabrir"
              className="px-2 py-1 text-[11px] text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >↩</button>
          )}
          <button
            onClick={() => onStatus(projeto.id, projeto.status === "pausado" ? "ativo" : "pausado")}
            title={projeto.status === "pausado" ? "Retomar" : "Pausar"}
            className={`px-2 py-1 text-[11px] rounded-lg transition-colors ${
              projeto.status === "pausado"
                ? "text-amber-400 hover:text-white hover:bg-white/10"
                : "text-white/30 hover:text-amber-400 hover:bg-amber-400/10"
            }`}
          >{projeto.status === "pausado" ? "▶" : "⏸"}</button>
          <button
            onClick={() => onDelete(projeto.id)}
            title="Excluir"
            className="px-2 py-1 text-[11px] text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >✕</button>
        </div>
      </div>
    </div>
  );
}

function NovoProjetoModal({
  defaultPrazo,
  onClose,
  onSaved,
}: {
  defaultPrazo: Prazo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prazo, setPrazo] = useState<Prazo>(defaultPrazo);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await supabase.from("projetos").insert({
      title: title.trim(),
      description: description.trim(),
      prazo,
      status: "ativo",
    });
    setSaving(false);
    onSaved();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
            <h2 className="font-semibold text-white">Novo Projeto</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
            >✕</button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="text-[11px] text-white/30 mb-1 block">Título</label>
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSave()}
                placeholder="Nome do projeto…"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/30 mb-1 block">Descrição (opcional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Objetivo, contexto, próximos passos…"
                rows={3}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/30 mb-2 block">Prazo</label>
              <div className="grid grid-cols-3 gap-2">
                {(["longo", "medio", "curto"] as Prazo[]).map(p => {
                  const c = PRAZO_CONFIG[p];
                  const active = prazo === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setPrazo(p)}
                      className={`py-2.5 rounded-xl text-xs font-medium transition-all border ${
                        active
                          ? `${c.color} ${c.border} ${c.bg}`
                          : "text-white/30 border-white/5 hover:border-white/10 hover:text-white/60"
                      }`}
                    >
                      {c.label}
                      <span className="block text-[9px] opacity-50 mt-0.5">{c.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="w-full py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 disabled:opacity-30 transition-all"
            >
              {saving ? "Salvando…" : "Criar projeto"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProjetosPage() {
  const router = useRouter();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [defaultPrazo, setDefaultPrazo] = useState<Prazo>("curto");

  const fetchProjetos = useCallback(async () => {
    const { data } = await supabase
      .from("projetos")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProjetos(data as Projeto[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjetos(); }, [fetchProjetos]);

  const handleDelete = async (id: number) => {
    await supabase.from("projetos").delete().eq("id", id);
    setProjetos(prev => prev.filter(p => p.id !== id));
  };

  const handleStatus = async (id: number, status: Status) => {
    await supabase.from("projetos").update({ status }).eq("id", id);
    setProjetos(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const openModal = (prazo: Prazo) => {
    setDefaultPrazo(prazo);
    setShowModal(true);
  };

  const byPrazo = useMemo(() => ({
    longo: projetos.filter(p => p.prazo === "longo"),
    medio: projetos.filter(p => p.prazo === "medio"),
    curto: projetos.filter(p => p.prazo === "curto"),
  }), [projetos]);

  const totalAtivos = projetos.filter(p => p.status === "ativo").length;
  const totalConcluidos = projetos.filter(p => p.status === "concluido").length;

  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-[120px]">
          <span className="text-2xl font-bold leading-none">✦</span>
          <span className="text-lg font-semibold tracking-wide">Aura+</span>
        </div>
        <LimelightNav
          initialActive={4}
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

      <div className="max-w-7xl mx-auto px-6 py-6 pb-16 space-y-6">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Projetos</h1>
            <p className="text-sm text-white/30 mt-1">
              {projetos.length} projeto{projetos.length !== 1 ? "s" : ""}
              {" · "}{totalAtivos} ativo{totalAtivos !== 1 ? "s" : ""}
              {" · "}{totalConcluidos} concluído{totalConcluidos !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => openModal("curto")}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-all"
          >+ Novo projeto</button>
        </div>

        {/* 3 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {(["longo", "medio", "curto"] as Prazo[]).map(prazo => {
            const config = PRAZO_CONFIG[prazo];
            const list = byPrazo[prazo];
            const concluidos = list.filter(p => p.status === "concluido").length;
            const ativos = list.filter(p => p.status === "ativo").length;
            const progress = list.length > 0 ? Math.round(concluidos / list.length * 100) : 0;

            return (
              <GlowCard key={prazo} glowColor="blue" className="bg-black p-5 flex flex-col gap-4">

                {/* Cabeçalho da coluna */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className={`font-semibold text-base ${config.color}`}>{config.label}</h2>
                      {list.length > 0 && (
                        <span className="text-[11px] text-white/25 font-medium">{list.length}</span>
                      )}
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">{config.sub}</p>
                  </div>
                  <button
                    onClick={() => openModal(prazo)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all text-sm"
                  >+</button>
                </div>

                {/* Barra de progresso */}
                {list.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/25">{ativos} ativo{ativos !== 1 ? "s" : ""}</span>
                      <span className="text-white/35">{progress}% concluído</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${config.bar}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Lista de projetos */}
                <div className="space-y-2">
                  {loading ? (
                    <>
                      <div className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
                      <div className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
                    </>
                  ) : list.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-white/20 text-sm">Nenhum projeto</p>
                      <button
                        onClick={() => openModal(prazo)}
                        className="mt-2 text-xs text-white/20 hover:text-white/50 transition-colors"
                      >+ Adicionar</button>
                    </div>
                  ) : (
                    list.map(projeto => (
                      <ProjetoCard
                        key={projeto.id}
                        projeto={projeto}
                        onDelete={handleDelete}
                        onStatus={handleStatus}
                      />
                    ))
                  )}
                </div>
              </GlowCard>
            );
          })}
        </div>
      </div>

      {showModal && (
        <NovoProjetoModal
          defaultPrazo={defaultPrazo}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchProjetos(); }}
        />
      )}
    </div>
  );
}
