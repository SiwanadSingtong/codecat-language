import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    // If Supabase environment variables are missing (e.g. not configured on Vercel yet),
    // we bypass session checks and proceed with the request to avoid crashing the application.
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              supabaseResponse = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              )
            } catch (err) {
              // Ignore cookie modifications error if header already sent
            }
          },
        },
      }
    )

    // This will refresh the session if expired
    await supabase.auth.getUser()
  } catch (error) {
    console.error('Supabase middleware updateSession error:', error)
  }

  return supabaseResponse
}
