import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This will either redirect to login or allow access to the protected route
  await getAuthOrRedirect();

  return <>{children}</>;
}
