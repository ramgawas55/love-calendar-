'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, Heart, Camera, Music, MapPin, Sparkles } from 'lucide-react'
import { MONTHS, DAYS_SHORT, getDaysInMonth, getFirstDayOfMonth } from '@/lib/utils/date'
import type { Memory } from '@/types/database'

interface CalendarGridProps {
    memories: Memory[]
}

export default function CalendarGrid({ memories }: CalendarGridProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    // Map memories by date ISO string YYYY-MM-DD
    const memoryMap: Record<string, Memory[]> = {}
    memories.forEach(m => {
        if (!memoryMap[m.memory_date]) memoryMap[m.memory_date] = []
        memoryMap[m.memory_date].push(m)
    })

    function prevMonth() {
        setCurrentDate(new Date(year, month - 1, 1))
        setSelectedDate(null)
    }

    function nextMonth() {
        setCurrentDate(new Date(year, month + 1, 1))
        setSelectedDate(null)
    }

    function goToday() {
        setCurrentDate(new Date())
        setSelectedDate(null)
    }

    const selectedMemories = selectedDate ? (memoryMap[selectedDate] || []) : []

    return (
        <div className="space-y-6">
            {/* Calendar Header */}
            <div className="glass rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="font-display text-2xl md:text-3xl font-semibold" style={{ color: 'var(--text)' }}>
                        {MONTHS[month]} <span style={{ color: 'var(--accent-light)' }}>{year}</span>
                    </h2>
                    <button
                        onClick={goToday}
                        className="text-xs py-1 px-3 rounded-full font-medium transition-all"
                        style={{ background: 'rgba(200,75,75,0.15)', color: 'var(--accent-light)', border: '1px solid rgba(200,75,75,0.3)' }}
                    >
                        Today
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 rounded-xl glass hover:bg-white/5 transition-all"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 rounded-xl glass hover:bg-white/5 transition-all"
                        aria-label="Next month"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="glass rounded-2xl p-4 md:p-6">
                {/* Days Header */}
                <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 text-center">
                    {DAYS_SHORT.map((day) => (
                        <div
                            key={day}
                            className="text-xs uppercase font-medium tracking-wider py-2"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Cells */}
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {/* Empty padding cells */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="calendar-cell opacity-0 pointer-events-none" />
                    ))}

                    {/* Month Days */}
                    {daysInMonth.map((d) => {
                        const dateStr = d.toISOString().slice(0, 10)
                        const dayNum = d.getDate()
                        const isToday = new Date().toISOString().slice(0, 10) === dateStr
                        const dateMemories = memoryMap[dateStr] || []
                        const isSelected = selectedDate === dateStr

                        const hasFavorite = dateMemories.some(m => m.is_favorite)

                        return (
                            <div
                                key={dateStr}
                                onClick={() => setSelectedDate(dateStr)}
                                className={`calendar-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dateMemories.length > 0 ? 'has-memory' : ''}`}
                                style={{ background: isSelected ? 'var(--accent-dim)' : undefined }}
                            >
                                <span
                                    className="text-xs md:text-sm font-medium"
                                    style={{ color: isToday ? 'var(--accent-light)' : 'var(--text)' }}
                                >
                                    {dayNum}
                                </span>

                                {/* Indicators */}
                                {dateMemories.length > 0 && (
                                    <div className="flex items-center gap-0.5 mt-auto mb-1">
                                        {hasFavorite ? (
                                            <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
                                        ) : (
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-light)' }} />
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Selected Date Memories Panel */}
            {selectedDate && (
                <div className="glass rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                        <h3 className="font-display font-medium text-lg" style={{ color: 'var(--text)' }}>
                            Memories on {selectedDate}
                        </h3>
                        <Link
                            href={`/memories/new?date=${selectedDate}`}
                            className="inline-flex items-center gap-1 text-xs py-1.5 px-3 rounded-lg font-medium"
                            style={{ background: 'var(--accent)', color: '#fff' }}
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Memory
                        </Link>
                    </div>

                    {selectedMemories.length === 0 ? (
                        <p className="text-sm py-4 text-center font-light" style={{ color: 'var(--text-muted)' }}>
                            No memories recorded for this date yet. ❤️
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {selectedMemories.map(mem => (
                                <Link
                                    key={mem.id}
                                    href={`/memories/${mem.id}`}
                                    className="block p-4 rounded-xl transition-all hover:translate-x-1"
                                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-display font-medium" style={{ color: 'var(--text)' }}>{mem.title}</h4>
                                        {mem.is_favorite && <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />}
                                    </div>
                                    {mem.description && (
                                        <p className="text-xs line-clamp-2 font-light" style={{ color: 'var(--text-muted)' }}>
                                            {mem.description}
                                        </p>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
