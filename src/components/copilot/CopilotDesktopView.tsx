
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { ChatEmbedded, ChatEmbeddedAPI, IChatEmbeddedApiAuthProvider } from '@microsoft/sharepointembedded-copilotchat-react';
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
  
  useEffect(() => {
    const openChat = async () => {
      if (!chatApi || !isOpen) {
        return;
      }

      try {
        console.log('Opening Copilot chat...');
        await chatApi.openChat();
      } catch (err) {
        console.error('Failed to open chat:', err);
        onError('Failed to open chat. Please try again.');
      }
    };

    openChat();
  }, [chatApi, isOpen, onError]);
  
  const formatContainerId = (rawId: string): string => {
    if (rawId.startsWith('b!')) {
      console.log('Using b! prefixed ID:', rawId);
      return rawId;
    }
    
    if (rawId.includes('/files/')) {
      const parts = rawId.split('/files/');
      if (parts.length > 1) {
        const extractedId = parts[1];
        console.log('Extracted ID from URL path:', extractedId);
        if (extractedId.startsWith('b!')) {
          return extractedId;
        }
      }
    }
    
    console.log('Using original ID format:', rawId);
    return rawId;
  };

  const validContainerId = formatContainerId(containerId);
  
  useEffect(() => {
    if (isOpen) {
      console.log('CopilotDesktopView - Details:', {
        original: containerId,
        formatted: validContainerId,
        authProvider,
        chatKey,
        chatLoadFailed,
        chatConfig,
        chatApiReady: !!chatApi
      });
    }
  }, [isOpen, containerId, validContainerId, authProvider, chatKey, chatLoadFailed, chatConfig, chatApi]);

  const handleChatApiError = () => {
    setChatLoadFailed(true);
    onError("The chat component failed to load. Please try resetting the chat.");
  };
  
  const handleChatError = (event: Event) => {
    console.error('ChatEmbedded component error:', event);
    handleChatApiError();
  };
  
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('error', handleChatError);
      
      return () => {
        window.removeEventListener('error', handleChatError);
      };
    }
  }, [isOpen]);

  const handleApiReady = (api: ChatEmbeddedAPI) => {
    console.log('Copilot chat API is ready');
    setChatApi(api);
    onApiReady(api);
  };
  
  // Custom sheet component with transparent overlay
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare size={16} />
          <span>Copilot Chat</span>
        </Button>
      </SheetTrigger>
      
      {/* Apply custom styling to prevent darkening of the background */}
      <div className={cn(
        "fixed inset-0 z-49 pointer-events-none",
        isOpen ? "pointer-events-auto" : "hidden"
      )}>
        <SheetContent 
          className="w-[400px] sm:w-[540px] flex flex-col h-full p-0 border-l shadow-lg z-50 pointer-events-auto" 
          side="right"
          // Override the overlay with empty div to prevent darkening
          forceMount
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
              <div className="h-full" key={chatKey}>
                {authProvider ? (
                  <ChatEmbedded
                    containerId={validContainerId}
                    authProvider={authProvider}
                    onApiReady={handleApiReady}
                    style={{ height: '100%', width: '100%' }}
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
      </div>
    </Sheet>
  );
};

export default CopilotDesktopView;
