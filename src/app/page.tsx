'use client';

import { useQueryState } from 'nuqs';
import { SearchBar } from '@/features/search/components/search-bar';
import { PostedItemsGrid } from '@/features/bartering/components/posted-items/posted-items-grid';

export default function Home() {
  // Use nuqs for URL query parameter management
  const [searchTerm, setSearchTerm] = useQueryState('search', {
    defaultValue: '',
    shallow: false,
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term || null); // Set to null to remove from URL when empty
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Marketplace
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover and trade items with others
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex justify-start">
          <SearchBar
            onSearch={handleSearch}
            initialValue={searchTerm || ''}
            placeholder="Search items... (e.g., sofa tarlac)"
          />
        </div>

        {/* Posted Items Grid */}
        <PostedItemsGrid searchTerm={searchTerm || ''} />
      </div>
    </div>
  );
}
