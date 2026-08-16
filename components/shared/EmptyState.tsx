import Link from 'next/link'
import { Heart, Plus } from 'lucide-react'

interface EmptyStateProps {
    icon?: any
    title: string
    description: string
    actionLabel?: string
    actionHref?: string
}

export default function EmptyState({
    icon: Icon = Heart,
    title,
    description,
    actionLabel,
    actionHref,
}: EmptyStateProps) {
    return (
        <div className="glass rounded-2xl p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(200,75,75,0.1)', border: '1px solid rgba(200,75,75,0.2)' }}>
                <Icon className="w-7 h-7" style={{ color: 'var(--accent-light)' }} />
            </div>
            <div className="max-w-md">
                <h3 className="font-display text-xl font-medium mb-1" style={{ color: 'var(--text)' }}>
                    {title}
                </h3>
                <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
                    {description}
                </p>
            </div>
            {actionLabel && actionHref && (
                <Link
                    href={actionHref}
                    className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-medium transition-all hover:scale-105"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                >
                    <Plus className="w-4 h-4" />
                    <span>{actionLabel}</span>
                </Link>
            )}
        </div>
    )
}
