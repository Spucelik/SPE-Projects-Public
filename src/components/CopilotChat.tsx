
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CopilotChatProps {
  containerId: string;
}

const CopilotChat: React.FC<CopilotChatProps> = ({ containerId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getAccessToken } = useAuth();
  
  // This is a placeholder as the actual implementation would require the SharePoint Embedded Copilot SDK
  // which would be installed via npm as specified in the instructions
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare size={16} />
          <span>Copilot Chat</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <div className="h-full flex flex-col">
          <div className="py-4 border-b">
            <h2 className="text-lg font-semibold">SharePoint Embedded Copilot</h2>
            <p className="text-sm text-gray-500">Ask questions about your files and folders</p>
          </div>
          
          <div className="flex-1 p-4 flex items-center justify-center">
            <p className="text-center text-gray-500">
              To enable Copilot Chat, install the SharePoint Embedded Copilot SDK:<br />
              <code className="text-xs bg-gray-100 p-1 rounded">
                npm install "https://download.microsoft.com/download/27d10531-b158-40c9-a146-af376c0e7f2a/microsoft-sharepointembedded-copilotchat-react-1.0.7.tgz"
              </code>
              <br /><br />
              Then implement using the containerId: {containerId}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CopilotChat;
