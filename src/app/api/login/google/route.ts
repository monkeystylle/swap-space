import { generateState, generateCodeVerifier } from 'arctic';
import { google } from '@/lib/oauth';
import { cookies } from 'next/headers';
import { getBaseUrl } from '@/utils/url';

export async function GET(): Promise<Response> {
  // Debug: Let's see what URLs are being generated
  const baseUrl = getBaseUrl();
  const expectedRedirectUri = `${baseUrl}/api/login/google/callback`;

  console.log('=== OAuth Debug Info ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Base URL:', baseUrl);
  console.log('Expected Redirect URI:', expectedRedirectUri);
  console.log('VERCEL_URL:', process.env.VERCEL_URL);
  console.log('NEXT_PUBLIC_VERCEL_URL:', process.env.NEXT_PUBLIC_VERCEL_URL);
  console.log('========================');

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
