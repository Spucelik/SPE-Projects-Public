
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ChatEmbeddedAPI } from '@microsoft/sharepointembedded-copilotchat-react';
import { useCopilotSite } from '../hooks/useCopilotSite';
import CopilotMobileView from './copilot/CopilotMobileView';
import CopilotDesktopView from './copilot/CopilotDesktopView';

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
  
  // Log the containerId for debugging
  console.log('CopilotChat received containerId:', containerId);
  
  // Use the useCopilotSite hook
  const {
    isLoading,
    error: siteError,
    siteUrl,
    siteName,
    sharePointHostname,
  } = useCopilotSite(containerId);

  // Combine errors
  const error = copilotError || siteError;

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

  // Reset error state and force re-render when opening chat
  useEffect(() => {
    if (isOpen) {
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
    
    // Make sure we're using a clean URL without trailing slashes for the external chat
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

  // Debug output
  useEffect(() => {
    if (isOpen) {
      console.log('Copilot Chat rendering with:', {
        containerId,
        siteUrl,
        siteName,
        isLoading,
        error,
        authProvider,
        isMobileView,
        sharePointHostname
      });
    }
  }, [isOpen, containerId, siteUrl, siteName, isLoading, error, authProvider, isMobileView, sharePointHostname]);

  const handleApiReady = useCallback((api: ChatEmbeddedAPI) => {
    console.log('Copilot Chat API ready');
    setChatApi(api);
  }, []);

  // Handle API errors
  const handleChatError = useCallback((error: Error) => {
    console.error('Copilot Chat error:', error);
    setCopilotError(error.message);
    toast({
      title: "Copilot Chat Error",
      description: error.message,
      variant: "destructive",
    });
  }, []);

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
