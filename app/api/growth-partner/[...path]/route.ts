import { NextRequest, NextResponse } from 'next/server';

const GROWTH_PARTNER_ORIGIN = 'https://pink-growth-partner-diamondpeomotion-cybers-projects.vercel.app';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path?.join('/') || '';
  const url = new URL(`/${path}`, GROWTH_PARTNER_ORIGIN);
  
  // Preserve query parameters
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': request.headers.get('User-Agent') || 'Nexora-Proxy',
        'Accept': request.headers.get('Accept') || '*/*',
      },
    });

    // Create a new response with the fetched content
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 502 }
    );
  }
}
