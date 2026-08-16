import imageCompression from 'browser-image-compression'

const MAX_SIZE_MB = 0.5          // 500 KB output target
const MAX_WIDTH_PX = 1200
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export interface CompressedImage {
    file: File
    width: number
    height: number
    originalBytes: number
    compressedBytes: number
}

export async function compressImage(file: File): Promise<CompressedImage> {
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        throw new Error(`Unsupported file type: ${file.type}. Please upload a JPEG, PNG, or WebP image.`)
    }

    const originalBytes = file.size

    const options = {
        maxSizeMB: MAX_SIZE_MB,
        maxWidthOrHeight: MAX_WIDTH_PX,
        useWebWorker: true,
        fileType: 'image/webp' as const,
        initialQuality: 0.85,
    }

    const compressed = await imageCompression(file, options)

    // Get dimensions
    const { width, height } = await getImageDimensions(compressed)

    return {
        file: compressed,
        width,
        height,
        originalBytes,
        compressedBytes: compressed.size,
    }
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight })
            URL.revokeObjectURL(url)
        }
        img.onerror = reject
        img.src = url
    })
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isValidImageFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)) {
        return 'Only JPEG, PNG, or WebP images are allowed.'
    }
    if (file.size > 20 * 1024 * 1024) {
        return 'Image must be smaller than 20 MB.'
    }
    return null
}
