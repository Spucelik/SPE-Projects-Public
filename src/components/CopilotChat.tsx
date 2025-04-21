
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ChatEmbeddedAPI } from '@microsoft/sharepointembedded-copilotchat-react';
import { useCopilotSite } from '../hooks/useCopilotSite';
import CopilotMobileView from './copilot/CopilotMobileView';
import CopilotDesktopView from './copilot/CopilotDesktopView';
import { MessageSquare } from 'lucide-react';
import { Button } from './ui/button';

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
  
  // Log when component mounts/unmounts and containerId info
  useEffect(() => {
    console.log('CopilotChat component mounted with containerId:', containerId);
    return () => console.log('CopilotChat component unmounting');
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
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // When opening the chat, reset errors and refresh the component
      console.log('Chat opened - resetting error state and refreshing');
      setCopilotError(null);
      setChatKey(prev => prev + 1);
    }
  }, [isOpen]);

  const authProvider = useMemo(() => {
    if (!sharePointHostname) {
      console.log('SharePoint hostname not available');
      return null;
    }
    
    const hostname = sharePointHostname.replace(/\/+$/, '');
    const cleanSiteUrl = siteUrl ? siteUrl.replace(/\/+$/, '') : undefined;
    
    console.log('Configuring auth provider with:', { hostname, siteUrl: cleanSiteUrl });
    
    try {
      new URL(hostname);
      return {
        hostname,
        getToken: async () => {
          try {
            console.log('Getting token for hostname:', hostname);
            const token = await getAccessToken(hostname);
            console.log('Token acquired successfully:', token ? 'Valid token' : 'No token');
            if (!token) throw new Error('No access token available');
            return token;
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get token';
            console.error('Auth provider error:', errorMessage);
            setCopilotError(errorMessage);
            throw err;
          }
        },
        siteUrl: cleanSiteUrl
      };
    } catch (err) {
      console.error('Invalid hostname format:', err);
      setCopilotError('Invalid SharePoint hostname');
      return null;
    }
  }, [getAccessToken, siteUrl, sharePointHostname]);

  const handleApiReady = useCallback((api: ChatEmbeddedAPI) => {
    console.log('Copilot Chat API ready');
    setChatApi(api);
    
    try {
      if (typeof api.openChat === 'function') {
        console.log('openChat method is available');
        setTimeout(() => {
          try {
            api.openChat();
            console.log('Chat opened automatically');
          } catch (e) {
            console.error('Error auto-opening chat:', e);
          }
        }, 500);
      }
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

  // If container ID is invalid or too short, show disabled button
  if (!containerId || containerId.length < 10) {
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

  // If auth provider is null, show error state
  if (!authProvider) {
    return (
      <Button 
        variant="outline" 
        className="gap-2"
        disabled
      >
        <MessageSquare size={16} />
        <span>Authentication Error</span>
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
      openExternalChat={null}
    />
  ) : (
    <CopilotDesktopView
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      siteName={siteName}
      isLoading={isLoading}
      error={error}
      openExternalChat={null}
      containerId={containerId}
      authProvider={authProvider}
      onApiReady={handleApiReady}
      chatKey={chatKey}
    />
  );
};

export default CopilotChat;
