import Link from 'next/link'
import { Heart, Calendar, Clock, Sparkles, Settings } from 'lucide-react'

interface NavigationProps {
    partnerName?: string
    relationshipName?: string
}

export default function Navigation({ partnerName, relationshipName }: NavigationProps) {
    return (
        <header className="sticky top-0 z-40 w-full glass border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ background: 'rgba(200,75,75,0.15)', border: '1px solid rgba(200,75,75,0.3)' }}>
                        <Heart className="w-4 h-4 text-glow-accent" style={{ color: 'var(--accent)' }} fill="currentColor" />
                    </div>
                    <span className="font-display font-semibold text-lg tracking-tight" style={{ color: 'var(--text)' }}>
                        Our Love Calendar
                    </span>
                </Link>

                {/* Desktop Nav Items */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="/calendar" className="transition-colors hover:text-amber-200" style={{ color: 'var(--text-muted)' }}>
                        Calendar
                    </Link>
                    <Link href="/memories" className="transition-colors hover:text-amber-200" style={{ color: 'var(--text-muted)' }}>
                        Memories
                    </Link>
                    <Link href="/story" className="transition-colors hover:text-amber-200" style={{ color: 'var(--text-muted)' }}>
                        Our Story
                    </Link>
                    <Link href="/on-this-day" className="transition-colors hover:text-amber-200" style={{ color: 'var(--text-muted)' }}>
                        On This Day
                    </Link>
                    <Link href="/time-machine" className="transition-colors hover:text-amber-200" style={{ color: 'var(--text-muted)' }}>
                        Time Machine
                    </Link>
                    <Link href="/favorites" className="transition-colors hover:text-amber-200" style={{ color: 'var(--text-muted)' }}>
                        Favorites
                    </Link>
                </nav>

                {/* User Pill / Settings */}
                <div className="flex items-center gap-3">
                    {partnerName && (
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs py-1 px-3 rounded-full font-medium"
                            style={{ background: 'rgba(201,169,110,0.12)', color: 'var(--gold)', border: '1px solid rgba(201,169,110,0.25)' }}>
                            <Heart className="w-3 h-3 fill-current" />
                            <span>You & {partnerName}</span>
                        </span>
                    )}

                    <Link
                        href="/settings"
                        className="p-2 rounded-xl glass hover:bg-white/5 transition-all text-muted"
                        style={{ color: 'var(--text-muted)' }}
                        aria-label="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </header>
    )
}
