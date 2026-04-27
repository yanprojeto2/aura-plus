"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { LimelightNav } from "../components/ui/limelight-nav";
import { GlowCard } from "../components/ui/spotlight-card";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

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
    setPos(p => ({
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
      <video src="/Video.mp4" autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
      />
      <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white/60 text-[11px] px-2.5 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Arraste para ajustar
      </div>
    </div>
  );
}

const navLinks = [
  { label: "Menu",              href: "/menu"              },
  { label: "Financeiro",        href: "/financeiro"        },
  { label: "Gym",               href: "/gym"               },
  { label: "Tarefas",           href: "/tarefas"           },
  { label: "Projetos",          href: "/projetos"          },
  { label: "Calendário",        href: "/calendario"        },
  { label: "Quadro dos Sonhos", href: "/quadro-dos-sonhos" },
  { label: "Configurações",     href: "#"                  },
];

type FinanceiroTab = "menu" | "fluxo" | "contas" | "categorias" | "orcamento" | "timeline";

const financeiroTabs: { id: FinanceiroTab; label: string }[] = [
  { id: "menu",       label: "Menu"             },
  { id: "fluxo",      label: "Fluxo de Caixa"  },
  { id: "contas",     label: "Contas"           },
  { id: "categorias", label: "Categorias"       },
  { id: "orcamento",  label: "Orçamento"        },
  { id: "timeline",   label: "Linha do tempo"   },
];

/* ─── Fluxo de caixa ─── */
function FluxoDeCaixa({ saldoTotal, receitasMes, despesasMes, pendentes }: { saldoTotal: number; receitasMes: number; despesasMes: number; pendentes: number }) {
  const resumoData = [
    { d: "Jan", v: 0 }, { d: "Fev", v: 0 }, { d: "Mar", v: 0 },
    { d: "Abr", v: 0 }, { d: "Mai", v: 0 }, { d: "Jun", v: 0 },
  ];

  type CatTotal = { categoria: string; total: number };
  const [despPorCat, setDespPorCat] = useState<CatTotal[]>([]);
  const [recPorCat,  setRecPorCat]  = useState<CatTotal[]>([]);

  useEffect(() => {
    supabase.from("financeiro_transacoes").select("tipo,valor,categoria").then(({ data }) => {
      if (!data) return;
      const normTipo = (v: string) => {
        const m: Record<string, string> = { entrada: "Receita", saida: "Despesa", saída: "Despesa" };
        return m[v?.toLowerCase()] ?? v;
      };
      const agregar = (tipo: string) => {
        const mapa: Record<string, number> = {};
        data.filter(t => normTipo(t.tipo) === tipo).forEach(t => {
          const cat = t.categoria?.trim() || "Sem categoria";
          mapa[cat] = (mapa[cat] ?? 0) + Number(t.valor);
        });
        return Object.entries(mapa).map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total);
      };
      setDespPorCat(agregar("Despesa"));
      setRecPorCat(agregar("Receita"));
    });
  }, []);

  return (
    <div className="space-y-3">

      {/* ROW 1 — 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Saldo Total */}
        <GlowCard glowColor="blue" className="bg-black p-5 flex flex-col gap-3">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Saldo Total</p>
            <p className="text-lg font-bold text-white">R${fmtBRL(saldoTotal)}</p>
            <p className="text-[11px] text-white/30 mt-1">saldo em contas</p>
          </div>
        </GlowCard>

        {/* Receitas do Mês */}
        <GlowCard glowColor="blue" className="bg-black p-5 flex flex-col gap-3">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Receitas do Mês</p>
            <p className="text-lg font-bold text-blue-400">R${fmtBRL(receitasMes)}</p>
            <p className="text-[11px] text-white/30 mt-1">entradas no mês</p>
          </div>
        </GlowCard>

        {/* Despesas do Mês */}
        <GlowCard glowColor="blue" className="bg-black p-5 flex flex-col gap-3">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Despesas do Mês</p>
            <p className="text-lg font-bold text-white">R${fmtBRL(despesasMes)}</p>
            <p className="text-[11px] text-white/30 mt-1">saídas no mês</p>
          </div>
        </GlowCard>

        {/* Pendentes */}
        <GlowCard glowColor="blue" className="bg-black p-5 flex flex-col gap-3">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Pendentes</p>
            <p className="text-lg font-bold text-yellow-400">{pendentes}</p>
            <p className="text-[11px] text-white/30 mt-1">despesas a pagar</p>
          </div>
        </GlowCard>
      </div>

      {/* ROW 2 — 2 cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Balanço do Mês */}
        <GlowCard glowColor="blue" className="bg-black p-5 flex flex-col gap-2">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Balanço do Mês</p>
          <p className="text-xl font-bold text-white">
            R${fmtBRL(Math.abs(receitasMes - despesasMes))}
          </p>
          <p className="text-[11px] text-white/30">{receitasMes - despesasMes >= 0 ? "superávit" : "déficit"} no mês</p>
        </GlowCard>

        {/* A vencer */}
        <GlowCard glowColor="blue" className="bg-black p-5 flex flex-col gap-2">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">A Pagar (Pendentes)</p>
          <p className="text-xl font-bold text-white">{pendentes}</p>
          <p className="text-[11px] text-white/30">despesas pendentes</p>
        </GlowCard>
      </div>

      {/* ROW 3 — Resumo do dia + Receitas vs Despesas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Resumo do Dia */}
        <GlowCard glowColor="blue" className="bg-black p-5">
          <p className="text-sm font-semibold text-white mb-4">Resumo do Dia</p>
          <div className="flex items-center gap-6 mb-5">
            {[
              { label: "Receita",  value: "R$0,00", color: "text-blue-400", dot: "bg-blue-400" },
              { label: "Saldo",    value: "R$0,00", color: "text-white",       dot: "bg-white/60"    },
              { label: "Balanço",  value: "R$0,00", color: "text-yellow-400",  dot: "bg-yellow-400"  },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                <div>
                  <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
                  <p className="text-[10px] text-white/30">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={resumoData}>
              <defs>
                <linearGradient id="resumoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="d" tick={{ fill: "#ffffff30", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#ffffff30", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 11 }} formatter={v => [`R$${v}`, ""]} />
              <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={1.5} fill="url(#resumoGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </GlowCard>

        {/* Receitas vs Despesas */}
        <GlowCard glowColor="blue" className="bg-black p-5">
          <p className="text-sm font-semibold text-white mb-4">Receitas vs Despesas</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={resumoData}>
              <defs>
                <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="despGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="d" tick={{ fill: "#ffffff30", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#ffffff30", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 11 }} formatter={v => [`R$${v}`, ""]} />
              <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={1.5} fill="url(#recGrad)" dot={false} name="Receitas" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-400 rounded" /><span className="text-[11px] text-white/30">Receitas</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-white/40 rounded" /><span className="text-[11px] text-white/30">Despesas</span></div>
          </div>
        </GlowCard>
      </div>

      {/* ROW 4 — Despesas e Receitas por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Despesas por Categoria */}
        <GlowCard glowColor="blue" className="bg-black p-5">
          <p className="text-sm font-semibold text-white mb-4">Despesas por Categoria</p>
          {despPorCat.length === 0 ? (
            <p className="text-xs text-white/20 text-center py-6">Nenhuma despesa registrada</p>
          ) : (() => {
            const max = despPorCat[0].total;
            return (
              <div className="space-y-3">
                {despPorCat.map(({ categoria, total }) => (
                  <div key={categoria}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/60 truncate max-w-[60%]">{categoria}</span>
                      <span className="text-xs font-semibold text-white">R${fmtBRL(total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(total / max) * 100}%`, background: "linear-gradient(90deg, #7f1d1d, #dc2626)" }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </GlowCard>

        {/* Receitas por Categoria */}
        <GlowCard glowColor="blue" className="bg-black p-5">
          <p className="text-sm font-semibold text-white mb-4">Receitas por Categoria</p>
          {recPorCat.length === 0 ? (
            <p className="text-xs text-white/20 text-center py-6">Nenhuma receita registrada</p>
          ) : (() => {
            const max = recPorCat[0].total;
            return (
              <div className="space-y-3">
                {recPorCat.map(({ categoria, total }) => (
                  <div key={categoria}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/60 truncate max-w-[60%]">{categoria}</span>
                      <span className="text-xs font-semibold text-blue-400">R${fmtBRL(total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(total / max) * 100}%`, background: "linear-gradient(90deg, #1e3a8a, #3b82f6)" }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </GlowCard>

      </div>
    </div>
  );
}

/* ─── Fluxo de Caixa — Transações ─── */
type TipoTransacao = "Receita" | "Despesa" | "Transferência";

interface Transacao {
  id: number;
  nome: string;
  categoria: string;
  conta: string;
  data: string;
  valor: number;
  tipo: TipoTransacao;
}

const TIPO_CORES: Record<TipoTransacao, { bg: string; text: string; icone: string; gradient: string }> = {
  Receita:       { bg: "bg-blue-500/20",   text: "text-blue-400",   icone: "↑", gradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)" },
  Despesa:       { bg: "bg-red-500/20",    text: "text-red-400",    icone: "↓", gradient: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 60%, #f87171 100%)" },
  Transferência: { bg: "bg-yellow-500/20", text: "text-yellow-400", icone: "⇄", gradient: "linear-gradient(135deg, #78350f 0%, #d97706 60%, #fbbf24 100%)" },
};

function FluxoCaixaTransacoes({ onUpdate }: { onUpdate: () => void }) {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"Todos" | TipoTransacao>("Todos");
  const [filtroConta, setFiltroConta] = useState("Todas");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Transacao | null>(null);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ nome: "", categoria: "", conta: "", data: today, valor: "", tipo: "Despesa" as TipoTransacao });
  const [erroForm, setErroForm] = useState<string | null>(null);

  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<{ nome: string; icone: string; cor: string }[]>([]);
  const [contasDisponiveis, setContasDisponiveis] = useState<{ nome: string; icone: string; cor: string }[]>([]);

  useEffect(() => {
    supabase.from("financeiro_transacoes").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) {
        const normalizar = (v: string): TipoTransacao => {
          const mapa: Record<string, TipoTransacao> = {
            receita: "Receita", despesa: "Despesa",
            entrada: "Receita", saida: "Despesa", saída: "Despesa",
            transferencia: "Transferência", transferência: "Transferência",
          };
          return mapa[v?.toLowerCase()] ?? (v as TipoTransacao);
        };
        setTransacoes(data.map(t => ({ id: t.id, nome: t.nome, categoria: t.categoria, conta: t.conta, data: t.data, valor: t.valor, tipo: normalizar(t.tipo) })));
      }
    });
    supabase.from("financeiro_categorias").select("nome,icone,cor").order("created_at").then(({ data }) => {
      if (data) setCategoriasDisponiveis(data);
    });
    supabase.from("financeiro_contas").select("nome,icone,cor").order("created_at").then(({ data }) => {
      if (data) setContasDisponiveis(data);
    });
  }, []);

  const contas = Array.from(new Set(transacoes.map(t => t.conta).filter(Boolean)));

  const filtradas = transacoes.filter(t => {
    const okBusca = t.nome.toLowerCase().includes(busca.toLowerCase()) || t.categoria.toLowerCase().includes(busca.toLowerCase());
    const okTipo  = filtroTipo === "Todos" || t.tipo === filtroTipo;
    const okConta = filtroConta === "Todas" || t.conta === filtroConta;
    return okBusca && okTipo && okConta;
  });

  const abrirNova = () => {
    setEditando(null);
    setErroForm(null);
    setForm({ nome: "", categoria: "", conta: "", data: today, valor: "", tipo: "Despesa" });
    setModal(true);
  };

  const abrirEditar = (t: Transacao) => {
    setEditando(t);
    setErroForm(null);
    setForm({ nome: t.nome, categoria: t.categoria, conta: t.conta, data: t.data, valor: String(t.valor), tipo: t.tipo });
    setModal(true);
  };

  const salvar = async () => {
    setErroForm(null);
    if (!form.nome.trim()) { setErroForm("Informe o nome da transação."); return; }
    if (!form.conta) { setErroForm("Selecione uma conta."); return; }
    const valorNum = parseFloat(form.valor || "0");
    if (!valorNum || valorNum <= 0) { setErroForm("Informe um valor válido."); return; }
    const payload = { nome: form.nome, categoria: form.categoria, conta: form.conta, data: form.data, valor: valorNum, tipo: form.tipo };
    if (editando) {
      await supabase.from("financeiro_transacoes").update(payload).eq("id", editando.id);
      setTransacoes(prev => prev.map(t => t.id === editando.id ? { ...t, ...payload } : t));
    } else {
      const { data } = await supabase.from("financeiro_transacoes").insert(payload).select().single();
      if (data) setTransacoes(prev => [{ id: data.id, ...payload }, ...prev]);
    }
    setModal(false);
    onUpdate();
  };

  const excluir = async (id: number) => {
    setTransacoes(prev => prev.filter(t => t.id !== id));
    await supabase.from("financeiro_transacoes").delete().eq("id", id);
    onUpdate();
  };

  return (
    <div className="space-y-4">

      {/* Barra de busca + filtros + botões */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 bg-[#111] border border-white/[0.06] rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#ffffff40" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar transações..."
            className="bg-transparent text-sm text-white placeholder-white/20 outline-none flex-1"
          />
        </div>

        {/* Filtro tipo */}
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value as typeof filtroTipo)}
          className="bg-[#111] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white outline-none"
        >
          <option value="Todos" className="bg-[#111]">Todos</option>
          <option value="Receita" className="bg-[#111]">Receita</option>
          <option value="Despesa" className="bg-[#111]">Despesa</option>
          <option value="Transferência" className="bg-[#111]">Transferência</option>
        </select>

        {/* Filtro conta */}
        <select
          value={filtroConta}
          onChange={e => setFiltroConta(e.target.value)}
          className="bg-[#111] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white outline-none"
        >
          <option value="Todas" className="bg-[#111]">Todas</option>
          {contas.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
        </select>

        {/* Botões */}
        <button
          onClick={abrirNova}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90"
          style={{background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)"}}
        >
          + Adicionar
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/[0.06] text-white/70 hover:text-white text-sm font-medium rounded-xl transition-all">
          ↑ Importar Extrato
        </button>
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-white/20 text-sm">{busca ? "Nenhuma transação encontrada" : "Nenhuma transação cadastrada"}</p>
          {!busca && <button onClick={abrirNova} className="mt-3 text-xs text-white/30 hover:text-white transition-colors">+ Adicionar primeira transação</button>}
        </div>
      ) : (
        <GlowCard glowColor="blue" className="bg-black overflow-hidden">
          {filtradas.map((t, i) => {
            const cfg = TIPO_CORES[t.tipo] ?? { bg: "bg-gray-500/20", text: "text-gray-400", icone: "?" };
            const negativo = t.tipo === "Despesa";
            return (
              <div key={t.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors rounded-2xl ${i < filtradas.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                {/* Ícone */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 border border-white/10" style={{background: cfg.gradient}}>
                  {cfg.icone}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{t.nome}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    {[t.categoria, t.conta, fmtData(t.data)].filter(Boolean).join(" • ")}
                  </p>
                </div>

                {/* Valor */}
                <p className={`text-sm font-bold flex-shrink-0 ${negativo ? "text-white" : "text-emerald-400"}`}>
                  {negativo ? "-" : "+"}R${fmtBRL(t.valor)}
                </p>

                {/* Ações */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => abrirEditar(t)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all text-xs">✏</button>
                  <button onClick={() => excluir(t.id)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/30 hover:text-red-400 transition-all text-xs">🗑</button>
                </div>
              </div>
            );
          })}
        </GlowCard>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">{editando ? "Editar transação" : "Nova transação"}</h2>
              <button onClick={() => setModal(false)} className="text-white/30 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Nome</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Aluguel, Salário..."
                  className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15" />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Despesa","Receita","Transferência"] as TipoTransacao[]).map(tp => {
                    const cfg = TIPO_CORES[tp];
                    return (
                      <button key={tp} onClick={() => setForm(f => ({ ...f, tipo: tp }))}
                        className={`py-2 rounded-xl text-xs font-medium border transition-all ${form.tipo === tp ? `${cfg.bg} ${cfg.text} border-current` : "bg-white/5 border-white/10 text-white/40"}`}>
                        {tp}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Valor (R$)</label>
                <input type="number" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                  placeholder="0,00"
                  className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15" />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Data</label>
                <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                  className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white outline-none border border-transparent focus:border-white/15" />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Categoria</label>
                {categoriasDisponiveis.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {categoriasDisponiveis.map(cat => {
                      const corObj = CAT_CORES.find(c => c.bg === cat.cor) ?? CAT_CORES[0];
                      const selected = form.categoria === cat.nome;
                      return (
                        <button
                          key={cat.nome}
                          onClick={() => setForm(f => ({ ...f, categoria: selected ? "" : cat.nome }))}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all flex-shrink-0 ${
                            selected ? `${cat.cor} ${corObj.text} border-current` : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
                          }`}
                        >
                          <span>{cat.icone}</span>
                          <span>{cat.nome}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                    placeholder="Ex: Alimentação, Salário..."
                    className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15" />
                )}
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Conta</label>
                {contasDisponiveis.length > 0 ? (
                  <div className="max-h-[160px] overflow-y-auto scrollbar-none rounded-xl border border-white/[0.06] bg-white/[0.03]">
                    {contasDisponiveis.map((c, i) => {
                      const corObj = CORES.find(x => x.bg === c.cor) ?? CORES[0];
                      const selected = form.conta === c.nome;
                      return (
                        <button
                          key={c.nome}
                          onClick={() => setForm(f => ({ ...f, conta: selected ? "" : c.nome }))}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all text-left ${
                            selected ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white/80"
                          } ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
                        >
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selected ? corObj.text.replace("text-", "bg-") : "bg-white/20"}`} />
                          <span className="flex-1">{c.nome}</span>
                          {selected && <span className="text-white/40 text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input value={form.conta} onChange={e => setForm(f => ({ ...f, conta: e.target.value }))}
                    placeholder="Ex: Nubank, Bradesco..."
                    className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15" />
                )}
              </div>
            </div>

            {erroForm && (
              <p className="mt-4 text-xs text-red-400 text-center">{erroForm}</p>
            )}
            <button onClick={salvar} className="mt-3 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl transition-all">
              {editando ? "Salvar alterações" : "Adicionar transação"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Linha do Tempo ─── */
type StatusDespesa = "Pendente" | "Próxima" | "Vencida" | "Paga";

interface Despesa {
  id: number;
  nome: string;
  valor: number;
  data: string;
  status: StatusDespesa;
  categoria: string;
  syncSource?: string | null;
}

const STATUS_CONFIG: Record<StatusDespesa, { label: string; bg: string; text: string }> = {
  Paga:     { label: "Paga",     bg: "bg-emerald-500/20", text: "text-emerald-400" },
  Pendente: { label: "Pendente", bg: "bg-yellow-500/20",  text: "text-yellow-400"  },
  Próxima:  { label: "Próxima",  bg: "bg-blue-500/20",    text: "text-blue-400"    },
  Vencida:  { label: "Vencida",  bg: "bg-red-500/20",     text: "text-red-400"     },
};

function fmtData(d: string) {
  const [y, m, day] = d.split("-");
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${day} ${meses[parseInt(m) - 1]} ${y}`;
}

function fmtMesAno(d: string) {
  const [y, m] = d.split("-");
  const meses = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
  return `${meses[parseInt(m) - 1]} ${y}`;
}

function LinhaDoTempo() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [filtro, setFiltro] = useState<"Todas" | StatusDespesa>("Todas");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Despesa | null>(null);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ nome: "", valor: "", data: today, status: "Pendente" as StatusDespesa, categoria: "" });

  useEffect(() => {
    supabase.from("financeiro_despesas").select("*").order("created_at").then(({ data }) => {
      if (data) setDespesas(data.map(d => ({ id: d.id, nome: d.nome, valor: d.valor, data: d.data, status: d.status as StatusDespesa, categoria: d.categoria, syncSource: d.sync_source ?? null })));
    });
  }, []);

  const filtradas = filtro === "Todas" ? despesas : despesas.filter(d => d.status === filtro);

  // agrupar por mês
  const grupos = filtradas.reduce<Record<string, Despesa[]>>((acc, d) => {
    const key = d.data.slice(0, 7);
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});
  const mesesOrdenados = Object.keys(grupos).sort((a, b) => b.localeCompare(a));

  const abrirNova = () => {
    setEditando(null);
    setForm({ nome: "", valor: "", data: today, status: "Pendente", categoria: "" });
    setModal(true);
  };

  const abrirEditar = (d: Despesa) => {
    setEditando(d);
    setForm({ nome: d.nome, valor: String(d.valor), data: d.data, status: d.status, categoria: d.categoria });
    setModal(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) return;
    const payload = { nome: form.nome, valor: parseFloat(form.valor || "0"), data: form.data, status: form.status, categoria: form.categoria };
    if (editando) {
      await supabase.from("financeiro_despesas").update(payload).eq("id", editando.id);
      setDespesas(prev => prev.map(d => d.id === editando.id ? { ...d, ...payload } : d));
    } else {
      const { data } = await supabase.from("financeiro_despesas").insert(payload).select().single();
      if (data) {
        setDespesas(prev => [...prev, { id: data.id, ...payload }]);
        if (payload.categoria !== "Compromisso") {
          fetch("/api/calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: payload.nome,
              note: `R$ ${payload.valor.toFixed(2)}${payload.categoria ? " • " + payload.categoria : ""}`,
              date: payload.data,
              startTime: "09:00",
              endTime: "10:00",
              syncSource: "financeiro",
            }),
          });
        }
      }
    }
    setModal(false);
  };

  const excluir = async (id: number) => {
    const despesa = despesas.find(d => d.id === id);
    setDespesas(prev => prev.filter(d => d.id !== id));
    await supabase.from("financeiro_despesas").delete().eq("id", id);
    if (despesa && despesa.categoria !== "Compromisso") {
      fetch(`/api/calendar?date=${despesa.data}`)
        .then(r => r.json())
        .then((calEvents: any[]) => {
          const match = calEvents.find(e => e.title === despesa.nome && e.syncSource === "financeiro");
          if (match) fetch(`/api/calendar/${match.id}`, { method: "DELETE" });
        })
        .catch(() => {});
    }
  };

  return (
    <div className="space-y-4">

      {/* Filtros + botão */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-[#111] border border-white/[0.06] rounded-xl p-1">
          {(["Todas", "Pendentes", "Próximas", "Vencidas", "Pagas"] as const).map(f => {
            const val = f === "Todas" ? "Todas" : f === "Pendentes" ? "Pendente" : f === "Próximas" ? "Próxima" : f === "Vencidas" ? "Vencida" : "Paga";
            const active = filtro === val;
            return (
              <button
                key={f}
                onClick={() => setFiltro(val as typeof filtro)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
        <button
          onClick={abrirNova}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90"
          style={{background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)"}}
        >
          + Nova Despesa
        </button>
      </div>

      {/* Lista agrupada por mês */}
      {mesesOrdenados.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-white/20 text-sm">Nenhuma despesa cadastrada</p>
          <button onClick={abrirNova} className="mt-3 text-xs text-white/30 hover:text-white transition-colors">+ Adicionar primeira despesa</button>
        </div>
      ) : (
        mesesOrdenados.map(mes => {
          const total = grupos[mes].reduce((a, d) => a + d.valor, 0);
          return (
            <div key={mes}>
              {/* Cabeçalho do mês */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-white tracking-wide">{fmtMesAno(mes + "-01")}</p>
                <p className="text-sm font-semibold text-white/50">R${fmtBRL(total)}</p>
              </div>

              {/* Itens */}
              <GlowCard glowColor="blue" className="bg-black overflow-hidden">
                {grupos[mes].sort((a, b) => a.data.localeCompare(b.data)).map((despesa, i, arr) => {
                  const st = STATUS_CONFIG[despesa.status] ?? STATUS_CONFIG["Pendente"];
                  const paga = despesa.status === "Paga";
                  return (
                    <div key={despesa.id} className={`flex items-center gap-4 px-5 py-4 ${i < arr.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                      {/* Ícone status */}
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        paga ? "border-emerald-500 text-emerald-400" : despesa.status === "Vencida" ? "border-red-500 text-red-400" : "border-white/20 text-white/30"
                      }`}>
                        {paga ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className={`text-sm font-semibold ${paga ? "line-through text-white/40" : "text-white"}`}>{despesa.nome}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                          {despesa.categoria && (
                            <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{despesa.categoria}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <p className={`text-base font-bold ${paga ? "text-white/40" : "text-white"}`}>R${fmtBRL(despesa.valor)}</p>
                          <p className="text-[11px] text-white/30">{fmtData(despesa.data)}</p>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => abrirEditar(despesa)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all text-xs">✏</button>
                        <button onClick={() => excluir(despesa.id)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/30 hover:text-red-400 transition-all text-xs">🗑</button>
                      </div>
                    </div>
                  );
                })}
              </GlowCard>
            </div>
          );
        })
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">{editando ? "Editar despesa" : "Nova despesa"}</h2>
              <button onClick={() => setModal(false)} className="text-white/30 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Nome</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Aluguel, Netflix..."
                  className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15" />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Valor (R$)</label>
                <input type="number" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                  placeholder="0,00"
                  className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15" />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Data</label>
                <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                  className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white outline-none border border-transparent focus:border-white/15" />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Categoria</label>
                <input value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  placeholder="Ex: Investimentos, Cartão..."
                  className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15" />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Pendente","Próxima","Vencida","Paga"] as StatusDespesa[]).map(s => {
                    const st = STATUS_CONFIG[s];
                    return (
                      <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                        className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                          form.status === s ? `${st.bg} border-current ${st.text}` : "bg-white/5 border-white/10 text-white/40"
                        }`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button onClick={salvar} className="mt-6 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl transition-all">
              {editando ? "Salvar alterações" : "Adicionar despesa"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Categorias ─── */
type TipoCategoria = "Despesa" | "Receita";

interface Categoria {
  id: number;
  nome: string;
  tipo: TipoCategoria;
  cor: string;
  icone: string;
}

const CAT_CORES = [
  { bg: "bg-orange-500/20",  text: "text-orange-400"  },
  { bg: "bg-purple-500/20",  text: "text-purple-400"  },
  { bg: "bg-blue-500/20",    text: "text-blue-400"    },
  { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  { bg: "bg-red-500/20",     text: "text-red-400"     },
  { bg: "bg-yellow-500/20",  text: "text-yellow-400"  },
  { bg: "bg-pink-500/20",    text: "text-pink-400"    },
  { bg: "bg-cyan-500/20",    text: "text-cyan-400"    },
];

function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [form, setForm] = useState({ nome: "", tipo: "Despesa" as TipoCategoria, cor: "0", icone: "★" });

  useEffect(() => {
    supabase.from("financeiro_categorias").select("*").order("created_at").then(({ data }) => {
      if (data) setCategorias(data.map(c => ({ id: c.id, nome: c.nome, tipo: c.tipo as TipoCategoria, cor: c.cor, icone: c.icone })));
    });
  }, []);

  const abrirNova = () => {
    setEditando(null);
    setForm({ nome: "", tipo: "Despesa", cor: "0", icone: "★" });
    setModal(true);
  };

  const abrirEditar = (c: Categoria) => {
    setEditando(c);
    const corIdx = CAT_CORES.findIndex(x => x.bg === c.cor);
    setForm({ nome: c.nome, tipo: c.tipo, cor: String(corIdx >= 0 ? corIdx : 0), icone: c.icone });
    setModal(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) return;
    const corObj = CAT_CORES[Number(form.cor)];
    const payload = { nome: form.nome, tipo: form.tipo, cor: corObj.bg, icone: form.icone };
    if (editando) {
      await supabase.from("financeiro_categorias").update(payload).eq("id", editando.id);
      setCategorias(prev => prev.map(c => c.id === editando.id ? { ...c, ...payload } : c));
    } else {
      const { data } = await supabase.from("financeiro_categorias").insert(payload).select().single();
      if (data) setCategorias(prev => [...prev, { id: data.id, ...payload }]);
    }
    setModal(false);
  };

  const excluir = async (id: number) => {
    setCategorias(prev => prev.filter(c => c.id !== id));
    await supabase.from("financeiro_categorias").delete().eq("id", id);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-white/30">{categorias.length} categoria{categorias.length !== 1 ? "s" : ""} cadastrada{categorias.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={abrirNova}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90"
          style={{background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)"}}
        >
          + Nova Categoria
        </button>
      </div>

      {/* Grid */}
      {categorias.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-white/20 text-sm">Nenhuma categoria cadastrada</p>
          <button onClick={abrirNova} className="mt-3 text-xs text-white/30 hover:text-white transition-colors">+ Adicionar primeira categoria</button>
        </div>
      ) : (
        <div className="space-y-6">
          {(["Despesa", "Receita"] as TipoCategoria[]).map(tipo => {
            const grupo = categorias.filter(c => c.tipo === tipo);
            if (grupo.length === 0) return null;
            return (
              <div key={tipo}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${tipo === "Despesa" ? "bg-red-400" : "bg-emerald-400"}`} />
                  <p className={`text-xs font-semibold uppercase tracking-widest ${tipo === "Despesa" ? "text-red-400" : "text-emerald-400"}`}>{tipo}</p>
                  <span className="text-[11px] text-white/20">{grupo.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {grupo.map(cat => {
                    const corObj = CAT_CORES.find(c => c.bg === cat.cor) ?? CAT_CORES[0];
                    return (
                      <GlowCard key={cat.id} glowColor="blue" className="bg-black px-4 py-3.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{cat.nome}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => abrirEditar(cat)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all text-xs"
                          >
                            ✏
                          </button>
                          <button
                            onClick={() => excluir(cat.id)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/30 hover:text-red-400 transition-all text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </GlowCard>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">{editando ? "Editar categoria" : "Nova categoria"}</h2>
              <button onClick={() => setModal(false)} className="text-white/30 hover:text-white transition-colors">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Nome</label>
                <input
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Alimentação, Salário..."
                  className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Tipo</label>
                <div className="flex gap-2">
                  {(["Despesa", "Receita"] as TipoCategoria[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, tipo: t }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                        form.tipo === t
                          ? t === "Despesa"
                            ? "bg-red-500/20 border-red-500/40 text-red-400"
                            : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : "bg-white/5 border-white/10 text-white/40"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Ícone (emoji ou letra)</label>
                <input
                  value={form.icone}
                  onChange={e => setForm(f => ({ ...f, icone: e.target.value.slice(0, 2) }))}
                  placeholder="★"
                  className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {CAT_CORES.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setForm(f => ({ ...f, cor: String(i) }))}
                      className={`w-7 h-7 rounded-full ${c.bg} border-2 transition-all ${form.cor === String(i) ? "border-white" : "border-transparent"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={salvar}
              className="mt-6 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl transition-all"
            >
              {editando ? "Salvar alterações" : "Adicionar categoria"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Contas Bancárias ─── */
type StatusConta = "Disponível" | "A Receber";
type TipoConta = "Conta Corrente" | "Conta Poupança" | "Carteira Digital" | "Investimento" | "Outro";
type PerfilConta = "Pessoal" | "Empresarial";

interface Conta {
  id: number;
  nome: string;
  tipo: TipoConta;
  status: StatusConta;
  perfil: PerfilConta;
  saldo: number;
  cor: string;
  icone: string;
}

const CORES = [
  { bg: "bg-emerald-500/20", text: "text-emerald-400", hex: "#10b981" },
  { bg: "bg-blue-500/20",    text: "text-blue-400",    hex: "#3b82f6" },
  { bg: "bg-purple-500/20",  text: "text-purple-400",  hex: "#a855f7" },
  { bg: "bg-orange-500/20",  text: "text-orange-400",  hex: "#f97316" },
  { bg: "bg-red-500/20",     text: "text-red-400",     hex: "#ef4444" },
  { bg: "bg-yellow-500/20",  text: "text-yellow-400",  hex: "#eab308" },
  { bg: "bg-pink-500/20",    text: "text-pink-400",    hex: "#ec4899" },
  { bg: "bg-cyan-500/20",    text: "text-cyan-400",    hex: "#06b6d4" },
];

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ContasBancarias({ onUpdate }: { onUpdate: () => void }) {
  const [contas, setContas] = useState<Conta[]>([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Conta | null>(null);
  const [form, setForm] = useState({
    nome: "", tipo: "Conta Corrente" as TipoConta,
    status: "Disponível" as StatusConta, perfil: "Pessoal" as PerfilConta, saldo: "", cor: "0", icone: "★",
  });

  const fetchContas = useCallback(async () => {
    const { data: contasData } = await supabase.from("financeiro_contas").select("*").order("created_at");
    if (!contasData) return;
    setContas(contasData.map(c => ({
      id: c.id, nome: c.nome, tipo: c.tipo as TipoConta, status: c.status as StatusConta,
      perfil: (c.perfil as PerfilConta) ?? "Pessoal",
      saldo: Number(c.saldo),
      cor: c.cor, icone: c.icone,
    })));
    onUpdate();
  }, [onUpdate]);

  useEffect(() => {
    fetchContas();
    const channel = supabase.channel("contas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "financeiro_contas" }, fetchContas)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchContas]);

  const totalDisponivel = contas.filter(c => c.status === "Disponível").reduce((a, c) => a + c.saldo, 0);
  const totalReceber    = contas.filter(c => c.status === "A Receber").reduce((a, c) => a + c.saldo, 0);
  const totalGeral      = contas.reduce((a, c) => a + c.saldo, 0);

  const abrirNova = () => {
    setEditando(null);
    setForm({ nome: "", tipo: "Conta Corrente", status: "Disponível", perfil: "Pessoal", saldo: "", cor: "0", icone: "★" });
    setModal(true);
  };

  const abrirEditar = (c: Conta) => {
    setEditando(c);
    const corIdx = CORES.findIndex(x => x.bg === c.cor);
    setForm({ nome: c.nome, tipo: c.tipo, status: c.status, perfil: c.perfil ?? "Pessoal", saldo: String(c.saldo), cor: String(corIdx >= 0 ? corIdx : 0), icone: c.icone });
    setModal(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) return;
    const corObj = CORES[Number(form.cor)];
    const parseSaldo = (v: string) => parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0;
    const payload = { nome: form.nome, tipo: form.tipo, status: form.status, perfil: form.perfil, saldo: parseSaldo(form.saldo), cor: corObj.bg, icone: form.icone };
    if (editando) {
      await supabase.from("financeiro_contas").update(payload).eq("id", editando.id);
      setContas(prev => prev.map(c => c.id === editando.id ? { ...c, ...payload } : c));
    } else {
      const { data } = await supabase.from("financeiro_contas").insert(payload).select().single();
      if (data) setContas(prev => [...prev, { id: data.id, ...payload, perfil: form.perfil }]);
    }
    setModal(false);
    onUpdate();
  };

  const excluir = async (id: number) => {
    setContas(prev => prev.filter(c => c.id !== id));
    await supabase.from("financeiro_contas").delete().eq("id", id);
    onUpdate();
  };

  const contasPessoais    = contas.filter(c => (c.perfil ?? "Pessoal") === "Pessoal");
  const contasEmpresariais = contas.filter(c => c.perfil === "Empresarial");

  const renderGrid = (lista: Conta[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {lista.map(conta => (
        <GlowCard key={conta.id} glowColor="blue" className="bg-black p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {conta.nome?.toLowerCase().includes("bradesco") && (
                <img src="/Bra 1.png" alt="Bradesco" className="w-16 h-16 rounded-full object-cover" />
              )}
              {conta.nome?.toLowerCase().includes("nubank") && (
                <img src="/Nu.png" alt="Nubank" className="w-16 h-16 rounded-full object-cover" />
              )}
              {conta.nome?.toLowerCase().includes("cakto") && (
                <img src="/cAK.png" alt="Cakto" className="w-16 h-16 rounded-full object-cover" />
              )}
              {conta.nome?.toLowerCase().includes("payt") && (
                <img src="/Payt.png" alt="Payt" className="w-16 h-16 rounded-full object-cover" />
              )}
              {!conta.nome?.toLowerCase().includes("bradesco") &&
               !conta.nome?.toLowerCase().includes("nubank") &&
               !conta.nome?.toLowerCase().includes("cakto") &&
               !conta.nome?.toLowerCase().includes("payt") && (
                <img src="/Money.png" alt="Conta" className="w-16 h-16 rounded-full object-cover" />
              )}
              <div>
                <p className="text-sm font-semibold text-white leading-none">{conta.nome}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{conta.tipo}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => abrirEditar(conta)} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all text-xs">✏</button>
              <button onClick={() => excluir(conta.id)} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/30 hover:text-red-400 transition-all text-xs">✕</button>
            </div>
          </div>
          <span className="text-[10px] font-medium text-white/40 self-start">{conta.status}</span>
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Saldo</p>
            <p className="text-xl font-bold text-white mt-0.5">R${fmtBRL(conta.saldo)}</p>
          </div>
        </GlowCard>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-white/40 uppercase tracking-wider">Saldo Total das Contas</p>
          <p className="text-2xl font-bold text-white mt-1">R${fmtBRL(totalGeral)}</p>
          <p className="text-[11px] text-white/30 mt-1">{contas.length} conta{contas.length !== 1 ? "s" : ""} registrada{contas.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={abrirNova}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-sm font-medium rounded-xl transition-all"
        >
          + Nova Conta
        </button>
      </div>

      {/* Disponível / A Receber */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative overflow-hidden rounded-2xl px-6 py-5 flex flex-col gap-1" style={{background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)"}}>
          <div className="absolute inset-0 opacity-20" style={{background: "radial-gradient(circle at 80% 20%, #60a5fa, transparent 60%)"}} />
          <p className="relative text-[10px] text-blue-200/70 uppercase tracking-widest font-medium">Disponível</p>
          <p className="relative text-2xl font-bold text-white drop-shadow">R${fmtBRL(totalDisponivel)}</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl px-6 py-5 flex flex-col gap-1" style={{background: "linear-gradient(135deg, #3b0764 0%, #7c3aed 50%, #a855f7 100%)"}}>
          <div className="absolute inset-0 opacity-20" style={{background: "radial-gradient(circle at 80% 20%, #c084fc, transparent 60%)"}} />
          <p className="relative text-[10px] text-purple-200/70 uppercase tracking-widest font-medium">A Receber</p>
          <p className="relative text-2xl font-bold text-white drop-shadow">R${fmtBRL(totalReceber)}</p>
        </div>
      </div>

      {/* Contas Pessoais */}
      {contasPessoais.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Pessoal</p>
            <div className="flex-1 h-px bg-white/5" />
            <p className="text-xs text-white/30">R${fmtBRL(contasPessoais.reduce((a, c) => a + c.saldo, 0))}</p>
          </div>
          {renderGrid(contasPessoais)}
        </div>
      )}

      {/* Contas Empresariais */}
      {contasEmpresariais.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Empresarial</p>
            <div className="flex-1 h-px bg-white/5" />
            <p className="text-xs text-white/30">R${fmtBRL(contasEmpresariais.reduce((a, c) => a + c.saldo, 0))}</p>
          </div>
          {renderGrid(contasEmpresariais)}
        </div>
      )}

      {contas.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-white/20 text-sm">Nenhuma conta cadastrada</p>
          <button onClick={abrirNova} className="mt-3 text-xs text-white/30 hover:text-white transition-colors">+ Adicionar primeira conta</button>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">{editando ? "Editar conta" : "Nova conta"}</h2>
              <button onClick={() => setModal(false)} className="text-white/30 hover:text-white transition-colors">✕</button>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Nome da conta</label>
                <input
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Nubank, Bradesco..."
                  className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoConta }))}
                  className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white outline-none border border-transparent focus:border-white/15"
                >
                  {(["Conta Corrente","Conta Poupança","Carteira Digital","Investimento","Outro"] as TipoConta[]).map(t => (
                    <option key={t} value={t} className="bg-[#111]">{t}</option>
                  ))}
                </select>
              </div>

              {/* Perfil */}
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Perfil</label>
                <div className="flex gap-2">
                  {(["Pessoal", "Empresarial"] as PerfilConta[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setForm(f => ({ ...f, perfil: p }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                        form.perfil === p
                          ? p === "Pessoal" ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-purple-500/20 border-purple-500/40 text-purple-400"
                          : "bg-white/5 border-white/10 text-white/40"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Status</label>
                <div className="flex gap-2">
                  {(["Disponível","A Receber"] as StatusConta[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                        form.status === s
                          ? s === "Disponível" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-orange-500/20 border-orange-500/40 text-orange-400"
                          : "bg-white/5 border-white/10 text-white/40"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Saldo */}
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Saldo inicial (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.saldo}
                  onChange={e => setForm(f => ({ ...f, saldo: e.target.value }))}
                  placeholder="0,00"
                  className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15"
                />
              </div>

              {/* Cor */}
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {CORES.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setForm(f => ({ ...f, cor: String(i) }))}
                      className={`w-7 h-7 rounded-full ${c.bg} border-2 transition-all ${form.cor === String(i) ? "border-white" : "border-transparent"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={salvar}
              className="mt-6 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl transition-all"
            >
              {editando ? "Salvar alterações" : "Adicionar conta"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FinanceiroPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FinanceiroTab>("menu");
  const [saldoTotal, setSaldoTotal]     = useState(0);
  const [receitasMes, setReceitasMes]   = useState(0);
  const [despesasMes, setDespesasMes]   = useState(0);
  const [pendentes, setPendentes]       = useState(0);

  const loadStats = useCallback(async () => {
    const mesAtual = new Date().toISOString().slice(0, 7);
    const normTipo = (v: string) => {
      const m: Record<string, string> = {
        receita: "Receita", despesa: "Despesa",
        entrada: "Receita", saida: "Despesa", saída: "Despesa",
        transferencia: "Transferência", transferência: "Transferência",
      };
      return m[v?.toLowerCase()] ?? v;
    };
    const isTransferencia = (t: { tipo: string; categoria?: string }) =>
      normTipo(t.tipo) === "Transferência" ||
      /transfer/i.test(t.categoria ?? "");
    const [{ data: contas }, { data: transMes }, { data: pend }] = await Promise.all([
      supabase.from("financeiro_contas").select("saldo"),
      supabase.from("financeiro_transacoes").select("valor,tipo,categoria").like("data", `${mesAtual}%`),
      supabase.from("financeiro_despesas").select("id").in("status", ["Pendente", "Vencida"]),
    ]);
    setSaldoTotal(contas?.reduce((a, c) => a + Number(c.saldo), 0) ?? 0);
    setReceitasMes(transMes?.filter(t => normTipo(t.tipo) === "Receita" && !isTransferencia(t)).reduce((a, t) => a + Number(t.valor), 0) ?? 0);
    setDespesasMes(transMes?.filter(t => normTipo(t.tipo) === "Despesa" && !isTransferencia(t)).reduce((a, t) => a + Number(t.valor), 0) ?? 0);
    setPendentes(pend?.length ?? 0);
  }, []);

  useEffect(() => {
    loadStats();
    const channel = supabase.channel("financeiro-stats-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "financeiro_contas" }, loadStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "financeiro_transacoes" }, loadStats)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadStats]);

  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-[120px]">
          <span className="text-2xl font-bold leading-none">✦</span>
          <span className="text-lg font-semibold tracking-wide">Aura+</span>
        </div>
        <LimelightNav
          initialActive={1}
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

        {/* HERO CARD */}
        <div className="relative rounded-3xl overflow-hidden min-h-[280px] flex items-center p-10">
          <div className="absolute inset-0 bg-black/55 z-10 pointer-events-none" />
          <DraggableVideo />
          <div className="flex-1 z-20">
            <p className="text-sm text-gray-300 mb-1">Saldo total</p>
            <p className="text-5xl font-bold tracking-tight">R${fmtBRL(saldoTotal)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 z-20">
            {[
              { label: "Receitas do mês",  value: `R$${fmtBRL(receitasMes)}`  },
              { label: "Despesas do mês",  value: `R$${fmtBRL(despesasMes)}`  },
              { label: "Balanço",          value: `${receitasMes - despesasMes >= 0 ? "+" : "-"}R$${fmtBRL(Math.abs(receitasMes - despesasMes))}` },
              { label: "Pendentes",        value: String(pendentes)            },
            ].map(({ label, value }, i) => (
              <div key={i} className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[130px]">
                <p className="text-[11px] text-gray-300 mb-1">{label}</p>
                <p className="text-base font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SUB NAVBAR */}
        <div className="flex items-center gap-1 border-b border-white/5">
          {financeiroTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-all relative whitespace-nowrap
                ${activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white/70"}`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        {activeTab === "menu"       && <FluxoDeCaixa saldoTotal={saldoTotal} receitasMes={receitasMes} despesasMes={despesasMes} pendentes={pendentes} />}
        {activeTab === "fluxo"      && <FluxoCaixaTransacoes onUpdate={loadStats} />}
        {activeTab === "contas"     && <ContasBancarias onUpdate={loadStats} />}
        {activeTab === "categorias" && <Categorias />}
        {activeTab === "orcamento"  && <div className="py-16 text-center text-white/20 text-sm">Orçamento em breve</div>}
        {activeTab === "timeline"   && <LinhaDoTempo />}

      </div>
    </div>
  );
}
