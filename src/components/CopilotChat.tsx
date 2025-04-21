
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
  
  // Log when component mounts/unmounts and containerId info
  useEffect(() => {
    console.log('CopilotChat component mounted with containerId:', containerId);
    console.log('ContainerId type:', typeof containerId);
    console.log('ContainerId length:', containerId?.length);
    
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
      // When opening the chat, reset errors and refresh the component
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
    () => {
      // Ensure hostname has no trailing slash
      const cleanHostname = sharePointHostname ? sharePointHostname.replace(/\/+$/, '') : '';
      console.log('Clean SharePoint hostname for auth provider:', cleanHostname);
      
      return {
        hostname: cleanHostname,
        getToken: async () => {
          try {
            console.log('Getting token for hostname:', cleanHostname);
            const token = await getAccessToken(cleanHostname);
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
        siteUrl: siteUrl ? siteUrl.replace(/\/+$/, '') : undefined,
      };
    },
    [getAccessToken, siteUrl, sharePointHostname]
  );

  // Debug output when key components change
  useEffect(() => {
    if (isOpen) {
      console.log('Copilot Chat dependencies updated:', {
        containerId,
        siteUrl,
        siteName,
        isLoading,
        error,
        isMobileView,
        sharePointHostname,
        cleanHostname: sharePointHostname ? sharePointHostname.replace(/\/+$/, '') : '',
        chatKey
      });
    }
  }, [isOpen, containerId, siteUrl, siteName, isLoading, error, authProvider, isMobileView, sharePointHostname, chatKey]);

  const handleApiReady = useCallback((api: ChatEmbeddedAPI) => {
    console.log('Copilot Chat API ready');
    setChatApi(api);
    
    try {
      // Log API information for debugging
      console.log('Copilot API instance properties:', Object.keys(api));
      console.log('Copilot API type:', api.constructor?.name);
      
      // Check if the API has the expected methods
      if (typeof api.openChat === 'function') {
        console.log('openChat method is available');
        // Try to open the chat automatically
        api.openChat();
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
