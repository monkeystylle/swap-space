/**
 * SearchBar Component
 * Provides search input with button to filter posted items
 * Uses nuqs for URL query parameter management
 */

'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  initialValue?: string;
  placeholder?: string;
}

export const SearchBar = ({
  onSearch,
  initialValue = '',
  placeholder = 'Search items...',
}: SearchBarProps) => {
  const [searchValue, setSearchValue] = useState(initialValue);

  const handleSearch = () => {
    onSearch(searchValue.trim());
  };

  const handleClear = () => {
    setSearchValue('');
    onSearch(''); // Clear the search results
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      handleSearch();
    }
  };

  return (
    <div className="flex items-center space-x-2 w-full max-w-2xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-10"
        />
        {/* X Clear Button */}
        {searchValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        )}
      </div>
      <Button
        onClick={handleSearch}
        variant="default"
        size="default"
        className="px-4"
        disabled={!searchValue.trim()}
      >
        Search
      </Button>
    </div>
  );
};
