
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { ChatEmbedded, ChatEmbeddedAPI, IChatEmbeddedApiAuthProvider, ChatLaunchConfig } from '@microsoft/sharepointembedded-copilotchat-react';

interface CopilotDesktopViewProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  siteName: string | null;
  isLoading: boolean;
  error: string | null;
  containerId: string;
  onError: (errorMessage: string) => void;
  chatConfig: ChatLaunchConfig;
  authProvider: IChatEmbeddedApiAuthProvider | null;
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
  const [chatApi, setChatApi] = useState<ChatEmbeddedAPI | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Reset the load failure state when the sheet is opened or chat key changes
  useEffect(() => {
    if (isOpen) {
      setChatLoadFailed(false);
    }
  }, [isOpen, chatKey]);
  
  // Handle API ready event
  const handleApiReady = (api: ChatEmbeddedAPI) => {
    console.log('Copilot chat API is ready');
    setChatApi(api);
    onApiReady(api);
  };
  
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
  
  // Use effect to initialize the chat when it's ready
  useEffect(() => {
    const initializeChat = async () => {
      if (chatApi && isOpen && chatConfig) {
        try {
          console.log('Initializing chat with config:', chatConfig);
          await chatApi.openChat(chatConfig);
          console.log('Chat initialized successfully');
        } catch (err) {
          console.error('Failed to initialize chat:', err);
          onError('Failed to initialize chat');
        }
      }
    };
    
    if (chatApi && isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeChat();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chatApi, isOpen, chatConfig, onError]);
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare size={16} />
          <span>Copilot Chat</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        className="w-[400px] sm:w-[540px] flex flex-col h-full p-0 border-l shadow-lg"
        side="right"
      >
        <SheetTitle className="sr-only">SharePoint Embedded Copilot</SheetTitle>
        <div className="flex-shrink-0 border-b px-6 py-4">
          <h2 className="text-lg font-semibold">SharePoint Embedded Copilot</h2>
          {siteName && <p className="text-sm text-muted-foreground">Connected to: {siteName}</p>}
          <p className="text-sm text-muted-foreground">Ask questions about your files and folders</p>
        </div>
        
        <div className="flex-1 min-h-0 relative">
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
              className="h-full w-full" 
              key={chatKey} 
              id="copilot-chat-container"
              ref={chatContainerRef}
              style={{ height: 'calc(100vh - 130px)' }}
            >
              {authProvider ? (
                <ChatEmbedded
                  containerId={containerId}
                  authProvider={authProvider}
                  onApiReady={handleApiReady}
                  style={{ 
                    height: '100%', 
                    width: '100%',
                    display: 'flex',
                    border: 'none',
                    overflow: 'hidden'
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full p-6 text-center">
                  <p className="text-muted-foreground">
                    Authentication setup in progress. Please wait or reload the page.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CopilotDesktopView;
