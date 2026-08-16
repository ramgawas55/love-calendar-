import { createClient } from '@/lib/supabase/client'

const BUCKET = 'memories'

/** Upload a file to Supabase Storage and return the storage path */
export async function uploadFile(
    path: string,
    file: File,
    onProgress?: (pct: number) => void
): Promise<string> {
    const supabase = createClient()
    onProgress?.(10)
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
    })
    if (error) throw new Error(error.message)
    onProgress?.(100)
    return path
}

/** Delete a file from Supabase Storage */
export async function deleteFile(path: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) throw new Error(error.message)
}

/** Get a signed URL for a private file (1 hour TTL) */
export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const supabase = createClient()
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn)
    if (error) throw new Error(error.message)
    return data.signedUrl
}

/** Build the canonical storage path for a memory photo */
export function buildPhotoPath(relationshipId: string, memoryId: string, filename: string): string {
    return `${relationshipId}/photos/${memoryId}/${filename}`
}

/** Build the canonical storage path for an avatar */
export function buildAvatarPath(userId: string): string {
    return `avatars/${userId}.webp`
}

/** Build the canonical storage path for a milestone photo */
export function buildMilestonePath(relationshipId: string, milestoneId: string): string {
    return `${relationshipId}/milestones/${milestoneId}.webp`
}
