import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PostedItemCard } from '@/features/bartering/components/posted-items/posted-item-card';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';

interface ItemPageProps {
  params: {
    id: string;
  };
}

const ItemPage = async ({ params }: ItemPageProps) => {
  // Get current authenticated user
  const { user } = await getAuthOrRedirect();

  const postedItem = await prisma.postedItem.findUnique({
    where: {
      id: params.id,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      offers: {
        include: {
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Posted Item</h1>
        <PostedItemCard postedItem={postedItemWithDetails} />
      </div>
    </div>
  );
};

export default ItemPage;
