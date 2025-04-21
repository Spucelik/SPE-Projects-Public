
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ChatEmbeddedAPI } from '@microsoft/sharepointembedded-copilotchat-react';
import { useCopilotSite } from '../hooks/useCopilotSite';
import CopilotMobileView from './copilot/CopilotMobileView';
import CopilotDesktopView from './copilot/CopilotDesktopView';
import { Button } from '@/components/ui/button';
import { MessageSquare, ExternalLink } from 'lucide-react';

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
  const [useExternalChatOnly, setUseExternalChatOnly] = useState(false);
  
  // Log when component mounts/unmounts and containerId info
  useEffect(() => {
    console.log('CopilotChat component mounted with containerId:', containerId);
    
    // Check if we've previously encountered CSP errors and prefer external chat
    const preferExternal = localStorage.getItem('preferExternalCopilotChat');
    if (preferExternal === 'true') {
      console.log('Using external chat due to previous CSP issues');
      setUseExternalChatOnly(true);
    }
    
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
    if (isOpen && !useExternalChatOnly) {
      // When opening the chat, reset errors and refresh the component
      console.log('Chat opened - resetting error state and refreshing');
      setCopilotError(null);
      setChatKey(prev => prev + 1);
    }
  }, [isOpen, useExternalChatOnly]);

  // Handle CSP errors by switching to external chat
  useEffect(() => {
    const handleCspError = (event: ErrorEvent) => {
      if (
        event.message.includes('Content Security Policy') ||
        event.message.includes('frame-ancestors') ||
        event.message.includes('SecurityError')
      ) {
        console.error('CSP error detected, switching to external chat:', event.message);
        setUseExternalChatOnly(true);
        localStorage.setItem('preferExternalCopilotChat', 'true');
        
        if (isOpen) {
          toast({
            title: "Chat Display Issue",
            description: "Opening chat in a new window for better compatibility",
            variant: "default",
          });
          openExternalChat();
        }
      }
    };
    
    window.addEventListener('error', handleCspError);
    return () => window.removeEventListener('error', handleCspError);
  }, [isOpen, siteUrl]);

  const openExternalChat = useCallback(() => {
    if (!siteUrl) {
      toast({
        title: "Cannot open Copilot Chat",
        description: "Site URL is not available",
        variant: "destructive",
      });
      return;
    }
    
    // Extract only the hostname and protocol from the siteUrl
    let chatUrl;
    try {
      const url = new URL(siteUrl);
      chatUrl = `${url.protocol}//${url.hostname}/_layouts/15/CopilotGallery.aspx`;
    } catch (e) {
      // If URL parsing fails, use the original siteUrl
      const baseUrl = siteUrl.replace(/\/+$/, '');
      chatUrl = `${baseUrl}/_layouts/15/CopilotGallery.aspx`;
    }
    
    console.log('Opening external Copilot Chat at:', chatUrl);
    window.open(chatUrl, '_blank', 'noopener,noreferrer');
    
    // Close the internal chat panel if it's open
    setIsOpen(false);
  }, [siteUrl]);

  // Updated auth provider with CSP compatible settings
  const authProvider = useMemo(() => {
    if (!sharePointHostname) {
      console.log('SharePoint hostname not available');
      return null;
    }
    
    // Ensure all URLs have no trailing slashes
    const hostname = sharePointHostname.replace(/\/+$/, '');
    const cleanSiteUrl = siteUrl ? siteUrl.replace(/\/+$/, '') : undefined;
    
    console.log('Configuring auth provider with:', {
      hostname,
      siteUrl: cleanSiteUrl
    });
    
    try {
      // Make sure the hostname is a valid URL
      new URL(hostname);
      
      return {
        hostname,
        getToken: async () => {
          try {
            console.log('Getting token for hostname:', hostname);
            // Use the explicit hostname without any path
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
        authProvider,
        chatKey,
        useExternalChatOnly
      });
    }
  }, [isOpen, containerId, siteUrl, siteName, isLoading, error, authProvider, isMobileView, sharePointHostname, chatKey, useExternalChatOnly]);

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

  // If auth provider is null or we're using external chat only, show external chat option
  if (!authProvider || useExternalChatOnly) {
    return (
      <Button 
        variant="outline" 
        className="gap-2"
        onClick={openExternalChat}
      >
        <ExternalLink size={16} />
        <span>Open Copilot Chat</span>
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
