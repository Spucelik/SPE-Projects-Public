
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
  // The SharePoint API expects a specific GUID format without decorations
  const extractValidGuid = (id: string): string | null => {
    try {
      // Regular expression to find a GUID pattern
      const guidRegex = /([0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12})|([0-9a-f]{32})/i;
      
      // Remove 'b!' prefix if it exists
      const strippedId = id.startsWith('b!') ? id.substring(2) : id;
      
      // Try to find a GUID in the string
      const match = strippedId.match(guidRegex);
      
      if (match && match[0]) {
        // Format the GUID if it's not already in the standard format with dashes
        const guid = match[0];
        if (guid.length === 32 && !guid.includes('-')) {
          // Insert dashes in the correct positions for a standard GUID format
          return `${guid.slice(0,8)}-${guid.slice(8,12)}-${guid.slice(12,16)}-${guid.slice(16,20)}-${guid.slice(20)}`;
        }
        return guid;
      }
    } catch (err) {
      console.error('Error extracting GUID:', err);
    }
    return null;
  };

  // Process the containerId with multiple fallback mechanisms
  const processContainerId = (): string => {
    // Original value for debugging
    console.log('Original containerId:', containerId);
    
    // First attempt: try to extract a valid GUID
    const extractedGuid = extractValidGuid(containerId);
    if (extractedGuid) {
      console.log('Successfully extracted GUID:', extractedGuid);
      return extractedGuid;
    }
    
    // Second attempt: If the ID starts with b!, take the first part after splitting by underscore
    if (containerId.startsWith('b!')) {
      const parts = containerId.substring(2).split('_');
      if (parts.length > 0 && parts[0]) {
        console.log('Using first part after b!:', parts[0]);
        return parts[0];
      }
    }
    
    // Last resort: Just use the plain ID without any b! prefix
    const fallbackId = containerId.startsWith('b!') ? containerId.substring(2) : containerId;
    console.log('Using fallback ID:', fallbackId);
    return fallbackId;
  };

  const formattedContainerId = processContainerId();
  
  // Additional debugging
  useEffect(() => {
    console.log('CopilotDesktopView - containerId processing:', {
      original: containerId,
      formatted: formattedContainerId,
      length: formattedContainerId.length
    });
  }, [containerId, formattedContainerId]);
  
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
