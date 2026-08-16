import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/layout/Navigation'
import BottomNav from '@/components/layout/BottomNav'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Check relationship membership (any record means user belongs to a relationship)
    const { data: membership } = await supabase
        .from('relationship_members')
        .select('relationship_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!membership) {
        redirect('/setup')
    }

    // Fetch partner profile name if available
    const { data: members } = await supabase
        .from('relationship_members')
        .select('user_id')
        .eq('relationship_id', (membership as any).relationship_id) as any

    let partnerName: string | undefined = undefined
    const partnerId = members?.find((m: any) => m.user_id !== user.id)?.user_id
    if (partnerId) {
        const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', partnerId)
            .single() as any
        if (partnerProfile) partnerName = partnerProfile.display_name
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-x-hidden">
            <Navigation partnerName={partnerName} />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 pt-6 pb-24 md:pb-12">
                {children}
            </main>

            <BottomNav />
        </div>
    )
}
