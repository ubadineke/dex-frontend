import { NextResponse } from 'next/server'

const POLYMARKET_GAMMA_API = 'https://gamma-api.polymarket.com'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') || '10'
  const offset = searchParams.get('offset') || '0'

  try {
    const response = await fetch(
      `${POLYMARKET_GAMMA_API}/events?limit=${limit}&offset=${offset}&active=true&closed=false`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Moxie/1.0',
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    )

    if (!response.ok) {
      console.error('[Polymarket API] Error:', response.status, response.statusText)
      return NextResponse.json({ error: 'Failed to fetch from Polymarket' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Polymarket API] Fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 })
  }
}

