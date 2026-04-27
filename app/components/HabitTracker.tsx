'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Habit {
  id: string
  name: string
  completions: Record<string, boolean>
}

const INITIAL_HABITS: Habit[] = []

// Sunday → Saturday initials in PT-BR
const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function getWeekDates(offset: number): Date[] {
  const now = new Date()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay() + offset * 7)
  sunday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

function dateKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

function weekLabel(offset: number): string {
  if (offset === 0) return 'Esta semana'
  if (offset === -1) return 'Semana passada'
  if (offset === 1) return 'Próxima semana'
  if (offset < 0) return `${Math.abs(offset)} semanas atrás`
  return `Em ${offset} semanas`
}

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS)
  const [weekOffset, setWeekOffset] = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    supabase.from('habits').select('*').order('created_at').then(({ data }) => {
      if (data) setHabits(data.map(h => ({ id: h.id, name: h.name, completions: h.completions ?? {} })))
    })
  }, [])

  const weekDates = getWeekDates(weekOffset)
  const todayKey = dateKey(new Date())

  const toggle = async (habitId: string, d: Date) => {
    const key = dateKey(d)
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return
    const updated = { ...habit.completions, [key]: !habit.completions[key] }
    setHabits((prev) => prev.map((h) => h.id === habitId ? { ...h, completions: updated } : h))
    await supabase.from('habits').update({ completions: updated }).eq('id', habitId)
  }

  const addHabit = async () => {
    if (!newName.trim()) return
    const { data } = await supabase.from('habits').insert({ name: newName.trim(), completions: {} }).select().single()
    if (data) setHabits((prev) => [...prev, { id: data.id, name: data.name, completions: {} }])
    setNewName('')
    setIsAdding(false)
  }

  return (
    <div
      style={{
        background: '#1A1A1A',
        border: '1px solid #2A2A2A',
        borderRadius: 16,
        padding: '22px 24px 20px',
        marginTop: 28,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#38BDF8' }}>
          Grade de Hábitos
        </h2>
        <button
          onClick={() => { setIsAdding(true); setNewName('') }}
          style={{
            background: 'linear-gradient(135deg, #0EA5E9, #2DD4BF)',
            border: 'none',
            borderRadius: 9999,
            padding: '8px 18px',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          + Adicionar
        </button>
      </div>

      {/* ── Week navigation ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          marginBottom: 22,
        }}
      >
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          style={{
            width: 34,
            height: 34,
            borderRadius: 9999,
            background: '#252525',
            border: '1px solid #333',
            color: '#8A8A8A',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8A8A8A')}
        >
          ‹
        </button>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#38BDF8',
            minWidth: 140,
            textAlign: 'center',
          }}
        >
          {weekLabel(weekOffset)}
        </span>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          style={{
            width: 34,
            height: 34,
            borderRadius: 9999,
            background: '#252525',
            border: '1px solid #333',
            color: '#8A8A8A',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8A8A8A')}
        >
          ›
        </button>
      </div>

      {/* ── Grid ── */}
      <div style={{ overflowX: 'auto' }}>
        {/* Day headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '130px repeat(7, 1fr)',
            marginBottom: 10,
          }}
        >
          <div />
          {weekDates.map((d, i) => {
            const isToday = dateKey(d) === todayKey
            return (
              <div
                key={i}
                style={{ textAlign: 'center' }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? '#38BDF8' : '#8A8A8A',
                  }}
                >
                  {String(d.getDate()).padStart(2, '0')}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: isToday ? '#38BDF8' : '#555',
                    marginTop: 3,
                    fontWeight: isToday ? 700 : 400,
                  }}
                >
                  {DAY_LABELS[d.getDay()]}
                </p>
              </div>
            )
          })}
        </div>

        {/* Habit rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {habits.map((habit) => (
            <div
              key={habit.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '130px repeat(7, 1fr)',
                alignItems: 'center',
              }}
            >
              {/* Habit name */}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  paddingRight: 12,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {habit.name}
              </span>

              {/* Day circles */}
              {weekDates.map((d, i) => {
                const key = dateKey(d)
                const done = habit.completions[key] ?? false
                const isFuture = d > new Date() && key !== todayKey

                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => !isFuture && toggle(habit.id, d)}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 9999,
                        border: `2.5px solid ${done ? 'transparent' : '#333'}`,
                        background: done
                          ? 'linear-gradient(135deg, #0EA5E9, #2DD4BF)'
                          : 'transparent',
                        cursor: isFuture ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isFuture ? 0.3 : 1,
                        transition: 'all 0.18s',
                        padding: 0,
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        if (!isFuture && !done)
                          e.currentTarget.style.borderColor = '#38BDF8'
                      }}
                      onMouseLeave={(e) => {
                        if (!done) e.currentTarget.style.borderColor = '#333'
                      }}
                    >
                      {done && (
                        <svg
                          width="17"
                          height="17"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="#fff"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Add habit inline ── */}
      {isAdding && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 18,
            paddingTop: 18,
            borderTop: '1px solid #2A2A2A',
          }}
        >
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addHabit()
              if (e.key === 'Escape') setIsAdding(false)
            }}
            placeholder="Nome do hábito..."
            style={{
              flex: 1,
              background: '#111',
              border: '1px solid #38BDF8',
              borderRadius: 9,
              padding: '9px 14px',
              color: '#fff',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            onClick={addHabit}
            style={{
              background: 'linear-gradient(135deg, #0EA5E9, #2DD4BF)',
              border: 'none',
              borderRadius: 9,
              padding: '9px 18px',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Salvar
          </button>
          <button
            onClick={() => setIsAdding(false)}
            style={{
              background: '#252525',
              border: '1px solid #333',
              borderRadius: 9,
              padding: '9px 14px',
              color: '#8A8A8A',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
