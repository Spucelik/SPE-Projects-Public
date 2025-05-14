
import React, { useEffect, useState, useRef, useCallback } from 'react';
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
}) => {
  const [chatLoadFailed, setChatLoadFailed] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [chatApiInstance, setChatApiInstance] = useState<ChatEmbeddedAPI | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [chatInitialized, setChatInitialized] = useState(false);
  const initAttemptedRef = useRef(false);
  
  // Early return if not authenticated - don't even try to render the component
  if (!isAuthenticated) {
    return null;
  }
  
  // Reset the load failure state when the sheet is opened or chat key changes
  useEffect(() => {
    if (isOpen) {
      setChatLoadFailed(false);
      initAttemptedRef.current = false;
      console.log('Copilot chat sheet opened, container dimensions:', 
        chatContainerRef.current ? 
        `width: ${chatContainerRef.current.offsetWidth}px, height: ${chatContainerRef.current.offsetHeight}px` : 
        'container ref not available');
    } else {
      // Reset initialization flag when closing
      setChatInitialized(false);
      setInitializing(false);
    }
  }, [isOpen, chatKey]);
  
  // Handle chat error - memoized to prevent recreation
  const handleChatError = useCallback((err?: any) => {
    console.error('ChatEmbedded component error:', err);
    setChatLoadFailed(true);
    onError('Failed to load the chat component');
  }, [onError]);
  
  // Set up global error handler for the chat component
  useEffect(() => {
    if (isOpen) {
      const errorHandler = (event: ErrorEvent) => {
        if (event.message && (
          event.message.includes('ChatEmbedded') || 
          event.message.includes("Cannot read properties of undefined (reading 'name')")
        )) {
          console.error('Caught chat error:', event.message);
          handleChatError(event);
        }
      };
      
      window.addEventListener('error', errorHandler);
      return () => {
        window.removeEventListener('error', errorHandler);
      };
    }
  }, [isOpen, handleChatError]);
  
  // Handle API Ready event - memoized to prevent recreation
  const handleApiReady = useCallback((api: ChatEmbeddedAPI | null) => {
    console.log('Chat API ready callback triggered');
    
    // Early return if API is null or undefined
    if (!api) {
      console.error('Chat API is undefined');
      handleChatError();
      return;
    }
    
    console.log('Chat API is ready and valid');
    setChatApiInstance(api);
    
    // Make sure to only call onApiReady if the API is valid
    onApiReady(api);
  }, [handleChatError, onApiReady]);
  
  // Initialize chat - this is the main source of the infinite loop if not managed carefully
  useEffect(() => {
    // Skip if conditions aren't right
    if (!isOpen || !chatApiInstance || chatInitialized || initializing || chatLoadFailed || !isAuthenticated) {
      return;
    }

    // Use ref to prevent double initialization attempts
    if (initAttemptedRef.current) {
      return;
    }
    
    const initChat = async () => {
      try {
        // Set flags to prevent concurrent initialization
        initAttemptedRef.current = true;
        setInitializing(true);
        
        console.log('Initializing chat with config:', JSON.stringify({
          header: chatConfig.header || 'SharePoint Embedded',
          hasTheme: !!chatConfig.theme,
          hasZeroQueryPrompts: !!chatConfig.zeroQueryPrompts,
          hasInstruction: !!chatConfig.instruction
        }));
        
        await chatApiInstance.openChat(chatConfig);
        console.log('Chat initialized successfully');
        setChatInitialized(true);
      } catch (chatError) {
        console.error('Error opening chat with config:', chatError);
        handleChatError(chatError);
      } finally {
        setInitializing(false);
      }
    };
    
    // Use setTimeout to avoid immediate execution and potential race conditions
    const timer = setTimeout(() => {
      initChat();
    }, 500);
    
    return () => {
      clearTimeout(timer);
    };
  }, [chatApiInstance, isOpen, chatConfig, chatLoadFailed, handleChatError, chatInitialized, initializing, isAuthenticated]);
  
  // Determine if chat can be rendered
  const canRenderChat = isAuthenticated && !chatLoadFailed && !!containerId;

  // Function to force remounting of chat component
  const forceRefreshChat = useCallback(() => {
    if (onResetChat) {
      console.log('Force refreshing chat component');
      setChatApiInstance(null);
      setChatInitialized(false);
      initAttemptedRef.current = false;
      onResetChat();
    }
  }, [onResetChat]);
  
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
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">SharePoint Embedded Copilot</h2>
                <p className="text-sm text-muted-foreground">Connected to: {siteName || 'SharePoint Site'}</p>
                <p className="text-sm text-muted-foreground">Ask questions about your files and folders</p>
              </div>
              {onResetChat && isAuthenticated && (
                <Button onClick={forceRefreshChat} size="sm" variant="ghost" className="gap-1">
                  <RefreshCw size={14} />
                  <span className="sr-only md:not-sr-only md:inline-block">Refresh</span>
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden relative">
            {isLoading || initializing ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-2 text-sm text-muted-foreground">
                  {initializing ? 'Initializing chat...' : 'Loading...'}
                </span>
              </div>
            ) : error || chatLoadFailed || !isAuthenticated ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <p className="text-destructive mb-4">
                  {!isAuthenticated 
                    ? "Please log in to use Copilot Chat" 
                    : (error || "Unable to load the chat. Please try again.")}
                </p>
                {onResetChat && isAuthenticated && (
                  <Button onClick={forceRefreshChat} variant="outline" className="gap-2">
                    <RefreshCw size={16} />
                    <span>Reset Chat</span>
                  </Button>
                )}
              </div>
            ) : canRenderChat && isOpen ? (
              <div 
                ref={chatContainerRef}
                className="h-full w-full flex-1"
                style={{ 
                  height: 'calc(100vh - 120px)', 
                  minHeight: "600px", 
                  position: "relative",
                  display: "flex",
                  flexDirection: "column"
                }}
                data-testid="copilot-chat-container"
                id="copilot-chat-embedded-container"
              >
                <ChatEmbedded
                  key={`chat-${chatKey}-${containerId}`}
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
                    bottom: 0,
                    zIndex: 10,
                    backgroundColor: 'transparent'
                  }}
                  allowTransparency={true}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <p className="text-amber-600 mb-4">
                  Unable to render chat component. Missing required data.
                </p>
                {onResetChat && (
                  <Button onClick={forceRefreshChat} variant="outline" className="gap-2">
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
