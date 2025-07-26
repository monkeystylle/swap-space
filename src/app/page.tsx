'use client';

import { Suspense } from 'react';
import { useQueryState } from 'nuqs';
import { SearchBar } from '@/features/search/components/search-bar';
import { PostedItemsGrid } from '@/features/bartering/components/posted-items/posted-items-grid';

// Component that uses search params - needs to be wrapped in Suspense
function SearchableContent() {
  // Use nuqs for URL query parameter management
  const [searchTerm, setSearchTerm] = useQueryState('search', {
    defaultValue: '',
    shallow: false,
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term || null); // Set to null to remove from URL when empty
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex justify-start w-full">
        <SearchBar
          onSearch={handleSearch}
          initialValue={searchTerm || ''}
          placeholder="Search items... "
        />
      </div>

      {/* Posted Items Grid */}
      <PostedItemsGrid searchTerm={searchTerm || ''} />
    </div>
  );
}

// Loading fallback for the suspense boundary
function SearchableContentFallback() {
  return (
    <div className="space-y-6">
      {/* Search Bar Skeleton */}
      <div className="flex justify-start w-full">
        <div className="flex items-center space-x-2 w-full max-w-2xl">
          <div className="relative flex-1">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
          </div>
          <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="custom-container  py-8">
      <Suspense fallback={<SearchableContentFallback />}>
        <SearchableContent />
      </Suspense>
    </div>
  );
}
