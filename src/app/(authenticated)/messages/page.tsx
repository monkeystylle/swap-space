import { Suspense } from 'react';
import { MessagesPageContent } from '@/features/messaging/components/messages-page-content';
import { MessagesLoadingSkeleton } from '@/features/messaging/components/messages-loading-skeleton';

// Main page component
export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesLoadingSkeleton />}>
      <MessagesPageContent />
    </Suspense>
  );
}
