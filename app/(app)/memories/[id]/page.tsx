import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemoryDetail from '@/components/memories/MemoryDetail'

export default async function MemoryDetailPage({
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

    return <MemoryDetail memory={memory} />
}
