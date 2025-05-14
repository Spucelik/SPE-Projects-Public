import React, { useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCopilotSite } from '@/hooks/useCopilotSite';
import CopilotDesktopView from './CopilotDesktopView';
import CopilotMobileView from './CopilotMobileView';
import { toast } from '@/hooks/use-toast';
import { appConfig } from '@/config/appConfig';
import { useAuth } from '@/context/AuthContext';
import { IChatEmbeddedApiAuthProvider, ChatEmbeddedAPI, ChatLaunchConfig } from '@microsoft/sharepointembedded-copilotchat-react';

interface CopilotChatContainerProps {
  containerId: string;
}

const CopilotChatContainer: React.FC<CopilotChatContainerProps> = ({ containerId }) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false); // Start with chat closed by default
  const { getSharePointToken, isAuthenticated } = useAuth();
  const [chatKey, setChatKey] = useState(0);
  
  // Early return if on login page or not authenticated
  if (window.location.pathname === '/login' || !isAuthenticated) {
    console.log('CopilotChatContainer not rendering: on login page or not authenticated');
    return null;
  }
  
  // Validate and normalize containerId
  const normalizedContainerId = containerId && typeof containerId === 'string' 
    ? (containerId.startsWith('b!') ? containerId : `b!${containerId}`)
    : '';
  
  // Don't proceed if we don't have a valid container ID
  if (!normalizedContainerId) {
    return (
      <div className="text-red-500 p-4 border border-red-300 rounded-md">
        Error: No valid containerId provided for Copilot Chat
      </div>
    );
  }
  
  const {
    isLoading,
    error,
    siteUrl,
    siteName,
    sharePointHostname,
  } = useCopilotSite(normalizedContainerId);
  
  // Ensure we have valid hostnames and site names
  const safeSharePointHostname = sharePointHostname || appConfig.sharePointHostname;
  const safeSiteName = siteName || 'SharePoint Site';
  
  const handleError = useCallback((errorMessage: string) => {
    console.error('Copilot chat error:', errorMessage);
    toast({
      title: "Copilot error",
      description: errorMessage,
      variant: "destructive",
    });
  }, []);
  
  // Create auth provider for Copilot chat with better error handling
  const authProvider = React.useMemo((): IChatEmbeddedApiAuthProvider => {
    return {
      hostname: safeSharePointHostname,
      getToken: async () => {
        try {
          if (!isAuthenticated) {
            console.error('User not authenticated, cannot get token');
            return '';
          }
          
          console.log('Getting SharePoint token for hostname:', safeSharePointHostname);
          const token = await getSharePointToken(safeSharePointHostname);
          console.log('SharePoint auth token retrieved:', token ? 'successfully' : 'failed');
          
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
  }, [safeSharePointHostname, getSharePointToken, handleError, isAuthenticated]);
  
  // Handles API ready event from ChatEmbedded component
  const handleApiReady = useCallback((api: ChatEmbeddedAPI) => {
    if (!api) {
      console.error('Chat API is undefined');
      handleError('Chat API initialization failed');
      return;
    }
    
    console.log('Copilot chat API is ready');
  }, [handleError]);
  
  // Create chat configuration - simplify to avoid potential undefined issues
  const chatConfig = React.useMemo((): ChatLaunchConfig => ({
    header: `SharePoint Embedded - ${safeSiteName}`,
    theme: {
      useDarkMode: false,
      customTheme: {
        themePrimary: '#4854EE',
        themeBackground: 'white'
      }
    },
    zeroQueryPrompts: {
      headerText: `Chat with content in ${safeSiteName}`,
      promptSuggestionList: [
        { suggestionText: 'Show me recent files' },
        { suggestionText: "What documents do I have access to?" }
      ]
    },
    instruction: "You are a helpful assistant that helps users find and summarize information related to their files and documents.",
    locale: "en-US",
  }), [safeSiteName]);

  // Reset chat when there's an issue
  const handleResetChat = useCallback(() => {
    console.log('Resetting Copilot chat');
    setChatKey(prev => prev + 1);
    setIsOpen(false);
    setTimeout(() => {
      setIsOpen(true);
    }, 500);
  }, []);

  return isMobile ? (
    <CopilotMobileView
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      siteName={safeSiteName}
      isLoading={isLoading}
      error={error}
      openExternalChat={null}
    />
  ) : (
    <CopilotDesktopView
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      siteName={safeSiteName}
      isLoading={isLoading}
      error={error}
      containerId={normalizedContainerId}
      onError={handleError}
      chatConfig={chatConfig}
      authProvider={authProvider}
      onApiReady={handleApiReady}
      chatKey={chatKey}
      onResetChat={handleResetChat}
      isAuthenticated={isAuthenticated}
    />
  );
};

export default CopilotChatContainer;
