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
    <div className="bg-zinc-900 text-white rounded-2xl shadow-xl border border-zinc-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-green-500/20 border-b border-zinc-700/50 px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold tracking-wide bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
            Meeting Details
          </h3>
          {onClose && (
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800/70 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30" 
              title="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
        <p className="text-zinc-400 text-sm">View and share meeting information</p>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="space-y-4">
          {/* Meeting ID */}
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span className="text-sm font-medium text-zinc-300">Meeting ID</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                  alert('Meeting ID copied to clipboard!'); // Or use a toast/notification
                }}
                className="text-blue-400 hover:text-blue-300 text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
              </button>
            </div>
            <p className="mt-1 text-sm font-mono bg-zinc-900/50 p-2 rounded border border-zinc-800/50 text-zinc-300 break-all">{roomId}</p>
          </div>
          
          {/* Host */}
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/30">
            <div className="flex items-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-green-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="text-sm font-medium text-zinc-300">Host</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                {hostName?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm text-zinc-300">{hostName || "Unknown"}</span>
            </div>
          </div>
          
          {/* Time */}
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/30">
            <div className="flex items-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span className="text-sm font-medium text-zinc-300">Started at</span>
            </div>
            <p className="text-sm text-zinc-300 ml-7">{meetingStartTime || "Unknown"}</p>
          </div>
          
          {/* Share Meeting */}
          <div className="mt-6">
            <button
              onClick={() => {
                const meetingUrl = window.location.href;
                navigator.clipboard.writeText(meetingUrl);
                alert('Meeting link copied to clipboard!'); // Or use a toast/notification
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              Share Meeting Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailsPanel;
