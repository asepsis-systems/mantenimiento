import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'session_token',
    value: '',
    httpOnly: true,
    path: '/',
    expires: new Date(0)
  });
  return response;
}
