
import React, { useState } from 'react';
import { LocationMarkerIcon, SearchIcon } from './icons';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onMyLocation: () => void;
  loading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onMyLocation, loading }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setQuery(''); // Clear after search
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10 w-full max-w-md px-4 sm:px-0">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a city... (Ctrl+K)"
          className="w-full pl-10 pr-20 py-3 bg-gray-800/50 text-white border border-gray-600 rounded-full backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all placeholder:text-gray-400"
          disabled={loading}
          aria-label="Search for a city"
          autoComplete="off"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <SearchIcon className="w-5 h-5 text-gray-400" />
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          <button
            type="button"
            onClick={onMyLocation}
            className="p-2 bg-gray-700/60 hover:bg-cyan-500/50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Use my location"
            aria-label="Use my current location"
            disabled={loading}
          >
            <LocationMarkerIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
