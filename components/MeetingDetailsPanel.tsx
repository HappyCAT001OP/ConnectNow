// components/MeetingDetailsPanel.tsx
'use client';

import React from 'react';

interface MeetingDetailsPanelProps {
  roomId: string;
  onClose?: () => void; // Optional function to close the panel (e.g., for a modal)
}

const MeetingDetailsPanel: React.FC<MeetingDetailsPanelProps> = ({ roomId, onClose }) => {
  return (
    <div className="bg-zinc-800 text-white p-4 rounded-md shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Meeting Details</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white focus:outline-none">
            {/* You can add an X icon here */}
            Close
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span>Meeting ID: {roomId}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(roomId);
            alert('Meeting ID copied to clipboard!'); // Or use a toast/notification
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
        >
          Copy ID
        </button>
      </div>
      {/* Add other meeting details here as needed */} 
    </div>
  );
};

export default MeetingDetailsPanel;
