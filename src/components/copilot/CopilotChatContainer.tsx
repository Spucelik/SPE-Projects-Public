
import React, { useState } from 'react';
import { useMobile } from '@/hooks/use-mobile';
import { useCopilotSite } from '@/hooks/useCopilotSite';
import CopilotDesktopView from './CopilotDesktopView';
import CopilotMobileView from './CopilotMobileView';
import { toast } from '@/hooks/use-toast';
import { appConfig } from '@/config/appConfig';

interface CopilotChatContainerProps {
  containerId: string;
}

const CopilotChatContainer: React.FC<CopilotChatContainerProps> = ({ containerId }) => {
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  
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
  const getChatConfig = () => {
    const containerName = getContainerName();
    
    return {
      header: `Project Assistant - ${containerName}`,
      theme: appConfig.copilotTheme,
      zeroQueryPrompts: generatePrompts(),
      instruction: "You are a helpful project management assistant. Help users find information, summarize content, and gain insights from the documents in this project. Always provide references to the source documents when possible.",
      locale: "en",
    };
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
      siteUrl={siteUrl}
      sharePointHostname={sharePointHostname}
      containerId={normalizedContainerId}
      onError={handleError}
      chatConfig={getChatConfig()}
    />
  );
};

export default CopilotChatContainer;
