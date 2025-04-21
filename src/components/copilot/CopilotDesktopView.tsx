
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
    try {
      console.log('Raw containerId:', rawId);
      
      // If the ID is from a URL path, extract just the ID part after /files/
      const pathMatch = rawId.match(/\/files\/([^\/]+)/);
      if (pathMatch && pathMatch[1]) {
        rawId = pathMatch[1];
        console.log('Extracted from path:', rawId);
      }
      
      // Handle "b!" prefix specifically - SharePoint uses this to indicate a driveItem
      if (rawId.startsWith('b!')) {
        console.log('Processing b! prefixed ID');
        
        // For b! IDs, we need to extract a specific segment
        // According to SharePoint API docs, the b! format contains encoded information
        // that may not be directly usable as a GUID
        
        // Recommended approach: When presented with a b! ID in a URL, 
        // use it directly as the API expects this format
        return rawId;
      }
      
      // If it's already a GUID with dashes, return it directly
      if (rawId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log('Already a valid GUID format:', rawId);
        return rawId;
      }
      
      // For any other format, just return as is and let the API handle it
      console.log('Using original ID format:', rawId);
      return rawId;
    } catch (error) {
      console.error('Error formatting containerId:', error);
      // Return the original ID as fallback
      return rawId;
    }
  };

  // Get a correctly formatted containerId
  const validContainerId = formatContainerId(containerId);
  
  // Add more debug info
  useEffect(() => {
    if (isOpen) {
      console.log('CopilotDesktopView - containerId details:', {
        original: containerId,
        formatted: validContainerId
      });
    }
  }, [isOpen, containerId, validContainerId]);
  
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
