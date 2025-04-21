
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
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
  containerId,
  authProvider,
  onApiReady,
  chatKey,
}) => {
  // Format the containerId for the SharePoint Embedded API
  // The correct format is typically just the GUID portion without any prefixes
  const formatContainerId = (id: string): string => {
    // Check if it starts with 'b!' format
    if (id.startsWith('b!')) {
      // Extract just the GUID portion (likely the first part after 'b!')
      const parts = id.substring(2).split('_');
      if (parts.length > 0) {
        return parts[0]; // Return just the first part which should be the GUID
      }
    }
    
    // If we can't parse it properly, return the original without 'b!' prefix
    return id.startsWith('b!') ? id.substring(2) : id;
  };

  const formattedContainerId = formatContainerId(containerId);
  
  // Debug log to help troubleshoot
  console.log('Formatted containerId:', {
    original: containerId,
    formatted: formattedContainerId
  });
    
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
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive">{error}</p>
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
