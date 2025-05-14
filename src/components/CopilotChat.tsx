
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
  
  useEffect(() => {
    // If we're on /login route, silently skip showing errors
    if (window.location.pathname === '/login') {
      return;
    }
    
    if (!isAuthenticated) {
      // Don't show any errors if user is not authenticated - this is expected
      return;
    }
    
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
  }, [containerId, isAuthenticated, errorShown]);
  
  // Early return if not authenticated with no visible indication
  // Also early return if on login route to avoid any interference with login process
  if (!isAuthenticated || window.location.pathname === '/login') {
    console.log('Copilot not rendering: not authenticated or on login route');
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
