import { google } from '@/lib/oauth';
import { cookies } from 'next/headers';

import { ObjectParser } from '@pilcrowjs/object-parser';

import { decodeIdToken, type OAuth2Tokens } from 'arctic';
import { homePath } from '@/paths';
import { createUserFromGoogle } from '@/features/auth/actions/create-user-from-google';
import { getUserFromGoogleId } from '@/features/auth/queries/get-user-from-google-id';
import { generateRandomToken } from '@/utils/crypto';
import { createSession } from '@/lib/session-management';
import { setSessionCookie } from '@/features/auth/utils/session-cookie';

export async function GET(request: Request): Promise<Response> {
  //get the callback url parameters
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  //get the stored tokens from cookies
  const cookieStore = await cookies();
  const storedState = cookieStore.get('google_oauth_state')?.value ?? null;
  const codeVerifier = cookieStore.get('google_code_verifier')?.value ?? null;

  //check if the code, state, storedState, and codeVerifier are all present
  if (
    code === null ||
    state === null ||
    storedState === null ||
    codeVerifier === null
  ) {
    return new Response('Please restart the process.', {
      status: 400,
    });
  }

  //verify the state matches (security check)
  if (state !== storedState) {
    return new Response('Please restart the process.', {
      status: 400,
    });
  }

  let tokens: OAuth2Tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch {
    return new Response('Please restart the process.', {
      status: 400,
    });
  }

  const claims = decodeIdToken(tokens.idToken());
  const claimsParser = new ObjectParser(claims);

  // Extract user info from claims
  const googleId = claimsParser.getString('sub');
  const name = claimsParser.getString('name');
  const email = claimsParser.getString('email');

  // Check if user already exists
  const existingUser = await getUserFromGoogleId(googleId);

  if (existingUser) {
    // User exists, create session
    const sessionToken = generateRandomToken();
    const session = await createSession(sessionToken, existingUser.id);
    await setSessionCookie(sessionToken, session.expiresAt);

    return new Response(null, {
      status: 302,
      headers: {
        Location: homePath(),
      },
    });
  }

  // User doesn't exist, create new user
  const result = await createUserFromGoogle(googleId, email, name);

  if (result.status === 'SUCCESS' && result.data) {
    const sessionToken = generateRandomToken();
    const session = await createSession(sessionToken, result.data.id);
    await setSessionCookie(sessionToken, session.expiresAt);

    return new Response(null, {
      status: 302,
      headers: {
        Location: homePath(),
      },
    });
  } else {
    return new Response('Failed to create account. Please try again.', {
      status: 500,
    });
  }
}

// This route handles the callback from Google's OAuth process
// It verifies the state, validates the tokens, and creates a session
// If the user doesn't exist, it creates a new user and session
// If the user exists, it creates a session
