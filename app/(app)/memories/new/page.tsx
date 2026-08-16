import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemoryForm from '@/components/memories/MemoryForm'

export default async function NewMemoryPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>
}) {
    const params = await searchParams
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: membership } = await supabase
        .from('relationship_members')
        .select('relationship_id')
        .eq('user_id', user.id)
        .single() as { data: { relationship_id: string } | null }

    if (!membership) redirect('/setup')

    return (
        <div className="space-y-6">
            <div className="text-center max-w-md mx-auto">
                <h1 className="font-display text-3xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
                    Create a Memory ❤️
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Capture a moment to treasure forever
                </p>
            </div>

            <MemoryForm
                defaultDate={params.date}
                relationshipId={membership.relationship_id}
            />
        </div>
    )
}
