import { format, formatDistanceToNow, differenceInDays, differenceInMonths, differenceInYears, addYears, isBefore, isSameDay, parseISO } from 'date-fns'

/** Format a date string (YYYY-MM-DD) into human-readable form. */
export function formatMemoryDate(dateStr: string): string {
    return format(parseISO(dateStr), 'MMMM d, yyyy')
}

export function formatShortDate(dateStr: string): string {
    return format(parseISO(dateStr), 'MMM d, yyyy')
}

export function formatMonthYear(date: Date): string {
    return format(date, 'MMMM yyyy')
}

/** Relationship duration stats from a start date ISO string */
export function getRelationshipStats(startedAt: string) {
    const start = parseISO(startedAt)
    const now = new Date()

    const days = differenceInDays(now, start)
    const months = differenceInMonths(now, start)
    const years = differenceInYears(now, start)

    return { days, months, years }
}

/** Next anniversary date from start date */
export function getNextAnniversary(startedAt: string): Date {
    const start = parseISO(startedAt)
    const now = new Date()
    const years = differenceInYears(now, start)

    let next = addYears(start, years)
    if (isBefore(next, now) || isSameDay(next, now)) {
        next = addYears(start, years + 1)
    }
    return next
}

/** Days until next anniversary */
export function getDaysUntilAnniversary(startedAt: string): number {
    const next = getNextAnniversary(startedAt)
    return differenceInDays(next, new Date())
}

/** Relative time string */
export function timeAgo(dateStr: string): string {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
}

/** Today as YYYY-MM-DD */
export function todayISO(): string {
    return format(new Date(), 'yyyy-MM-dd')
}

/** Calendar helpers */
export function getDaysInMonth(year: number, month: number): Date[] {
    const days: Date[] = []
    const d = new Date(year, month, 1)
    while (d.getMonth() === month) {
        days.push(new Date(d))
        d.setDate(d.getDate() + 1)
    }
    return days
}

export function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay()
}

/** Month names */
export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** pluralise helper */
export function plural(n: number, singular: string, p?: string): string {
    return `${n} ${n === 1 ? singular : (p ?? singular + 's')}`
}
