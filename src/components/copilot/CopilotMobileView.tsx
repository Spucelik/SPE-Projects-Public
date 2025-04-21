
import React from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { MessageSquare, ExternalLink } from 'lucide-react';

interface CopilotMobileViewProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  siteName: string | null;
  isLoading: boolean;
  error: string | null;
  openExternalChat: () => void;
}

const CopilotMobileView: React.FC<CopilotMobileViewProps> = ({
  isOpen,
  setIsOpen,
  siteName,
  isLoading,
  error,
  openExternalChat,
}) => {
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare size={16} />
          <span>Copilot Chat</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="flex flex-col h-96">
        <div className="flex-shrink-0 border-b px-6 py-4">
          <h2 className="text-lg font-semibold">SharePoint Embedded Copilot</h2>
          {siteName && <p className="text-sm text-muted-foreground">Connected to: {siteName}</p>}
        </div>
        <div className="flex-1 min-h-0 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-destructive text-center p-4">
              <p>Could not load Copilot Chat: {error}</p>
              <Button 
                variant="outline" 
                className="mt-4 gap-2"
                onClick={openExternalChat}
              >
                <ExternalLink size={16} />
                Open in new tab
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p>Copilot Chat works best in a new tab on mobile devices.</p>
              <Button 
                variant="outline" 
                className="mt-4 gap-2"
                onClick={openExternalChat}
              >
                <ExternalLink size={16} />
                Open Copilot Chat
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CopilotMobileView;
