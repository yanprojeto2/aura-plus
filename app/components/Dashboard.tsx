'use client'

import React, { useState, useMemo, useEffect } from 'react'
import TaskModal from './TaskModal'
import HabitTracker from './HabitTracker'
import { supabase } from '../../lib/supabase'

export type Priority = 'alta' | 'media' | 'baixa'
export type Status = 'pendente' | 'em_progresso' | 'concluida' | 'atrasada'

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const emptyWeekly = () => Object.fromEntries(DAYS.map((d) => [d, false]))

export interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  dueDate: string
  category: string
  createdAt: string
  weeklyTodos?: Record<string, boolean>
}

interface DashboardProps {
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
}

const INITIAL_TASKS: Task[] = []

const categoryIcon: Record<string, React.ReactNode> = {
  Trabalho: (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  Saúde: (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  Estudos: (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  Pessoal: (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Outro: (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
}

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  alta: { label: 'Alta', color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  media: { label: 'Média', color: '#FCD34D', bg: 'rgba(252,211,77,0.12)' },
  baixa: { label: 'Baixa', color: '#4ADE80', bg: 'rgba(74,222,128,0.12)' },
}

const statusConfig: Record<Status, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: '#8A8A8A' },
  em_progresso: { label: 'Em Progresso', color: '#38BDF8' },
  concluida: { label: 'Concluída', color: '#4ADE80' },
  atrasada: { label: 'Atrasada', color: '#F87171' },
}

// Simple SVG sparkline
function SparkLine({ values, color, gradId }: { values: number[]; color: string; gradId: string }) {
  const w = 200
  const h = 52
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 6) - 3,
  }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`

  const patternId = `pat-${gradId}`
  const clipId = `clip-${gradId}`

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: 52, display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <pattern id={patternId} width="20" height="13" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 13" fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="0.5" />
        </pattern>
        {/* Clip region = exactly the filled area shape */}
        <clipPath id={clipId}>
          <path d={area} />
        </clipPath>
      </defs>
      {/* Grid clipped to the area shape only */}
      <rect width={w} height={h} fill={`url(#${patternId})`} clipPath={`url(#${clipId})`} />
      {/* Gradient fill on top */}
      <path d={area} fill={`url(#${gradId})`} />
      {/* Line */}
      <path d={line} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const formatDate = (d: string) => {
  const date = new Date(d + 'T12:00:00')
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const today = new Date().toISOString().split('T')[0]

export default function Dashboard({ isModalOpen, setIsModalOpen }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [filter, setFilter] = useState<'todas' | Status>('todas')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('tasks').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setTasks(data.map(t => ({
        id: t.id, title: t.title, description: t.description,
        priority: t.priority, status: t.status, dueDate: t.due_date,
        category: t.category, createdAt: t.created_at, weeklyTodos: t.weekly_todos ?? emptyWeekly()
      })))
    })
  }, [])

  const stats = useMemo(
    () => ({
      total: tasks.length,
      concluidas: tasks.filter((t) => t.status === 'concluida').length,
      em_progresso: tasks.filter((t) => t.status === 'em_progresso').length,
      atrasadas: tasks.filter((t) => t.status === 'atrasada').length,
      pendentes: tasks.filter((t) => t.status === 'pendente').length,
    }),
    [tasks]
  )

  const completionRate =
    tasks.length > 0 ? Math.round((stats.concluidas / tasks.length) * 100) : 0

  const todayTasks = tasks.filter((t) => t.dueDate === today)
  const todayDone = todayTasks.filter((t) => t.status === 'concluida').length

  const filteredTasks = tasks
    .filter((t) => filter === 'todas' || t.status === filter)
    .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    const { data } = await supabase.from('tasks').insert({
      title: task.title, description: task.description,
      priority: task.priority, status: task.status,
      due_date: task.dueDate, category: task.category,
      weekly_todos: task.weeklyTodos ?? emptyWeekly()
    }).select().single()
    if (data) setTasks((prev) => [{
      id: data.id, title: data.title, description: data.description,
      priority: data.priority, status: data.status, dueDate: data.due_date,
      category: data.category, createdAt: data.created_at, weeklyTodos: data.weekly_todos
    }, ...prev])
  }

  const toggleWeeklyDay = async (taskId: string, day: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const updated = { ...emptyWeekly(), ...task.weeklyTodos, [day]: !(task.weeklyTodos ?? {})[day] }
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, weeklyTodos: updated } : t))
    await supabase.from('tasks').update({ weekly_todos: updated }).eq('id', taskId)
  }

  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const newStatus = task.status === 'concluida' ? 'pendente' : 'concluida'
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
  }

  const weeklyData = [2, 4, 3, 5, 4, 6, stats.concluidas || 1]


  return (
    <>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minWidth: 0 }}>
        {/* ─── Main content ─── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px', minWidth: 0 }}>

          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 32,
            }}
          >
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
                Dashboard
              </h1>
              <p style={{ fontSize: 13, color: '#8A8A8A', marginTop: 3 }}>
                {new Date().toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Search */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: 9999,
                  padding: '8px 16px',
                  width: 220,
                }}
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#8A8A8A" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar tarefas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: 13,
                    width: '100%',
                  }}
                />
              </div>

              {/* Bell */}
              <button
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9999,
                  background: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#8A8A8A',
                  position: 'relative',
                }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {stats.atrasadas > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 8,
                      height: 8,
                      borderRadius: 9999,
                      background: '#F87171',
                      border: '2px solid #0D0D0D',
                    }}
                  />
                )}
              </button>

              {/* Avatar */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9999,
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Y
              </div>
            </div>
          </div>

          {/* ─── Visão Geral — 2 featured cards ─── */}
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Visão Geral</h2>
              <span style={{ fontSize: 13, color: '#38BDF8', cursor: 'pointer', fontWeight: 500 }}>
                Ver Tudo
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Progresso Semanal */}
              <div
                style={{
                  background: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: 16,
                  padding: '18px 18px 0',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 12, color: '#8A8A8A', fontWeight: 500 }}>Progresso Semanal</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 5 }}>
                      {stats.concluidas}{' '}
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#8A8A8A' }}>tarefas</span>
                    </p>
                    <p style={{ fontSize: 12, color: '#4ADE80', marginTop: 4, fontWeight: 500 }}>
                      ↑ {completionRate}% de conclusão
                    </p>
                  </div>
                  <div
                    style={{
                      background: 'rgba(56,189,248,0.1)',
                      border: '1px solid rgba(56,189,248,0.2)',
                      borderRadius: 9,
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#38BDF8',
                    }}
                  >
                    Esta semana
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <SparkLine values={weeklyData} color="#38BDF8" gradId="grad-blue" />
                </div>
              </div>

              {/* Meta de Hoje */}
              <div
                style={{
                  background: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: 16,
                  padding: '18px 18px 0',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 12, color: '#8A8A8A', fontWeight: 500 }}>Meta de Hoje</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 5 }}>
                      {todayDone}/{todayTasks.length}{' '}
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#8A8A8A' }}>concluídas</span>
                    </p>
                    <p style={{ fontSize: 12, color: '#8A8A8A', marginTop: 4, fontWeight: 500 }}>
                      {todayTasks.length - todayDone} restantes para hoje
                    </p>
                  </div>
                  <div
                    style={{
                      background: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.2)',
                      borderRadius: 9,
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#8B5CF6',
                    }}
                  >
                    Hoje
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <SparkLine values={[1, 2, 1, 3, 2, 3, todayDone || 1]} color="#8B5CF6" gradId="grad-purple" />
                </div>
              </div>
            </div>
          </div>

          <HabitTracker />

          {/* ─── Task List ─── */}
          <div style={{ marginTop: 28 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Minhas Tarefas</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #0EA5E9, #2DD4BF)',
                  border: 'none',
                  borderRadius: 9999,
                  padding: '8px 16px',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Nova Tarefa
              </button>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {(
                ['todas', 'pendente', 'em_progresso', 'concluida', 'atrasada'] as const
              ).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    background: filter === f ? '#252525' : 'transparent',
                    border: `1px solid ${filter === f ? '#3A3A3A' : '#2A2A2A'}`,
                    borderRadius: 9999,
                    padding: '5px 13px',
                    color: filter === f ? '#fff' : '#8A8A8A',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {f === 'todas' ? 'Todas' : statusConfig[f].label}
                  <span
                    style={{
                      background: '#2A2A2A',
                      borderRadius: 9999,
                      padding: '1px 7px',
                      fontSize: 11,
                      color: '#8A8A8A',
                    }}
                  >
                    {f === 'todas' ? tasks.length : tasks.filter((t) => t.status === f).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Task items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredTasks.length === 0 ? (
                <div
                  style={{
                    background: '#1A1A1A',
                    border: '1px solid #2A2A2A',
                    borderRadius: 12,
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#8A8A8A',
                    fontSize: 14,
                  }}
                >
                  {search
                    ? 'Nenhuma tarefa encontrada.'
                    : 'Nenhuma tarefa ainda. Clique em "Nova Tarefa" para começar!'}
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      background: '#1A1A1A',
                      border: '1px solid #2A2A2A',
                      borderRadius: 10,
                      overflow: 'hidden',
                      transition: 'background 0.12s',
                    }}
                  >
                  <div
                    style={{
                      padding: '13px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'default',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = '#202020')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleComplete(task.id)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        flexShrink: 0,
                        border: `2px solid ${
                          task.status === 'concluida' ? '#4ADE80' : '#3A3A3A'
                        }`,
                        background:
                          task.status === 'concluida'
                            ? 'rgba(74,222,128,0.15)'
                            : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        padding: 0,
                      }}
                    >
                      {task.status === 'concluida' && (
                        <svg
                          width="11"
                          height="11"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="#4ADE80"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    {/* Category icon */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        background: '#252525',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                        flexShrink: 0,
                      }}
                    >
                      {categoryIcon[task.category] || categoryIcon['Outro']}
                    </div>

                    {/* Task info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: task.status === 'concluida' ? '#8A8A8A' : '#fff',
                          textDecoration:
                            task.status === 'concluida' ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {task.title}
                      </p>
                      <p style={{ fontSize: 12, color: '#8A8A8A', marginTop: 2 }}>
                        {task.category}
                      </p>
                    </div>

                    {/* Priority badge */}
                    <span
                      style={{
                        background: priorityConfig[task.priority].bg,
                        color: priorityConfig[task.priority].color,
                        borderRadius: 9999,
                        padding: '3px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {priorityConfig[task.priority].label}
                    </span>

                    {/* Status */}
                    <span
                      style={{
                        fontSize: 12,
                        color: statusConfig[task.status].color,
                        flexShrink: 0,
                        fontWeight: 500,
                        minWidth: 90,
                        textAlign: 'right',
                      }}
                    >
                      {statusConfig[task.status].label}
                    </span>

                    {/* Due date */}
                    <span
                      style={{
                        fontSize: 12,
                        color: '#8A8A8A',
                        flexShrink: 0,
                        minWidth: 56,
                        textAlign: 'right',
                      }}
                    >
                      {formatDate(task.dueDate)}
                    </span>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: expandedId === task.id ? 'rgba(56,189,248,0.12)' : 'transparent',
                        border: `1px solid ${expandedId === task.id ? 'rgba(56,189,248,0.3)' : '#2A2A2A'}`,
                        color: expandedId === task.id ? '#38BDF8' : '#8A8A8A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        padding: 0,
                        transition: 'all 0.15s',
                      }}
                      title="To-do semanal"
                    >
                      <svg
                        width="12"
                        height="12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{
                          transform: expandedId === task.id ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>

                  {/* ─── To-do Semanal ─── */}
                  {expandedId === task.id && (
                    <div
                      style={{
                        padding: '12px 16px 14px',
                        borderTop: '1px solid #2A2A2A',
                        background: '#161616',
                      }}
                    >
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#8A8A8A', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        To-do semanal
                      </p>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {DAYS.map((day) => {
                          const checked = (task.weeklyTodos ?? {})[day]
                          return (
                            <button
                              key={day}
                              onClick={() => toggleWeeklyDay(task.id, day)}
                              style={{
                                flex: 1,
                                padding: '7px 0',
                                borderRadius: 8,
                                border: `1px solid ${checked ? '#38BDF8' : '#2A2A2A'}`,
                                background: checked ? 'rgba(56,189,248,0.12)' : 'transparent',
                                color: checked ? '#38BDF8' : '#8A8A8A',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              {day}
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: 9999,
                                  background: checked ? '#38BDF8' : '#2A2A2A',
                                  transition: 'background 0.15s',
                                }}
                              />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {isModalOpen && (
        <TaskModal onClose={() => setIsModalOpen(false)} onAdd={addTask} />
      )}
    </>
  )
}
