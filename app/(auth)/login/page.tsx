'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Heart, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const supabase = createClient()
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

        if (authError) {
            setError('Incorrect email or password. Please try again.')
            setLoading(false)
            return
        }

        router.push('/')
        router.refresh()
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm"
        >
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                    style={{ background: 'rgba(200,75,75,0.15)', border: '1px solid rgba(200,75,75,0.4)' }}>
                    <Heart className="w-7 h-7" style={{ color: 'var(--accent)' }} fill="currentColor" />
                </div>
                <h1 className="font-display text-2xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
                    Welcome Back
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Sign in to your private space
                </p>
            </div>

            {/* Card */}
            <div className="glass rounded-2xl p-6">
                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="rounded-xl p-3 text-sm"
                            style={{ background: 'rgba(200,75,75,0.12)', color: 'var(--accent-light)', border: '1px solid rgba(200,75,75,0.3)' }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <div>
                        <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                            style={{ color: 'var(--text-muted)' }}>
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                style={{ paddingLeft: '2.25rem' }}
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                            style={{ color: 'var(--text-muted)' }}>
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: 'var(--text-dim)' }}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all"
                        style={{
                            background: loading ? 'var(--accent-dim)' : 'var(--accent)',
                            color: '#fff',
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    New here?{' '}
                    <Link href="/signup" className="transition-colors"
                        style={{ color: 'var(--accent-light)' }}>
                        Create an account
                    </Link>
                </p>
            </div>
        </motion.div>
    )
}
