
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Search, Clock, FileIcon } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchResult, searchService } from '@/services/searchService';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import FilePreviewDialog from '@/components/files/FilePreviewDialog';
import { useFilePreview } from '@/hooks/useFilePreview';
import { Badge } from '@/components/ui/badge';

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
        console.log('Setting search results:', searchResults);
        
        // For Office documents, fetch their webUrls and build edit URLs
        const enhancedResults = await Promise.all(
          searchResults.map(async (result) => {
            if (isOfficeFile(result.title) && containerId && result.driveId && result.itemId) {
              try {
                const fileDetails = await searchService.getFileDetails(token, result.driveId, result.itemId);
                
                // Add the webUrl to the result
                if (fileDetails.webUrl) {
                  console.log(`Found webUrl for ${result.title}: ${fileDetails.webUrl}`);
                  
                  // Get the full file data from Graph API to build edit URL
                  const editUrl = searchService.buildEditUrl({
                    ...result,
                    webUrl: fileDetails.webUrl,
                  });
                  
                  return { 
                    ...result, 
                    webUrl: fileDetails.webUrl,
                    editUrl: editUrl 
                  };
                }
              } catch (error) {
                console.error(`Failed to get webUrl for ${result.title}:`, error);
              }
            }
            return result;
          })
        );
        
        setResults(enhancedResults);
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
    
    // Check if the file is a Microsoft Office document
    const isOfficeDocument = isOfficeFile(result.title);
    
    if (isOfficeDocument && result.webUrl) {
      // Open Office documents directly using their webUrl
      console.log('Opening Office document with webUrl:', result.webUrl);
      window.open(result.webUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // For non-Office files or Office files without webUrl, use the file preview
    const fileItem = searchService.convertToFileItem(result);
    await handleViewFile(fileItem);
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
  
  // Function to get file extension from filename
  const getFileExtension = (filename: string): string => {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  };
  
  // Function to get friendly file type from extension
  const getFileType = (filename: string): string => {
    const ext = getFileExtension(filename);
    
    const fileTypes: Record<string, string> = {
      'pdf': 'PDF Document',
      'doc': 'Word Document',
      'docx': 'Word Document',
      'xls': 'Excel Spreadsheet',
      'xlsx': 'Excel Spreadsheet',
      'ppt': 'PowerPoint Presentation',
      'pptx': 'PowerPoint Presentation',
      'txt': 'Text Document',
      'csv': 'CSV File',
      'jpg': 'JPEG Image',
      'jpeg': 'JPEG Image',
      'png': 'PNG Image',
      'gif': 'GIF Image',
      'zip': 'ZIP Archive',
      'mp4': 'Video File',
      'mp3': 'Audio File',
      'html': 'HTML Document',
      'odt': 'OpenDocument Text',
      'ods': 'OpenDocument Spreadsheet',
      'odp': 'OpenDocument Presentation',
      'vsd': 'Visio Drawing',
      'vsdx': 'Visio Drawing',
    };
    
    return fileTypes[ext] || `${ext.toUpperCase()} File`;
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
  
  // A helper function to determine the best URL to use for Office documents
  const getBestDocumentUrl = (result: SearchResult): string | null => {
    // Log all available URLs for debugging
    console.log('Available URLs for document:', {
      title: result.title,
      editUrl: result.editUrl || 'Not available',
      webUrl: result.webUrl || 'Not available',
    });
    
    // Prioritize editUrl if available (this is the "Edit in Office" URL)
    if (result.editUrl) {
      console.log(`Using editUrl for ${result.title}: ${result.editUrl}`);
      return result.editUrl;
    }
    
    // Fall back to webUrl if editUrl is not available
    if (result.webUrl) {
      console.log(`Using webUrl for ${result.title}: ${result.webUrl}`);
      return result.webUrl;
    }
    
    console.log(`No URL available for ${result.title}`);
    return null;
  }
  
  return (
    <div className="container space-y-6 py-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Search Results</h1>
        {/* Search bar has been removed from here */}
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
                  <div className="pl-0 mb-1">
                    <Skeleton className="h-4 w-12" /> {/* File extension badge skeleton */}
                  </div>
                  <div className="space-y-2 mb-2 pl-0">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="pl-0">
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
                const fileExt = getFileExtension(result.title);
                // Get the best URL to use (with detailed logging)
                const targetUrl = isOfficeDoc ? getBestDocumentUrl(result) : null;
                
                return (
                  <div key={`result-${result.id || Math.random().toString()}`} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-baseline mb-1">
                      {isOfficeDoc && targetUrl ? (
                        // Direct link for Office documents with URL
                        <a 
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-semibold text-blue-600 hover:underline"
                          onClick={(e) => {
                            e.preventDefault(); // Prevent default behavior
                            console.log(`Opening Office document with URL: ${targetUrl}`);
                            
                            // Log URL components for debugging
                            try {
                              const urlObj = new URL(targetUrl);
                              console.log('URL details:', {
                                protocol: urlObj.protocol,
                                hostname: urlObj.hostname,
                                pathname: urlObj.pathname,
                                search: urlObj.search,
                                hash: urlObj.hash
                              });
                            } catch (err) {
                              console.error('Invalid URL format:', targetUrl, err);
                            }
                            
                            // Open in new tab manually to ensure it works across browsers
                            window.open(targetUrl, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          {result.title || 'Unnamed Document'}
                        </a>
                      ) : (
                        // Regular button for non-Office files
                        <h3 
                          className="text-lg font-semibold text-blue-600 hover:underline cursor-pointer"
                          onClick={() => handleResultClick(result)}
                        >
                          {result.title || 'Unnamed Document'}
                        </h3>
                      )}
                    </div>
                    
                    {/* File extension badge */}
                    {fileExt && (
                      <div className="pl-0 mb-2">
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700">
                          <FileIcon className="h-3 w-3 mr-1" />
                          {fileExt}
                        </Badge>
                      </div>
                    )}
                    
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
