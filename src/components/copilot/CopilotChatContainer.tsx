import React, { useState, useCallback, useRef } from 'react';
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
  const { getAccessToken } = useAuth();
  const [chatKey, setChatKey] = useState(0);
  const chatApiRef = useRef<ChatEmbeddedAPI | null>(null);
  
  // Parse containerId to ensure consistent format
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
  
  const handleError = (errorMessage: string) => {
    console.error('Copilot chat error:', errorMessage);
    toast({
      title: "Copilot error",
      description: errorMessage,
      variant: "destructive",
    });
  };
  
  const getContainerName = () => {
    return siteName || 'SharePoint Container';
  };
  
  // Create auth provider for Copilot chat using standard Graph token
  const createAuthProvider = useCallback((): IChatEmbeddedApiAuthProvider | null => {
    if (!sharePointHostname) return null;
    
    return {
      hostname: sharePointHostname,
      getToken: async () => {
        try {
          const token = await getAccessToken();
          console.log('Auth token retrieved for Copilot chat', token ? 'successfully' : 'failed');
          return token || '';
        } catch (err) {
          console.error('Error getting token for Copilot chat:', err);
          handleError('Failed to authenticate. Please try again.');
          return '';
        }
      }
    };
  }, [sharePointHostname, getAccessToken]);
  
  // Auth provider instance
  const authProvider = createAuthProvider();
  
  // Handles API ready event from ChatEmbedded component
  const handleApiReady = (api: ChatEmbeddedAPI) => {
    console.log('Copilot chat API is ready');
    chatApiRef.current = api;
    
    // Configure chat if we have settings
    if (api && chatConfig) {
      try {
        console.log('Applying chat configuration:', chatConfig);
        // The updateChatConfig method doesn't exist, so we need to use the correct method
        // or simply apply configuration through props instead
        console.log('Chat configuration will be applied through props instead');
      } catch (err) {
        console.error('Error configuring chat:', err);
      }
    }
  };
  
  // Generate dynamic prompts based on container name
  const generatePrompts = () => {
    const containerName = getContainerName();
    
    return {
      headerText: `Chat with content in ${containerName}`,
      promptSuggestionList: [
        {
          suggestionText: 'Show me recent files',
        },
        {
          suggestionText: 'Summarize the content in this container',
        },
        {
          suggestionText: 'What are the key milestones in this project?',
        },
        {
          suggestionText: 'Generate a status report based on these files',
        },
      ]
    };
  };
  
  // Generate chat configuration
  const getChatConfig = useCallback(() => {
    const containerName = getContainerName();
    
    return {
      header: `Project Assistant - ${containerName}`,
      theme: appConfig.copilotTheme,
      zeroQueryPrompts: generatePrompts(),
      instruction: "You are a helpful project management assistant. Help users find information, summarize content, and gain insights from the documents in this project. Always provide references to the source documents when possible.",
      locale: "en",
    };
  }, [siteName]);
  
  // Chat configuration
  const chatConfig = getChatConfig();
  
  // Reset chat when there's an issue
  const handleResetChat = () => {
    setChatKey(prev => prev + 1);
    
    // Close and reopen the chat panel
    setIsOpen(false);
    setTimeout(() => {
      setIsOpen(true);
    }, 500);
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
