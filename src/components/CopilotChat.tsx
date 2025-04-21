import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { sharePointService } from '../services/sharePointService';

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
  const [showExternalChatOption, setShowExternalChatOption] = useState(true);
  const [embeddedChatAttempted, setEmbeddedChatAttempted] = useState(false);

  useEffect(() => {
    if (!containerId) return;
    
    const fetchSiteInfo = async () => {
      try {
        setIsFetchingSiteInfo(true);
        const token = await getAccessToken();
        if (!token) return;
        
        console.log('Fetching site info for containerId:', containerId);
        const containerDetails = await sharePointService.getContainerDetails(token, containerId);
        
        console.log('Retrieved site info:', containerDetails);
        setSiteUrl(containerDetails.webUrl);
        setSiteName(containerDetails.name);
      } catch (err) {
        console.error('Error fetching site info:', err);
      } finally {
        setIsFetchingSiteInfo(false);
      }
    };
    
    fetchSiteInfo();
  }, [containerId, getAccessToken]);

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

  const authProvider: IChatEmbeddedApiAuthProvider = useMemo(
    () => ({
      hostname: sharePointHostname,
      getToken: async () => {
        try {
          setError(null);
          console.log('Getting SharePoint access token for Copilot Chat...');
          
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
      siteUrl: siteUrl || undefined,
    }),
    [getAccessToken, siteUrl, sharePointHostname]
  );

  const handleApiReady = useCallback((api: ChatEmbeddedAPI) => {
    console.log('Copilot Chat API ready, inspecting API properties:', {
      apiExists: !!api,
      apiMethods: Object.keys(api),
      timestamp: new Date().toISOString()
    });
    setChatApi(api);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setDetailedError(null);
    setRetryCount(prev => prev + 1);
    setEmbeddedChatAttempted(false);
    setShowExternalChatOption(false);
  }, []);

  const openChatInNewTab = useCallback(() => {
    if (siteUrl) {
      const chatUrl = `${siteUrl}/_layouts/15/copilotchat.aspx`;
      window.open(chatUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "Missing Site Information",
        description: "Unable to determine the SharePoint site URL for Copilot Chat.",
        variant: "destructive",
      });
    }
  }, [siteUrl]);

  useEffect(() => {
    const openChat = async () => {
      if (!chatApi || !siteUrl || embeddedChatAttempted) {
        return;
      }
      
      setIsLoading(true);
      setError(null);
      setDetailedError(null);
      setEmbeddedChatAttempted(true);
      
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
        setShowExternalChatOption(false);
      } catch (error) {
        const errorObj = error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
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
        
        setShowExternalChatOption(true);
        
        toast({
          title: "Copilot Chat Error",
          description: "Could not embed Copilot Chat. Using external option instead.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && chatApi && siteUrl && !embeddedChatAttempted) {
      openChat();
    }
  }, [chatApi, isOpen, containerId, retryCount, siteUrl, siteName, embeddedChatAttempted]);

  useEffect(() => {
    console.log('CopilotChat Component State:', {
      isOpen,
      containerId,
      siteUrl,
      chatApiReady: !!chatApi,
      showExternalChatOption,
      embeddedChatAttempted
    });
  }, [isOpen, containerId, siteUrl, chatApi, showExternalChatOption, embeddedChatAttempted]);

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
          
          {showExternalChatOption && (
            <div className="mt-3">
              <Button
                variant="outline"
                onClick={openChatInNewTab}
                className="w-full gap-2 mt-2"
              >
                <ExternalLink size={16} />
                Open Chat in New Tab
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Due to browser security restrictions, the chat needs to be opened in a separate tab.
              </p>
            </div>
          )}
          
          {error && !showExternalChatOption && (
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
          
          {isOpen && !showExternalChatOption && containerId && siteUrl && (
            <ChatEmbedded
              containerId={containerId}
              authProvider={authProvider}
              style={{ width: '100%', height: '100%' }}
              onApiReady={handleApiReady}
            />
          )}
          
          {isOpen && showExternalChatOption && (
            <div className="flex items-center justify-center h-full p-8 text-center">
              <div>
                <div className="bg-muted p-6 rounded-lg mb-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-lg font-medium">Chat in New Tab</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Due to browser security restrictions, the chat needs to be opened in a separate tab.
                  </p>
                </div>
                <Button
                  onClick={openChatInNewTab}
                  className="w-full gap-2"
                >
                  <ExternalLink size={16} />
                  Open Copilot Chat
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CopilotChat;
