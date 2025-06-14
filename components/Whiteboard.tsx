import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useEffect, useState } from 'react';

type WhiteboardProps = {
  roomId: string;
};

const Whiteboard = ({ roomId }: WhiteboardProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for the whiteboard
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[65vh] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-700/50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-green-500/20 border-b border-zinc-700/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="M2 2l7.586 7.586"></path>
              <circle cx="11" cy="11" r="2"></circle>
            </svg>
            <h2 className="text-sm font-medium text-zinc-200">Collaborative Whiteboard</h2>
          </div>
          <div className="text-xs bg-zinc-800/70 text-zinc-400 px-2 py-1 rounded-full border border-zinc-700/30">
            Room: {roomId.substring(0, 8)}...
          </div>
        </div>

        {/* Whiteboard Container */}
        <div className="flex-1 bg-white">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center bg-zinc-100">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-zinc-600 text-sm">Loading whiteboard...</p>
              </div>
            </div>
          ) : (
            <Tldraw />
          )}
        </div>
      </div>
      
      <div className="mt-4 text-center text-xs text-zinc-500">
        <p>Draw, sketch, and collaborate in real-time with other participants</p>
      </div>
    </div>
  );
};

export default Whiteboard;