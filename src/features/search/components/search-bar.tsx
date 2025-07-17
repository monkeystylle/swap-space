/**
 * SearchBar Component
 * Provides search input with button to filter posted items
 * Uses nuqs for URL query parameter management
 */

'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
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
  placeholder = 'Search items... (e.g., "sofa tarlac")',
}: SearchBarProps) => {
  const [searchValue, setSearchValue] = useState(initialValue);

  const handleSearch = () => {
    onSearch(searchValue.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex items-center space-x-2 max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10"
        />
      </div>
      <Button
        onClick={handleSearch}
        variant="default"
        size="default"
        className="px-4"
      >
        Search
      </Button>
    </div>
  );
};
