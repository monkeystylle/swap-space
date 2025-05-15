import { generateState, generateCodeVerifier } from 'arctic';
import { google } from '@/lib/oauth';
import { cookies } from 'next/headers';

export async function GET(): Promise<Response> {
  //generate security tokens
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  //create the google 0auth URL with the security tokens
  const url = google.createAuthorizationURL(state, codeVerifier, [
    'openid',
    'profile',
    'email',
  ]);

  //store the security tokens in cookies
  const cookieStore = await cookies();
  cookieStore.set('google_oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax',
  });
  cookieStore.set('google_code_verifier', codeVerifier, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax',
  });

  //redirect user to Google's login page
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
    },
  });
}
