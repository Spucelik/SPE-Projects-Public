
import React, { useEffect } from 'react';
import CopilotChatContainer from './copilot/CopilotChatContainer';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '../context/AuthContext';

interface CopilotChatProps {
  containerId: string;
  className?: string; // Added className prop for better positioning
}

const CopilotChat: React.FC<CopilotChatProps> = ({ containerId, className }) => {
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!containerId || typeof containerId !== 'string') {
      const errorMsg = 'CopilotChat: No valid containerId provided';
      console.error(errorMsg);
      toast({
        title: "Copilot Error",
        description: "No valid container ID provided. Copilot chat cannot load.",
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
  
  // Early return if not authenticated or no containerId is provided
  if (!isAuthenticated) {
    console.log('CopilotChat: User not authenticated, not rendering chat');
    return null;
  }
  
  // Early return if no containerId is provided
  if (!containerId || typeof containerId !== 'string') {
    return (
      <div className="text-red-500 p-4 border border-red-300 rounded-md">
        Error: No valid containerId provided for Copilot Chat
      </div>
    );
  }
  
  return (
    <div className={`copilot-wrapper ${className || ''}`} data-testid="copilot-chat-wrapper">
      <CopilotChatContainer containerId={containerId} />
    </div>
  );
};

export default CopilotChat;
