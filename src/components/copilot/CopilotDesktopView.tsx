
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
  // The SharePoint API expects a proper GUID format
  const formatContainerId = (id: string): string => {
    try {
      // For IDs in the 'b!' format
      if (id.startsWith('b!')) {
        // Extract the first GUID segment, before any underscore
        const strippedId = id.substring(2); // Remove 'b!' prefix
        
        // If there's an underscore, take only the part before it
        // This should be the DriveId GUID which is what Copilot expects
        const firstSegment = strippedId.split('_')[0];
        
        // Check if it's a valid GUID-like string (basic check)
        if (firstSegment && firstSegment.length >= 32) {
          console.log('Using first GUID segment:', firstSegment);
          return firstSegment;
        }
        
        // If splitting didn't work as expected, return the whole stripped string
        return strippedId;
      }
      
      // For already formatted GUIDs without 'b!' prefix
      return id;
    } catch (err) {
      console.error('Error formatting containerId:', err);
      // Return original as fallback
      return id;
    }
  };

  const formattedContainerId = formatContainerId(containerId);
  
  // Debug logging
  console.log('ContainerId processing:', {
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
