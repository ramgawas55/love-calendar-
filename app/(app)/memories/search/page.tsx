'use client'

import { useState } from 'react'
import { Search as SearchIcon, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import MemoryCard from '@/components/memories/MemoryCard'
import type { MemoryWithMedia } from '@/types/database'

export default function SearchPage() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<MemoryWithMedia[]>([])
    const [searching, setSearching] = useState(false)
    const [searched, setSearched] = useState(false)

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        if (!query.trim()) return

        setSearching(true)
        setSearched(true)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: membership } = await supabase
            .from('relationship_members')
            .select('relationship_id')
            .eq('user_id', user.id)
            .single() as any

        if (!membership) return

        const q = query.trim()
        const { data } = await supabase
            .from('memories')
            .select('*, memory_media(*)')
            .eq('relationship_id', membership.relationship_id)
            .or(`title.ilike.%${q}%,description.ilike.%${q}%,location_name.ilike.%${q}%,song_title.ilike.%${q}%`)
            .order('memory_date', { ascending: false }) as any

        setResults(data || [])
        setSearching(false)
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-1">
                <h1 className="font-display text-3xl font-semibold" style={{ color: 'var(--text)' }}>
                    Search Memories ❤️
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Find memories by title, story, location, or song
                </p>
            </div>

            <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-dim)' }} />
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search 'beach', 'Paris', 'sunset'…"
                    className="text-base py-3 pl-12 pr-10"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => { setQuery(''); setResults([]); setSearched(false) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </form>

            {searched && (
                <div className="space-y-4">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                        {results.length === 0 ? 'No memories matched your search.' : `Found ${results.length} memories:`}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {results.map(mem => (
                            <MemoryCard key={mem.id} memory={mem} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
