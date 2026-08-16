'use client'

import { formatMemoryDate } from '@/lib/utils/date'
import { Sparkles, MapPin, Heart } from 'lucide-react'
import type { Milestone } from '@/types/database'

interface TimelineProps {
    milestones: Milestone[]
}

export default function Timeline({ milestones }: TimelineProps) {
    return (
        <div className="relative border-l-2 ml-4 md:ml-32 space-y-12 py-4" style={{ borderColor: 'var(--border-light)' }}>
            {milestones.map((m, idx) => (
                <div key={m.id || idx} className="relative pl-6 md:pl-10 group">
                    {/* Timeline Node Dot */}
                    <div
                        className="absolute -left-[17px] top-1.5 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-transform group-hover:scale-125 glow-accent"
                        style={{ background: 'var(--card)', border: '2px solid var(--accent)', color: 'var(--accent-light)' }}
                    >
                        {m.icon || '✨'}
                    </div>

                    {/* Date Stamp (Mobile & Desktop) */}
                    <div className="md:absolute md:-left-32 md:top-2 text-xs font-mono tracking-wider font-medium mb-1 md:mb-0 md:w-24 md:text-right"
                        style={{ color: 'var(--gold)' }}>
                        {formatMemoryDate(m.milestone_date)}
                    </div>

                    {/* Milestone Card */}
                    <div className="glass rounded-2xl p-6 transition-all hover:border-amber-900/40 space-y-2">
                        <h3 className="font-display font-semibold text-xl" style={{ color: 'var(--text)' }}>
                            {m.title}
                        </h3>

                        {m.description && (
                            <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                {m.description}
                            </p>
                        )}

                        {m.location_name && (
                            <div className="flex items-center gap-1 text-xs pt-2" style={{ color: 'var(--text-dim)' }}>
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{m.location_name}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
