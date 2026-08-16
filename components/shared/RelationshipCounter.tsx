'use client'

import { getRelationshipStats, getDaysUntilAnniversary, plural } from '@/lib/utils/date'
import { Heart, Calendar, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface CounterProps {
    startedAt: string
    relationshipName?: string
}

export default function RelationshipCounter({ startedAt, relationshipName }: CounterProps) {
    const { days, months, years } = getRelationshipStats(startedAt)
    const daysUntilAnniv = getDaysUntilAnniversary(startedAt)

    return (
        <div className="glass rounded-2xl p-6 md:p-8 relative overflow-hidden text-center">
            {/* Background ambient glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(200,75,75,0.12) 0%, rgba(0,0,0,0) 70%)' }}
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10"
            >
                <p className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    {relationshipName || 'Our Story'}
                </p>

                <div className="flex items-center justify-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-glow-accent animate-pulse" style={{ color: 'var(--accent)' }} fill="currentColor" />
                    <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                        {days.toLocaleString()} <span className="font-normal text-2xl md:text-3xl" style={{ color: 'var(--accent-light)' }}>days</span>
                    </h2>
                    <Heart className="w-5 h-5 text-glow-accent animate-pulse" style={{ color: 'var(--accent)' }} fill="currentColor" />
                </div>

                <p className="text-sm md:text-base font-light mb-6" style={{ color: 'var(--text-muted)' }}>
                    {years > 0 && `${plural(years, 'year')}, `}{months > 0 && `${plural(months % 12, 'month')}, `}and {plural(days, 'day')} of us ❤️
                </p>

                {/* Next Anniversary Pill */}
                <div
                    className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(201,169,110,0.12)', color: 'var(--gold)', border: '1px solid rgba(201,169,110,0.3)' }}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                        {daysUntilAnniv === 0
                            ? "🎉 Happy Anniversary Today!"
                            : `${plural(daysUntilAnniv, 'day')} until our next anniversary`}
                    </span>
                </div>
            </motion.div>
        </div>
    )
}
