
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
    console.log('Raw containerId:', rawId);
    
    // If we have a b! prefix, extract just the first part (before any underscore)
    if (rawId.startsWith('b!')) {
      const idWithoutPrefix = rawId.substring(2);
      
      // Look for a standard GUID pattern
      const guidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
      const match = idWithoutPrefix.match(guidPattern);
      
      if (match && match[1]) {
        console.log('Found GUID pattern in b! ID:', match[1]);
        return match[1];
      }
      
      // If no GUID pattern found, take the part before any underscore
      const parts = idWithoutPrefix.split('_');
      const firstPart = parts[0];
      
      // If the first part is a potential GUID without dashes, format it
      if (firstPart.length === 32) {
        const formattedGuid = `${firstPart.slice(0,8)}-${firstPart.slice(8,12)}-${firstPart.slice(12,16)}-${firstPart.slice(16,20)}-${firstPart.slice(20)}`;
        console.log('Formatted GUID from b! ID:', formattedGuid);
        return formattedGuid;
      }
      
      console.log('Using first part of b! ID:', firstPart);
      return firstPart;
    }
    
    return rawId;
  };

  const formattedContainerId = formatContainerId(containerId);
  
  // Add more debug info
  useEffect(() => {
    if (isOpen) {
      console.log('CopilotDesktopView - containerId details:', {
        original: containerId,
        formatted: formattedContainerId
      });
    }
  }, [isOpen, containerId, formattedContainerId]);
  
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
                containerId={formattedContainerId}
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
