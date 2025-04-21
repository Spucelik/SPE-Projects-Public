
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
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';

interface CopilotChatProps {
  containerId: string;
}

const CopilotChat: React.FC<CopilotChatProps> = ({ containerId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getAccessToken } = useAuth();
  const [chatApi, setChatApi] = useState<ChatEmbeddedAPI | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [chatKey, setChatKey] = useState(0); // Add key to force re-render

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Reset error state when opening/closing the chat
  useEffect(() => {
    if (isOpen) {
      setError(null);
      // Force re-render of ChatEmbedded when opening
      setChatKey(prev => prev + 1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!containerId) return;
    
    const fetchSiteInfo = async () => {
      try {
        setIsLoading(true);
        const token = await getAccessToken();
        if (!token) {
          setError('Authentication token not available');
          setIsLoading(false);
          return;
        }
        
        const containerDetails = await sharePointService.getContainerDetails(token, containerId);
        console.log('Container details retrieved:', containerDetails);
        setSiteUrl(containerDetails.webUrl);
        setSiteName(containerDetails.name);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching site info:', err);
        setIsLoading(false);
        setError('Failed to load site information');
      }
    };
    
    fetchSiteInfo();
  }, [containerId, getAccessToken]);

  // Open external chat in a new window
  const openExternalChat = useCallback(() => {
    if (!siteUrl) {
      toast({
        title: "Cannot open Copilot Chat",
        description: "Site URL is not available",
        variant: "destructive",
      });
      return;
    }
    
    const chatUrl = `${siteUrl}/_layouts/15/CopilotGallery.aspx`;
    window.open(chatUrl, '_blank');
  }, [siteUrl]);

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
          const token = await getAccessToken(sharePointHostname);
          if (!token) throw new Error('No access token available');
          return token;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to get token';
          setError(errorMessage);
          throw err;
        }
      },
      siteUrl: siteUrl || undefined,
    }),
    [getAccessToken, siteUrl, sharePointHostname]
  );

  const handleApiReady = useCallback((api: ChatEmbeddedAPI) => {
    console.log('Copilot Chat API ready');
    setChatApi(api);
  }, []);

  // Error handler for ChatEmbedded component
  const handleChatError = useCallback((err: any) => {
    console.error('Embedded chat error:', err);
    setError(err.message || 'Failed to load embedded chat');
  }, []);

  const renderMobileView = () => (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare size={16} />
          <span>Copilot Chat</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="flex flex-col h-96">
        <div className="flex-shrink-0 border-b px-6 py-4">
          <h2 className="text-lg font-semibold">SharePoint Embedded Copilot</h2>
          {siteName && <p className="text-sm text-muted-foreground">Connected to: {siteName}</p>}
        </div>
        <div className="flex-1 min-h-0 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-destructive text-center p-4">
              <p>Could not load Copilot Chat: {error}</p>
              <Button 
                variant="outline" 
                className="mt-4 gap-2"
                onClick={openExternalChat}
              >
                <ExternalLink size={16} />
                Open in new tab
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p>Copilot Chat works best in a new tab on mobile devices.</p>
              <Button 
                variant="outline" 
                className="mt-4 gap-2"
                onClick={openExternalChat}
              >
                <ExternalLink size={16} />
                Open Copilot Chat
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );

  const renderDesktopView = () => (
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
        </div>
        <div className="flex-1 min-h-0 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-background/80 z-10">
              <p className="text-destructive mb-4">Failed to load embedded chat: {error}</p>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={openExternalChat}
              >
                <ExternalLink size={16} />
                Open in new tab
              </Button>
            </div>
          )}
          
          {isOpen && containerId && siteUrl && !error && (
            <div className="h-full w-full" key={chatKey}>
              <ChatEmbedded
                containerId={containerId}
                authProvider={authProvider}
                style={{ width: '100%', height: '100%' }}
                onApiReady={handleApiReady}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return isMobileView ? renderMobileView() : renderDesktopView();
};

export default CopilotChat;
