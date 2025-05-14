
import React from 'react';
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
  isAuthenticated?: boolean;
  chatApi: ChatEmbeddedAPI | null;
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
  isAuthenticated = true,
  chatApi
}) => {
  // Early return if not authenticated or on login page
  if (!isAuthenticated || window.location.pathname === '/login') {
    console.log('CopilotDesktopView: Not rendering because not authenticated or on login page');
    return null;
  }
  
  // Reset chat when requested
  const handleResetChat = () => {
    if (onResetChat) {
      console.log('Force refreshing chat component');
      onResetChat();
    }
  };
  
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
          <div className="flex-shrink-0 border-b px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <SheetTitle className="text-lg font-semibold">SharePoint Embedded Copilot</SheetTitle>
                <p className="text-sm text-muted-foreground">Connected to: {siteName || 'SharePoint Site'}</p>
                <p className="text-sm text-muted-foreground">Ask questions about your files and folders</p>
              </div>
              {onResetChat && isAuthenticated && (
                <Button onClick={handleResetChat} size="sm" variant="ghost" className="gap-1">
                  <RefreshCw size={14} />
                  <span className="sr-only md:not-sr-only md:inline-block">Refresh</span>
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden relative">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : error || !isAuthenticated ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <p className="text-destructive mb-4">
                  {!isAuthenticated 
                    ? "Please log in to use Copilot Chat" 
                    : (error || "Unable to load the chat. Please try again.")}
                </p>
                {onResetChat && isAuthenticated && (
                  <Button onClick={handleResetChat} variant="outline" className="gap-2">
                    <RefreshCw size={16} />
                    <span>Reset Chat</span>
                  </Button>
                )}
              </div>
            ) : isOpen && containerId && chatConfig ? (
              <div 
                className="h-full w-full"
                style={{ 
                  height: 'calc(100vh - 120px)',
                  position: "relative",
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
                data-testid="copilot-chat-container"
              >
                <ChatEmbedded
                  key={`chat-${chatKey}`}
                  containerId={containerId}
                  authProvider={authProvider}
                  onApiReady={onApiReady}
                  style={{ 
                    height: '100%',
                    width: '100%',
                    border: 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10,
                    WebkitUserSelect: 'none',
                    userSelect: 'none'
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <p className="text-amber-600 mb-4">
                  Unable to render chat component. Missing required data.
                </p>
                {onResetChat && (
                  <Button onClick={handleResetChat} variant="outline" className="gap-2">
                    <RefreshCw size={16} />
                    <span>Try Again</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CopilotDesktopView;
