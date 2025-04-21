
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Import the correct classes and interfaces from the SDK
import {
  createChatEmbeddedInstance,
  IChatEmbeddedConfig,
  IChatEmbeddedApiAuthProvider
} from '@microsoft/sharepointembedded-copilotchat-react';

interface CopilotChatProps {
  containerId: string;
}

const SPE_HOSTNAME = 'https://m365x10735106.sharepoint.com'; // Replace with your actual SharePoint Embedded host if not this demo

const CopilotChat: React.FC<CopilotChatProps> = ({ containerId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getAccessToken } = useAuth();
  const chatContainerId = React.useRef(`copilot-chat-container-${Math.random().toString(36).substring(2, 11)}`);

  // Create an authProvider compatible with the SDK requirements
  const authProvider: IChatEmbeddedApiAuthProvider = useMemo(
    () => ({
      hostname: SPE_HOSTNAME,
      getToken: async () => {
        // Use your existing access token logic
        const token = await getAccessToken();
        if (!token) throw new Error('No access token available for Copilot Chat');
        return token;
      },
    }),
    [getAccessToken]
  );

  // Initialize chat component when sheet is opened
  React.useEffect(() => {
    if (isOpen) {
      const config: IChatEmbeddedConfig = {
        containerId: chatContainerId.current,
        authProvider: authProvider,
        siteContainerId: containerId,
        height: '100%'
      };

      // Create instance
      const cleanup = createChatEmbeddedInstance(config);
      
      // Clean up on unmount
      return () => {
        if (cleanup && typeof cleanup === 'function') {
          cleanup();
        }
      };
    }
  }, [isOpen, authProvider, containerId]);

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
          <p className="text-sm text-muted-foreground">Ask questions about your files and folders</p>
        </div>
        <div className="flex-1 min-h-0" id={chatContainerId.current}>
          {/* The chat component will be rendered here by the SDK */}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CopilotChat;
