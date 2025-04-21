
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare, ExternalLink } from 'lucide-react';
import { ChatEmbedded, ChatEmbeddedAPI } from '@microsoft/sharepointembedded-copilotchat-react';
import { IChatEmbeddedApiAuthProvider } from '@microsoft/sharepointembedded-copilotchat-react';

interface CopilotDesktopViewProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  siteName: string | null;
  isLoading: boolean;
  error: string | null;
  openExternalChat: () => void;
  containerId: string;
  authProvider: IChatEmbeddedApiAuthProvider;
  onApiReady: (api: ChatEmbeddedAPI) => void;
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
  // Chat configuration
  const [chatConfig] = useState({
    header: {
      title: 'Copilot',
      subtitle: 'Ask me about your files',
    },
    theme: {
      primaryColor: '#0078d4',
    },
    zeroQueryPrompts: [
      'What files are available in this container?',
      'Summarize the recent documents',
      'Help me understand this project'
    ],
    suggestedPrompts: [
      'Find documents about marketing strategy',
      "What's the latest sales report?", // Escaped apostrophe
      'Show me project timelines'
    ],
    instruction: 'I am an AI assistant that can help you with your documents in SharePoint.',
    locale: 'en',
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
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-background/80 z-10">
              <p className="text-destructive mb-4">Failed to load embedded chat: {error}</p>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={openExternalChat}
              >
                <ExternalLink size={16} />
                Open in new tab
              </Button>
            </div>
          )}
          
          {isOpen && containerId && !error && (
            <div className="h-full w-full" key={chatKey}>
              <ChatEmbedded
                containerId={containerId}
                authProvider={authProvider}
                style={{ width: '100%', height: '100%' }}
                onApiReady={onApiReady}
                config={chatConfig}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CopilotDesktopView;
