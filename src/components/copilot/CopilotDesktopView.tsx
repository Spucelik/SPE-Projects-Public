
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare, ExternalLink, AlertCircle } from 'lucide-react';
import { ChatEmbedded, ChatEmbeddedAPI } from '@microsoft/sharepointembedded-copilotchat-react';
import { IChatEmbeddedApiAuthProvider } from '@microsoft/sharepointembedded-copilotchat-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  // Always direct to external chat in this environment due to CSP restrictions
  const useExternalChatOnly = true;

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
        <div className="flex-1 min-h-0 relative p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 h-full">
              <Alert variant="info" className="mb-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  Copilot Chat works best in its own dedicated window due to browser security policies.
                </AlertDescription>
              </Alert>
              
              <Button 
                variant="default" 
                className="gap-2 w-full max-w-xs"
                onClick={openExternalChat}
              >
                <ExternalLink size={16} />
                Open Copilot Chat
              </Button>
              
              <p className="text-sm text-muted-foreground text-center mt-4">
                This will open Copilot Chat in a new tab where you can interact with your SharePoint content.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CopilotDesktopView;
