import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemoryCard from '@/components/memories/MemoryCard'
import EmptyState from '@/components/shared/EmptyState'
import { Sparkles } from 'lucide-react'
import type { MemoryWithMedia } from '@/types/database'

export default async function OnThisDayPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: membership } = await supabase
        .from('relationship_members')
        .select('relationship_id')
        .eq('user_id', user.id)
        .single() as any

    if (!membership) redirect('/setup')

    const todayStr = new Date().toISOString().slice(5, 10) // MM-DD

    const { data: memories } = await supabase
        .from('memories')
        .select('*, memory_media(*)')
        .eq('relationship_id', membership.relationship_id)
        .filter('memory_date::text', 'like', `%-${todayStr}`) as any

    return (
        <div className="space-y-6">
            <div className="text-center max-w-md mx-auto space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-2"
                    style={{ background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)', color: 'var(--gold)' }}>
                    <Sparkles className="w-6 h-6" />
                </div>
                <h1 className="font-display text-3xl font-semibold" style={{ color: 'var(--text)' }}>
                    On This Day ❤️
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Relive what happened on this date in past years
                </p>
            </div>

            {!memories || memories.length === 0 ? (
                <EmptyState
                    icon={Sparkles}
                    title="Nothing from this date yet."
                    description="Maybe today will become a new memory to relive next year! ❤️"
                    actionLabel="Create Memory Today"
                    actionHref="/memories/new"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(memories as MemoryWithMedia[]).map(mem => (
                        <MemoryCard key={mem.id} memory={mem} />
                    ))}
                </div>
            )}
        </div>
    )
}
