import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterSort: 'status' | 'name' | 'elo' | 'recent';
  onFilterSortChange: (sort: 'status' | 'name' | 'elo' | 'recent') => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  filterSort,
  onFilterSortChange,
  placeholder = 'Search friends by name or @handle...'
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 bg-black/40 border border-white/10 focus:border-[#F5C453] rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5">
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#F5C453]" />
        <span className="text-[10px] text-white/50 uppercase font-bold">Sort:</span>
        <select
          value={filterSort}
          onChange={e => onFilterSortChange(e.target.value as any)}
          className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
        >
          <option value="status" className="bg-[#111827] text-white">Online First</option>
          <option value="elo" className="bg-[#111827] text-white">Rating (Elo)</option>
          <option value="name" className="bg-[#111827] text-white">Name (A-Z)</option>
          <option value="recent" className="bg-[#111827] text-white">Recent</option>
        </select>
      </div>
    </div>
  );
};
