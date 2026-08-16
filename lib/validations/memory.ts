import { z } from 'zod'

export const MemorySchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
    description: z.string().max(5000, 'Description is too long').optional().nullable(),
    memory_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    location_name: z.string().max(200).optional().nullable(),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    song_title: z.string().max(200).optional().nullable(),
    song_artist: z.string().max(200).optional().nullable(),
    song_url: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
    mood: z.enum(['happy', 'romantic', 'adventurous', 'nostalgic', 'silly', 'bittersweet']).optional().nullable(),
    is_favorite: z.boolean().default(false),
})

export type MemoryFormValues = z.infer<typeof MemorySchema>

export const MilestoneSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional().nullable(),
    milestone_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    icon: z.string().min(1).max(10).default('✨'),
    location_name: z.string().max(200).optional().nullable(),
})

export type MilestoneFormValues = z.infer<typeof MilestoneSchema>

export const ProfileSchema = z.object({
    display_name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
})

export const RelationshipSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    started_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
})
