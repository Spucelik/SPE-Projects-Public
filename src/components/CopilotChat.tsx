
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

  // Auth provider for the SDK
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
            setError(noTokenError);
            throw new Error(noTokenError);
          }
          console.log('Access token obtained successfully');
          return token;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to get token';
          setError(errorMessage);
          console.error('Token acquisition failed:', errorMessage);
          throw err;
        }
      },
      // Use the determined site URL
      siteUrl: siteUrl || (containerParts ? `${SPE_HOSTNAME}/contentstorage/CSP_${containerParts.contentId}` : undefined),
    }),
    [getAccessToken, containerParts, siteUrl]
  );
  
  // Callback for API ready
  const handleApiReady = useCallback((api: ChatEmbeddedAPI) => {
    console.log('Copilot Chat API ready:', api);
    setChatApi(api);
  }, []);

  // Function to handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  // Try multiple site URL formats when container ID changes
  useEffect(() => {
    if (!containerId || !containerParts) return;
    
    const fetchSiteUrl = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        
        // Try multiple possible site URL formats
        const possibleSiteUrls = [
          `${SPE_HOSTNAME}/contentstorage/CSP_${containerParts.contentId}`,
          `${SPE_HOSTNAME}/sites/contentstorage_${containerParts.contentId}`,
          `${SPE_HOSTNAME}/_api/v2.1/drives/${containerId}/root`
        ];
        
        console.log('Trying possible site URLs:', possibleSiteUrls);
        
        // Try each URL format
        for (const url of possibleSiteUrls) {
          try {
            console.log('Trying to validate with URL:', url);
            // For the _api URLs, we make an actual fetch
            if (url.includes('_api')) {
              const response = await fetch(url, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
                }
              });
              
              if (response.ok) {
                console.log('URL validation successful with:', url);
                const data = await response.json();
                console.log('Site data:', data);
                
                // If we got webUrl from the response, use it directly
                if (data.webUrl) {
                  setSiteUrl(data.webUrl);
                  setIsSiteUrlFetched(true);
                  console.log('Set site URL from API response:', data.webUrl);
                  return;
                }
              }
            } else {
              // For potential direct URLs, set it and let the SDK try
              setSiteUrl(url);
              setIsSiteUrlFetched(true);
              console.log('Set site URL to try:', url);
              return;
            }
          } catch (err) {
            console.warn('Failed attempt with URL format:', url, err);
          }
        }
        
        // If we get here, none of the formats worked
        console.warn('Could not validate any site URL format');
      } catch (err) {
        console.warn('Site URL validation failed:', err);
      }
    };
    
    fetchSiteUrl();
  }, [containerId, containerParts, getAccessToken]);

  // Effect to open the chat when the API is ready
  useEffect(() => {
    const openChat = async () => {
      if (!chatApi) {
        return;
      }
      
      setIsLoading(true);
      setError(null);
      console.log('Attempting to open chat with API with containerId:', containerId);
      console.log('Using site URL:', siteUrl || (containerParts ? `${SPE_HOSTNAME}/contentstorage/CSP_${containerParts.contentId}` : 'undefined'));
      
      try {
        await chatApi.openChat();
        console.log('Chat opened successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Failed to open chat: ${errorMessage}`);
        console.error('Failed to open chat details:', error);
        
        // Notify user about the error
        toast({
          title: "Copilot Chat Error",
          description: "Could not connect to Copilot Chat. Please try again later.",
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
              <p>{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry} 
                className="mt-2">
                Retry Connection
              </Button>
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
