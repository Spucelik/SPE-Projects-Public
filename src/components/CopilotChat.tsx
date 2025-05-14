
import React, { useEffect } from 'react';
import CopilotChatContainer from './copilot/CopilotChatContainer';

interface CopilotChatProps {
  containerId: string;
}

const CopilotChat: React.FC<CopilotChatProps> = ({ containerId }) => {
  useEffect(() => {
    if (!containerId) {
      console.error('CopilotChat: No containerId provided');
      return;
    }
    
    console.log('CopilotChat component mounted with containerId:', containerId);
  }, [containerId]);
  
  if (!containerId) {
    console.error('CopilotChat: No containerId provided');
    return null;
  }
  
  return (
    <div className="copilot-wrapper">
      <CopilotChatContainer containerId={containerId} />
    </div>
  );
};

export default CopilotChat;
