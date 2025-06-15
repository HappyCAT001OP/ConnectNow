'use client';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { LayoutList, Users } from 'lucide-react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import ChatSidebar from './ChatSidebar';
import CodeShare from './CodeShare';
import Whiteboard from './Whiteboard';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import EndCallButton from './EndCallButton';
import HostParticipantsPanel from './HostParticipantsPanel';
import Loader from './Loader';
import MeetingDetailsPanel from './MeetingDetailsPanel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

const MeetingRoom = () => {
  const params = useParams();
  const roomId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const isPersonalRoom = false; // Adjust if you have personal room logic elsewhere
  const router = useRouter();
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const { useCallCallingState } = useCallStateHooks();
  const [activeTab, setActiveTab] = useState<'video' | 'whiteboard' | 'codeshare'>('video');
  const [showChat, setShowChat] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // for more detail about types of CallingState see: https://getstream-io/video-react-sdk/calling-state
  const callingState = useCallCallingState();

  const { user } = useUser();
  const isHost = user?.id === roomId; // Replace with real host logic

  // Auto-hide controls when mouse is inactive
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Show controls when mouse moves
      setShowControls(true);
      
      // If mouse is in the bottom 150px of the screen, keep controls visible
      const isNearBottom = e.clientY > window.innerHeight - 150;
      
      // Clear any existing timer
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
      
      // If not near bottom, set timer to hide controls
      if (!isNearBottom) {
        controlsTimerRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, []);

  if (callingState !== CallingState.JOINED) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-gradient-to-b from-zinc-950 to-black overflow-hidden">

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Content Area */}
        <div className="flex flex-1 flex-col transition-all duration-300 w-full">
          {/* Tab Navigation - Auto-hide with controls */}
          <div className={cn("flex justify-between items-center px-6 py-3 bg-zinc-900/60 border-b border-zinc-800/50 transition-opacity duration-300", {
            'opacity-0 pointer-events-none': !showControls,
            'opacity-100': showControls
          })}>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('video')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'video' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700/80'}`}
              >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  Video
                </div>
              </button>
              <button
                onClick={() => setActiveTab('whiteboard')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'whiteboard' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700/80'}`}
              >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
                  Whiteboard
                </div>
              </button>
              <button
                onClick={() => setActiveTab('codeshare')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'codeshare' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700/80'}`}
              >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  Code Share
                </div>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDetails((prev) => !prev)}
                className="px-3 py-1.5 rounded-full bg-zinc-800/80 text-zinc-200 text-sm font-medium hover:bg-zinc-700/80 transition-colors flex items-center gap-2 border border-zinc-700/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                Details
              </button>
              <button
                onClick={() => setShowChat((prev) => !prev)}
                className={"px-3 py-1.5 rounded-full bg-blue-600/90 text-white text-sm font-medium hover:bg-blue-700/90 transition-colors flex items-center gap-2 border border-blue-500/50"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {showChat ? 'Close Chat' : 'Chat'}
              </button>
            </div>
          </div>
          
          {/* Main Content */}
          <div className={cn("relative flex size-full items-center justify-center", {
            'pr-[340px]': showChat, // Add padding when chat is open to prevent overlap
          })}>  
            {activeTab === 'codeshare' ? (
              <div className="flex size-full items-center relative">
                <CodeShare roomId={roomId} />
              </div>
            ) : (
              <div className="flex size-full items-center relative">
                {activeTab === 'video' && <CallLayout />}
                {activeTab === 'whiteboard' && <Whiteboard roomId={roomId} />}
              </div>
            )}
            {/* Meeting Details Panel (Floating Card) */}
            {showDetails && (
              <div className="absolute top-8 right-8 w-[350px] bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 p-5 rounded-2xl shadow-2xl overflow-hidden z-[60] flex flex-col animate-in fade-in slide-in-from-right duration-300">
                <MeetingDetailsPanel roomId={roomId} onClose={() => setShowDetails(false)} />
              </div>
            )}
            {/* Participants Panel */}
            <div
              className={cn('absolute top-8 left-8 w-[300px] bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-left duration-300', {
                'block': showParticipants,
                'hidden': !showParticipants,
              })}
              style={{maxHeight: '80vh'}}
            >
              <div className="p-4 border-b border-zinc-800/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">Participants</h3>
                  <button 
                    onClick={() => setShowParticipants(false)}
                    className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>
              <div className="max-h-[65vh] overflow-y-auto custom-scrollbar">
                <CallParticipantsList onClose={() => setShowParticipants(false)} />
                {isHost && <HostParticipantsPanel roomId={roomId} />}
              </div>
            </div>
            {/* Chat Sidebar */}
            {showChat && (
              <div className="fixed right-0 top-0 h-full w-[340px] z-[90] bg-zinc-900/95 border-l border-zinc-800/50 shadow-2xl animate-in fade-in slide-in-from-right duration-300 flex flex-col">
                <ChatSidebar roomId={roomId} onClose={() => setShowChat(false)} />
                <button
                  onClick={() => setShowChat(false)}
                  className="absolute top-4 left-4 z-50 bg-zinc-800/80 text-zinc-200 px-3 py-1.5 rounded-full border border-zinc-700/50 hover:bg-zinc-700/80 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  Close Chat
                </button>
              </div>
            )}
            {/* End Call Button - ensure it is above all overlays */}
            <div className="fixed bottom-8 right-8 z-[100]">
              <EndCallButton />
            </div>
          </div>
          
          {/* Control Bar - Auto-hide */}
          <div className={cn("fixed bottom-0 left-0 right-0 flex items-center justify-center px-6 py-4 z-40 transition-transform duration-300", {
            'translate-y-24': !showControls,
            'translate-y-0': showControls
          })}>
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/50 rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4">
              {/* Call Controls */}
              <div className="flex items-center gap-3 mr-2">
                <CallControls onLeave={() => router.push(`/`)} />
              </div>
              
              {/* Divider */}
              <div className="h-10 w-px bg-zinc-800/70"></div>
              
              {/* Layout Controls */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/70 hover:bg-zinc-700/70 text-zinc-200 transition-colors">
                  <LayoutList size={18} />
                  <span className="text-sm font-medium">Layout</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl shadow-xl p-1">
                  {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => setLayout(item.toLowerCase() as CallLayoutType)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-blue-600/20 hover:text-blue-400 cursor-pointer"
                    >
                      {item === 'Grid' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                      ) : item === 'Speaker-Left' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="10" height="18" rx="2"></rect><rect x="16" y="3" width="5" height="5" rx="1"></rect><rect x="16" y="10" width="5" height="5" rx="1"></rect><rect x="16" y="17" width="5" height="4" rx="1"></rect></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="11" y="3" width="10" height="18" rx="2"></rect><rect x="3" y="3" width="5" height="5" rx="1"></rect><rect x="3" y="10" width="5" height="5" rx="1"></rect><rect x="3" y="17" width="5" height="4" rx="1"></rect></svg>
                      )}
                      {item}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Stats Button */}
              <div className="flex items-center">
                <CallStatsButton />
              </div>
              
              {/* Participants Button */}
              <button 
                onClick={() => setShowParticipants((prev) => !prev)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${showParticipants ? 'bg-blue-600/30 text-blue-400' : 'bg-zinc-800/70 text-zinc-200 hover:bg-zinc-700/70'} transition-colors`}
              >
                <Users size={18} />
                <span className="text-sm font-medium">Participants</span>
              </button>
              {/* End Call Button */}
              {!isPersonalRoom && <EndCallButton />}
            </div>
          </div>
        </div>
        
        {/* Chat Sidebar - Positioned absolutely to avoid overlap */}
        {showChat && (
          <div className="absolute right-0 top-0 h-full w-[340px] transition-all duration-300 z-30">
            <ChatSidebar />
            <button
              onClick={() => setShowChat(false)}
              className="absolute top-4 left-4 z-50 bg-zinc-800/80 text-zinc-200 px-3 py-1.5 rounded-full border border-zinc-700/50 hover:bg-zinc-700/80 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              Close Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingRoom;