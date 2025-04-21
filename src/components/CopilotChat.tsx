import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { sharePointService } from '../services/sharePointService';

// Import correct exports from the SDK
import {
  ChatEmbedded,
  ChatEmbeddedAPI,
  IChatEmbeddedApiAuthProvider,
} from '@microsoft/sharepointembedded-copilotchat-react';

interface CopilotChatProps {
  containerId: string;
}

const CopilotChat: React.FC<CopilotChatProps> = ({ containerId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getAccessToken } = useAuth();
  const [chatApi, setChatApi] = useState<ChatEmbeddedAPI | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<any | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [isFetchingSiteInfo, setIsFetchingSiteInfo] = useState(false);

  // Effect to fetch correct site URL when container ID changes
  useEffect(() => {
    if (!containerId) return;
    
    const fetchSiteInfo = async () => {
      try {
        setIsFetchingSiteInfo(true);
        // Use Graph API token for this call
        const token = await getAccessToken();
        if (!token) return;
        
        // Use the service method to get container details
        console.log('Fetching site info for containerId:', containerId);
        const containerDetails = await sharePointService.getContainerDetails(token, containerId);
        
        console.log('Retrieved site info:', containerDetails);
        setSiteUrl(containerDetails.webUrl);
        setSiteName(containerDetails.name);
      } catch (err) {
        console.error('Error fetching site info:', err);
        // Don't set error state here as we might still be able to proceed with default values
      } finally {
        setIsFetchingSiteInfo(false);
      }
    };
    
    fetchSiteInfo();
  }, [containerId, getAccessToken]);

  // Get the SharePoint hostname from the site URL
  const sharePointHostname = useMemo(() => {
    if (siteUrl) {
      try {
        const url = new URL(siteUrl);
        return `${url.protocol}//${url.hostname}`;
      } catch (e) {
        console.error('Error parsing site URL:', e);
      }
    }
    return "https://pucelikenterprise.sharepoint.com";
  }, [siteUrl]);

  // Auth provider for the SDK
  const authProvider: IChatEmbeddedApiAuthProvider = useMemo(
    () => ({
      hostname: sharePointHostname,
      getToken: async () => {
        try {
          setError(null);
          console.log('Getting SharePoint access token for Copilot Chat...');
          
          // Request token specifically for SharePoint
          const token = await getAccessToken(sharePointHostname);
          
          if (!token) {
            const noTokenError = 'No access token available for Copilot Chat';
            console.error(noTokenError);
            setError(noTokenError);
            throw new Error(noTokenError);
          }
          
          console.log('SharePoint access token obtained successfully', {
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
      // Use the fetched site URL
      siteUrl: siteUrl || undefined,
    }),
    [getAccessToken, siteUrl, sharePointHostname]
  );
  
  // Callback for API ready
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

  // Effect to open the chat when the API is ready
  useEffect(() => {
    const openChat = async () => {
      if (!chatApi || !siteUrl) {
        return;
      }
      
      setIsLoading(true);
      setError(null);
      setDetailedError(null);
      console.log('Attempting to open chat with API:', {
        containerId,
        siteUrl,
        siteName,
        retryCount,
        timestamp: new Date().toISOString()
      });
      
      try {
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

    if (isOpen && chatApi && siteUrl) {
      openChat();
    }
  }, [chatApi, isOpen, containerId, retryCount, siteUrl, siteName]);

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
          {siteName && <p className="text-sm text-muted-foreground">Connected to: {siteName}</p>}
          <p className="text-sm text-muted-foreground">Ask questions about your files and folders</p>
          
          {isFetchingSiteInfo && (
            <div className="mt-2 p-2 bg-blue-50 text-blue-800 rounded text-sm">
              <p>Getting site information...</p>
              <div className="mt-2 w-full h-1 bg-blue-100 overflow-hidden">
                <div className="h-full bg-blue-400 animate-pulse"></div>
              </div>
            </div>
          )}
          
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
          {isOpen && containerId && siteUrl && (
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
