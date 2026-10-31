'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Heart, Plus, Users, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { todayISO } from '@/lib/utils/date'

function SetupContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')

    const [relName, setRelName] = useState('Our Relationship')
    const [startedAt, setStartedAt] = useState(todayISO())

    const [inviteToken, setInviteToken] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const invite = searchParams.get('invite')
        if (invite) {
            setInviteToken(invite)
            setMode('join')
        }
    }, [searchParams])

    async function handleCreateRelationship(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('User not authenticated'); setLoading(false); return }

        try {
            const { data: rel, error: relErr } = await (supabase as any)
                .from('relationships')
                .insert({
                    name: relName,
                    started_at: startedAt,
                    created_by: user.id,
                })
                .select()
                .single()

            if (relErr) throw new Error(relErr.message)

            const { error: memErr } = await (supabase as any)
                .from('relationship_members')
                .insert({
                    relationship_id: (rel as any).id,
                    user_id: user.id,
                })

            if (memErr) throw new Error(memErr.message)

            await (supabase as any)
                .from('invite_tokens')
                .insert({
                    relationship_id: (rel as any).id,
                    created_by: user.id,
                })

            router.push('/')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Failed to create relationship.')
        } finally {
            setLoading(false)
        }
    }

    async function handleJoinRelationship(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('User not authenticated'); setLoading(false); return }

        try {
            const cleanToken = inviteToken.trim()

            const { data: tok, error: tokErr } = await (supabase as any)
                .from('invite_tokens')
                .select('*')
                .eq('token', cleanToken)
                .is('used_at', null)
                .single()

            if (tokErr || !tok) {
                throw new Error('Invalid or expired invite token.')
            }

            if (new Date((tok as any).expires_at) < new Date()) {
                throw new Error('This invite token has expired.')
            }

            const { error: joinErr } = await (supabase as any)
                .from('relationship_members')
                .insert({
                    relationship_id: (tok as any).relationship_id,
                    user_id: user.id,
                })

            if (joinErr) throw new Error(joinErr.message)

            await (supabase as any)
                .from('invite_tokens')
                .update({
                    used_at: new Date().toISOString(),
                })
                .eq('token', cleanToken)

            router.push('/')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Failed to join relationship.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-dvh flex items-center justify-center p-4 relative">
            <div className="w-full max-w-md space-y-6">

                <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 glow-accent"
                        style={{ background: 'rgba(200,75,75,0.15)', border: '1px solid rgba(200,75,75,0.4)' }}>
                        <Heart className="w-7 h-7 text-glow-accent" style={{ color: 'var(--accent)' }} fill="currentColor" />
                    </div>
                    <h1 className="font-display text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                        Welcome to Our Love Calendar
                    </h1>
                    <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
                        Create a new relationship space or join your partner's existing space.
                    </p>
                </div>

                {error && (
                    <div className="rounded-xl p-3 text-sm text-center"
                        style={{ background: 'rgba(200,75,75,0.12)', color: 'var(--accent-light)', border: '1px solid rgba(200,75,75,0.3)' }}>
                        {error}
                    </div>
                )}

                {mode === 'choose' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setMode('create')}
                            className="w-full glass p-6 rounded-2xl text-left transition-all hover:scale-[1.02] hover:border-amber-900/40 group flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(200,75,75,0.15)', color: 'var(--accent)' }}>
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-display font-medium text-base" style={{ color: 'var(--text)' }}>
                                        Start a New Relationship Space
                                    </h3>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        I am the first partner setting this up
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" style={{ color: 'var(--text-muted)' }} />
                        </button>

                        <button
                            onClick={() => setMode('join')}
                            className="w-full glass p-6 rounded-2xl text-left transition-all hover:scale-[1.02] hover:border-amber-900/40 group flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(201,169,110,0.15)', color: 'var(--gold)' }}>
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-display font-medium text-base" style={{ color: 'var(--text)' }}>
                                        Join Existing Space
                                    </h3>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        My partner already created our space & gave me a code
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" style={{ color: 'var(--text-muted)' }} />
                        </button>
                    </div>
                )}

                {mode === 'create' && (
                    <form onSubmit={handleCreateRelationship} className="glass rounded-2xl p-6 space-y-4">
                        <h2 className="font-display text-lg font-medium" style={{ color: 'var(--text)' }}>
                            Set Up Our Space ❤️
                        </h2>

                        <div>
                            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                Relationship Name / Title
                            </label>
                            <input
                                type="text"
                                value={relName}
                                onChange={e => setRelName(e.target.value)}
                                placeholder="e.g. Ram & Girlfriend"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                When Did Your Story Begin?
                            </label>
                            <input
                                type="date"
                                value={startedAt}
                                onChange={e => setStartedAt(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setMode('choose')}
                                className="w-1/3 py-2.5 rounded-xl text-sm font-medium transition-all"
                                style={{ background: 'var(--card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-2/3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                                style={{ background: 'var(--accent)', color: '#fff' }}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Space ❤️'}
                            </button>
                        </div>
                    </form>
                )}

                {mode === 'join' && (
                    <form onSubmit={handleJoinRelationship} className="glass rounded-2xl p-6 space-y-4">
                        <h2 className="font-display text-lg font-medium" style={{ color: 'var(--text)' }}>
                            Join Partner's Space ✨
                        </h2>

                        <div>
                            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                Invite Token / Code
                            </label>
                            <input
                                type="text"
                                value={inviteToken}
                                onChange={e => setInviteToken(e.target.value)}
                                placeholder="Enter invite code from partner"
                                required
                                className="font-mono text-center tracking-wider"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setMode('choose')}
                                className="w-1/3 py-2.5 rounded-xl text-sm font-medium transition-all"
                                style={{ background: 'var(--card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-2/3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                                style={{ background: 'var(--gold)', color: '#0D0D0D' }}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join Relationship ✨'}
                            </button>
                        </div>
                    </form>
                )}

            </div>
        </div>
    )
}

export default function SetupPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[40dvh]">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
        }>
            <SetupContent />
        </Suspense>
    )
}
