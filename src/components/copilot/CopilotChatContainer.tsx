
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCopilotSite } from '@/hooks/useCopilotSite';
import CopilotDesktopView from './CopilotDesktopView';
import CopilotMobileView from './CopilotMobileView';
import { toast } from '@/hooks/use-toast';
import { appConfig } from '@/config/appConfig';
import { useAuth } from '@/context/AuthContext';
import { IChatEmbeddedApiAuthProvider, ChatEmbeddedAPI } from '@microsoft/sharepointembedded-copilotchat-react';

interface CopilotChatContainerProps {
  containerId: string;
}

const CopilotChatContainer: React.FC<CopilotChatContainerProps> = ({ containerId }) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { getSharePointToken } = useAuth();
  const [chatKey, setChatKey] = useState(0);
  const chatApiRef = useRef<ChatEmbeddedAPI | null>(null);
  
  // Ensure containerId is properly formatted
  const normalizedContainerId = containerId.startsWith('b!') 
    ? containerId 
    : `b!${containerId}`;
  
  console.log('CopilotChatContainer with containerId:', normalizedContainerId);
  
  const {
    isLoading,
    error,
    siteUrl,
    siteName,
    sharePointHostname,
  } = useCopilotSite(normalizedContainerId);
  
  // Log visibility of the component to help with debugging
  useEffect(() => {
    console.log('CopilotChatContainer render state:', {
      isOpen,
      isLoading,
      error: error || 'none',
      sharePointHostname: sharePointHostname || 'unknown',
      containerId: normalizedContainerId,
      hasChatApi: !!chatApiRef.current
    });
  }, [isOpen, isLoading, error, sharePointHostname, normalizedContainerId]);
  
  const handleError = (errorMessage: string) => {
    console.error('Copilot chat error:', errorMessage);
    toast({
      title: "Copilot error",
      description: errorMessage,
      variant: "destructive",
    });
  };
  
  // Create auth provider for Copilot chat with better error handling
  const createAuthProvider = useCallback((): IChatEmbeddedApiAuthProvider | null => {
    if (!sharePointHostname) {
      console.error('No SharePoint hostname available for auth provider');
      return null;
    }
    
    return {
      hostname: sharePointHostname,
      getToken: async () => {
        try {
          console.log('Getting SharePoint token for hostname:', sharePointHostname);
          const token = await getSharePointToken(sharePointHostname);
          console.log('SharePoint auth token retrieved for Copilot chat', token ? 'successfully' : 'failed');
          
          if (!token) {
            handleError('Failed to get authentication token for SharePoint.');
            return '';
          }
          
          return token;
        } catch (err) {
          console.error('Error getting token for Copilot chat:', err);
          handleError('Failed to authenticate with SharePoint. Please try again.');
          return '';
        }
      }
    };
  }, [sharePointHostname, getSharePointToken]);
  
  // Auth provider instance
  const authProvider = createAuthProvider();
  
  // Handles API ready event from ChatEmbedded component
  const handleApiReady = (api: ChatEmbeddedAPI) => {
    console.log('Copilot chat API is ready');
    chatApiRef.current = api;
  };
  
  // Reset chat when there's an issue
  const handleResetChat = () => {
    setChatKey(prev => prev + 1);
    
    // Close and reopen the chat panel
    setIsOpen(false);
    setTimeout(() => {
      setIsOpen(true);
    }, 500);
  };

  // Chat configuration object
  const chatConfig = {
    theme: appConfig.copilotTheme
  };

  return isMobile ? (
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
      containerId={normalizedContainerId}
      onError={handleError}
      chatConfig={chatConfig}
      authProvider={authProvider}
      onApiReady={handleApiReady}
      chatKey={chatKey}
      onResetChat={handleResetChat}
    />
  );
};

export default CopilotChatContainer;
