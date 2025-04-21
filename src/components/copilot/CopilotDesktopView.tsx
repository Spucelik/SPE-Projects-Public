
import React, { useEffect } from 'react';
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
  
  // Add debug info
  useEffect(() => {
    if (isOpen) {
      console.log('CopilotDesktopView - Details:', {
        original: containerId,
        formatted: validContainerId,
        authProvider,
        chatKey
      });
    }
  }, [isOpen, containerId, validContainerId, authProvider, chatKey]);
  
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
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <p className="text-destructive mb-4">{error}</p>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={openExternalChat}
              >
                <ExternalLink size={16} />
                Try External Chat
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
