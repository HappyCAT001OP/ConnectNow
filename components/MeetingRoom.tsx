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
  import { useParams } from 'next/navigation';

  const params = useParams();
  const roomId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const isPersonalRoom = false; // Adjust if you have personal room logic elsewhere
  const router = useRouter();
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const { useCallCallingState } = useCallStateHooks();
  const [activeTab, setActiveTab] = useState<'video' | 'whiteboard' | 'codeshare'>('video');
  const [showChat, setShowChat] = useState(false);
  const [showDetails, setShowDetails] = useState(false); // New state for the details panel

  // for more detail about types of CallingState see: https://getstream-io/video-react-sdk/calling-state
  const callingState = useCallCallingState();

  const { user } = useUser();
  const hostName = user?.username || 'Unknown Host';
  const meetingStartTime = new Date().toLocaleTimeString();
  const isHost = user?.id === /* logic to determine host, e.g., call.creatorId or first participant */ roomId; // Replace with real host logic



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

      <div className="flex flex-1 overflow-hidden">
        <div className={cn("flex flex-1 flex-col transition-all duration-300", { 'w-full': !showChat, 'w-[calc(100%-340px)]': showChat })}>
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
              className="px-4 py-2 rounded bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition-colors z-50"
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
              <div className="absolute top-4 right-4 h-[90%] w-[320px] bg-zinc-900 border-l border-zinc-800 p-4 rounded-2xl shadow-xl overflow-y-auto z-50 flex flex-col">
                <MeetingDetailsPanel roomId={roomId} onClose={() => setShowDetails(false)} hostName={hostName} meetingStartTime={meetingStartTime} />
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
          <div className="fixed bottom-0 flex w-full items-center justify-start px-10 gap-5 bg-black bg-opacity-80 py-3 z-40">
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
            <button
              onClick={() => setShowDetails((prev) => !prev)}
              className="px-4 py-2 rounded bg-zinc-800 text-white font-semibold shadow hover:bg-zinc-700 transition-colors"
            >
              Details
            </button>
            <button onClick={() => setShowParticipants((prev) => !prev)}>
              <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
                <Users size={30} className="text-white" />
              </div>
            </button>
            {!isPersonalRoom && <EndCallButton />}
          </div>
        </div>
        {showChat && (
          <div className="relative h-screen w-[340px] transition-all duration-300">
            <ChatSidebar />
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingRoom;