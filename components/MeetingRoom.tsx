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
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import ChatSidebar from './ChatSidebar';
import CodeShare from './CodeShare';
import Whiteboard from './Whiteboard';
import { Info } from 'lucide-react'; // Import the Info icon
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
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const roomId = searchParams.get('id') || 'default-room';
  const router = useRouter();
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const { useCallCallingState } = useCallStateHooks();
  const [activeTab, setActiveTab] = useState<'video' | 'whiteboard' | 'codeshare'>('video');
  const [showChat, setShowChat] = useState(false);

  // for more detail about types of CallingState see: https://getstream.io/video/docs/react/ui-cookbook/ringing-call/#incoming-call-panel
  const callingState = useCallCallingState();

  const { user } = useUser();
  const [showDetails, setShowDetails] = useState(false); // New state for the details panel
  const isHost = user?.id === /* logic to determine host, e.g., call.creatorId or first participant */ roomId; // Replace with real host logic

    // Display Meeting ID and Copy Button
  const meetingIdDisplay = (
    <div className="bg-zinc-900 text-white p-2 border-b border-zinc-800 flex items-center justify-between">
      <span className="font-semibold">Meeting ID: {roomId}</span>
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
  );



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
    <div className="flex h-screen w-full flex-col bg-black">
      {meetingIdDisplay}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <div className="flex justify-between items-center px-6 py-2 bg-zinc-900 border-b border-zinc-800">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('video')}
                className={`px-4 py-2 rounded-t-md font-semibold transition-colors ${activeTab === 'video' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'}`}
              >
                Video
              </button>
              <button
                onClick={() => setActiveTab('whiteboard')}
                className={`px-4 py-2 rounded-t-md font-semibold transition-colors ${activeTab === 'whiteboard' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'}`}
              >
                Whiteboard
              </button>
              <button
                onClick={() => setActiveTab('codeshare')}
                className={`px-4 py-2 rounded-t-md font-semibold transition-colors ${activeTab === 'codeshare' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'}`}
              >
                Code Share
              </button>
            </div>

            <button
              onClick={() => setShowChat((prev) => !prev)}
              className="px-4 py-2 rounded bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition-colors"
            >
              {showChat ? 'Close Chat' : 'Chat'}
            </button>
          </div>
          <div className="relative flex size-full items-center justify-center">
            <div className="flex size-full max-w-[1000px] items-center">
              {activeTab === 'video' && <CallLayout />}
              {activeTab === 'whiteboard' && <Whiteboard roomId={roomId} />}
              {activeTab === 'codeshare' && <CodeShare roomId={roomId} />}
            </div>
            {/* Meeting Details Panel (Sidebar) */}
            {showDetails && (
              <div className="absolute top-0 right-0 h-full w-[300px] bg-zinc-900 border-l border-zinc-800 p-4 overflow-y-auto">
                <MeetingDetailsPanel roomId={roomId} onClose={() => setShowDetails(false)} />
              </div>
            )}
            <div
              className={cn('h-[calc(100vh-86px)] ml-2', {
                'block': showParticipants,
                'hidden': !showParticipants,
              })}
            >
              <CallParticipantsList onClose={() => setShowParticipants(false)} />
              {isHost && <HostParticipantsPanel roomId={roomId} />}
            </div>
          </div>
          <div className="fixed bottom-0 flex w-full items-center justify-center gap-5">
            <CallControls onLeave={() => router.push(`/`)} />
            <DropdownMenu>
              <div className="flex items-center">
                <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
                  <LayoutList size={30} className="text-white" />
                </DropdownMenuTrigger>
              </div>
              <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
                {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, index) => (
                  <div key={index}>
                    <DropdownMenuItem
                      onClick={() =>
                        setLayout(item.toLowerCase() as CallLayoutType)
                      }
                    >
                      {item}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="border-dark-1" />
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <CallStatsButton />
            <button onClick={() => setShowParticipants((prev) => !prev)}>
              <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
                <Users size={30} className="text-white" />
              </div>
            </button>
               <button
              onClick={() => setShowDetails((prev) => !prev)}
              className="px-4 py-2 rounded bg-zinc-800 text-white font-semibold shadow hover:bg-zinc-700 transition-colors"
            >
              Details
            </button>
            {!isPersonalRoom && <EndCallButton />}
          </div>
        </div>
        {showChat && <ChatSidebar />}
      </div>
    </div>
  );
};

export default MeetingRoom;