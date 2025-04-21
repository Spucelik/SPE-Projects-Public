
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
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
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);

  useEffect(() => {
    if (!containerId) return;
    
    const fetchSiteInfo = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        
        const containerDetails = await sharePointService.getContainerDetails(token, containerId);
        setSiteUrl(containerDetails.webUrl);
        setSiteName(containerDetails.name);
      } catch (err) {
        console.error('Error fetching site info:', err);
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
