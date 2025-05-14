
import React from 'react';
import CopilotChatContainer from './copilot/CopilotChatContainer';

interface CopilotChatProps {
  containerId: string;
}

const CopilotChat: React.FC<CopilotChatProps> = ({ containerId }) => {
  if (!containerId) {
    console.error('CopilotChat: No containerId provided');
    return null;
  }
  
  console.log('CopilotChat rendering with containerId:', containerId);
  return (
    <div className="copilot-wrapper">
      <CopilotChatContainer containerId={containerId} />
    </div>
  );
};

export default CopilotChat;
