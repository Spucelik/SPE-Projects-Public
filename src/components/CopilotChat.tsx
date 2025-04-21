
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '@/hooks/use-toast';

// Import correct exports from the SDK
import {
  ChatEmbedded,
  ChatEmbeddedAPI,
  IChatEmbeddedApiAuthProvider,
} from '@microsoft/sharepointembedded-copilotchat-react';

interface CopilotChatProps {
  containerId: string;
}

// The hostname should match your actual SharePoint tenant
// The format should be: https://tenantname.sharepoint.com (without trailing slash)
const SPE_HOSTNAME = 'https://pucelikenterprise.sharepoint.com'; 

const CopilotChat: React.FC<CopilotChatProps> = ({ containerId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getAccessToken } = useAuth();
  const [chatApi, setChatApi] = useState<ChatEmbeddedAPI | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Auth provider for the SDK
  const authProvider: IChatEmbeddedApiAuthProvider = useMemo(
    () => ({
      hostname: SPE_HOSTNAME,
      getToken: async () => {
        try {
          setError(null);
          console.log('Getting access token for Copilot Chat...');
          const token = await getAccessToken();
          if (!token) {
            const noTokenError = 'No access token available for Copilot Chat';
            setError(noTokenError);
            throw new Error(noTokenError);
          }
          console.log('Access token obtained successfully');
          return token;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to get token';
          setError(errorMessage);
          console.error('Token acquisition failed:', errorMessage);
          throw err;
        }
      },
    }),
    [getAccessToken]
  );
  
  // Callback for API ready
  const handleApiReady = useCallback((api: ChatEmbeddedAPI) => {
    console.log('Copilot Chat API ready:', api);
    setChatApi(api);
  }, []);

  // Function to handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  // Effect to open the chat when the API is ready
  useEffect(() => {
    const openChat = async () => {
      if (!chatApi) {
        return;
      }
      
      setIsLoading(true);
      setError(null);
      console.log('Attempting to open chat with API with containerId:', containerId);
      try {
        await chatApi.openChat();
        console.log('Chat opened successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Failed to open chat: ${errorMessage}`);
        console.error('Failed to open chat details:', error);
        
        // Notify user about the error
        toast({
          title: "Copilot Chat Error",
          description: "Could not connect to Copilot Chat. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && chatApi) {
      openChat();
    }
  }, [chatApi, isOpen, containerId, retryCount]);

  console.log('CopilotChat rendering with containerId:', containerId);

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
          {error && (
            <div className="mt-2 p-2 bg-red-50 text-red-800 rounded text-sm">
              <p>{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry} 
                className="mt-2">
                Retry Connection
              </Button>
            </div>
          )}
        </div>
        <div className="flex-1 min-h-0 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
          {isOpen && containerId && (
            <ChatEmbedded
              containerId={containerId}
              authProvider={authProvider}
              style={{ width: '100%', height: '100%' }}
              onApiReady={handleApiReady}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CopilotChat;
