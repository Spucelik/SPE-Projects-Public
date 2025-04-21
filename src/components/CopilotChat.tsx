
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Import correct exports from the SDK
import {
  ChatEmbedded,
  ChatEmbeddedAPI,
  IChatEmbeddedApiAuthProvider,
} from '@microsoft/sharepointembedded-copilotchat-react';

interface CopilotChatProps {
  containerId: string;
}

const SPE_HOSTNAME = 'https://m365x10735106.sharepoint.com'; // Replace with your actual SharePoint Embedded host if not this demo

const CopilotChat: React.FC<CopilotChatProps> = ({ containerId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getAccessToken } = useAuth();
  const [chatApi, setChatApi] = useState<ChatEmbeddedAPI | null>(null);

  // Auth provider for the SDK
  const authProvider: IChatEmbeddedApiAuthProvider = useMemo(
    () => ({
      hostname: SPE_HOSTNAME,
      getToken: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('No access token available for Copilot Chat');
        return token;
      },
    }),
    [getAccessToken]
  );

  // Callback to handle when the Chat API is ready
  const onApiReady = (api: ChatEmbeddedAPI) => {
    console.log('Copilot Chat API is ready:', api);
    setChatApi(api);
  };

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
        <div className="flex-1 min-h-0">
          {isOpen && (
            <ChatEmbedded
              containerId={containerId}
              authProvider={authProvider}
              style={{ height: '100%' }}
              onApiReady={onApiReady}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CopilotChat;
