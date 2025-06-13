// components/MeetingDetailsPanel.tsx
'use client';

import React from 'react';

interface MeetingDetailsPanelProps {
  roomId: string;
  onClose?: () => void; // Optional function to close the panel (e.g., for a modal)
  hostName: string;
  meetingStartTime: string;
}

const MeetingDetailsPanel: React.FC<MeetingDetailsPanelProps> = ({ roomId, onClose }) => {
    // Replace with real host name and meeting start time
    const hostName = "[Retrieved Host Name]";  // Replace with the actual host's name
    const meetingStartTime = new Date().toLocaleTimeString(); // Replace with actual start time


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
      <div className="flex flex-col gap-2">
        <div>
          <span className="font-semibold">Meeting ID:</span> {roomId}
        </div>
        <div>
          <span className="font-semibold">Host:</span> {hostName}
        </div>
        <div>
          <span className="font-semibold">Started:</span> {meetingStartTime}
        </div>
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
