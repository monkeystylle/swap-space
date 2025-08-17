import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PostedItemCard } from '@/features/bartering/components/posted-items/posted-item-card';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';

interface ItemPageProps {
  params: Promise<{
    id: string;
  }>;
}

const ItemPage = async ({ params }: ItemPageProps) => {
  // Await params in Next.js 15
  const { id } = await params;

  // Get current authenticated user
  const { user } = await getAuthOrRedirect();

  const postedItem = await prisma.postedItem.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      title: true,
      details: true,
      status: true,
      category: true,
      tag: true,
      imagePublicId: true,
      imageSecureUrl: true,
      userId: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          profile: {
            select: {
              id: true,
              profilePictureSecureUrl: true,
              profilePicturePublicId: true,
            },
          },
        },
      },
      offers: {
        select: {
          id: true,
          createdAt: true,
          content: true,
          imagePublicId: true,
          imageSecureUrl: true,
          postedItemId: true,
          userId: true,
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          offers: true,
        },
      },
    },
  });

  if (!postedItem) {
    notFound();
  }

  // Add isOwner property to match PostedItemWithDetails type
  const postedItemWithDetails = {
    ...postedItem,
    isOwner: postedItem.userId === user.id,
  };

  return (
    <div className="container-custom">
      <div className="max-w-4xl mx-auto py-4 sm:py-6 md:py-8">
        <div className="px-4 space-y-4 sm:space-y-6">
          <h1 className="text-xl sm:text-2xl font-bold">Posted Item</h1>
          <div className="max-w-2xl">
            <PostedItemCard postedItem={postedItemWithDetails} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemPage;
