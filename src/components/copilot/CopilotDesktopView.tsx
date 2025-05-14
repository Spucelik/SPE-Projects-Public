
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { ChatEmbedded, ChatEmbeddedAPI, IChatEmbeddedApiAuthProvider, ChatLaunchConfig } from '@microsoft/sharepointembedded-copilotchat-react';
import { cn } from '@/lib/utils';

interface CopilotDesktopViewProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  siteName: string | null;
  isLoading: boolean;
  error: string | null;
  containerId: string;
  onError: (errorMessage: string) => void;
  chatConfig: any;
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
  
  // Handle chat opening with improved error handling
  useEffect(() => {
    if (!chatApi || !isOpen) {
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        console.log('Opening Copilot chat with API and config:', chatConfig);
        await chatApi.openChat(chatConfig);
        console.log('Copilot chat opened successfully');
      } catch (err) {
        console.error('Failed to open chat:', err);
        setChatLoadFailed(true);
        onError('Failed to open chat. This might be due to browser security restrictions.');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [chatApi, isOpen, onError, chatConfig]);
  
  // Error handling for chat component
  const handleChatApiError = () => {
    setChatLoadFailed(true);
    onError("The chat component failed to load. Please try resetting the chat.");
  };
  
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('error', handleChatError);
      
      return () => {
        window.removeEventListener('error', handleChatError);
      };
    }
  }, [isOpen]);

  const handleChatError = (event: Event) => {
    console.error('ChatEmbedded component error:', event);
    handleChatApiError();
  };
  
  // Logging for debugging
  useEffect(() => {
    if (isOpen) {
      console.log('CopilotDesktopView - Details:', {
        containerId,
        authProvider: !!authProvider,
        chatKey,
        chatLoadFailed,
        chatConfig: !!chatConfig,
        chatApiReady: !!chatApi,
      });
    }
  }, [isOpen, containerId, authProvider, chatKey, chatLoadFailed, chatConfig, chatApi]);
  
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
            <div className="h-full w-full overflow-hidden" key={chatKey}>
              {authProvider ? (
                <div className="w-full h-full flex">
                  <ChatEmbedded
                    containerId={containerId}
                    authProvider={authProvider}
                    onApiReady={handleApiReady}
                    style={{ 
                      height: '100%', 
                      width: '100%',
                      display: 'block',
                      minHeight: '400px',
                      border: 'none'
                    }}
                  />
                </div>
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
