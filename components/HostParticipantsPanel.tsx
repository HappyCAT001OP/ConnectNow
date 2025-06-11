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
}

export default function HostParticipantsPanel({ roomId }: HostParticipantsPanelProps) {
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
    <div className="mt-4 bg-zinc-900 rounded-xl p-5 shadow-lg border border-zinc-800 max-w-[350px] font-sans">
      <div className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent font-bold mb-4 text-lg tracking-wide">Code Edit Permissions</div>
      <label className="mb-4 block text-blue-400 font-medium text-sm">
        <input type="checkbox" checked={allCanEdit} onChange={toggleAllCanEdit} className="mr-2 accent-blue-400 transition-shadow focus:ring-2 focus:ring-blue-400/30" /> All participants can edit and share code
      </label>
      {!allCanEdit && participants.map((p) => (
        <div key={p.userId} className="flex items-center mb-2 bg-zinc-800 rounded px-2 py-1">
          <div className={`${p.userId === userId ? 'ring-2 ring-green-400' : ''} w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-base mr-2`}>
            {p.name?.[0]?.toUpperCase() || p.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="mr-2 font-medium text-sm">{p.name || p.username || ''}</span>
          {p.userId !== userId && (
            <label className="ml-auto text-xs text-white">
              <input
                type="checkbox"
                checked={!!userPermissions[p.userId]}
                onChange={() => toggleUserEdit(p.userId)}
                className="mr-1 accent-blue-400 transition-shadow focus:ring-2 focus:ring-blue-400/30"
              />
              Can edit code
            </label>
          )}
        </div>
      ))}
    </div>
  );
} 