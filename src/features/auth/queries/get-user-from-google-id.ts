'use server';

import { prisma } from '@/lib/prisma';

export const getUserFromGoogleId = async (googleId: string) => {
  const user = await prisma.user.findUnique({
    where: { googleId: googleId },
  });

  return user;
};
