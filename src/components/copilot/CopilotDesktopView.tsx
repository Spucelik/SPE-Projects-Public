
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare, ExternalLink } from 'lucide-react';
import { ChatEmbedded } from '@microsoft/sharepointembedded-copilotchat-react';

interface CopilotDesktopViewProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  siteName: string | null;
  isLoading: boolean;
  error: string | null;
  openExternalChat: () => void;
  containerId: string;
  authProvider: any;
  onApiReady: (api: any) => void;
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
  const [chatLoadFailed, setChatLoadFailed] = useState(false);
  
  // Reset error state when the chat is reopened
  useEffect(() => {
    if (isOpen) {
      setChatLoadFailed(false);
    }
  }, [isOpen, chatKey]);
  
  // Format the containerId for the SharePoint Embedded API
  const formatContainerId = (rawId: string): string => {
    // If the ID is already correctly formatted with 'b!' prefix, use it directly
    if (rawId.startsWith('b!')) {
      console.log('Using b! prefixed ID:', rawId);
      return rawId;
    }
    
    // If it's a path from a URL, extract just the ID part
    if (rawId.includes('/files/')) {
      const parts = rawId.split('/files/');
      if (parts.length > 1) {
        const extractedId = parts[1];
        console.log('Extracted ID from URL path:', extractedId);
        // If extracted part has b! prefix, return it
        if (extractedId.startsWith('b!')) {
          return extractedId;
        }
      }
    }
    
    // For any other format, return as is
    console.log('Using original ID format:', rawId);
    return rawId;
  };

  // Get a correctly formatted containerId
  const validContainerId = formatContainerId(containerId);
  
  // Detect CSP errors with frames
  useEffect(() => {
    if (!isOpen) return;
    
    const handleCspError = (event: ErrorEvent) => {
      if (
        event.message.includes('Content Security Policy') ||
        event.message.includes('frame-ancestors') ||
        event.message.includes('SecurityError')
      ) {
        console.error('CSP error detected in CopilotDesktopView:', event.message);
        setChatLoadFailed(true);
      }
    };
    
    window.addEventListener('error', handleCspError);
    return () => window.removeEventListener('error', handleCspError);
  }, [isOpen]);
  
  // Add debug info
  useEffect(() => {
    if (isOpen) {
      console.log('CopilotDesktopView - Details:', {
        original: containerId,
        formatted: validContainerId,
        authProvider,
        chatKey,
        chatLoadFailed
      });
    }
  }, [isOpen, containerId, validContainerId, authProvider, chatKey, chatLoadFailed]);
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare size={16} />
          <span>Copilot Chat</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full p-0" side="right">
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
                {error || "Unable to load the embedded chat due to security restrictions."}
              </p>
              <p className="text-sm text-center mb-4">
                {chatLoadFailed ? 
                  "SharePoint's Content Security Policy is preventing the chat from loading in this window." : 
                  "Try opening the chat in a new window instead."}
              </p>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={openExternalChat}
              >
                <ExternalLink size={16} />
                Open in New Window
              </Button>
            </div>
          ) : (
            <div className="h-full" key={chatKey}>
              <ChatEmbedded
                containerId={validContainerId}
                authProvider={authProvider}
                onApiReady={onApiReady}
                style={{ height: '100%' }}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CopilotDesktopView;
