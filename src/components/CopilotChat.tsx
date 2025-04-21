import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ChatEmbeddedAPI } from '@microsoft/sharepointembedded-copilotchat-react';
import { useCopilotSite } from '../hooks/useCopilotSite';
import CopilotMobileView from './copilot/CopilotMobileView';
import CopilotDesktopView from './copilot/CopilotDesktopView';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface CopilotChatProps {
  containerId: string;
}

const CopilotChat: React.FC<CopilotChatProps> = ({ containerId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getAccessToken } = useAuth();
  const [chatApi, setChatApi] = useState<ChatEmbeddedAPI | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [copilotError, setCopilotError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('CopilotChat component mounted with containerId:', containerId);
    
    return () => {
      console.log('CopilotChat component unmounting');
    };
  }, [containerId]);
  
  const {
    isLoading,
    error: siteError,
    siteUrl,
    siteName,
    sharePointHostname,
  } = useCopilotSite(containerId);

  const error = copilotError || siteError;

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

  useEffect(() => {
    if (isOpen) {
      console.log('Chat opened - resetting error state and refreshing');
      setCopilotError(null);
      setChatKey(prev => prev + 1);
    }
  }, [isOpen]);

  const openExternalChat = useCallback(() => {
    if (!siteUrl) {
      toast({
        title: "Cannot open Copilot Chat",
        description: "Site URL is not available",
        variant: "destructive",
      });
      return;
    }
    
    const baseUrl = siteUrl.replace(/\/+$/, '');
    const chatUrl = `${baseUrl}/_layouts/15/CopilotGallery.aspx`;
    
    console.log('Opening external Copilot Chat at:', chatUrl);
    window.open(chatUrl, '_blank');
  }, [siteUrl]);

  const authProvider = useMemo(
    () => ({
      hostname: sharePointHostname,
      getToken: async () => {
        try {
          const token = await getAccessToken(sharePointHostname);
          if (!token) throw new Error('No access token available');
          return token;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to get token';
          console.error('Auth provider error:', errorMessage);
          setCopilotError(errorMessage);
          throw err;
        }
      },
      siteUrl: siteUrl || undefined,
    }),
    [getAccessToken, siteUrl, sharePointHostname]
  );

  useEffect(() => {
    if (isOpen) {
      console.log('Copilot Chat dependencies updated:', {
        containerId,
        siteUrl,
        siteName,
        isLoading,
        error,
        authProvider,
        isMobileView,
        sharePointHostname,
        chatKey
      });
    }
  }, [isOpen, containerId, siteUrl, siteName, isLoading, error, authProvider, isMobileView, sharePointHostname, chatKey]);

  const handleApiReady = useCallback((api: ChatEmbeddedAPI) => {
    console.log('Copilot Chat API ready');
    setChatApi(api);
    
    try {
      console.log('Copilot API instance:', api);
    } catch (err) {
      console.error('Error with Copilot API:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown Copilot error';
      setCopilotError(errorMessage);
      toast({
        title: "Copilot Chat Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, []);

  if (containerId && containerId.length < 10) {
    return (
      <Button 
        variant="outline" 
        className="gap-2 opacity-50 cursor-not-allowed"
        disabled
      >
        <MessageSquare size={16} />
        <span>Copilot Unavailable</span>
      </Button>
    );
  }

  return isMobileView ? (
    <CopilotMobileView
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      siteName={siteName}
      isLoading={isLoading}
      error={error}
      openExternalChat={openExternalChat}
    />
  ) : (
    <CopilotDesktopView
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      siteName={siteName}
      isLoading={isLoading}
      error={error}
      openExternalChat={openExternalChat}
      containerId={containerId}
      authProvider={authProvider}
      onApiReady={handleApiReady}
      chatKey={chatKey}
    />
  );
};

export default CopilotChat;
