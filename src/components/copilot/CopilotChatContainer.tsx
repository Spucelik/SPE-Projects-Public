
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
  const { getSharePointToken } = useAuth();
  const [chatKey, setChatKey] = useState(0);
  const chatApiRef = useRef<ChatEmbeddedAPI | null>(null);
  
  // Validate and normalize containerId
  const normalizedContainerId = containerId && typeof containerId === 'string' 
    ? (containerId.startsWith('b!') ? containerId : `b!${containerId}`)
    : '';
  
  console.log('CopilotChatContainer rendering with containerId:', normalizedContainerId || 'MISSING');
  
  const {
    isLoading,
    error,
    siteUrl,
    siteName,
    sharePointHostname,
  } = useCopilotSite(normalizedContainerId);
  
  const safeSharePointHostname = sharePointHostname || appConfig.sharePointHostname;
  const safeSiteName = siteName || 'SharePoint Site';
  
  useEffect(() => {
    if (isOpen) {
      console.log('Copilot chat opened with hostname:', safeSharePointHostname);
      console.log('Copilot chat opened with siteName:', safeSiteName);
      console.log('Copilot chat opened with siteUrl:', siteUrl || 'Not available');
      console.log('Chat API reference:', chatApiRef.current ? 'Available' : 'Not available');
    }
  }, [isOpen, safeSharePointHostname, safeSiteName, siteUrl]);
  
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
  }, [safeSharePointHostname, getSharePointToken, handleError]);
  
  // Auth provider instance
  const authProvider = createAuthProvider();
  
  // Handles API ready event from ChatEmbedded component
  const handleApiReady = useCallback((api: ChatEmbeddedAPI) => {
    console.log('Copilot chat API is ready');
    chatApiRef.current = api;
  }, []);
  
  // Create chat configuration with proper null checks for all properties
  const chatConfig: ChatLaunchConfig = {
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
    locale: "en",
  };

  // Reset chat when there's an issue
  const handleResetChat = useCallback(() => {
    console.log('Resetting Copilot chat');
    chatApiRef.current = null;
    setChatKey(prev => prev + 1);
    
    // Close and reopen the chat panel
    setIsOpen(false);
    setTimeout(() => {
      setIsOpen(true);
    }, 500);
  }, []);

  // Validate containerId before rendering chat components
  if (!normalizedContainerId) {
    console.error('No valid containerId provided to CopilotChatContainer');
    return (
      <div className="text-red-500 p-4 border border-red-300 rounded-md">
        Error: No valid containerId provided for Copilot Chat
      </div>
    );
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
    />
  );
};

export default CopilotChatContainer;
