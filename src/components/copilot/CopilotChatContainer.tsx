
import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const { getSharePointToken, isAuthenticated } = useAuth();
  const [chatKey, setChatKey] = useState(0);
  const chatApiRef = useRef<ChatEmbeddedAPI | null>(null);
  
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
  const createAuthProvider = useCallback((): IChatEmbeddedApiAuthProvider => {
    return {
      hostname: safeSharePointHostname,
      getToken: async () => {
        try {
          // Early return if user is not authenticated
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
  
  // Auth provider instance - memoize to prevent re-creation
  const authProvider = React.useMemo(() => createAuthProvider(), 
    [createAuthProvider]);
  
  // Handles API ready event from ChatEmbedded component with deduplication
  const handleApiReady = useCallback((api: ChatEmbeddedAPI) => {
    if (!api) {
      console.error('Chat API is undefined');
      handleError('Chat API initialization failed');
      return;
    }
    
    // Only set if different to avoid re-renders
    if (chatApiRef.current !== api) {
      console.log('Copilot chat API is ready - new instance');
      chatApiRef.current = api;
    } else {
      console.log('Copilot chat API is ready - same instance, skipping update');
    }
  }, [handleError]);
  
  // Create chat configuration with proper null checks for all properties
  const chatConfig = React.useMemo(() => ({
    header: `SharePoint Embedded - ${safeSiteName}`,
    theme: appConfig.copilotTheme || {
      useDarkMode: false,
      customTheme: {
        themePrimary: '#4854EE',
        themeBackground: 'white',
      }
    },
    zeroQueryPrompts: {
      headerText: `Chat with content in ${safeSiteName}`,
      promptSuggestionList: [
        {
          suggestionText: 'Show me recent files',
        },
        {
          suggestionText: "Summarize the main topics in my documents",
        },
        {
          suggestionText: "What kind of files do I have?",
        },
        {
          suggestionText: "Help me find documents related to planning",
        }
      ]
    },
    instruction: "You are a helpful assistant that helps users find and summarize information related to their files and documents. Make sure you include references to the documents data comes from when possible.",
    locale: "en-US", // Be explicit about locale
  }), [safeSiteName]);

  // Reset chat when there's an issue
  const handleResetChat = useCallback(() => {
    console.log('Resetting Copilot chat');
    chatApiRef.current = null;
    setChatKey(prev => prev + 1);
    
    // Close and reopen the chat panel
    setIsOpen(false);
    setTimeout(() => {
      setIsOpen(true);
    }, 800); // Slightly longer delay to ensure proper cleanup
  }, []);

  // Add effect to detect when chat should be refreshed
  useEffect(() => {
    if (isOpen && chatKey > 1) {
      console.log('Chat reopened after reset with new key:', chatKey);
    }
  }, [isOpen, chatKey]);

  // Early return if user is not authenticated 
  if (!isAuthenticated) {
    return null;
  }

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
