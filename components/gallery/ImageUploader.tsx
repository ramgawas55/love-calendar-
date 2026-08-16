'use client'

import { useState } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { compressImage, formatBytes, isValidImageFile } from '@/lib/utils/image'

interface ImageUploaderProps {
    onFilesSelected: (compressedFiles: { file: File; width: number; height: number }[]) => void
    maxFiles?: number
}

export default function ImageUploader({ onFilesSelected, maxFiles = 20 }: ImageUploaderProps) {
    const [previews, setPreviews] = useState<{ url: string; file: File; size: number; width: number; height: number }[]>([])
    const [compressing, setCompressing] = useState(false)
    const [error, setError] = useState('')

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = Array.from(e.target.files || [])
        if (selected.length === 0) return

        if (previews.length + selected.length > maxFiles) {
            setError(`Maximum ${maxFiles} images per memory allowed.`)
            return
        }

        setCompressing(true)
        setError('')

        try {
            const compressedResults: { file: File; width: number; height: number }[] = []
            const newPreviews = [...previews]

            for (const file of selected) {
                const err = isValidImageFile(file)
                if (err) { setError(err); continue }

                const compressed = await compressImage(file)
                const withMeta = {
                    file: compressed.file,
                    width: compressed.width,
                    height: compressed.height,
                }
                compressedResults.push(withMeta)

                newPreviews.push({
                    url: URL.createObjectURL(compressed.file),
                    file: compressed.file,
                    size: compressed.compressedBytes,
                    width: compressed.width,
                    height: compressed.height,
                })
            }

            setPreviews(newPreviews)
            onFilesSelected(newPreviews.map(p => ({ file: p.file, width: p.width, height: p.height })))
        } catch (err: any) {
            setError(err.message || 'Error processing images.')
        } finally {
            setCompressing(false)
            e.target.value = ''
        }
    }

    function removeImage(index: number) {
        const previewItem = previews[index]
        if (previewItem?.url) URL.revokeObjectURL(previewItem.url)
        const updated = previews.filter((_, i) => i !== index)
        setPreviews(updated)
        onFilesSelected(updated.map(p => ({ file: p.file, width: p.width, height: p.height })))
    }

    return (
        <div className="space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Attach Photos ({previews.length}/{maxFiles})
            </label>

            {error && (
                <p className="text-xs" style={{ color: 'var(--accent-light)' }}>{error}</p>
            )}

            <div className="relative glass rounded-xl p-6 text-center border-dashed border-2 hover:border-amber-900/50 transition-colors cursor-pointer"
                style={{ borderColor: 'var(--border-light)' }}>
                <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    onChange={handleFileChange}
                    disabled={compressing}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />

                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    {compressing ? (
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
                    ) : (
                        <Upload className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                    )}
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {compressing ? 'Compressing WebP images…' : 'Drop photos here or click to browse'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                        Auto-compressed to WebP (≤500 KB per photo). Max 20 photos.
                    </p>
                </div>
            </div>

            {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-2">
                    {previews.map((item, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden glass group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.url} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="p-1 rounded-full bg-red-600 text-white"
                                    aria-label="Remove image"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <span className="absolute bottom-1 right-1 text-[9px] px-1 rounded bg-black/60 font-mono" style={{ color: 'var(--gold)' }}>
                                {formatBytes(item.size)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
