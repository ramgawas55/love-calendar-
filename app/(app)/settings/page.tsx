'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Settings, Heart, Calendar, User, Copy, Check, Save, Loader2, Sparkles, LogOut } from 'lucide-react'

export default function SettingsPage() {
    const router = useRouter()
    const [displayName, setDisplayName] = useState('')
    const [relName, setRelName] = useState('')
    const [startedAt, setStartedAt] = useState('')
    const [inviteToken, setInviteToken] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const [msg, setMsg] = useState('')

    async function handleLogout() {
        setLoggingOut(true)
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    useEffect(() => {
        async function loadSettings() {
            const supabase: any = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Load Profile
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            if (profile) setDisplayName(profile.display_name)

            // Load Relationship
            const { data: mem } = await supabase
                .from('relationship_members')
                .select('relationship_id, relationships(*)')
                .eq('user_id', user.id)
                .single()

            if (mem?.relationships) {
                setRelName(mem.relationships.name)
                setStartedAt(mem.relationships.started_at)

                // Fetch existing invite token or create one
                const { data: tok } = await supabase
                    .from('invite_tokens')
                    .select('*')
                    .eq('relationship_id', mem.relationship_id)
                    .is('used_at', null)
                    .single()

                if (tok) setInviteToken(tok.token)
            }
            setLoading(false)
        }
        loadSettings()
    }, [])

    async function handleSaveProfile(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setMsg('')
        const supabase: any = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('profiles').update({ display_name: displayName }).eq('id', user.id)
        setSaving(false)
        setMsg('Profile updated!')
        setTimeout(() => setMsg(''), 2500)
    }

    async function handleSaveRelationship(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setMsg('')
        const supabase: any = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: mem } = await supabase
            .from('relationship_members')
            .select('relationship_id')
            .eq('user_id', user.id)
            .single()

        if (mem) {
            await supabase
                .from('relationships')
                .update({ name: relName, started_at: startedAt })
                .eq('id', mem.relationship_id)
        }
        setSaving(false)
        setMsg('Relationship settings saved!')
        setTimeout(() => setMsg(''), 2500)
    }

    async function generateNewInvite() {
        const supabase: any = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: mem } = await supabase
            .from('relationship_members')
            .select('relationship_id')
            .eq('user_id', user.id)
            .single()

        if (!mem) return

        const { data: tok } = await supabase
            .from('invite_tokens')
            .insert({ relationship_id: mem.relationship_id, created_by: user.id })
            .select()
            .single()

        if (tok) setInviteToken(tok.token)
    }

    function copyInvite() {
        if (!inviteToken) return
        const inviteUrl = `${window.location.origin}/signup?invite=${inviteToken}`
        navigator.clipboard.writeText(inviteUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40dvh]">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-1">
                <h1 className="font-display text-3xl font-semibold" style={{ color: 'var(--text)' }}>
                    Settings ⚙️
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Customize your profile and relationship details
                </p>
            </div>

            {msg && (
                <div className="rounded-xl p-3 text-sm text-center font-medium"
                    style={{ background: 'rgba(201,169,110,0.15)', color: 'var(--gold)', border: '1px solid rgba(201,169,110,0.3)' }}>
                    {msg}
                </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleSaveProfile} className="glass rounded-2xl p-6 space-y-4">
                <h2 className="font-display text-lg font-medium flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <User className="w-5 h-5" style={{ color: 'var(--accent-light)' }} /> My Profile
                </h2>

                <div>
                    <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        Display Name
                    </label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                >
                    <Save className="w-4 h-4" /> Save Profile
                </button>
            </form>

            {/* Relationship Settings */}
            <form onSubmit={handleSaveRelationship} className="glass rounded-2xl p-6 space-y-4">
                <h2 className="font-display text-lg font-medium flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" /> Relationship Details
                </h2>

                <div>
                    <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        Relationship Title
                    </label>
                    <input
                        type="text"
                        value={relName}
                        onChange={e => setRelName(e.target.value)}
                        placeholder="Our Story"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        Relationship Start Date
                    </label>
                    <input
                        type="date"
                        value={startedAt}
                        onChange={e => setStartedAt(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all"
                    style={{ background: 'var(--gold)', color: '#0D0D0D' }}
                >
                    <Save className="w-4 h-4" /> Save Relationship Details
                </button>
            </form>

            {/* Partner Invite Section */}
            <div className="glass rounded-2xl p-6 space-y-4 border-l-4" style={{ borderColor: 'var(--gold)' }}>
                <h2 className="font-display text-lg font-medium flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <Sparkles className="w-5 h-5" style={{ color: 'var(--gold)' }} /> Partner Access & Invite Code
                </h2>

                <p className="text-xs font-light" style={{ color: 'var(--text-muted)' }}>
                    Give this code to your partner so they can join your space from the Setup screen:
                </p>

                {inviteToken ? (
                    <div className="rounded-xl p-3 flex items-center justify-between font-mono text-sm tracking-wider"
                        style={{ background: 'var(--card)', border: '1px dashed var(--border-light)' }}>
                        <span className="truncate mr-2" style={{ color: 'var(--gold)' }}>{inviteToken}</span>
                        <button
                            type="button"
                            onClick={copyInvite}
                            className="flex items-center gap-1 text-xs py-1.5 px-3 rounded-lg font-sans font-medium transition-all shrink-0"
                            style={{ background: 'var(--accent)', color: '#fff' }}
                        >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? 'Copied!' : 'Copy Code'}
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={generateNewInvite}
                        className="py-2 px-4 rounded-xl text-xs font-medium"
                        style={{ background: 'var(--card)', color: 'var(--gold)', border: '1px solid var(--border)' }}
                    >
                        Generate Partner Invite Code
                    </button>
                )}
            </div>

            {/* Logout Section */}
            <div className="glass rounded-2xl p-6 space-y-4 border-l-4" style={{ borderColor: 'var(--accent)' }}>
                <h2 className="font-display text-lg font-medium flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <LogOut className="w-5 h-5" style={{ color: 'var(--accent-light)' }} /> Sign Out
                </h2>

                <p className="text-xs font-light" style={{ color: 'var(--text-muted)' }}>
                    Sign out of this private space on this device.
                </p>

                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all"
                    style={{
                        background: loggingOut ? 'var(--accent-dim)' : 'rgba(200,75,75,0.15)',
                        color: 'var(--accent-light)',
                        border: '1px solid rgba(200,75,75,0.4)',
                    }}
                >
                    {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    {loggingOut ? 'Signing out…' : 'Sign Out of Our Love Calendar'}
                </button>
            </div>
        </div>
    )
}
