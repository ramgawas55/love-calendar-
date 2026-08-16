import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RelationshipCounter from '@/components/shared/RelationshipCounter'
import EmptyState from '@/components/shared/EmptyState'
import Link from 'next/link'
import { Plus, Calendar as CalendarIcon, Clock, Sparkles, Heart, ChevronRight, MapPin, Music } from 'lucide-react'
import { formatMemoryDate } from '@/lib/utils/date'
import type { MemoryWithMedia } from '@/types/database'

export default async function HomePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get user relationship
    const { data: membership } = await supabase
        .from('relationship_members')
        .select('relationship_id, relationships(*)')
        .eq('user_id', user.id)
        .single() as any

    if (!membership) redirect('/setup')

    const relationship = membership.relationships
    const relId = relationship.id

    // Fetch recent memories with media
    const { data: recentMemories } = await supabase
        .from('memories')
        .select('*, memory_media(*)')
        .eq('relationship_id', relId)
        .order('memory_date', { ascending: false })
        .limit(3) as any

    // Fetch today's memory from past years ("On This Day")
    const todayStr = new Date().toISOString().slice(5, 10) // MM-DD
    const { data: onThisDayMemories } = await supabase
        .from('memories')
        .select('*, memory_media(*)')
        .eq('relationship_id', relId)
        .filter('memory_date::text', 'like', `%-${todayStr}`) as any

    return (
        <div className="space-y-8">
            {/* Counter */}
            <RelationshipCounter
                startedAt={relationship.started_at}
                relationshipName={relationship.name}
            />

            {/* Action Bar */}
            <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--text)' }}>
                    Recent Moments ❤️
                </h2>
                <Link
                    href="/memories/new"
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all hover:scale-105"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Memory</span>
                </Link>
            </div>

            {/* On This Day banner if available */}
            {onThisDayMemories && onThisDayMemories.length > 0 && (
                <div className="glass rounded-2xl p-6 border-l-4" style={{ borderColor: 'var(--gold)' }}>
                    <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--gold)' }}>
                        <Sparkles className="w-5 h-5" />
                        <h3 className="font-display font-medium text-lg">On This Day in History</h3>
                    </div>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                        You have {onThisDayMemories.length} memory from this exact date in a previous year!
                    </p>
                    <Link
                        href="/on-this-day"
                        className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                        style={{ color: 'var(--gold)' }}
                    >
                        <span>Relive On This Day</span>
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            )}

            {/* Memory Grid or Empty State */}
            {!recentMemories || recentMemories.length === 0 ? (
                <EmptyState
                    title="We haven't written this chapter yet. ❤️"
                    description="Your private digital scrapbook is waiting for your first shared memory."
                    actionLabel="Create First Memory"
                    actionHref="/memories/new"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(recentMemories as MemoryWithMedia[]).map((mem) => {
                        const coverMedia = mem.memory_media?.find(m => m.is_cover) || mem.memory_media?.[0]
                        return (
                            <Link
                                key={mem.id}
                                href={`/memories/${mem.id}`}
                                className="glass rounded-2xl overflow-hidden group transition-all hover:-translate-y-1 hover:border-amber-900/40 flex flex-col"
                            >
                                {coverMedia ? (
                                    <div className="aspect-video relative overflow-hidden bg-black/40">
                                        <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
                                            📸 Photo Attached
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-video flex items-center justify-center p-6 text-center" style={{ background: 'var(--card)' }}>
                                        <p className="font-display italic text-sm line-clamp-3" style={{ color: 'var(--text-muted)' }}>
                                            "{mem.description || mem.title}"
                                        </p>
                                    </div>
                                )}

                                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                                    <div>
                                        <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                                            <span>{formatMemoryDate(mem.memory_date)}</span>
                                            {mem.is_favorite && <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />}
                                        </div>
                                        <h3 className="font-display font-medium text-lg group-hover:text-amber-200 transition-colors line-clamp-1">
                                            {mem.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-dim)' }}>
                                        {mem.location_name && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {mem.location_name}
                                            </span>
                                        )}
                                        {mem.song_title && (
                                            <span className="flex items-center gap-1">
                                                <Music className="w-3 h-3" /> {mem.song_title}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}

            {/* Navigation Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <Link
                    href="/calendar"
                    className="glass p-5 rounded-2xl flex flex-col items-center text-center group hover:border-red-900/40 transition-all"
                >
                    <CalendarIcon className="w-6 h-6 mb-2 text-rose-400 group-hover:scale-110 transition-transform" />
                    <span className="font-display font-medium text-sm">Love Calendar</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>View by month</span>
                </Link>

                <Link
                    href="/story"
                    className="glass p-5 rounded-2xl flex flex-col items-center text-center group hover:border-red-900/40 transition-all"
                >
                    <Clock className="w-6 h-6 mb-2 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="font-display font-medium text-sm">Our Timeline</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Milestone story</span>
                </Link>

                <Link
                    href="/time-machine"
                    className="glass p-5 rounded-2xl flex flex-col items-center text-center group hover:border-red-900/40 transition-all"
                >
                    <Sparkles className="w-6 h-6 mb-2 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="font-display font-medium text-sm">Time Machine</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Random memory</span>
                </Link>

                <Link
                    href="/favorites"
                    className="glass p-5 rounded-2xl flex flex-col items-center text-center group hover:border-red-900/40 transition-all"
                >
                    <Heart className="w-6 h-6 mb-2 text-red-500 fill-red-500 group-hover:scale-110 transition-transform" />
                    <span className="font-display font-medium text-sm">Our Favorites</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Starred moments</span>
                </Link>
            </div>
        </div>
    )
}
