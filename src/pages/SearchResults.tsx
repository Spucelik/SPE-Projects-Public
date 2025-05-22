
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Search, Clock } from 'lucide-react';
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
  const [officeDocUrls, setOfficeDocUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});
  
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
        console.log('Setting search results:', searchResults);
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

  // New effect to prefetch webUrls for Office documents
  useEffect(() => {
    const fetchOfficeDocUrls = async () => {
      if (!results.length || !containerId) return;
      
      const token = await getAccessToken();
      if (!token) return;
      
      const officeFiles = results.filter(r => isOfficeFile(r.title));
      
      // Create a temporary loading state object
      const newLoadingState: Record<string, boolean> = {};
      officeFiles.forEach(file => {
        newLoadingState[file.id] = true;
      });
      setLoadingUrls(newLoadingState);
      
      // Fetch all webUrls in parallel
      const urlPromises = officeFiles.map(async (file) => {
        try {
          if (!file.driveId || !file.itemId) return null;
          
          const details = await searchService.getFileDetails(token, file.driveId, file.itemId);
          return { id: file.id, webUrl: details.webUrl };
        } catch (error) {
          console.error(`Error fetching URL for ${file.title}:`, error);
          return null;
        } finally {
          // Update loading state for this specific file
          setLoadingUrls(prev => ({ ...prev, [file.id]: false }));
        }
      });
      
      const results = await Promise.all(urlPromises);
      
      // Update state with all fetched URLs
      const urlMap: Record<string, string> = {};
      results.forEach(result => {
        if (result && result.webUrl) {
          urlMap[result.id] = result.webUrl;
        }
      });
      
      setOfficeDocUrls(urlMap);
    };
    
    fetchOfficeDocUrls();
  }, [results, containerId, getAccessToken]);
  
  const handleResultClick = async (result: SearchResult) => {
    if (!result.driveId || !result.itemId) {
      toast({
        title: "Error",
        description: "Cannot preview this file: Missing file information",
        variant: "destructive",
      });
      return;
    }
    
    // Check if the file is a Microsoft Office document
    const isOfficeDocument = isOfficeFile(result.title);
    
    if (isOfficeDocument) {
      // If we already have the URL cached, use it directly
      if (officeDocUrls[result.id]) {
        openOfficeDocument(officeDocUrls[result.id]);
        return;
      }
      
      try {
        // Get the accurate webUrl using the direct API method
        console.log('Getting accurate webUrl for Office document');
        const token = await getAccessToken();
        
        if (!token) {
          throw new Error("Failed to get access token");
        }
        
        const fileDetails = await searchService.getFileDetails(token, result.driveId, result.itemId);
        
        if (!fileDetails.webUrl) {
          throw new Error("Could not retrieve valid webUrl for the document");
        }
        
        openOfficeDocument(fileDetails.webUrl);
      } catch (error: any) {
        console.error('Error opening Office document:', error);
        toast({
          title: "Error Opening Document",
          description: error.message || "Could not open the document",
          variant: "destructive",
        });
        
        // Fall back to preview if we can't open it directly
        const fileItem = searchService.convertToFileItem(result);
        await handleViewFile(fileItem);
      }
      
      return;
    }
    
    // For non-Office files, use the file preview
    const fileItem = searchService.convertToFileItem(result);
    await handleViewFile(fileItem);
  };
  
  // Helper function to open Office documents
  const openOfficeDocument = (webUrl: string) => {
    console.log('Opening Office document with webUrl:', webUrl);
    
    const newWindow = window.open(webUrl, '_blank');
    
    if (!newWindow) {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site to open documents",
        variant: "destructive",
      });
    }
  };
  
  // Helper function to determine if a file is a Microsoft Office document
  const isOfficeFile = (fileName: string): boolean => {
    if (!fileName) return false;
    
    const officeExtensions = [
      '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', 
      '.vsdx', '.vsd', '.odt', '.odp', '.ods'
    ];
    
    return officeExtensions.some(ext => 
      fileName.toLowerCase().endsWith(ext.toLowerCase())
    );
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="container space-y-6 py-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Search Results</h1>
        <SearchBar containerId={containerId} />
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        {!loading && results.length > 0 && (
          <p>{results.length} results for "{searchTerm}"</p>
        )}
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {loading && (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={`loading-${i}`} className="border-b pb-4">
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
              {results.map((result) => {
                const isOfficeDoc = isOfficeFile(result.title);
                const hasLoadedUrl = isOfficeDoc && officeDocUrls[result.id];
                const isLoadingUrl = isOfficeDoc && loadingUrls[result.id];
                
                return (
                  <div key={`result-${result.id || Math.random().toString()}`} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-baseline mb-2">
                      {isOfficeDoc && hasLoadedUrl ? (
                        // Direct link for Office documents with loaded URLs
                        <a 
                          href={officeDocUrls[result.id]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-semibold text-blue-600 hover:underline"
                          onClick={(e) => {
                            // Handle popup blockers by capturing the click
                            e.preventDefault();
                            openOfficeDocument(officeDocUrls[result.id]);
                          }}
                        >
                          {result.title || 'Unnamed Document'}
                        </a>
                      ) : (
                        // Regular button for non-Office files or files with no URL yet
                        <h3 
                          className={`text-lg font-semibold text-blue-600 hover:underline cursor-pointer ${
                            isLoadingUrl ? 'opacity-70' : ''
                          }`}
                          onClick={() => !isLoadingUrl && handleResultClick(result)}
                        >
                          {result.title || 'Unnamed Document'} 
                          {isLoadingUrl && <span className="text-xs ml-2">(loading...)</span>}
                        </h3>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm mb-2 line-clamp-2">
                        {result.preview || 'No preview available'}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          Last modified {formatDate(result.createdDateTime || '')}
                          {result.createdBy && ` by ${result.createdBy}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
