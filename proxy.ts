import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-current-pathname', request.nextUrl.pathname)

    const supabaseResponse = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    const isAuthRoute = ['/login', '/signup'].includes(pathname)
    if (isAuthRoute && user) {
        const redirectUrl = new URL('/', request.url)
        const response = NextResponse.redirect(redirectUrl)
        supabaseResponse.cookies.getAll().forEach(cookie => {
            response.cookies.set(cookie.name, cookie.value, cookie)
        })
        return response
    }

    const publicPaths = ['/login', '/signup', '/api/auth']
    const isPublic = publicPaths.some(p => pathname.startsWith(p))

    if (!isPublic && !user) {
        const redirectUrl = new URL('/login', request.url)
        const response = NextResponse.redirect(redirectUrl)
        supabaseResponse.cookies.getAll().forEach(cookie => {
            response.cookies.set(cookie.name, cookie.value, cookie)
        })
        return response
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|robots.txt).*)',
    ],
}
