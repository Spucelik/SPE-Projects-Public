
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import SearchBar from '@/components/SearchBar';
import { SearchResult, searchService } from '@/services/searchService';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import FilePreviewDialog from '@/components/files/FilePreviewDialog';
import { useFilePreview } from '@/hooks/useFilePreview';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const containerId = searchParams.get('container') || undefined;
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getAccessToken } = useAuth();
  
  // Use the existing file preview hook
  const {
    isPreviewOpen,
    setIsPreviewOpen,
    previewUrl,
    previewLoading,
    handleViewFile
  } = useFilePreview(containerId);
  
  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const token = await getAccessToken();
        if (!token) {
          setError("Failed to get access token. Please try logging in again.");
          toast({
            title: "Authentication Error",
            description: "Failed to get access token",
            variant: "destructive",
          });
          return;
        }
        
        const searchResults = await searchService.searchFiles(token, searchTerm, containerId);
        setResults(searchResults);
      } catch (error: any) {
        console.error('Search error:', error);
        setError(error.message || 'An error occurred while searching');
        toast({
          title: "Search Error",
          description: `Failed to search: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    performSearch();
  }, [searchTerm, containerId, getAccessToken]);
  
  const handleResultClick = async (result: SearchResult) => {
    if (!result.driveId || !result.itemId) {
      toast({
        title: "Error",
        description: "Cannot preview this file: Missing file information",
        variant: "destructive",
      });
      return;
    }
    
    // Convert search result to file item format for preview
    const fileItem = searchService.convertToFileItem(result);
    
    // Use the existing view file handler
    await handleViewFile(fileItem);
  };
  
  return (
    <div className="container space-y-6 py-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Search Results</h1>
        <SearchBar containerId={containerId} />
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {loading && (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-b pb-4">
                  <div className="flex items-baseline mb-2">
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <div className="space-y-2 mb-2 pl-8">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="pl-8">
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!loading && !error && results.length === 0 && (
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground">No files found matching your search.</p>
            </div>
          )}
          
          {!loading && !error && results.length > 0 && (
            <div className="space-y-6">
              {results.map((result, index) => (
                <div key={result.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-baseline mb-2">
                    <span className="text-muted-foreground mr-2">{index + 1}</span>
                    <h3 
                      className="text-lg font-semibold text-blue-600 hover:underline cursor-pointer"
                      onClick={() => handleResultClick(result)}
                    >
                      {result.title}
                    </h3>
                  </div>
                  
                  <div className="pl-8">
                    <p className="text-sm mb-2">
                      <span className="font-semibold">Summary:</span>
                    </p>
                    <p className="text-sm pl-4 mb-2">{result.preview || 'No preview available'}</p>
                    
                    <p className="text-xs text-gray-500 italic">
                      Last modified by {result.createdBy} {result.createdDateTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Reuse the file preview dialog component */}
      <FilePreviewDialog
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        previewUrl={previewUrl}
        previewLoading={previewLoading}
      />
    </div>
  );
};

export default SearchResults;
