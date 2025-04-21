
import React from 'react';
import CopilotChatContainer from './copilot/CopilotChatContainer';

interface CopilotChatProps {
  containerId: string;
}

const CopilotChat: React.FC<CopilotChatProps> = ({ containerId }) => {
  if (!containerId) {
    return null;
  }
  
  return <CopilotChatContainer containerId={containerId} />;
};

export default CopilotChat;
