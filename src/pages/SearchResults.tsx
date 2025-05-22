
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import SearchBar from '@/components/SearchBar';
import { SearchResult, searchService } from '@/services/searchService';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import FilePreviewDialog from '@/components/files/FilePreviewDialog';
import { useFilePreview } from '@/hooks/useFilePreview';
import { format } from 'date-fns';

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
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Unknown Date';
    }
  };
  
  return (
    <div className="container space-y-6 py-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Search Results</h1>
        <SearchBar containerId={containerId} />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Results for "{searchTerm}"</CardTitle>
          <CardDescription>
            {results.length} {results.length === 1 ? 'file' : 'files'} found
            {containerId ? ' in this container' : ''}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell 
                      className="font-medium"
                      onClick={() => handleResultClick(result)}
                    >
                      {result.title}
                    </TableCell>
                    <TableCell>{result.createdBy}</TableCell>
                    <TableCell>{formatDate(result.createdDateTime)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      <div className="line-clamp-2">{result.preview}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
