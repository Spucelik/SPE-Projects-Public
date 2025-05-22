
import React from 'react';
import { useParams } from 'react-router-dom';
import SearchBar from './SearchBar';

const SearchHeader: React.FC = () => {
  // Get container ID if available from the route params
  const { containerId } = useParams<{ containerId?: string }>();
  
  return (
    <div className="border-b py-3 px-6 bg-background sticky top-0 z-10">
      <div className="flex justify-end items-center">
        <SearchBar containerId={containerId} />
      </div>
    </div>
  );
};

export default SearchHeader;
