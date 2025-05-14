
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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Reset the load failure state when the sheet is opened or chat key changes
  useEffect(() => {
    if (isOpen) {
      setChatLoadFailed(false);
      console.log('Copilot chat sheet opened, container:', chatContainerRef.current);
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
              className="h-full w-full overflow-hidden" 
              key={chatKey} 
              id="copilot-chat-container"
              ref={chatContainerRef}
              data-testid="copilot-chat-container"
            >
              {authProvider ? (
                <ChatEmbedded
                  containerId={containerId}
                  authProvider={authProvider}
                  onApiReady={onApiReady}
                  style={{ 
                    height: '100vh', 
                    width: '100%',
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
