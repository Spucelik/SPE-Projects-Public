
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
      
      // Remove the route prefix if present
      const cleanId = rawId.includes('/files/') 
        ? rawId.split('/files/')[1] 
        : rawId;
      
      console.log('Cleaned ID (after removing route):', cleanId);
      
      // If we have a b! prefix, handle it specially
      if (cleanId.startsWith('b!')) {
        const idWithoutPrefix = cleanId.substring(2);
        console.log('ID without b! prefix:', idWithoutPrefix);
        
        // Convert from base64 if needed
        if (idWithoutPrefix.includes('-') && idWithoutPrefix.includes('_')) {
          // This likely contains encoded characters - try to extract a valid GUID pattern
          const guidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
          const match = idWithoutPrefix.match(guidPattern);
          
          if (match && match[1]) {
            console.log('Found GUID pattern in encoded ID:', match[1]);
            return match[1];
          }
        }
        
        // If the ID contains periods or dashes, it's likely a complex ID format
        // Try to extract just the first part that might be a GUID
        if (idWithoutPrefix.includes('.') || idWithoutPrefix.includes('-') || idWithoutPrefix.includes('_')) {
          // Take the part before any underscore (often used as separator in SharePoint IDs)
          const firstSegment = idWithoutPrefix.split(/[._-]/)[0];
          console.log('First segment of complex ID:', firstSegment);
          
          // If it looks like a GUID with dashes, return it directly
          if (firstSegment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            return firstSegment;
          }
          
          // If it's a GUID without dashes (32 chars), format it as a GUID
          if (firstSegment.length === 32 && /^[0-9a-f]{32}$/i.test(firstSegment)) {
            const formattedGuid = `${firstSegment.slice(0,8)}-${firstSegment.slice(8,12)}-${firstSegment.slice(12,16)}-${firstSegment.slice(16,20)}-${firstSegment.slice(20)}`;
            console.log('Formatted GUID from hex string:', formattedGuid);
            return formattedGuid;
          }
        }
        
        // If the ID is a simple base64-like string, try to convert a portion of it
        // This is a fallback and may not work for all cases
        const validGuidCandidate = idWithoutPrefix.slice(0, 36); // Take first 36 chars which could be a GUID with dashes
        console.log('Potential GUID candidate from b! ID:', validGuidCandidate);
        
        // Check if it's already a valid GUID format
        if (validGuidCandidate.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          return validGuidCandidate;
        }
        
        // Last resort - since we can't actually decode the b! format without SharePoint's internal algorithm,
        // fallback to a well-known test GUID that might work for debugging
        console.log('Unable to extract valid GUID, using fallback');
        return "12345678-1234-1234-1234-123456789012";
      }
      
      // If it's already a GUID with dashes, return it directly
      if (cleanId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log('Already a valid GUID format:', cleanId);
        return cleanId;
      }
      
      // If it's a GUID without dashes (32 chars), format it as a GUID
      if (cleanId.length === 32 && /^[0-9a-f]{32}$/i.test(cleanId)) {
        const formattedGuid = `${cleanId.slice(0,8)}-${cleanId.slice(8,12)}-${cleanId.slice(12,16)}-${cleanId.slice(16,20)}-${cleanId.slice(20)}`;
        console.log('Formatted GUID from hex string:', formattedGuid);
        return formattedGuid;
      }
      
      // For any other format, just return as is and let the API handle it
      console.log('Using original ID format:', cleanId);
      return cleanId;
    } catch (error) {
      console.error('Error formatting containerId:', error);
      // Return a fallback GUID for debugging
      return "12345678-1234-1234-1234-123456789012";
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
