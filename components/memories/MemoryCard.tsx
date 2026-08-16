'use client'

import { useState } from 'react'
import { Heart, MapPin, Music, Sparkles } from 'lucide-react'
import { formatMemoryDate } from '@/lib/utils/date'
import type { MemoryWithMedia } from '@/types/database'
import Link from 'next/link'

const MOOD_EMOJIS: Record<string, string> = {
    happy: '😊',
    romantic: '❤️',
    adventurous: '🏔️',
    nostalgic: '🌅',
    silly: '🤪',
    bittersweet: '🌧️',
}

interface MemoryCardProps {
    memory: MemoryWithMedia
}

export default function MemoryCard({ memory }: MemoryCardProps) {
    return (
        <Link
            href={`/memories/${memory.id}`}
            className="glass rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1 flex flex-col"
            style={{ borderColor: 'var(--border)' }}
        >
            {/* Visual Cover */}
            <div className="aspect-[4/3] relative overflow-hidden bg-black/50 flex items-center justify-center">
                {memory.mood && (
                    <span className="absolute top-3 right-3 z-10 text-xl p-1.5 rounded-full glass">
                        {MOOD_EMOJIS[memory.mood] || '✨'}
                    </span>
                )}
                <div className="text-center p-4">
                    <p className="font-display italic text-base line-clamp-3" style={{ color: 'var(--text)' }}>
                        "{memory.title}"
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                    <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        <span>{formatMemoryDate(memory.memory_date)}</span>
                        {memory.is_favorite && <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />}
                    </div>
                    <h3 className="font-display font-medium text-lg group-hover:text-amber-200 transition-colors line-clamp-1">
                        {memory.title}
                    </h3>
                    {memory.description && (
                        <p className="text-xs font-light line-clamp-2 mt-1" style={{ color: 'var(--text-muted)' }}>
                            {memory.description}
                        </p>
                    )}
                </div>

                {/* Footer Meta */}
                <div className="flex items-center gap-3 text-xs pt-2 border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
                    {memory.location_name && (
                        <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" /> {memory.location_name}
                        </span>
                    )}
                    {memory.song_title && (
                        <span className="flex items-center gap-1 truncate">
                            <Music className="w-3 h-3 shrink-0" /> {memory.song_title}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}
