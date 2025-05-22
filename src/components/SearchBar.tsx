
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  containerId?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ containerId, className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    // Build the query parameters
    const params = new URLSearchParams();
    params.set('q', searchTerm.trim());
    
    if (containerId) {
      params.set('container', containerId);
    }
    
    // Navigate to search results page with query parameters
    navigate(`/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <div className="relative w-full max-w-sm">
        <Input
          type="search"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4"
        />
        <Button 
          type="submit" 
          size="icon" 
          variant="ghost" 
          className="absolute left-0 top-0 h-full px-2"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;
