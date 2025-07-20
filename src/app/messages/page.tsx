import { Suspense } from 'react';
import { MessagesPageContent } from '@/features/messaging/components/messages-page-content';

// Loading component
function MessagesPageLoading() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0 overflow-hidden">
          <h1 className="text-2xl font-bold mb-6 flex-shrink-0">Messages</h1>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Loading messages...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component
export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesPageLoading />}>
      <MessagesPageContent />
    </Suspense>
  );
}
