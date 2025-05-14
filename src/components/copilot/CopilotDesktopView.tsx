
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { ChatEmbedded, ChatEmbeddedAPI, IChatEmbeddedApiAuthProvider, ChatLaunchConfig } from '@microsoft/sharepointembedded-copilotchat-react';

interface CopilotDesktopViewProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  siteName: string;
  isLoading: boolean;
  error: string | null;
  containerId: string;
  onError: (errorMessage: string) => void;
  chatConfig: ChatLaunchConfig;
  authProvider: IChatEmbeddedApiAuthProvider;
  onApiReady: (api: ChatEmbeddedAPI) => void;
  chatKey: number;
  onResetChat?: () => void;
}

const CopilotDesktopView: React.FC<CopilotDesktopViewProps> = ({
  isOpen,
  setIsOpen,
  siteName,
  isLoading,
  error,
  containerId,
  onError,
  chatConfig,
  authProvider,
  onApiReady,
  chatKey,
  onResetChat,
}) => {
  const [chatLoadFailed, setChatLoadFailed] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [chatApiInstance, setChatApiInstance] = useState<ChatEmbeddedAPI | null>(null);
  
  // Reset the load failure state when the sheet is opened or chat key changes
  useEffect(() => {
    if (isOpen) {
      setChatLoadFailed(false);
      console.log('Copilot chat sheet opened, container dimensions:', 
        chatContainerRef.current ? 
        `width: ${chatContainerRef.current.offsetWidth}px, height: ${chatContainerRef.current.offsetHeight}px` : 
        'container ref not available');
    }
  }, [isOpen, chatKey]);
  
  // Handle chat error
  const handleChatError = () => {
    console.error('ChatEmbedded component error');
    setChatLoadFailed(true);
    onError('Failed to load the chat component');
  };
  
  // Set up global error handler for the chat component
  useEffect(() => {
    if (isOpen) {
      const errorHandler = (event: ErrorEvent) => {
        if (event.message && event.message.includes('ChatEmbedded')) {
          handleChatError();
        }
      };
      
      window.addEventListener('error', errorHandler);
      return () => {
        window.removeEventListener('error', errorHandler);
      };
    }
  }, [isOpen, onError]);
  
  // Handle API Ready event and initialize chat - added null check for api
  const handleApiReady = (api: ChatEmbeddedAPI) => {
    console.log('Chat API is ready');
    if (!api) {
      console.error('Chat API is undefined');
      handleChatError();
      return;
    }
    
    setChatApiInstance(api);
    
    // Make sure to only call onApiReady if the API is valid
    onApiReady(api);
  };
  
  // Open chat when API is available and the sheet is open
  useEffect(() => {
    const initChat = async () => {
      if (chatApiInstance && isOpen && !chatLoadFailed && chatConfig) {
        try {
          console.log('Initializing chat with config:', JSON.stringify({
            header: chatConfig.header || 'SharePoint Embedded',
            theme: chatConfig.theme ? 'Theme provided' : 'No theme',
            zeroQueryPrompts: chatConfig.zeroQueryPrompts ? {
              headerText: chatConfig.zeroQueryPrompts.headerText || '',
              promptSuggestionCount: chatConfig.zeroQueryPrompts.promptSuggestionList?.length || 0
            } : 'No zero query prompts'
          }, null, 2));
          
          try {
            await chatApiInstance.openChat(chatConfig);
            console.log('Chat initialized successfully');
          } catch (chatError) {
            console.error('Error opening chat with config:', chatError);
            handleChatError();
          }
        } catch (err) {
          console.error('Failed to open chat:', err);
          handleChatError();
        }
      }
    };
    
    if (isOpen && chatApiInstance) {
      const timer = setTimeout(() => {
        initChat();
      }, 300); // Small delay to ensure DOM is ready
      
      return () => clearTimeout(timer);
    }
  }, [chatApiInstance, isOpen, chatConfig, chatLoadFailed]);
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 flex items-center justify-center">
          <MessageSquare size={16} />
          <span>Copilot Chat</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        className="w-[400px] sm:w-[540px] p-0 border-l shadow-lg"
        side="right"
      >
        <div className="flex flex-col h-dvh max-h-screen">
          <SheetTitle className="sr-only">SharePoint Embedded Copilot</SheetTitle>
          <div className="flex-shrink-0 border-b px-6 py-4">
            <h2 className="text-lg font-semibold">SharePoint Embedded Copilot</h2>
            <p className="text-sm text-muted-foreground">Connected to: {siteName}</p>
            <p className="text-sm text-muted-foreground">Ask questions about your files and folders</p>
          </div>
          
          <div className="flex-1 overflow-hidden relative">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : error || chatLoadFailed ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <p className="text-destructive mb-4">
                  {error || "Unable to load the chat. Please try again."}
                </p>
                {onResetChat && (
                  <Button onClick={onResetChat} variant="outline" className="gap-2">
                    <RefreshCw size={16} />
                    <span>Reset Chat</span>
                  </Button>
                )}
              </div>
            ) : (
              <div 
                ref={chatContainerRef}
                className="h-full w-full flex-1"
                style={{ height: 'calc(100vh - 120px)', minHeight: "600px", position: "relative" }}
                data-testid="copilot-chat-container"
              >
                <ChatEmbedded
                  containerId={containerId}
                  authProvider={authProvider}
                  onApiReady={handleApiReady}
                  style={{ 
                    height: '100%',
                    width: '100%',
                    border: 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CopilotDesktopView;
