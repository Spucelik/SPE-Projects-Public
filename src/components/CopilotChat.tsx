
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '@/hooks/use-toast';

// Import correct exports from the SDK
import {
  ChatEmbedded,
  ChatEmbeddedAPI,
  IChatEmbeddedApiAuthProvider,
} from '@microsoft/sharepointembedded-copilotchat-react';

interface CopilotChatProps {
  containerId: string;
}

// The hostname should match your actual SharePoint tenant
// The format should be: https://tenantname.sharepoint.com (without trailing slash)
const SPE_HOSTNAME = 'https://pucelikenterprise.sharepoint.com'; 

const CopilotChat: React.FC<CopilotChatProps> = ({ containerId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getAccessToken } = useAuth();
  const [chatApi, setChatApi] = useState<ChatEmbeddedAPI | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<any | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isSiteUrlFetched, setIsSiteUrlFetched] = useState(false);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);

  // Extract container details for better site URL construction
  const containerParts = useMemo(() => {
    if (!containerId) return null;
    try {
      const parts = containerId.split('!');
      if (parts.length > 1) {
        const secondPart = parts[1].split('_');
        return {
          fullId: containerId,
          firstPart: parts[0],
          contentId: secondPart[0]
        };
      }
      return null;
    } catch (e) {
      console.error('Error parsing container ID:', e);
      return null;
    }
  }, [containerId]);

  // Detailed diagnostics for the site URL
  useEffect(() => {
    if (!containerId) return;
    
    console.log('Current route contains containerId:', containerId);
    console.log('Container parts parsing result:', containerParts);
    console.log('Current site URL being used:', siteUrl);
  }, [containerId, containerParts, siteUrl]);

  // Auth provider for the SDK with debugging
  const authProvider: IChatEmbeddedApiAuthProvider = useMemo(
    () => ({
      hostname: SPE_HOSTNAME,
      getToken: async () => {
        try {
          setError(null);
          console.log('Getting access token for Copilot Chat...');
          const token = await getAccessToken();
          
          if (!token) {
            const noTokenError = 'No access token available for Copilot Chat';
            console.error(noTokenError);
            setError(noTokenError);
            throw new Error(noTokenError);
          }
          
          // Log token details (safely)
          console.log('Access token obtained successfully', {
            length: token.length,
            prefix: token.substring(0, 5) + '...',
            timestamp: new Date().toISOString()
          });
          
          return token;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to get token';
          setError(errorMessage);
          console.error('Token acquisition failed:', errorMessage, err);
          throw err;
        }
      },
      // Use the determined site URL with detailed logging
      siteUrl: siteUrl || (containerParts ? `${SPE_HOSTNAME}/contentstorage/CSP_${containerParts.contentId}` : undefined),
    }),
    [getAccessToken, containerParts, siteUrl]
  );
  
  // Callback for API ready with enhanced logging
  const handleApiReady = useCallback((api: ChatEmbeddedAPI) => {
    console.log('Copilot Chat API ready, inspecting API properties:', {
      apiExists: !!api,
      apiMethods: Object.keys(api),
      timestamp: new Date().toISOString()
    });
    setChatApi(api);
  }, []);

  // Function to handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    setDetailedError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  // Try multiple site URL formats when container ID changes
  useEffect(() => {
    if (!containerId || !containerParts) return;
    
    const fetchSiteUrl = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        
        // Try multiple possible site URL formats with detailed logging
        const possibleSiteUrls = [
          `${SPE_HOSTNAME}/contentstorage/CSP_${containerParts.contentId}`,
          `${SPE_HOSTNAME}/sites/contentstorage_${containerParts.contentId}`,
          `${SPE_HOSTNAME}/_api/v2.1/drives/${containerId}/root`,
          // Include the raw containerId as is, in case it's already a valid site path
          `${SPE_HOSTNAME}/sites/${containerId}`,
          // Support for document libraries format
          `${SPE_HOSTNAME}/personal/${containerParts.contentId}_onmicrosoft_com/Documents`,
          // Try the unprocessed containerId directly
          `${SPE_HOSTNAME}/personal/${containerId}`,
          // Try with b! prefix removed if present
          containerId.startsWith('b!') ? 
            `${SPE_HOSTNAME}/personal/${containerId.substring(2)}` : 
            null,
          // Try with the drive directly
          `${SPE_HOSTNAME}/drives/${containerId}`
        ].filter(Boolean); // Remove null entries
        
        console.log('Attempting site URL discovery with formats:', possibleSiteUrls);
        console.log('Raw containerId being used:', containerId);
        
        // Try each URL format with detailed diagnostics
        for (const url of possibleSiteUrls) {
          try {
            console.log('Validating site URL:', url);
            
            // For the _api URLs, we make an actual fetch
            if (url.includes('_api')) {
              const response = await fetch(url, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
                }
              });
              
              console.log('API validation response status:', response.status);
              
              if (response.ok) {
                const data = await response.json();
                console.log('Site data received:', data);
                
                // If we got webUrl from the response, use it directly
                if (data.webUrl) {
                  setSiteUrl(data.webUrl);
                  setIsSiteUrlFetched(true);
                  console.log('Set site URL from API response:', data.webUrl);
                  return;
                }
              } else {
                const errorText = await response.text();
                console.warn('API validation failed with status:', response.status, errorText);
              }
            } else {
              // For potential direct URLs, set it and let the SDK try
              setSiteUrl(url);
              setIsSiteUrlFetched(true);
              console.log('Setting site URL to try:', url);
              return;
            }
          } catch (err) {
            console.warn('Failed validation attempt with URL format:', url, err);
          }
        }
        
        // If we get here, none of the formats worked
        console.warn('Could not validate any site URL format, using default format');
        // Fall back to the default format as last resort
        setSiteUrl(`${SPE_HOSTNAME}/contentstorage/CSP_${containerParts.contentId}`);
        setIsSiteUrlFetched(true);
      } catch (err) {
        console.error('Site URL validation failed:', err);
      }
    };
    
    fetchSiteUrl();
  }, [containerId, containerParts, getAccessToken]);

  // Effect to open the chat when the API is ready with enhanced error handling
  useEffect(() => {
    const openChat = async () => {
      if (!chatApi) {
        return;
      }
      
      setIsLoading(true);
      setError(null);
      setDetailedError(null);
      console.log('Attempting to open chat with API:', {
        containerId,
        siteUrl: siteUrl || (containerParts ? `${SPE_HOSTNAME}/contentstorage/CSP_${containerParts.contentId}` : 'undefined'),
        retryCount,
        timestamp: new Date().toISOString()
      });
      
      try {
        // Removed the addEventListener calls that caused TypeScript errors
        
        await chatApi.openChat();
        console.log('Chat opened successfully');
      } catch (error) {
        // Capture all error details for diagnosis
        const errorObj = error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          // Capture any additional properties on the error object
          ...Object.fromEntries(
            Object.getOwnPropertyNames(error)
              .filter(prop => prop !== 'name' && prop !== 'message' && prop !== 'stack')
              .map(prop => [prop, (error as any)[prop]])
          )
        } : error;
        
        console.error('Failed to open chat - detailed error:', errorObj);
        setDetailedError(errorObj);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Failed to open chat: ${errorMessage}`);
        
        // Check for specific error conditions
        if (errorMessage.includes('site URL') || errorMessage.includes('siteUrl')) {
          console.warn('Site URL related error detected, might need different URL format');
        }
        
        // Notify user about the error
        toast({
          title: "Copilot Chat Error",
          description: "Could not connect to Copilot Chat. See console for details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && chatApi) {
      openChat();
    }
  }, [chatApi, isOpen, containerId, retryCount, containerParts, siteUrl]);

  console.log('CopilotChat rendering with containerId:', containerId);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare size={16} />
          <span>Copilot Chat</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full p-0">
        <div className="flex-shrink-0 border-b px-6 py-4">
          <h2 className="text-lg font-semibold">SharePoint Embedded Copilot</h2>
          <p className="text-sm text-muted-foreground">Ask questions about your files and folders</p>
          
          {error && (
            <div className="mt-2 p-2 bg-red-50 text-red-800 rounded text-sm">
              <p className="font-medium">Error: {error}</p>
              
              {detailedError && (
                <div className="mt-2 overflow-auto max-h-40 text-xs p-2 bg-red-100 rounded">
                  <p className="font-mono whitespace-pre-wrap">
                    {typeof detailedError === 'object' 
                      ? JSON.stringify(detailedError, null, 2)
                      : String(detailedError)
                    }
                  </p>
                </div>
              )}
              
              <div className="mt-3 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry} 
                  className="flex-1">
                  Retry Connection
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {console.clear(); console.log('Console cleared for fresh diagnostics'); handleRetry();}}
                  className="flex-1">
                  Clear & Retry
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 min-h-0 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
          {isOpen && containerId && (
            <ChatEmbedded
              containerId={containerId}
              authProvider={authProvider}
              style={{ width: '100%', height: '100%' }}
              onApiReady={handleApiReady}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CopilotChat;
