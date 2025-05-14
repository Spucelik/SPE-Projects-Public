
import React, { useEffect, useState } from 'react';
import CopilotChatContainer from './copilot/CopilotChatContainer';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '../context/AuthContext';

interface CopilotChatProps {
  containerId: string;
  className?: string;
}

const CopilotChat: React.FC<CopilotChatProps> = ({ containerId, className }) => {
  const { isAuthenticated } = useAuth();
  const [errorShown, setErrorShown] = useState(false);
  
  // IMPORTANT: Don't even attempt to render on login page or when not authenticated
  if (window.location.pathname === '/login' || !isAuthenticated) {
    console.log('Copilot not rendering: on login page or not authenticated');
    return null;
  }
  
  useEffect(() => {
    if (!containerId || typeof containerId !== 'string') {
      const errorMsg = 'CopilotChat: No valid containerId provided';
      console.error(errorMsg);
      
      // Only show toast once to avoid spamming
      if (!errorShown) {
        setErrorShown(true);
        toast({
          title: "Copilot Error",
          description: "No valid container ID provided. Copilot chat cannot load.",
          variant: "destructive",
        });
      }
      return;
    }
    
    // Reset error shown flag when containerId changes and is valid
    setErrorShown(false);
    
    // Log the container ID to help with debugging
    console.log('CopilotChat component mounted with container ID:', containerId);
  }, [containerId, errorShown]);
  
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
