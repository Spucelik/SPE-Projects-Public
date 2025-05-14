
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
  const chatInitializedRef = useRef<boolean>(false);
  
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
  
  useEffect(() => {
    if (isOpen && sharePointHostname) {
      console.log('Copilot chat opened with hostname:', sharePointHostname);
      // Reset initialization flag whenever chat is reopened
      chatInitializedRef.current = false;
    }
  }, [isOpen, sharePointHostname]);
  
  const handleError = useCallback((errorMessage: string) => {
    console.error('Copilot chat error:', errorMessage);
    toast({
      title: "Copilot error",
      description: errorMessage,
      variant: "destructive",
    });
  }, []);
  
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
  }, [sharePointHostname, getSharePointToken, handleError]);
  
  // Auth provider instance
  const authProvider = createAuthProvider();
  
  // Handles API ready event from ChatEmbedded component
  const handleApiReady = useCallback((api: ChatEmbeddedAPI) => {
    console.log('Copilot chat API is ready');
    chatApiRef.current = api;
    
    // Log available API methods for debugging
    try {
      console.log('Available API methods:', 
        Object.keys(api).filter(key => typeof (api as any)[key] === 'function')
      );
    } catch (e) {
      console.error('Could not log API methods:', e);
    }
    
    // Force a re-render to ensure initialization can proceed
    setChatKey(prevKey => prevKey + 1);
  }, []);
  
  // Create chat configuration
  const chatConfig: ChatLaunchConfig = {
    header: siteName ? `SharePoint Embedded - ${siteName}` : 'SharePoint Embedded',
    theme: appConfig.copilotTheme || {
      useDarkMode: false,
      customTheme: {
        themePrimary: '#4854EE',
        themeBackground: 'white',
      }
    },
    zeroQueryPrompts: {
      headerText: `Chat with content in ${siteName || 'your files'}`,
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
  
  // Initialize chat when API is ready and chat is open
  useEffect(() => {
    const initChat = async () => {
      // Only proceed if not already initialized for this session
      if (chatInitializedRef.current) {
        console.log('Chat already initialized, skipping...');
        return;
      }
      
      if (chatApiRef.current && isOpen && sharePointHostname) {
        try {
          console.log('Initializing chat with config:', chatConfig);
          chatInitializedRef.current = true;
          await chatApiRef.current.openChat(chatConfig);
          console.log('Chat initialized successfully');
        } catch (err) {
          console.error('Failed to initialize chat:', err);
          chatInitializedRef.current = false; // Reset flag to allow retrying
          handleError('Failed to initialize chat: ' + (err instanceof Error ? err.message : String(err)));
        }
      }
    };
    
    if (isOpen && chatApiRef.current && !chatInitializedRef.current) {
      console.log('Preparing to initialize chat...');
      // Use a slightly longer delay to ensure DOM is fully ready
      const timer = setTimeout(() => {
        console.log('Delayed chat initialization starting...');
        initChat();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen, sharePointHostname, chatKey, handleError, chatConfig]);

  // Reset chat when there's an issue
  const handleResetChat = useCallback(() => {
    console.log('Resetting Copilot chat');
    chatInitializedRef.current = false; // Reset initialization flag
    setChatKey(prev => prev + 1);
    
    // Close and reopen the chat panel
    setIsOpen(false);
    setTimeout(() => {
      setIsOpen(true);
    }, 500);
  }, []);

  // Log critical information for debugging
  useEffect(() => {
    if (isOpen) {
      console.log('Copilot debug info:', {
        containerId: normalizedContainerId,
        siteName,
        sharePointHostname,
        isAuthProviderSet: !!authProvider,
        chatApiInitialized: !!chatApiRef.current,
        chatOpen: isOpen,
        chatKey
      });
    }
  }, [isOpen, normalizedContainerId, siteName, sharePointHostname, authProvider, chatKey]);

  // Log container ID on mount
  useEffect(() => {
    console.log('CopilotChatContainer mounted with containerId:', normalizedContainerId);
  }, [normalizedContainerId]);

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
