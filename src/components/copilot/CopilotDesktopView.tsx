
import React, { useEffect, useState, useRef } from 'react';
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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setChatLoadFailed(false);
      setIframeLoaded(false);
    }
  }, [isOpen, chatKey]);
  
  // Handle iframe load
  useEffect(() => {
    if (!isOpen || !chatContainerRef.current) return;
    
    // Find iframes when they are created by the ChatEmbedded component
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const iframes = chatContainerRef.current?.querySelectorAll('iframe');
          if (iframes && iframes.length > 0) {
            setIframeLoaded(true);
            observer.disconnect();
            break;
          }
        }
      }
    });
    
    observer.observe(chatContainerRef.current, { 
      childList: true, 
      subtree: true 
    });
    
    return () => observer.disconnect();
  }, [isOpen]);
  
  // Separate the chat opening logic with added security error handling
  useEffect(() => {
    if (!chatApi || !isOpen || !iframeLoaded) {
      return;
    }
    
    // Wait for iframe to be fully loaded and initialized before opening chat
    const timer = setTimeout(async () => {
      try {
        console.log('Opening Copilot chat...');
        await chatApi.openChat();
        console.log('Copilot chat opened successfully');
      } catch (err) {
        console.error('Failed to open chat:', err);
        setChatLoadFailed(true);
        onError('Failed to open chat. This might be due to browser security restrictions.');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [chatApi, isOpen, onError, iframeLoaded]);
  
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
        chatApiReady: !!chatApi,
        iframeLoaded
      });
    }
  }, [isOpen, containerId, validContainerId, authProvider, chatKey, chatLoadFailed, chatConfig, chatApi, iframeLoaded]);

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
        <div className="flex-1 min-h-0 relative" ref={chatContainerRef}>
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
            <div className="h-full overflow-hidden" key={chatKey}>
              {authProvider ? (
                <div className="w-full h-full isolate overflow-hidden">
                  <div className="sandbox-container" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                    <ChatEmbedded
                      containerId={validContainerId}
                      authProvider={authProvider}
                      onApiReady={handleApiReady}
                      style={{ height: '100%', width: '100%' }}
                    />
                  </div>
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
