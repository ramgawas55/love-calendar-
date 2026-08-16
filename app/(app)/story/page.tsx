import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Timeline from '@/components/timeline/Timeline'

export default async function OurStoryPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: membership } = await supabase
        .from('relationship_members')
        .select('relationship_id, relationships(*)')
        .eq('user_id', user.id)
        .single() as { data: { relationship_id: string; relationships: { name: string; started_at: string } } | null }

    if (!membership) redirect('/setup')

    const relId = membership.relationship_id

    // Fetch milestones
    const { data: dbMilestones } = await supabase
        .from('milestones')
        .select('*')
        .eq('relationship_id', relId)
        .order('milestone_date', { ascending: true })

    // Always include relationship start date as milestone #1 if not explicitly in DB
    const startMilestone = {
        id: 'start',
        relationship_id: relId,
        title: 'The Beginning of Us ❤️',
        description: `The day our story officially started: ${membership.relationships.name}`,
        milestone_date: membership.relationships.started_at,
        icon: '💖',
        photo_path: null,
        location_name: null,
        created_at: membership.relationships.started_at,
    }

    const milestones = [startMilestone, ...(dbMilestones || [])]

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
                <h1 className="font-display text-4xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                    Our Story Timeline ❤️
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    The key milestones that brought us to today
                </p>
            </div>

            <Timeline milestones={milestones} />
        </div>
    )
}
