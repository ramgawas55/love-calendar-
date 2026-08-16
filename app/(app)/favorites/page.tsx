import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemoryCard from '@/components/memories/MemoryCard'
import EmptyState from '@/components/shared/EmptyState'
import { Heart } from 'lucide-react'
import type { MemoryWithMedia } from '@/types/database'

export default async function FavoritesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: membership } = await supabase
        .from('relationship_members')
        .select('relationship_id')
        .eq('user_id', user.id)
        .single() as any

    if (!membership) redirect('/setup')

    const { data: memories } = await supabase
        .from('memories')
        .select('*, memory_media(*)')
        .eq('relationship_id', membership.relationship_id)
        .eq('is_favorite', true)
        .order('memory_date', { ascending: false }) as any

    return (
        <div className="space-y-6">
            <div className="text-center max-w-md mx-auto space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-2"
                    style={{ background: 'rgba(200,75,75,0.15)', border: '1px solid rgba(200,75,75,0.4)', color: 'var(--accent)' }}>
                    <Heart className="w-6 h-6 fill-red-500 text-red-500" />
                </div>
                <h1 className="font-display text-3xl font-semibold" style={{ color: 'var(--text)' }}>
                    Our Favorites ❤️
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Your starred moments and cherished memories
                </p>
            </div>

            {!memories || memories.length === 0 ? (
                <EmptyState
                    icon={Heart}
                    title="Your favorite moments will live here."
                    description="Star memories in your scrapbook to see them in this collection."
                    actionLabel="Explore Memories"
                    actionHref="/memories"
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
