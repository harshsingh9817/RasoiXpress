"use client";

import type { FC, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
}

const SearchBar: FC<SearchBarProps> = ({ searchTerm, onSearchChange, placeholder = "Search for restaurants or food..." }) => {
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <div className="relative w-full max-w-xl">
      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        className="w-full rounded-full bg-muted py-3 pl-10 pr-4 text-base focus:bg-background"
        aria-label="Search bar"
      />
    </div>
  );
};

export default SearchBar;
