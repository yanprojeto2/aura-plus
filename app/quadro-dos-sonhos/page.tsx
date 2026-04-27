"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LimelightNav } from "../components/ui/limelight-nav";
import { CardStack, CardStackItem } from "../components/ui/card-stack";

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

const defaultItems: CardStackItem[] = [
  {
    id: 1,
    title: "Viajar pelo mundo",
    description: "Conhecer novos lugares, culturas e experiências únicas",
    imageSrc: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
    tag: "Viagem",
  },
  {
    id: 2,
    title: "Casa própria",
    description: "Conquistar meu espaço, do jeito que sempre sonhei",
    imageSrc: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
    tag: "Patrimônio",
  },
  {
    id: 3,
    title: "Liberdade financeira",
    description: "Viver dos investimentos e ter tempo para o que importa",
    imageSrc: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80",
    tag: "Finanças",
  },
  {
    id: 4,
    title: "Saúde e corpo em forma",
    description: "Ter energia, disposição e bem-estar todos os dias",
    imageSrc: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
    tag: "Saúde",
  },
  {
    id: 5,
    title: "Empreender",
    description: "Construir algo meu e impactar a vida das pessoas",
    imageSrc: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80",
    tag: "Carreira",
  },
];

export default function QuadroDosSonhosPage() {
  const router = useRouter();
  const [items, setItems] = useState<CardStackItem[]>(defaultItems);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", imageSrc: "", tag: "" });

  const addDream = () => {
    if (!form.title.trim()) return;
    setItems(prev => [...prev, {
      id: Date.now(),
      title: form.title,
      description: form.description,
      imageSrc: form.imageSrc || "https://images.unsplash.com/photo-1502101872923-d48509bff386?w=800&q=80",
      tag: form.tag,
    }]);
    setForm({ title: "", description: "", imageSrc: "", tag: "" });
    setShowAdd(false);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-[120px]">
          <span className="text-2xl font-bold leading-none">✦</span>
          <span className="text-lg font-semibold tracking-wide">Aura+</span>
        </div>
        <LimelightNav
          initialActive={6}
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

      <div className="max-w-5xl mx-auto px-6 py-10 pb-16">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm text-white/30 mb-1">Visualize seus objetivos</p>
            <h1 className="text-4xl font-bold">Quadro dos Sonhos</h1>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="px-5 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-all"
          >
            + Adicionar sonho
          </button>
        </div>

        {/* Card Stack */}
        <CardStack
          items={items}
          cardWidth={500}
          cardHeight={320}
          autoAdvance
          intervalMs={3000}
          pauseOnHover
          showDots
          overlap={0.45}
          spreadDeg={44}
        />

        {/* List below */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all cursor-pointer" onClick={() => {}}>
              <div className="h-32 overflow-hidden">
                <img src={item.imageSrc} alt={item.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity group-hover:scale-105 duration-500" />
              </div>
              <div className="p-4">
                {item.tag && <span className="text-[11px] text-white/40 font-medium uppercase tracking-wide">{item.tag}</span>}
                <p className="text-sm font-semibold text-white mt-0.5">{item.title}</p>
                {item.description && <p className="text-xs text-white/40 mt-1 line-clamp-2">{item.description}</p>}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setItems(prev => prev.filter(it => it.id !== item.id)); }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white/30 hover:text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all"
              >✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal adicionar */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Novo sonho</h2>
              <button onClick={() => setShowAdd(false)} className="text-white/30 hover:text-white transition-colors">✕</button>
            </div>

            {[
              { label: "Título", key: "title", placeholder: "Ex: Viajar para o Japão" },
              { label: "Descrição", key: "description", placeholder: "Descreva seu sonho..." },
              { label: "Imagem (URL)", key: "imageSrc", placeholder: "https://..." },
              { label: "Categoria", key: "tag", placeholder: "Ex: Viagem, Saúde, Finanças..." },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="flex items-center gap-4">
                <span className="text-xs text-white/30 w-20 flex-shrink-0">{label}</span>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15"
                />
              </div>
            ))}

            <button
              onClick={addDream}
              className="w-full py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-all mt-2"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
