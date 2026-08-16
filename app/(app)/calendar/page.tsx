import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CalendarGrid from '@/components/calendar/CalendarGrid'

export default async function CalendarPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: membership } = await supabase
        .from('relationship_members')
        .select('relationship_id')
        .eq('user_id', user.id)
        .single() as { data: { relationship_id: string } | null }

    if (!membership) redirect('/setup')

    const { data: memories } = await supabase
        .from('memories')
        .select('*')
        .eq('relationship_id', membership.relationship_id)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
                    Our Love Calendar ❤️
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Select any date to view or create memories
                </p>
            </div>

            <CalendarGrid memories={memories || []} />
        </div>
    )
}
