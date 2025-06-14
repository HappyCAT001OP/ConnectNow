// components/MeetingDetailsPanel.tsx
'use client';

import React from 'react';

interface MeetingDetailsPanelProps {
  roomId: string;
  onClose?: () => void; // Optional function to close the panel (e.g., for a modal)
  hostName: string;
  meetingStartTime: string;
}

const MeetingDetailsPanel: React.FC<MeetingDetailsPanelProps> = ({ roomId, onClose, hostName, meetingStartTime }) => {

  return (
    <div className="bg-zinc-800 text-white p-6 rounded-2xl shadow-xl border border-zinc-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold tracking-wide bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">Meeting Details</h3>
        {onClose && (
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-700 hover:bg-blue-500 text-white transition-colors focus:outline-none" title="Close">
            <span className="text-lg">×</span>
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div>
          <span className="font-semibold">Meeting ID:</span> {roomId}
        </div>
        <div>
          <span className="font-semibold">Host:</span> {hostName || "Unknown"}
        </div>
        <div>
          <span className="font-semibold">Started:</span> {meetingStartTime || "Unknown"}
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
