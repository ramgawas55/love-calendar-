'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Calendar, BookOpen, Clock, Shuffle } from 'lucide-react'

const MOBILE_NAV = [
    { href: '/', label: 'Home', icon: Heart },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/memories', label: 'Memories', icon: BookOpen },
    { href: '/story', label: 'Story', icon: Clock },
    { href: '/time-machine', label: 'Magic', icon: Shuffle },
]

export default function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-around h-16 px-2">
                {MOBILE_NAV.map((item) => {
                    const Icon = item.icon
                    const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all"
                            style={{ color: active ? 'var(--accent-light)' : 'var(--text-muted)' }}
                        >
                            <Icon
                                className="w-5 h-5 transition-transform"
                                style={{ transform: active ? 'scale(1.15)' : 'scale(1)' }}
                                fill={active && item.icon === Heart ? 'currentColor' : 'none'}
                            />
                            <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
