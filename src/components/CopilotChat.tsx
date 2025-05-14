
import React, { useEffect, useState } from 'react';
import CopilotChatContainer from './copilot/CopilotChatContainer';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface CopilotChatProps {
  containerId: string;
  className?: string;
}

const CopilotChat: React.FC<CopilotChatProps> = ({ containerId, className }) => {
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [errorShown, setErrorShown] = useState(false);
  
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
    console.error('CopilotChat: Invalid containerId provided:', containerId);
    return (
      <div className="text-red-500 p-4 border border-red-300 rounded-md">
        Error: No valid containerId provided for Copilot Chat
      </div>
    );
  }
  
  // IMPORTANT: Don't render on mobile devices
  if (isMobile) {
    console.log('CopilotChat not rendering: on mobile device');
    return null;
  }
  
  // Don't render on login page
  if (window.location.pathname === '/login') {
    console.log('CopilotChat not rendering: on login page');
    return null;
  }
  
  // Don't render if not authenticated
  if (!isAuthenticated) {
    console.log('CopilotChat not rendering: not authenticated');
    return null;
  }
  
  return (
    <div className={`copilot-wrapper ${className || ''}`} data-testid="copilot-chat-wrapper">
      <CopilotChatContainer containerId={containerId} />
    </div>
  );
};

export default CopilotChat;
