import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemoryForm from '@/components/memories/MemoryForm'

export default async function EditMemoryPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: memory } = await supabase
        .from('memories')
        .select('*, memory_media(*)')
        .eq('id', id)
        .single()

    if (!memory) notFound()

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
                    Edit Memory ❤️
                </h1>
            </div>

            <MemoryForm
                initialValues={memory}
                relationshipId={membership.relationship_id}
            />
        </div>
    )
}
