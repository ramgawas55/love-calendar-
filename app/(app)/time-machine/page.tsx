'use client'

import { useState } from 'react'
import { Sparkles, Shuffle, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import MemoryCard from '@/components/memories/MemoryCard'
import type { MemoryWithMedia } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

export default function TimeMachinePage() {
    const [memory, setMemory] = useState<MemoryWithMedia | null>(null)
    const [loading, setLoading] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)

    async function pickRandomMemory() {
        setLoading(true)
        setHasStarted(true)

        const supabase: any = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: membership } = await supabase
            .from('relationship_members')
            .select('relationship_id')
            .eq('user_id', user.id)
            .single()

        if (!membership) return

        const { data: allMemories } = await supabase
            .from('memories')
            .select('*, memory_media(*)')
            .eq('relationship_id', membership.relationship_id)

        if (allMemories && allMemories.length > 0) {
            const randomIndex = Math.floor(Math.random() * allMemories.length)
            setMemory(allMemories[randomIndex])
        } else {
            setMemory(null)
        }
        setLoading(false)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 text-center min-h-[60dvh] flex flex-col items-center justify-center">
            <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glow-accent"
                    style={{ background: 'rgba(200,75,75,0.15)', border: '1px solid rgba(200,75,75,0.4)', color: 'var(--accent)' }}>
                    <Sparkles className="w-8 h-8" />
                </div>
                <h1 className="font-display text-4xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                    Time Machine ❤️
                </h1>
                <p className="max-w-md mx-auto text-sm" style={{ color: 'var(--text-muted)' }}>
                    Take a trip back in time to a random moment from your relationship
                </p>
            </div>

            {!hasStarted ? (
                <button
                    onClick={pickRandomMemory}
                    className="inline-flex items-center gap-3 py-4 px-8 rounded-2xl font-display text-lg font-medium tracking-wide transition-all hover:scale-105 glow-accent"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                >
                    <Shuffle className="w-5 h-5" />
                    <span>Take Me Back ❤️</span>
                </button>
            ) : (
                <div className="w-full space-y-6">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="glass rounded-3xl p-12 flex flex-col items-center justify-center space-y-4"
                            >
                                <Sparkles className="w-10 h-10 animate-spin text-purple-400" />
                                <p className="font-display italic text-lg" style={{ color: 'var(--gold)' }}>
                                    Traveling back through time…
                                </p>
                            </motion.div>
                        ) : memory ? (
                            <motion.div
                                key={memory.id}
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="w-full max-w-md mx-auto text-left"
                            >
                                <MemoryCard memory={memory} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="glass rounded-2xl p-8"
                            >
                                <p style={{ color: 'var(--text-muted)' }}>No memories saved yet! Create some first.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={pickRandomMemory}
                        disabled={loading}
                        className="inline-flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-medium transition-all glass hover:bg-white/5"
                        style={{ color: 'var(--text)' }}
                    >
                        <Shuffle className="w-4 h-4" />
                        <span>Take me somewhere else</span>
                    </button>
                </div>
            )}
        </div>
    )
}
