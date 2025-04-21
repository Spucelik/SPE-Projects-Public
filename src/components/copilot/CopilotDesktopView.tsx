
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare, ExternalLink } from 'lucide-react';
import { ChatEmbedded, ChatEmbeddedAPI } from '@microsoft/sharepointembedded-copilotchat-react';
import { IChatEmbeddedApiAuthProvider } from '@microsoft/sharepointembedded-copilotchat-react';

interface CopilotDesktopViewProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  siteName: string | null;
  isLoading: boolean;
  error: string | null;
  openExternalChat: () => void;
  containerId: string;
  authProvider: IChatEmbeddedApiAuthProvider;
  onApiReady: (api: ChatEmbeddedAPI) => void;
  chatKey: number;
}

const CopilotDesktopView: React.FC<CopilotDesktopViewProps> = ({
  isOpen,
  setIsOpen,
  siteName,
  isLoading,
  error,
  openExternalChat,
  containerId,
  authProvider,
  onApiReady,
  chatKey,
}) => {
  const [localChatApi, setLocalChatApi] = useState<ChatEmbeddedAPI | null>(null);
  const [cspError, setCspError] = useState<boolean>(false);
  
  // Pre-check for CSP issues by trying to access a test iframe
  useEffect(() => {
    // Function to detect if we can access iframes
    const detectCSPRestrictions = () => {
      try {
        // Create a test iframe to check if we can access its document
        const testFrame = document.createElement('iframe');
        testFrame.style.display = 'none';
        document.body.appendChild(testFrame);
        
        // Try to access the iframe's document - this will throw a CSP error if restricted
        if (testFrame.contentWindow) {
          // Just accessing the property is enough to trigger CSP
          const _ = testFrame.contentWindow.document;
        }
        
        // Clean up
        document.body.removeChild(testFrame);
      } catch (e) {
        console.error('CSP pre-check failed:', e);
        setCspError(true);
        return true;
      }
      return false;
    };
    
    // Run the check when the component mounts
    detectCSPRestrictions();
  }, []);
  
  // Handle error events (backup detection)
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('Content Security Policy') || 
          event.message.includes('frame-ancestors') ||
          event.message.includes('SecurityError')) {
        console.error('CSP Error detected from event:', event.message);
        setCspError(true);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Handle API ready and trigger chat opening
  const handleApiReady = (api: ChatEmbeddedAPI) => {
    console.log('Chat API ready');
    setLocalChatApi(api);
    onApiReady(api);
  };

  // Open chat when API is ready and component is open
  useEffect(() => {
    const openChat = async () => {
      if (!localChatApi || !isOpen || cspError) return;
      
      try {
        console.log('Opening chat...');
        await localChatApi.openChat();
      } catch (error) {
        console.error('Error opening chat:', error);
        // Check if the error is CSP related
        if (error instanceof Error && 
            (error.message.includes('SecurityError') || 
             error.message.includes('Content Security Policy'))) {
          setCspError(true);
        }
      }
    };

    openChat();
  }, [localChatApi, isOpen, cspError]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare size={16} />
          <span>Copilot Chat</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full p-0">
        <div className="flex-shrink-0 border-b px-6 py-4">
          <h2 className="text-lg font-semibold">SharePoint Embedded Copilot</h2>
          {siteName && <p className="text-sm text-muted-foreground">Connected to: {siteName}</p>}
          <p className="text-sm text-muted-foreground">Ask questions about your files and folders</p>
        </div>
        <div className="flex-1 min-h-0 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {(error || cspError) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-background/80 z-10">
              <p className="text-destructive mb-4">
                {cspError 
                  ? "Content Security Policy restrictions prevent embedding Copilot here." 
                  : `Failed to load embedded chat: ${error}`}
              </p>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={openExternalChat}
              >
                <ExternalLink size={16} />
                Open in new tab
              </Button>
            </div>
          )}
          
          {isOpen && containerId && !error && !cspError && (
            <div className="h-full w-full" key={chatKey}>
              <ChatEmbedded
                containerId={containerId}
                authProvider={authProvider}
                style={{ width: '100%', height: '100%' }}
                onApiReady={handleApiReady}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CopilotDesktopView;
