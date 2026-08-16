'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Calendar, MapPin, Music, Heart, Loader2, Save } from 'lucide-react'
import ImageUploader from '@/components/gallery/ImageUploader'
import { uploadFile, buildPhotoPath } from '@/lib/utils/storage'
import { todayISO } from '@/lib/utils/date'
import type { Mood } from '@/types/database'

interface MemoryFormProps {
    initialValues?: {
        id?: string
        title: string
        description?: string | null
        memory_date: string
        location_name?: string | null
        song_title?: string | null
        song_artist?: string | null
        song_url?: string | null
        mood?: Mood | null
        is_favorite?: boolean
    }
    defaultDate?: string
    relationshipId: string
}

const MOODS: { value: Mood; label: string; emoji: string }[] = [
    { value: 'happy', label: 'Happy', emoji: '😊' },
    { value: 'romantic', label: 'Romantic', emoji: '❤️' },
    { value: 'adventurous', label: 'Adventurous', emoji: '🏔️' },
    { value: 'nostalgic', label: 'Nostalgic', emoji: '🌅' },
    { value: 'silly', label: 'Silly', emoji: '🤪' },
    { value: 'bittersweet', label: 'Bittersweet', emoji: '🌧️' },
]

export default function MemoryForm({ initialValues, defaultDate, relationshipId }: MemoryFormProps) {
    const router = useRouter()
    const isEditing = !!initialValues?.id

    const [title, setTitle] = useState(initialValues?.title || '')
    const [description, setDescription] = useState(initialValues?.description || '')
    const [memoryDate, setMemoryDate] = useState(initialValues?.memory_date || defaultDate || todayISO())
    const [locationName, setLocationName] = useState(initialValues?.location_name || '')
    const [songTitle, setSongTitle] = useState(initialValues?.song_title || '')
    const [songArtist, setSongArtist] = useState(initialValues?.song_artist || '')
    const [songUrl, setSongUrl] = useState(initialValues?.song_url || '')
    const [mood, setMood] = useState<Mood | null>(initialValues?.mood || 'romantic')
    const [isFavorite, setIsFavorite] = useState(initialValues?.is_favorite || false)

    const [pendingPhotos, setPendingPhotos] = useState<{ file: File; width: number; height: number }[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim()) { setError('Title is required'); return }

        setLoading(true)
        setError('')

        const supabase: any = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('Unauthenticated'); setLoading(false); return }

        try {
            let memoryId = initialValues?.id

            if (isEditing && memoryId) {
                const { error: updateErr } = await supabase
                    .from('memories')
                    .update({
                        title,
                        description,
                        memory_date: memoryDate,
                        location_name: locationName || null,
                        song_title: songTitle || null,
                        song_artist: songArtist || null,
                        song_url: songUrl || null,
                        mood,
                        is_favorite: isFavorite,
                    })
                    .eq('id', memoryId)

                if (updateErr) throw new Error(updateErr.message)
            } else {
                const { data: newMem, error: insertErr } = await supabase
                    .from('memories')
                    .insert({
                        relationship_id: relationshipId,
                        title,
                        description,
                        memory_date: memoryDate,
                        location_name: locationName || null,
                        song_title: songTitle || null,
                        song_artist: songArtist || null,
                        song_url: songUrl || null,
                        mood,
                        is_favorite: isFavorite,
                        created_by: user.id,
                    })
                    .select()
                    .single()

                if (insertErr) throw new Error(insertErr.message)
                memoryId = newMem.id
            }

            // Upload photos
            if (memoryId && pendingPhotos.length > 0) {
                for (let i = 0; i < pendingPhotos.length; i++) {
                    const p = pendingPhotos[i]
                    const filename = `${Date.now()}_${i}.webp`
                    const storagePath = buildPhotoPath(relationshipId, memoryId, filename)

                    await uploadFile(storagePath, p.file)

                    await supabase.from('memory_media').insert({
                        memory_id: memoryId,
                        storage_path: storagePath,
                        file_name: p.file.name,
                        mime_type: 'image/webp',
                        size_bytes: p.file.size,
                        width: p.width,
                        height: p.height,
                        is_cover: i === 0,
                        sort_order: i,
                    })
                }
            }

            router.push(memoryId ? `/memories/${memoryId}` : '/memories')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Failed to save memory.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
            {error && (
                <div className="rounded-xl p-3 text-sm"
                    style={{ background: 'rgba(200,75,75,0.12)', color: 'var(--accent-light)', border: '1px solid rgba(200,75,75,0.3)' }}>
                    {error}
                </div>
            )}

            {/* Title */}
            <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Memory Title *
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Our First Sunset Beach Walk"
                    required
                    className="text-lg font-display"
                />
            </div>

            {/* Date */}
            <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Date *
                </label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
                    <input
                        type="date"
                        value={memoryDate}
                        onChange={e => setMemoryDate(e.target.value)}
                        required
                        style={{ paddingLeft: '2.25rem' }}
                    />
                </div>
            </div>

            {/* Story / Description */}
            <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Our Story
                </label>
                <textarea
                    rows={5}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Write down every detail you want to remember forever…"
                />
            </div>

            {/* Mood Selector */}
            <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Mood / Feeling
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {MOODS.map(m => (
                        <button
                            key={m.value}
                            type="button"
                            onClick={() => setMood(m.value)}
                            className="p-2.5 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all"
                            style={{
                                background: mood === m.value ? 'rgba(200,75,75,0.2)' : 'var(--card)',
                                border: mood === m.value ? '1px solid var(--accent)' : '1px solid var(--border)',
                                color: mood === m.value ? 'var(--text)' : 'var(--text-muted)',
                            }}
                        >
                            <span className="text-lg">{m.emoji}</span>
                            <span>{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Location */}
            <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Location (Optional)
                </label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
                    <input
                        type="text"
                        value={locationName}
                        onChange={e => setLocationName(e.target.value)}
                        placeholder="Marine Drive, Mumbai"
                        style={{ paddingLeft: '2.25rem' }}
                    />
                </div>
            </div>

            {/* Music */}
            <div className="space-y-3">
                <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Our Song (Optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                        type="text"
                        value={songTitle}
                        onChange={e => setSongTitle(e.target.value)}
                        placeholder="Song Title"
                    />
                    <input
                        type="text"
                        value={songArtist}
                        onChange={e => setSongArtist(e.target.value)}
                        placeholder="Artist"
                    />
                </div>
                <input
                    type="url"
                    value={songUrl}
                    onChange={e => setSongUrl(e.target.value)}
                    placeholder="Spotify or YouTube Link (Optional)"
                />
            </div>

            {/* Image Uploader */}
            <ImageUploader onFilesSelected={setPendingPhotos} />

            {/* Favorite Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl glass">
                <div className="flex items-center gap-2">
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} style={{ color: isFavorite ? undefined : 'var(--text-muted)' }} />
                    <div>
                        <p className="text-sm font-medium">Mark as Favorite</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Add to Our Favorites collection</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="w-12 h-6 rounded-full transition-colors relative p-0.5"
                    style={{ background: isFavorite ? 'var(--accent)' : 'var(--border-light)' }}
                >
                    <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${isFavorite ? 'translate-x-6' : 'translate-x-0'}`}
                    />
                </button>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="py-2.5 px-5 rounded-xl text-sm font-medium transition-all"
                    style={{ background: 'var(--card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl text-sm font-medium transition-all"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {loading ? 'Saving Memory…' : isEditing ? 'Save Changes' : 'Create Memory ❤️'}
                </button>
            </div>
        </form>
    )
}
