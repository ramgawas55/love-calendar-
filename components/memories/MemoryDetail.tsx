'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, MapPin, Music, Calendar, ArrowLeft, Edit, Trash2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMemoryDate } from '@/lib/utils/date'
import { getSignedUrl } from '@/lib/utils/storage'
import { createClient } from '@/lib/supabase/client'
import type { MemoryWithMedia } from '@/types/database'

interface MemoryDetailProps {
    memory: MemoryWithMedia
}

export default function MemoryDetail({ memory }: MemoryDetailProps) {
    const router = useRouter()
    const [photoUrls, setPhotoUrls] = useState<string[]>([])
    const [activePhotoIdx, setActivePhotoIdx] = useState(0)
    const [isFavorite, setIsFavorite] = useState(memory.is_favorite)
    const [deleting, setDeleting] = useState(false)

    // Fetch signed URLs for storage media
    useEffect(() => {
        async function loadSignedUrls() {
            if (!memory.memory_media || memory.memory_media.length === 0) return
            const urls: string[] = []
            for (const m of memory.memory_media) {
                try {
                    const signed = await getSignedUrl(m.storage_path)
                    urls.push(signed)
                } catch {
                    // fallback / ignore
                }
            }
            setPhotoUrls(urls)
        }
        loadSignedUrls()
    }, [memory.memory_media])

    async function toggleFavorite() {
        const supabase: any = createClient()
        const next = !isFavorite
        setIsFavorite(next)
        await supabase.from('memories').update({ is_favorite: next }).eq('id', memory.id)
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to forget this memory forever? ❤️')) return
        setDeleting(true)
        const supabase: any = createClient()
        await supabase.from('memories').delete().eq('id', memory.id)
        router.push('/memories')
        router.refresh()
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Memories
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFavorite}
                        className="p-2 rounded-xl glass hover:scale-105 transition-all"
                        aria-label="Toggle favorite"
                    >
                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} style={{ color: isFavorite ? undefined : 'var(--text-muted)' }} />
                    </button>
                    <Link
                        href={`/memories/${memory.id}/edit`}
                        className="p-2 rounded-xl glass hover:scale-105 transition-all"
                        style={{ color: 'var(--text-muted)' }}
                        aria-label="Edit memory"
                    >
                        <Edit className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="p-2 rounded-xl glass hover:bg-red-500/20 hover:text-red-400 transition-all text-red-400"
                        aria-label="Delete memory"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Scrapbook Sheet */}
            <div className="glass rounded-3xl p-6 md:p-10 space-y-8 relative overflow-hidden"
                style={{ border: '1px solid var(--border-light)' }}>

                {/* Header Metadata */}
                <div className="text-center space-y-2 border-b pb-6" style={{ borderColor: 'var(--border)' }}>
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium"
                        style={{ color: 'var(--text-muted)' }}>
                        <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--accent-light)' }} />
                        <span>{formatMemoryDate(memory.memory_date)}</span>
                    </div>

                    <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                        {memory.title}
                    </h1>

                    {/* Location & Music tags */}
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-2" style={{ color: 'var(--gold)' }}>
                        {memory.location_name && (
                            <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full"
                                style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.25)' }}>
                                <MapPin className="w-3.5 h-3.5" /> {memory.location_name}
                            </span>
                        )}
                        {memory.song_title && (
                            <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full"
                                style={{ background: 'rgba(200,75,75,0.12)', border: '1px solid rgba(200,75,75,0.25)', color: 'var(--accent-light)' }}>
                                <Music className="w-3.5 h-3.5" />
                                {memory.song_artist ? `${memory.song_title} — ${memory.song_artist}` : memory.song_title}
                                {memory.song_url && (
                                    <a href={memory.song_url} target="_blank" rel="noopener noreferrer" className="ml-1 hover:underline">
                                        <ExternalLink className="w-3 h-3 inline" />
                                    </a>
                                )}
                            </span>
                        )}
                    </div>
                </div>

                {/* Photo Gallery Viewer */}
                {photoUrls.length > 0 && (
                    <div className="space-y-3">
                        <div className="aspect-[16/10] relative rounded-2xl overflow-hidden glass bg-black/60 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={photoUrls[activePhotoIdx]}
                                alt={memory.title}
                                className="w-full h-full object-contain"
                            />

                            {photoUrls.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setActivePhotoIdx((activePhotoIdx - 1 + photoUrls.length) % photoUrls.length)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full glass hover:scale-110 transition-all"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setActivePhotoIdx((activePhotoIdx + 1) % photoUrls.length)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full glass hover:scale-110 transition-all"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {photoUrls.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                {photoUrls.map((url, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActivePhotoIdx(i)}
                                        className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 transition-all"
                                        style={{
                                            border: activePhotoIdx === i ? '2px solid var(--accent)' : '1px solid var(--border)',
                                            opacity: activePhotoIdx === i ? 1 : 0.6,
                                        }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt="Thumb" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Story Body */}
                {memory.description && (
                    <div className="prose prose-invert max-w-none font-light leading-relaxed text-base md:text-lg whitespace-pre-wrap"
                        style={{ color: 'var(--text)' }}>
                        {memory.description}
                    </div>
                )}
            </div>
        </div>
    )
}
