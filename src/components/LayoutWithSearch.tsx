
import React from 'react';
import { Sidebar } from './ui/sidebar';
import SearchHeader from './SearchHeader';

interface LayoutWithSearchProps {
  children: React.ReactNode;
}

const LayoutWithSearch: React.FC<LayoutWithSearchProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <SearchHeader />
      <div className="flex-1 container py-6">
        {children}
      </div>
    </div>
  );
};

export default LayoutWithSearch;
