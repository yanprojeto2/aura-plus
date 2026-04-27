"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LimelightNav } from "../components/ui/limelight-nav";
import { GlowCard } from "../components/ui/spotlight-card";

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

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const EVENT_COLORS = ["bg-red-400","bg-yellow-400","bg-blue-400","bg-green-400","bg-purple-400","bg-pink-400"];

interface CalEvent {
  id: string;
  title: string;
  note: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
}

function key(d: Date) { return d.toISOString().split("T")[0]; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function durationLabel(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h}h ${m}min` : `${h} hora${h > 1 ? "s" : ""}`;
}

function timeSteps(start: string, step = 30): string[] {
  const [h, m] = start.split(":").map(Number);
  const totalMins = h * 60 + m + step;
  const nh = Math.floor(totalMins / 60) % 24;
  const nm = totalMins % 60;
  return [`${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`];
}

export default function CalendarioPage() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(key(today));
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [modal, setModal] = useState<{ date: string } | null>(null);
  const [form, setForm] = useState({ title: "", note: "", startTime: "09:00", endTime: "10:00", color: "bg-blue-400" });

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar");
      if (res.ok) setEvents(await res.json());
    } catch {}
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { date: Date | null; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - firstDay + 1 + i), isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
  }

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const selectedEvents = events.filter(e => e.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const openModal = (date: string) => {
    setModal({ date });
    setForm({ title: "", note: "", startTime: "09:00", endTime: "10:00", color: "bg-blue-400" });
  };

  const saveEvent = async () => {
    if (!form.title.trim() || !modal) return;
    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, note: form.note, date: modal.date, startTime: form.startTime, endTime: form.endTime }),
    });
    setModal(null);
    loadEvents();
  };

  const deleteEvent = async (id: string) => {
    await fetch(`/api/calendar/${id}`, { method: "DELETE" });
    setEvents(prev => prev.filter(e => e.id !== id));
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
          initialActive={5}
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

      <div className="max-w-7xl mx-auto px-6 py-8 pb-16">
        <div className="flex gap-5">

          {/* CALENDAR */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button onClick={prevMonth} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all text-sm">‹</button>
                <span className="text-xl font-semibold">{MONTHS[month]}</span>
                <span className="text-xl font-semibold text-white/40">{year}</span>
                <button onClick={nextMonth} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all text-sm">›</button>
              </div>
              <button
                onClick={() => openModal(key(today))}
                className="px-4 py-1.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-all"
              >
                + Evento
              </button>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 mb-2">
              {WEEK_DAYS.map(d => (
                <div key={d} className="text-center text-xs text-white/30 py-2 font-medium">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map(({ date, isCurrentMonth }, i) => {
                if (!date) return <div key={i} />;
                const dateKey = key(date);
                const dayEvents = events.filter(e => e.date === dateKey);
                const isToday = dateKey === key(today);
                const isSelected = dateKey === selectedDate;
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDate(dateKey)}
                    onDoubleClick={() => openModal(dateKey)}
                    className={`p-2 min-h-[80px] cursor-pointer rounded-2xl border transition-all
                      ${!isCurrentMonth ? "opacity-25" : ""}
                      ${isSelected ? "bg-white/[0.10] border-white/10" : "bg-white/[0.04] border-white/[0.06]"}
                    `}
                  >
                    <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-white text-black" : "text-white/70"}`}>
                      {date.getDate()}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map(ev => (
                        <div key={ev.id} className="flex items-center gap-1 truncate">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ev.color}`} />
                          <span className="text-[10px] text-white/60 truncate">{ev.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[10px] text-white/30">+{dayEvents.length - 2}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDE PANEL */}
          <div className="w-72 flex-shrink-0">
            <div className="sticky top-24">
              <GlowCard className="bg-white/[0.05] p-5 backdrop-blur-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base font-semibold">Agendado</span>
                  <div className="flex gap-1">
                    <button onClick={() => setSelectedDate(key(addDays(new Date(selectedDate), -1)))} className="w-6 h-6 rounded-full border border-white/10 text-white/40 hover:text-white text-xs flex items-center justify-center">‹</button>
                    <button onClick={() => setSelectedDate(key(addDays(new Date(selectedDate), 1)))} className="w-6 h-6 rounded-full border border-white/10 text-white/40 hover:text-white text-xs flex items-center justify-center">›</button>
                  </div>
                </div>
                <p className="text-xs text-white/30 mb-5">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                </p>

                {selectedEvents.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-white/20">Nenhum evento</p>
                    <button onClick={() => openModal(selectedDate)} className="mt-3 text-xs text-white/40 hover:text-white transition-colors">+ Adicionar evento</button>
                  </div>
                )}

                <div className="space-y-5">
                  {selectedEvents.map(ev => (
                    <div key={ev.id} className="group/ev">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-white/30">{ev.startTime}</span>
                      </div>
                      <div className="relative pl-3">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${ev.color}`} />
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{ev.title}</p>
                            {ev.note && <p className="text-xs text-white/40 mt-0.5">{ev.note}</p>}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-white/30">{ev.startTime} – {ev.endTime}</span>
                              <span className="text-xs text-white/20">{durationLabel(ev.startTime, ev.endTime)}</span>
                            </div>
                          </div>
                          <button onClick={() => deleteEvent(ev.id)} className="opacity-0 group-hover/ev:opacity-100 text-white/20 hover:text-white/60 text-xs transition-all">✕</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedEvents.length > 0 && (
                  <button onClick={() => openModal(selectedDate)} className="mt-5 w-full py-2 rounded-xl border border-white/5 text-xs text-white/30 hover:text-white hover:border-white/20 transition-all">
                    + Adicionar evento
                  </button>
                )}
              </GlowCard>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Novo evento</h2>
              <button onClick={() => setModal(null)} className="text-white/30 hover:text-white transition-colors">✕</button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs text-white/30 w-16">Título</span>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Nome do evento"
                  className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15"
                />
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-white/30 w-16">Data</span>
                <span className="text-sm text-white/60">
                  {new Date(modal.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-white/30 w-16">Hora</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setForm(f => ({ ...f, startTime: timeSteps(f.startTime, -30)[0] }))} className="w-6 h-6 rounded-full border border-white/10 text-white/40 hover:text-white text-xs flex items-center justify-center">‹</button>
                  <span className="text-sm text-white w-12 text-center">{form.startTime}</span>
                  <button onClick={() => setForm(f => ({ ...f, startTime: timeSteps(f.startTime, 30)[0] }))} className="w-6 h-6 rounded-full border border-white/10 text-white/40 hover:text-white text-xs flex items-center justify-center">›</button>
                  <span className="text-xs text-white/20 mx-1">até</span>
                  <button onClick={() => setForm(f => ({ ...f, endTime: timeSteps(f.endTime, -30)[0] }))} className="w-6 h-6 rounded-full border border-white/10 text-white/40 hover:text-white text-xs flex items-center justify-center">‹</button>
                  <span className="text-sm text-white w-12 text-center">{form.endTime}</span>
                  <button onClick={() => setForm(f => ({ ...f, endTime: timeSteps(f.endTime, 30)[0] }))} className="w-6 h-6 rounded-full border border-white/10 text-white/40 hover:text-white text-xs flex items-center justify-center">›</button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-white/30 w-16">Cor</span>
                <div className="flex gap-2">
                  {EVENT_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-6 h-6 rounded-full ${c} transition-all ${form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#111]" : "opacity-50 hover:opacity-100"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-white/30 w-16">Nota</span>
                <input
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Adicionar nota..."
                  className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none border border-transparent focus:border-white/15"
                />
              </div>
            </div>

            <button
              onClick={saveEvent}
              className="mt-6 w-full py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-all"
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
