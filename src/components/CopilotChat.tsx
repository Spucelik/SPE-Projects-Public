
import React, { useEffect, useState } from 'react';
import CopilotChatContainer from './copilot/CopilotChatContainer';
import { toast } from '@/hooks/use-toast';

interface CopilotChatProps {
  containerId: string;
}

const CopilotChat: React.FC<CopilotChatProps> = ({ containerId }) => {
  const [containerError, setContainerError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!containerId) {
      const errorMsg = 'CopilotChat: No containerId provided';
      console.error(errorMsg);
      setContainerError(errorMsg);
      toast({
        title: "Copilot Error",
        description: "No container ID provided. Copilot chat cannot load.",
        variant: "destructive",
      });
      return;
    }
    
    // Log when component mounts with valid containerId
    console.log('CopilotChat component mounted with containerId:', containerId);
    
    // Add a cleanup function to ensure memory is properly released
    return () => {
      console.log('CopilotChat component unmounting');
    };
  }, [containerId]);
  
  if (!containerId) {
    return (
      <div className="text-red-500 p-4 border border-red-300 rounded-md">
        Error: No containerId provided for Copilot Chat
      </div>
    );
  }
  
  return (
    <div className="copilot-wrapper h-full">
      <CopilotChatContainer containerId={containerId} />
    </div>
  );
};

export default CopilotChat;
