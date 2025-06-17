import { useUser } from '@clerk/nextjs';
import { useCall } from '@stream-io/video-react-sdk';
import { useEffect, useRef, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

interface Participant {
  userId: string;
  name: string;
  username: string;
}

interface HostParticipantsPanelProps {
  roomId: string;
  onClose?: () => void;
  className?: string;
}

export default function HostParticipantsPanel({ roomId, onClose, className }: HostParticipantsPanelProps) {
  const call = useCall();
  const { user } = useUser();
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [allCanEdit, setAllCanEdit] = useState(true);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ymapRef = useRef<Y.Map<any> | null>(null);

  // Get participants from call.state.members
  const participants: Participant[] = call
    ? Object.values(call.state.members).map((m: any) => ({
        userId: m.user.id,
        name: m.user.name,
        username: m.user.name,
      }))
    : [];

  useEffect(() => {
    if (!roomId) return;

    // Initialize Yjs document
    if (!ydocRef.current) {
      ydocRef.current = new Y.Doc();
      ymapRef.current = ydocRef.current.getMap('permissions');
    }

    // Initialize WebSocket provider
    if (!providerRef.current) {
      providerRef.current = new WebsocketProvider(process.env.NEXT_PUBLIC_YJS_URL!, roomId + '-code', ydocRef.current!);
    }

    const updatePermissions = () => {
      setAllCanEdit(ymapRef.current?.get('allCanEdit') ?? true);
      setUserPermissions(ymapRef.current?.get('userPermissions') ?? {});
    };
    if (ymapRef.current) {
      ymapRef.current.observeDeep(updatePermissions);
      updatePermissions();
    }

    // Cleanup
    return () => {
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
      if (ymapRef.current) {
        ymapRef.current.unobserveDeep(updatePermissions);
      }
    };
  }, [roomId]);

  const userId = user?.id || 'unknown';

  const toggleAllCanEdit = () => {
    ymapRef.current?.set('allCanEdit', !allCanEdit);
  };

  const toggleUserEdit = (id: string) => {
    const perms = { ...userPermissions, [id]: !userPermissions[id] };
    ymapRef.current?.set('userPermissions', perms);
  };

  return (
    <div className={`bg-zinc-900 text-white rounded-2xl shadow-xl border border-zinc-700/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-500/20 border-b border-zinc-700/50 px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold tracking-wide bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-purple-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Participants
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
        <p className="text-zinc-400 text-sm">{participants.length} {participants.length === 1 ? 'person' : 'people'} in the meeting</p>
      </div>

      <div className="p-6">
        {/* Host Controls */}
        <div className="mb-5 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
          <h4 className="text-sm font-semibold mb-3 text-zinc-300 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Code Editing Permissions
          </h4>
          <div className="flex items-center gap-3 p-2 bg-zinc-900/50 rounded-md border border-zinc-800/50">
            <input
              type="checkbox"
              id="allowAllToEdit"
              checked={allCanEdit}
              onChange={toggleAllCanEdit}
              className="rounded text-blue-500 focus:ring-blue-500 bg-zinc-700 border-zinc-600 h-4 w-4"
            />
            <label htmlFor="allowAllToEdit" className="text-sm flex items-center gap-2">
              <span>Allow all participants to edit code</span>
              {allCanEdit && (
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">Enabled</span>
              )}
            </label>
          </div>
        </div>

        {/* Participants List */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {!allCanEdit && participants.map((p) => (
            <div key={p.userId} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/30 hover:bg-zinc-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${p.userId === userId ? 'bg-gradient-to-br from-purple-500 to-blue-500 ring-2 ring-green-400' : 'bg-blue-500'} flex items-center justify-center text-white font-bold shadow-md`}>
                  {p.name?.[0]?.toUpperCase() || p.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    {p.name || p.username || ''}
                    {p.userId === userId && (
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-medium">You</span>
                    )}
                  </div>
                  {p.userId !== userId && (
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {!!userPermissions[p.userId] ? 'Can edit code' : 'View only'}
                    </div>
                  )}
                </div>
              </div>

              {p.userId !== userId && (
                <div className="flex items-center">
                  <label htmlFor={`allow-${p.userId}`} className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id={`allow-${p.userId}`}
                      checked={!!userPermissions[p.userId]}
                      onChange={() => toggleUserEdit(p.userId)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              )}
            </div>
          ))}

          {participants.length === 0 && (
            <div className="text-center text-zinc-500 py-8 px-4 bg-zinc-800/30 rounded-lg border border-zinc-700/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-zinc-500 mx-auto mb-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <p>No participants have joined yet</p>
              <p className="text-xs mt-1">Share the meeting link to invite others</p>
            </div>
          )}
        </div>
      </div>

      {/* Add custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(39, 39, 42, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(82, 82, 91, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(82, 82, 91, 0.7);
        }
      `}</style>
    </div>
  );
}