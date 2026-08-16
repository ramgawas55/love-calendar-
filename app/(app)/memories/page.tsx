import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemoryCard from '@/components/memories/MemoryCard'
import EmptyState from '@/components/shared/EmptyState'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import type { MemoryWithMedia } from '@/types/database'

export default async function MemoriesPage() {
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
        .order('memory_date', { ascending: false }) as any

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
                        Our Memories ❤️
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        All the chapters of our story in one place
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/memories/search"
                        className="p-2.5 rounded-xl glass hover:bg-white/5 transition-all text-sm font-medium inline-flex items-center gap-2"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <Search className="w-4 h-4" />
                        <span>Search</span>
                    </Link>

                    <Link
                        href="/memories/new"
                        className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all hover:scale-105"
                        style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Memory</span>
                    </Link>
                </div>
            </div>

            {/* Grid */}
            {!memories || memories.length === 0 ? (
                <EmptyState
                    title="No memories created yet. ❤️"
                    description="Click 'Add Memory' to save your first shared moment."
                    actionLabel="Create First Memory"
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
