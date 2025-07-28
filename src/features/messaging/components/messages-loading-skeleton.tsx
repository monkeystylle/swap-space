import { MessageCircle } from 'lucide-react';

export function MessagesLoadingSkeleton() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0 overflow-hidden">
          <h1 className="text-2xl font-bold mb-6 flex-shrink-0">Messages</h1>

          <div className="flex-1 overflow-hidden min-h-0 max-h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-0 rounded-lg shadow-2xl">
            <div className="flex h-full min-h-0 max-h-full">
              {/* Left Sidebar Skeleton - Conversation List (30%) */}
              <div className="w-full md:w-[30%] border-r border-gray-200 dark:border-gray-700 h-full min-h-0 overflow-hidden">
                {/* Conversation List Header Skeleton */}
                <div className="h-16 px-4 flex items-center flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                  <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
                </div>

                {/* Conversation Items Skeleton */}
                <div className="flex-1 p-4 min-h-0">
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className="flex items-center space-x-3 p-3 rounded-lg animate-pulse"
                      >
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side - Exact Match of "Select a conversation" Empty State (70%) */}
              <div className="hidden md:block md:w-[70%] h-full min-h-0 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-900">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm">
                      Choose a conversation from the left to start messaging
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
