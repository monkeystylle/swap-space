'use client';

import { Suspense } from 'react';
import { useQueryState } from 'nuqs';
import { SearchBar } from '@/features/search/components/search-bar';
import { PostedItemsGrid } from '@/features/bartering/components/posted-items/posted-items-grid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Component that uses search params - needs to be wrapped in Suspense
function SearchableContent() {
  // Use nuqs for URL query parameter management
  const [searchTerm, setSearchTerm] = useQueryState('search', {
    defaultValue: '',
    shallow: false,
  });

  const [category, setCategory] = useQueryState('category', {
    defaultValue: 'ALL' as 'ITEM' | 'SERVICE' | 'ALL',
    shallow: false,
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term || null); // Set to null to remove from URL when empty
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value === 'ALL' ? null : (value as 'ITEM' | 'SERVICE')); // Set to null to remove from URL when ALL
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        {/* Search Bar */}
        <div className="w-full">
          <SearchBar
            onSearch={handleSearch}
            initialValue={searchTerm || ''}
            placeholder="Search items... "
          />
        </div>

        {/* Category Filter */}
        <div className="">
          <Select
            value={category || 'ALL'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="ITEM">Items</SelectItem>
              <SelectItem value="SERVICE">Services</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Posted Items Grid */}
      <PostedItemsGrid
        searchTerm={searchTerm || ''}
        category={(category || 'ALL') as 'ITEM' | 'SERVICE' | 'ALL'}
      />
    </div>
  );
}

// Loading fallback for the suspense boundary
function SearchableContentFallback() {
  return (
    <div className="space-y-6">
      {/* Search and Filter Bar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        {/* Search Bar Skeleton */}
        <div className="flex-1">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        </div>

        {/* Category Filter Skeleton */}
        <div className="w-full sm:w-48">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
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
    <div className="container-custom">
      <Suspense fallback={<SearchableContentFallback />}>
        <SearchableContent />
      </Suspense>
    </div>
  );
}
